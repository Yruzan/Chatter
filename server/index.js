import { createServer } from "node:http";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import sirv from "sirv";
import { createRelay } from "./relay.js";

export function createAppServer(options = {}) {
  const relay = createRelay(options);
  const serve = sirv(fileURLToPath(new URL("../dist", import.meta.url)), {
    single: true,
    setHeaders(res, path) {
      res.setHeader("X-Content-Type-Options", "nosniff");
      res.setHeader("Referrer-Policy", "no-referrer");
      res.setHeader(
        "Cache-Control",
        path.includes("/assets/")
          ? "public, max-age=31536000, immutable"
          : "no-cache",
      );
    },
  });
  const server = createServer((req, res) => {
    relay(req, res, () => {
      if (!["GET", "HEAD"].includes(req.method)) {
        res.writeHead(405);
        res.end();
        return;
      }
      serve(req, res, () => {
        res.writeHead(404);
        res.end("Not found");
      });
    }).catch(() => {
      if (!res.headersSent) res.writeHead(500);
      res.end();
    });
  });
  server.on("close", () => {
    relay.close().catch(() => {});
  });
  return server;
}
if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  const server = createAppServer();
  const host = process.env.HOST || "127.0.0.1";
  const port = Number(process.env.PORT || 3000);
  server.listen(port, host, () =>
    console.log(`Chatter listening on http://${host}:${port}`),
  );
  for (const signal of ["SIGTERM", "SIGINT"])
    process.once(signal, () => {
      server.close();
      setTimeout(() => {
        server.closeAllConnections();
      }, 5000).unref();
    });
}
