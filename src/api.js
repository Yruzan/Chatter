// Keys stay in memory. Server mode relays them only to an enabled API base URL.
export function apiBase(baseUrl) {
  let url;
  try {
    url = new URL(baseUrl.trim());
  } catch {
    throw new Error("Enter a complete API base URL.");
  }
  if (
    url.protocol !== "https:" &&
    !(
      url.protocol === "http:" &&
      ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)
    )
  )
    throw new Error("Use an HTTPS endpoint, or HTTP for a local provider.");
  if (url.username || url.password || url.search || url.hash)
    throw new Error(
      "Use a base URL without credentials, query parameters, or fragments.",
    );
  return url.href.replace(/\/+$/, "");
}

async function apiRequest(api, key, path, { body, signal } = {}) {
  const base = apiBase(api.baseUrl);
  const controller = new AbortController();
  const abort = () => controller.abort();
  signal?.addEventListener("abort", abort, { once: true });
  if (signal?.aborted) controller.abort();
  let timedOut = false;
  const timeout = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, 60000);
  try {
    const throughServer = api.transport !== "direct";
    const response = await fetch(
      throughServer ? `/api/provider${path}` : `${base}${path}`,
      {
        method: throughServer || body ? "POST" : "GET",
        headers: {
          Accept: "application/json",
          ...(throughServer || body
            ? { "Content-Type": "application/json" }
            : {}),
          ...(key.trim() ? { Authorization: `Bearer ${key.trim()}` } : {}),
        },
        ...(throughServer
          ? {
              body: JSON.stringify({
                baseUrl: base,
                ...(body ? { payload: body } : {}),
              }),
            }
          : body
            ? { body: JSON.stringify(body) }
            : {}),
        signal: controller.signal,
        credentials: "omit",
        redirect: "error",
        referrerPolicy: "no-referrer",
      },
    );
    if (throughServer && response.headers.get("X-Chatter-Relay") !== "1")
      throw new Error(
        "Chatter’s server connection is unavailable. This site needs the updated Chatter server; static-only hosting cannot relay API requests.",
      );
    if (throughServer && !response.ok) {
      let detail;
      try {
        detail = await response.json();
      } catch {
        /* Use the status explanation below. */
      }
      if (detail?.error?.type === "chatter_relay_error")
        throw new Error(detail.error.message);
    }
    if (!response.ok) {
      const explanations = {
        401:
          new URL(base).hostname === "ai.geraikita.com"
            ? "Check your GeraiKita key. Free-tier keys use /v1/claude; paid keys use /v1."
            : "Check your API key.",
        402: "Provider balance is insufficient. Check your account credits.",
        403: "This key or account cannot access the endpoint.",
        404: "Check the base URL and model ID.",
        429: "Rate limit or quota reached. Try again later.",
        400: "The provider rejected this model or generation settings.",
      };
      throw new Error(
        `API error ${response.status}. ${explanations[response.status] || "The provider could not complete the request. Try again."}`,
      );
    }
    try {
      return await response.json();
    } catch {
      throw new Error("The endpoint did not return valid JSON.");
    }
  } catch (error) {
    if (timedOut)
      throw new Error("The API timed out after 60 seconds. Please retry.");
    if (signal?.aborted) throw new DOMException("Stopped", "AbortError");
    if (error instanceof TypeError)
      throw new Error(
        api.transport === "direct"
          ? "The browser cannot reach this API. It may block browser access (CORS). Switch Connection to Chatter server, or check the URL and network."
          : "Cannot reach the Chatter server. Check this website’s connection and that its server is running.",
      );
    throw error;
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener("abort", abort);
  }
}

export async function loadModels(api, key, signal) {
  const data = await apiRequest(api, key, "/models", { signal });
  if (!Array.isArray(data?.data))
    throw new Error(
      "This endpoint does not return an OpenAI-compatible model list. Enter a model ID manually.",
    );
  const models = [
    ...new Set(
      data.data
        .map((m) => m?.id)
        .filter((id) => typeof id === "string" && id.trim()),
    ),
  ].sort();
  if (!models.length)
    throw new Error(
      "No models were returned. Check your account access or enter a model ID manually.",
    );
  return models;
}

export function messageText(message) {
  return message.variants?.[message.selectedVariant ?? 0] ?? message.text ?? "";
}
const fill = (text, character, profile) =>
  (text || "")
    .replaceAll("{{char}}", character.name)
    .replaceAll("{{user}}", profile.name);

export function completionPayload(
  api,
  parameters,
  character,
  profile,
  history,
) {
  if (!api.model.trim())
    throw new Error("Choose or enter a model ID in API settings.");
  const system = [
    parameters.prompt,
    `You are ${character.name}. The user's name is ${profile.name}.`,
    character.tagline,
    character.description,
    character.personality && `Personality: ${character.personality}`,
    character.scenario && `Scenario: ${character.scenario}`,
    ...(character.examples || []).map(
      (e) =>
        `Example dialogue:\nUser: ${e.user || ""}\n${character.name}: ${e.character || ""}`,
    ),
  ]
    .filter(Boolean)
    .map((text) => fill(text, character, profile))
    .join("\n\n");
  let turns = (parameters.memory ? history : history.slice(-1)).map((m) => ({
    role: m.role,
    content: m.image
      ? [
          { type: "text", text: messageText(m) },
          { type: "image_url", image_url: { url: m.image } },
        ]
      : messageText(m),
  }));
  // Conservative text budget (UTF-8 bytes), with an image allowance. Providers
  // tokenize differently; their context errors remain visible and retryable.
  const cost = (m) =>
    typeof m.content === "string"
      ? new TextEncoder().encode(m.content).length + 8
      : new TextEncoder().encode(m.content[0].text).length + 2056;
  const budget = parameters.contextSize - parameters.maxTokens;
  const systemCost = cost({ content: system });
  while (
    turns.length > 1 &&
    systemCost + turns.reduce((n, m) => n + cost(m), 0) > budget
  )
    turns.shift();
  if (systemCost + turns.reduce((n, m) => n + cost(m), 0) > budget)
    throw new Error(
      "The character and latest message exceed the context budget. Increase the context window or shorten the instructions/message.",
    );
  return {
    model: api.model.trim(),
    messages: [{ role: "system", content: system }, ...turns],
    temperature: parameters.temperature,
    top_p: parameters.topP,
    max_tokens: parameters.maxTokens,
    frequency_penalty: parameters.frequencyPenalty,
    presence_penalty: parameters.presencePenalty,
    stream: false,
  };
}

export async function requestReply(
  api,
  key,
  parameters,
  character,
  profile,
  history,
  signal,
) {
  const body = completionPayload(api, parameters, character, profile, history);
  const data = await apiRequest(api, key, "/chat/completions", {
    body,
    signal,
  });
  const text = data?.choices?.[0]?.message?.content;
  if (typeof text !== "string" || !text.trim())
    throw new Error(
      "The model returned no text. Try a different model or increase the response limit.",
    );
  return text;
}

export async function copyText(text) {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return;
    }
  } catch {
    /* Plain HTTP and restricted browsers need the legacy copy path. */
  }
  const before = document.activeElement;
  const selection = window.getSelection();
  const ranges = selection
    ? Array.from({ length: selection.rangeCount }, (_, i) =>
        selection.getRangeAt(i).cloneRange(),
      )
    : [];
  const input = document.createElement("textarea");
  input.value = text;
  input.setAttribute("readonly", "");
  input.style.cssText = "position:fixed;top:0;left:0;opacity:0;font-size:16px";
  // Inside an open dialog, so focus traps don't prevent selection.
  (document.querySelector('[role="dialog"]') || document.body).append(input);
  try {
    input.focus();
    input.select();
    input.setSelectionRange(0, input.value.length);
    if (!document.execCommand("copy"))
      throw new Error(
        "Copy was blocked. Select the message text to copy it manually.",
      );
  } finally {
    input.remove();
    before?.focus({ preventScroll: true });
    if (selection) {
      selection.removeAllRanges();
      ranges.forEach((range) => selection.addRange(range));
    }
  }
}
