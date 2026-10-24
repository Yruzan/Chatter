import { fetch, Agent, EnvHttpProxyAgent } from "undici";
import { apiBase } from "../src/api.js";

export const defaultAllowedBases = [
  "https://api.openai.com/v1",
  "https://openrouter.ai/api/v1",
  "https://ai.geraikita.com/v1",
  "https://ai.geraikita.com/v1/claude",
];
const MAX_BODY = 6 * 1024 * 1024;
const MAX_RESPONSE = 8 * 1024 * 1024;
const paths = new Map([
  ["/api/provider/models", "/models"],
  ["/api/provider/chat/completions", "/chat/completions"],
]);
function fail(status, message) {
  return Object.assign(new Error(message), { status });
}
async function readLimited(stream, limit) {
  const chunks = [];
  let size = 0;
  for await (const chunk of stream) {
    size += chunk.length;
    if (size > limit)
      throw fail(
        413,
        "The request or response is too large. Shorten the chat or remove image attachments.",
      );
    chunks.push(Buffer.from(chunk));
  }
  return Buffer.concat(chunks).toString("utf8");
}
function reply(res, status, data) {
  if (res.destroyed) return;
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
    "X-Chatter-Relay": "1",
  });
  res.end(JSON.stringify(data));
}
export function createRelay({ allowedBases } = {}) {
  const allowed = new Set(
    (
      allowedBases || [
        ...defaultAllowedBases,
        ...(process.env.CHATTER_API_BASE_URLS || "").split(",").filter(Boolean),
      ]
    ).map(apiBase),
  );
  const proxyAgent = new EnvHttpProxyAgent();
  const directAgent = new Agent();
  const middleware = async (req, res, next) => {
    const path = req.url?.split("?")[0];
    if (!path?.startsWith("/api/")) return next();
    if (path === "/api/health" && req.method === "GET") {
      return reply(res, 200, { service: "chatter", relay: true });
    }
    const operation = paths.get(path);
    if (!operation)
      return reply(res, 404, {
        error: { message: "Unknown Chatter API route." },
      });
    if (req.method !== "POST")
      return reply(res, 405, {
        error: { message: "Use POST for Chatter relay requests." },
      });
    const controller = new AbortController();
    let timedOut = false;
    const timeout = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, 55000);
    const onClose = () => {
      if (!res.writableEnded) controller.abort();
    };
    res.once("close", onClose);
    try {
      let originHost;
      try {
        originHost = req.headers.origin && new URL(req.headers.origin).host;
      } catch {
        throw fail(403, "Invalid request origin.");
      }
      if (
        (originHost && originHost !== req.headers.host) ||
        req.headers["sec-fetch-site"] === "cross-site"
      )
        throw fail(
          403,
          "Open the API controls on this Chatter website to send a request.",
        );
      if (
        !req.headers["content-type"]
          ?.toLowerCase()
          .startsWith("application/json")
      )
        throw fail(415, "The relay accepts JSON requests only.");
      if (Number(req.headers["content-length"]) > MAX_BODY)
        throw fail(
          413,
          "The chat request is too large. Remove older image attachments.",
        );
      let data;
      try {
        data = JSON.parse(await readLimited(req, MAX_BODY));
      } catch (error) {
        if (error.status) throw error;
        throw fail(400, "Invalid relay request JSON.");
      }
      let base;
      try {
        base = apiBase(data?.baseUrl);
      } catch {
        throw fail(400, "Enter a valid API base URL.");
      }
      if (!allowed.has(base))
        throw fail(
          403,
          "This API URL is not enabled on the Chatter server. Add the exact base URL to CHATTER_API_BASE_URLS and restart Chatter, or use Direct connection for a provider that permits browser access.",
        );
      const authorization = req.headers.authorization;
      if (
        authorization &&
        (!/^Bearer [^\r\n]+$/i.test(authorization) ||
          authorization.length > 8192)
      )
        throw fail(400, "Enter a valid API key.");
      if (
        operation === "/chat/completions" &&
        (!data.payload ||
          typeof data.payload.model !== "string" ||
          !Array.isArray(data.payload.messages) ||
          data.payload.stream !== false)
      )
        throw fail(
          400,
          "A model, messages, and non-streaming chat payload are required.",
        );
      const hostname = new URL(base).hostname;
      const upstream = await fetch(`${base}${operation}`, {
        method: operation === "/models" ? "GET" : "POST",
        headers: {
          Accept: "application/json",
          ...(authorization ? { Authorization: authorization } : {}),
          ...(operation === "/chat/completions"
            ? { "Content-Type": "application/json" }
            : {}),
        },
        ...(operation === "/chat/completions"
          ? { body: JSON.stringify(data.payload) }
          : {}),
        dispatcher: ["localhost", "127.0.0.1", "[::1]"].includes(hostname)
          ? directAgent
          : proxyAgent,
        signal: controller.signal,
        redirect: "manual",
      });
      if (upstream.status >= 300 && upstream.status < 400) {
        await upstream.body?.cancel();
        throw fail(
          502,
          "The provider redirects this URL. Enter its final API base URL; credentials are not forwarded across redirects.",
        );
      }
      if (!upstream.ok) {
        await upstream.body?.cancel();
        // Keep status, without leaking provider bodies, headers, or credentials.
        return reply(res, upstream.status, {
          error: { type: "provider_error" },
        });
      }
      const text = await readLimited(upstream.body, MAX_RESPONSE);
      let result;
      try {
        result = JSON.parse(text);
      } catch {
        throw fail(
          502,
          "The provider returned a page instead of API JSON. Check the API base URL.",
        );
      }
      reply(res, 200, result);
    } catch (error) {
      if (res.destroyed) return;
      const code = error.cause?.code || error.code;
      const message = error.status
        ? error.message
        : timedOut
          ? "The provider timed out. Please retry."
          : ["ENOTFOUND", "EAI_AGAIN"].includes(code)
            ? "The Chatter server cannot resolve this API hostname. Check the URL or server DNS."
            : [
                  "CERT_HAS_EXPIRED",
                  "DEPTH_ZERO_SELF_SIGNED_CERT",
                  "UNABLE_TO_VERIFY_LEAF_SIGNATURE",
                  "ERR_TLS_CERT_ALTNAME_INVALID",
                ].includes(code)
              ? "The provider's HTTPS certificate could not be verified. Check its certificate and API URL."
              : "The Chatter server cannot reach this provider. Check the API URL and the server's outbound network access.";
      reply(res, error.status || (timedOut ? 504 : 502), {
        error: { type: "chatter_relay_error", message },
      });
    } finally {
      clearTimeout(timeout);
      res.off("close", onClose);
    }
  };
  middleware.close = () =>
    Promise.all([proxyAgent.close(), directAgent.close()]);
  return middleware;
}
