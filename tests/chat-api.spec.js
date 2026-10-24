import { installProviderFixture } from "./provider-fixture";
import { test, expect } from "@playwright/test";
const base = "https://chatter-api.example/v1";
const fakeKey = "test-only-not-a-real-api-key";
const nav = (page, mobile) =>
  page.getByRole("navigation", {
    name: mobile ? "Mobile navigation" : "Main navigation",
    exact: true,
  });
async function sidebar(page, mobile) {
  if (mobile)
    await page
      .getByRole("button", { name: "Open navigation menu", exact: true })
      .click();
  return page.getByRole(mobile ? "dialog" : "complementary", {
    name: mobile ? "Navigation menu" : "Sidebar",
    exact: true,
  });
}
async function settings(page) {
  await page.getByTitle("Chat settings").click();
  await page.getByRole("tab", { name: "API", exact: true }).click();
}
async function configure(page) {
  await settings(page);
  await page.getByLabel("Provider", { exact: true }).selectOption("custom");
  await page.getByLabel("API base URL", { exact: true }).fill(base);
  await page.getByLabel("Connection", { exact: true }).selectOption("direct");
  await page.getByLabel("API key", { exact: true }).fill(fakeKey);
}
async function send(page, text) {
  await page.getByRole("textbox", { name: "Message", exact: true }).fill(text);
  await page.getByRole("button", { name: "Send message", exact: true }).click();
}
async function reopen(page, mobile) {
  await page.reload();
  await nav(page, mobile)
    .getByRole("button", { name: "Chats", exact: false })
    .click();
  await page.locator(".history-card").first().locator("button").first().click();
}
test.beforeEach(async ({ page }) => {
  page.on("pageerror", (error) => {
    throw error;
  });
  await installProviderFixture(page);
  await page.goto("/");
});

test("history and new chats stay with the current character", async ({
  page,
  isMobile,
}) => {
  await page.evaluate(() =>
    localStorage.setItem(
      "chatter-sessions",
      JSON.stringify({
        seraphine: {
          characterId: "seraphine",
          updated: 1,
          messages: [
            { role: "assistant", text: "Hello from Seraphine" },
            { role: "user", text: "Forest story" },
          ],
        },
        kael: {
          characterId: "kael",
          updated: 2,
          messages: [
            { role: "assistant", text: "Hello from Kael" },
            { role: "user", text: "City story" },
          ],
        },
      }),
    ),
  );
  await page.reload();
  await page.getByRole("button", { name: "Step into the story" }).click();
  let menu = await sidebar(page, isMobile);
  await expect(menu.locator(".sidebar-history-item")).toHaveCount(1);
  await expect(menu.locator(".sidebar-history")).toContainText("Forest story");
  await expect(menu.locator(".sidebar-history")).not.toContainText(
    "City story",
  );
  await menu.getByRole("button", { name: "New chat", exact: true }).click();
  await expect(page.locator(".chat-intro h2")).toHaveText("Seraphine");
  await expect(page.locator(".message.user")).toHaveCount(0);
  menu = await sidebar(page, isMobile);
  await expect(menu.locator(".sidebar-history-item")).toHaveCount(2);
  await expect(menu.locator(".sidebar-history")).not.toContainText("Kael");
  await menu.getByRole("button", { name: "Chats", exact: false }).click();
  await expect(page.locator(".history-card")).toHaveCount(3);
  await page
    .locator(".history-card")
    .filter({ hasText: "Kael" })
    .locator("button")
    .first()
    .click();
  menu = await sidebar(page, isMobile);
  await expect(menu.locator(".sidebar-history-item")).toHaveCount(1);
  await expect(menu.locator(".sidebar-history")).toContainText("City story");
  await menu.getByRole("button", { name: "New chat", exact: true }).click();
  await expect(page.locator(".chat-intro h2")).toHaveText("Kael");
});

test("both roles edit and copy, regenerated versions persist and remain editable", async ({
  page,
  isMobile,
}) => {
  // Simulate an HTTP browser without navigator.clipboard, then a denied API.
  await page.evaluate(() => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: undefined,
    });
    document.execCommand = (command) => {
      window.copiedText = document.activeElement.value;
      return command === "copy";
    };
  });
  await page.getByRole("button", { name: "Step into the story" }).click();
  await send(page, "Hello");
  await expect(page.locator(".message.assistant")).toHaveCount(2);
  const user = page.locator(".message.user");
  await user
    .getByRole("button", { name: "Edit your message", exact: true })
    .click();
  await page
    .getByLabel("Edit message text", { exact: true })
    .fill("My edited question");
  await page.getByRole("button", { name: "Save message", exact: true }).click();
  await user.getByRole("button", { name: "Copy message", exact: true }).click();
  expect(await page.evaluate(() => window.copiedText)).toBe(
    "My edited question",
  );
  await expect(page.getByRole("status")).toContainText("Message copied");
  await page.evaluate(() =>
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: () => Promise.reject(new Error("Denied")) },
    }),
  );
  const bot = page.locator(".message.assistant").last();
  await bot
    .getByRole("button", { name: "Edit character message", exact: true })
    .click();
  await page
    .getByLabel("Edit message text", { exact: true })
    .fill("Original edited reply");
  await page.getByRole("button", { name: "Save message", exact: true }).click();
  await page
    .getByRole("button", { name: "Regenerate reply", exact: true })
    .click();
  await expect(
    bot.getByRole("group", { name: "Reply versions" }),
  ).toContainText("2 / 2");
  await page
    .getByRole("button", { name: "Previous reply", exact: true })
    .click();
  await expect(bot.locator(".message-bubble")).toHaveText(
    "Original edited reply",
  );
  await expect(
    page.getByRole("button", { name: "Previous reply", exact: true }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "Next reply", exact: true }).click();
  await bot
    .getByRole("button", { name: "Edit character message", exact: true })
    .click();
  await page
    .getByLabel("Edit message text", { exact: true })
    .fill("Edited second version");
  await page.getByRole("button", { name: "Save message", exact: true }).click();
  await bot.getByRole("button", { name: "Copy message", exact: true }).click();
  expect(await page.evaluate(() => window.copiedText)).toBe(
    "Edited second version",
  );
  await page
    .getByRole("button", { name: "Regenerate reply", exact: true })
    .click();
  await expect(
    bot.getByRole("group", { name: "Reply versions" }),
  ).toContainText("3 / 3");
  await page
    .getByRole("button", { name: "Previous reply", exact: true })
    .click();
  await reopen(page, isMobile);
  await expect(bot.locator(".message-bubble")).toHaveText(
    "Edited second version",
  );
  await expect(
    bot.getByRole("group", { name: "Reply versions" }),
  ).toContainText("2 / 3");
  await page
    .getByRole("button", { name: "Previous reply", exact: true })
    .click();
  await expect(bot.locator(".message-bubble")).toHaveText(
    "Original edited reply",
  );
  await user
    .getByRole("button", { name: "Edit your message", exact: true })
    .click();
  await page.getByLabel("Edit message text", { exact: true }).fill("");
  await expect(
    page.getByRole("button", { name: "Save message", exact: true }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(user.locator(".message-bubble")).toHaveText(
    "My edited question",
  );
});

test("loads real endpoint models, tests connection and sends selected model and variant context", async ({
  page,
}) => {
  const requests = [];
  let generation = 0;
  await page.route(`${base}/**`, async (route) => {
    expect(route.request().headers().authorization).toBe(`Bearer ${fakeKey}`);
    if (route.request().url().endsWith("/models"))
      return route.fulfill({
        json: {
          data: [{ id: "story-b" }, { id: "story-a" }, { id: "story-a" }],
        },
      });
    const body = route.request().postDataJSON();
    requests.push(body);
    const text =
      body.messages.at(-1).content === "Reply with: Connection successful"
        ? "Connection successful"
        : `Provider reply ${++generation}`;
    return route.fulfill({
      json: { choices: [{ message: { role: "assistant", content: text } }] },
    });
  });
  await page.getByRole("button", { name: "Step into the story" }).click();
  await configure(page);
  await page.getByRole("button", { name: "Load models", exact: true }).click();
  await expect(page.getByLabel("Model ID", { exact: true })).toHaveJSProperty(
    "tagName",
    "SELECT",
  );
  await expect(
    page.getByLabel("Model ID", { exact: true }).locator("option"),
  ).toHaveText(["story-a", "story-b"]);
  await page.getByLabel("Model ID", { exact: true }).selectOption("story-b");
  await page
    .getByRole("button", { name: "Test connection", exact: true })
    .click();
  await expect(page.locator(".configuration-result")).toContainText(
    "Live request succeeded: Connection successful",
  );
  await page
    .getByRole("button", { name: "Close settings", exact: true })
    .click();
  await settings(page);
  await expect(page.getByLabel("Model ID", { exact: true })).toHaveJSProperty(
    "tagName",
    "SELECT",
  );
  await expect(page.getByLabel("Model ID", { exact: true })).toHaveValue(
    "story-b",
  );
  await page
    .getByRole("button", { name: "Close settings", exact: true })
    .click();
  await send(page, "Start a real story");
  await expect(
    page.locator(".message.assistant").last().locator(".message-bubble"),
  ).toHaveText("Provider reply 1");
  expect(requests[1].model).toBe("story-b");
  expect(requests[1].messages[1].content).toContain("You are Seraphine");
  expect(requests[1].messages.at(-1)).toEqual({
    role: "user",
    content: "Start a real story",
  });
  expect(requests[1].temperature).toBe(0.8);
  expect(requests[1].max_tokens).toBe(512);
  expect(requests[1].stream).toBe(false);
  await page
    .getByRole("button", { name: "Regenerate reply", exact: true })
    .click();
  await expect(
    page.locator(".message.assistant").last().locator(".message-bubble"),
  ).toHaveText("Provider reply 2");
  expect(requests[2].messages.at(-1).role).toBe("user");
  await page
    .getByRole("button", { name: "Previous reply", exact: true })
    .click();
  await send(page, "Continue from my chosen reply");
  await expect(page.locator(".message.assistant")).toHaveCount(3);
  expect(requests[3].messages.at(-2).content).toBe("Provider reply 1");
  expect(
    await page.evaluate(() => Object.values(localStorage).join(" ")),
  ).not.toContain(fakeKey);
  await page.reload();
  await page.getByRole("button", { name: "Step into the story" }).click();
  await settings(page);
  await expect(
    page.getByRole("switch", { name: "Use live AI", exact: false }),
  ).toHaveCount(0);
  await expect(page.getByLabel("API key", { exact: true })).toHaveValue("");
});

test("request failures preserve turns, retries work, and cancellation adds no fake reply", async ({
  page,
}) => {
  let mode = "unauthorized";
  let release;
  const delayed = new Promise((resolve) => {
    release = resolve;
  });
  await page.route(`${base}/chat/completions`, async (route) => {
    if (mode === "unauthorized")
      return route.fulfill({
        status: 401,
        json: { error: { message: "Secret upstream details" } },
      });
    if (mode === "delayed") await delayed;
    return route
      .fulfill({
        json: {
          choices: [{ message: { content: "A genuine transport response" } }],
        },
      })
      .catch(() => {});
  });
  await page.getByRole("button", { name: "Step into the story" }).click();
  await configure(page);
  await page.getByLabel("Model ID", { exact: true }).fill("story-model");
  await page
    .getByRole("button", { name: "Close settings", exact: true })
    .click();
  await send(page, "Keep this question");
  await expect(page.getByRole("alert")).toContainText("API error 401");
  await expect(page.locator(".message.assistant")).toHaveCount(1);
  await expect(page.locator(".message.user")).toHaveCount(1);
  mode = "ok";
  await page.getByRole("button", { name: "Retry reply", exact: true }).click();
  await expect(page.locator(".message.assistant")).toHaveCount(2);
  await expect(page.locator(".message.user")).toHaveCount(1);
  mode = "delayed";
  await page
    .getByRole("button", { name: "Regenerate reply", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Stop generating", exact: true })
    .click();
  await expect(page.getByRole("alert")).toContainText("Generation stopped");
  release();
  await expect(
    page.locator(".message.assistant").last().locator(".message-bubble"),
  ).toHaveText("A genuine transport response");
  await expect(page.getByRole("group", { name: "Reply versions" })).toHaveCount(
    0,
  );
  mode = "ok";
  await page.getByRole("button", { name: "Retry reply", exact: true }).click();
  await expect(
    page.getByRole("group", { name: "Reply versions" }),
  ).toContainText("2 / 2");
});

test("unsupported model listing allows manual IDs and changing endpoints invalidates its list", async ({
  page,
}) => {
  let mode = "unsupported";
  await page.route(`${base}/models`, (route) =>
    mode === "unsupported"
      ? route.fulfill({ status: 404, json: {} })
      : route.fulfill({ json: { data: [{ id: "private-story-model" }] } }),
  );
  await page.getByRole("button", { name: "Step into the story" }).click();
  await configure(page);
  await page.getByRole("button", { name: "Load models", exact: true }).click();
  await expect(page.locator(".configuration-result")).toContainText(
    "API error 404",
  );
  await page.getByLabel("Model ID", { exact: true }).fill("manual-model");
  mode = "ok";
  await page.getByRole("button", { name: "Load models", exact: true }).click();
  await expect(page.getByLabel("Model ID", { exact: true })).toHaveValue(
    "private-story-model",
  );
  await expect(page.getByLabel("Model ID", { exact: true })).toHaveJSProperty(
    "tagName",
    "SELECT",
  );
  await page
    .getByLabel("API base URL", { exact: true })
    .fill("https://another-provider.example/v1");
  await expect(page.getByLabel("Model ID", { exact: true })).toHaveJSProperty(
    "tagName",
    "INPUT",
  );
  await expect(page.locator("#api-model option")).toHaveCount(0);
});

test("copy fallback writes the selected text to the actual browser clipboard", async ({
  page,
  context,
}) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"], {
    origin: "http://127.0.0.1:5173",
  });
  await page.evaluate(() => {
    window.nativeClipboard = navigator.clipboard;
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: undefined,
    });
  });
  await page.getByRole("button", { name: "Step into the story" }).click();
  const expected = await page.evaluate(
    () =>
      JSON.parse(localStorage.getItem("chatter-sessions")).seraphine.messages[0]
        .text,
  );
  await page.getByRole("button", { name: "Copy message", exact: true }).click();
  expect(await page.evaluate(() => window.nativeClipboard.readText())).toBe(
    expected,
  );
});
