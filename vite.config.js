import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { createRelay, defaultAllowedBases } from "./server/relay.js";
function providerRelay(allowedBases) {
  const attach = (server) => {
    const relay = createRelay({ allowedBases });
    server.middlewares.use(relay);
    server.httpServer?.once("close", () => {
      relay.close().catch(() => {});
    });
  };
  return {
    name: "chatter-provider-relay",
    configureServer: attach,
    configurePreviewServer: attach,
  };
}
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "CHATTER_");
  const bases = [
    ...defaultAllowedBases,
    ...(env.CHATTER_API_BASE_URLS || "").split(",").filter(Boolean),
  ];
  return { plugins: [react(), providerRelay(bases)] };
});
