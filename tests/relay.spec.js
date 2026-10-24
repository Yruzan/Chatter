import { test, expect } from "@playwright/test";
import { createServer } from "node:http";
import { createAppServer } from "../server/index.js";
let upstream, app, apiBase, appOrigin;
const fixtureKey = "fixture-key-not-a-real-credential";
const calls = [];
async function listen(server) {
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  return `http://127.0.0.1:${server.address().port}`;
}
async function stop(server) {
  server?.closeAllConnections();
  if (server?.listening) await new Promise((resolve) => server.close(resolve));
}
test.beforeAll(async () => {
  // Real HTTP upstream deliberately sends NO Access-Control-Allow-Origin.
  upstream = createServer(async (req, res) => {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const body = chunks.length
      ? JSON.parse(Buffer.concat(chunks).toString())
      : null;
    calls.push({ path: req.url, auth: req.headers.authorization, body });
    res.setHeader("Content-Type", "application/json");
    if (req.url === "/v1/claude/models")
      return res.end(
        JSON.stringify({
          data: [{ id: "claude-fixture" }, { id: "claude-fixture-two" }],
        }),
      );
    if (req.url === "/v1/claude/chat/completions") {
      if (req.headers.authorization !== `Bearer ${fixtureKey}`) {
        res.statusCode = 401;
        return res.end(
          JSON.stringify({
            error: { message: "Private provider detail must not leak" },
          }),
        );
      }
      return res.end(
        JSON.stringify({
          choices: [
            { message: { content: "Reply from the real HTTP fixture" } },
          ],
        }),
      );
    }
    if (req.url === "/redirect/models") {
      res.writeHead(302, { Location: "/v1/claude/models" });
      return res.end();
    }
    if (req.url === "/html/models") {
      res.setHeader("Content-Type", "text/html");
      return res.end("<html>Wrong endpoint</html>");
    }
    res.statusCode = 404;
    res.end("{}");
  });
  const upstreamOrigin = await listen(upstream);
  apiBase = `${upstreamOrigin}/v1/claude`;
  app = createAppServer({
    allowedBases: [
      apiBase,
      `${upstreamOrigin}/redirect`,
      `${upstreamOrigin}/html`,
    ],
  });
  appOrigin = await listen(app);
});
test.afterAll(async () => {
  await stop(app);
  await stop(upstream);
});

test("a provider that blocks browser access works through the real Chatter relay", async ({
  page,
}) => {
  page.on("pageerror", (error) => {
    throw error;
  });
  await page.goto(appOrigin);
  const browserBlocked = await page.evaluate(async (url) => {
    try {
      await fetch(`${url}/models`);
      return false;
    } catch {
      return true;
    }
  }, apiBase);
  expect(browserBlocked).toBe(true);
  await page.getByRole("button", { name: "Step into the story" }).click();
  await page.getByTitle("Chat settings").click();
  await page.getByRole("tab", { name: "API", exact: true }).click();
  await page.getByLabel("Provider", { exact: true }).selectOption("custom");
  await expect(page.getByLabel("Connection", { exact: true })).toHaveValue(
    "server",
  );
  await page.getByLabel("API base URL", { exact: true }).fill(apiBase);
  await page.getByLabel("API key", { exact: true }).fill(fixtureKey);
  await page.getByRole("button", { name: "Load models", exact: true }).click();
  await expect(page.getByLabel("Model ID", { exact: true })).toHaveValue(
    "claude-fixture",
  );
  await page
    .getByRole("button", { name: "Test connection", exact: true })
    .click();
  await expect(page.locator(".configuration-result")).toContainText(
    "Live request succeeded: Reply from the real HTTP fixture",
  );
  await page.getByRole("switch", { name: "Use live AI", exact: false }).check();
  await page
    .getByRole("button", { name: "Close settings", exact: true })
    .click();
  await page
    .getByRole("textbox", { name: "Message", exact: true })
    .fill("An actual request through the server");
  await page.getByRole("button", { name: "Send message", exact: true }).click();
  await expect(
    page.locator(".message.assistant").last().locator(".message-bubble"),
  ).toHaveText("Reply from the real HTTP fixture");
  expect(
    calls.some(
      (c) =>
        c.path === "/v1/claude/models" && c.auth === `Bearer ${fixtureKey}`,
    ),
  ).toBe(true);
  expect(
    calls.some(
      (c) =>
        c.body?.messages?.at(-1).content ===
        "An actual request through the server",
    ),
  ).toBe(true);
  expect(
    await page.evaluate(() => Object.values(localStorage).join(" ")),
  ).not.toContain(fixtureKey);
});

test("relay limits endpoints and rejects cross-origin requests without forwarding secrets", async ({
  request,
}) => {
  const before = calls.length;
  let response = await request.post(`${appOrigin}/api/provider/models`, {
    data: { baseUrl: "http://127.0.0.1:1/private" },
  });
  expect(response.status()).toBe(403);
  expect((await response.json()).error.message).toContain(
    "CHATTER_API_BASE_URLS",
  );
  response = await request.post(`${appOrigin}/api/provider/models`, {
    data: { baseUrl: apiBase },
    headers: {
      Origin: "https://unrelated.example",
      Authorization: `Bearer ${fixtureKey}`,
    },
  });
  expect(response.status()).toBe(403);
  expect(calls.length).toBe(before);
  response = await request.get(`${appOrigin}/api/provider/models`);
  expect(response.status()).toBe(405);
});

test("upstream authentication, redirects and HTML produce useful errors", async ({
  request,
}) => {
  let response = await request.post(
    `${appOrigin}/api/provider/chat/completions`,
    {
      data: {
        baseUrl: apiBase,
        payload: {
          model: "claude-fixture",
          messages: [{ role: "user", content: "Hi" }],
          stream: false,
        },
      },
    },
  );
  expect(response.status()).toBe(401);
  expect(await response.text()).not.toContain("Private provider detail");
  response = await request.post(`${appOrigin}/api/provider/models`, {
    data: { baseUrl: apiBase.replace("/v1/claude", "/redirect") },
  });
  expect(response.status()).toBe(502);
  expect((await response.json()).error.message).toContain("redirects");
  response = await request.post(`${appOrigin}/api/provider/models`, {
    data: { baseUrl: apiBase.replace("/v1/claude", "/html") },
  });
  expect(response.status()).toBe(502);
  expect((await response.json()).error.message).toContain(
    "instead of API JSON",
  );
});

test("static-only hosting reports that the Chatter server is missing", async ({
  page,
}) => {
  await page.goto(appOrigin);
  await page.route("**/api/provider/**", (route) =>
    route.fulfill({
      status: 200,
      contentType: "text/html",
      body: "<html>Static fallback</html>",
    }),
  );
  await page.getByRole("button", { name: "Step into the story" }).click();
  await page.getByTitle("Chat settings").click();
  await page.getByRole("tab", { name: "API", exact: true }).click();
  await page.getByRole("button", { name: "Load models", exact: true }).click();
  await expect(page.locator(".configuration-result")).toContainText(
    "static-only hosting cannot relay API requests",
  );
});
