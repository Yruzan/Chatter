import { test, expect } from "@playwright/test";
import { installProviderFixture } from "./provider-fixture";
import { readCompletionStream } from "../src/api";
import { formatTokens } from "../src/components/FormattedMessage";
const nav = (page, mobile) =>
  page.getByRole("navigation", {
    name: mobile ? "Mobile navigation" : "Main navigation",
    exact: true,
  });
async function settings(page, tab) {
  await page.getByTitle("Chat settings").click();
  if (tab) await page.getByRole("tab", { name: tab, exact: true }).click();
}
test.beforeEach(async ({ page }) => {
  page.on("pageerror", (error) => {
    throw error;
  });
  await installProviderFixture(page);
  await page.goto("/");
});

test("a very long prompt has no input cap, no per-keystroke storage writes, and survives immediate close", async ({
  page,
}) => {
  await page.getByRole("button", { name: "Step into the story" }).click();
  await settings(page);
  const long = "Long system instruction. ".repeat(10000);
  const input = page.getByLabel("System prompt", { exact: true });
  await expect(input).not.toHaveAttribute("maxlength", /.+/);
  await page.evaluate(() => {
    window.preferenceWrites = 0;
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key, value) {
      if (key === "chatter-preferences") window.preferenceWrites++;
      return original.call(this, key, value);
    };
    window.chatMutations = 0;
    new MutationObserver((records) => {
      window.chatMutations += records.length;
    }).observe(document.querySelector(".messages"), {
      childList: true,
      subtree: true,
      characterData: true,
    });
  });
  await input.fill(long);
  await input.press("End");
  await input.pressSequentially(" Extra typing without blocking.", {
    delay: 1,
  });
  await page.keyboard.press("Escape");
  await settings(page);
  await expect(input).toHaveValue(long + " Extra typing without blocking.");
  const counters = await page.evaluate(() => ({
    writes: window.preferenceWrites,
    mutations: window.chatMutations,
  }));
  expect(counters.writes).toBeLessThanOrEqual(2);
  expect(counters.mutations).toBe(0);
  await expect(
    page.getByLabel("Post prompt", { exact: true }),
  ).not.toHaveAttribute("maxlength", /.+/);
});

test("chat mounting stays bounded while paging and the request retains history outside the visible five", async ({
  page,
}) => {
  await page.evaluate(() =>
    localStorage.setItem(
      "chatter-sessions",
      JSON.stringify({
        seraphine: {
          characterId: "seraphine",
          updated: 1,
          messages: Array.from({ length: 1000 }, (_, i) => ({
            role: i % 2 ? "user" : "assistant",
            text: `History ${i}`,
          })),
        },
      }),
    ),
  );
  await page.reload();
  await page.getByRole("button", { name: "Step into the story" }).click();
  await expect(page.locator(".messages .message")).toHaveCount(5);
  await expect(page.locator(".messages .message").first()).toHaveAttribute(
    "data-message-index",
    "995",
  );
  for (let i = 0; i < 5; i++)
    await page
      .getByRole("button", { name: "Load 5 older messages", exact: true })
      .click();
  await expect(page.locator(".messages .message")).toHaveCount(20);
  await expect(
    page.getByRole("button", { name: "Load 5 newer messages", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Jump to latest", exact: true })
    .click();
  await expect(page.locator(".messages .message")).toHaveCount(5);
  let payload;
  await page.route(
    "https://api.openai.com/v1/chat/completions",
    async (route) => {
      payload = route.request().postDataJSON();
      await route.fulfill({
        json: { choices: [{ message: { content: "Continued from history" } }] },
      });
    },
  );
  await page
    .getByRole("textbox", { name: "Message", exact: true })
    .fill("Continue");
  await page.getByRole("button", { name: "Send message", exact: true }).click();
  await expect(page.locator(".message.assistant").last()).toContainText(
    "Continued from history",
  );
  expect(payload.messages.some((m) => m.content === "History 980")).toBe(true);
  await expect(page.locator(".messages .message")).toHaveCount(5);
});

test("long malformed formatting stays linear and a long bubble uses progressive display", async ({
  page,
}) => {
  const malformed = "“".repeat(200000);
  const started = performance.now();
  expect(
    formatTokens(malformed)
      .map((p) => p.text)
      .join(""),
  ).toBe(malformed);
  expect(performance.now() - started).toBeLessThan(2000);
  await page.evaluate(
    (text) =>
      localStorage.setItem(
        "chatter-sessions",
        JSON.stringify({
          seraphine: {
            characterId: "seraphine",
            updated: 1,
            messages: [{ role: "assistant", text }],
          },
        }),
      ),
    "A long message. ".repeat(20000),
  );
  await page.reload();
  await page.getByRole("button", { name: "Step into the story" }).click();
  expect(
    (await page.locator(".formatted-message").innerText()).length,
  ).toBeLessThan(12500);
  await page.getByRole("button", { name: /Show more of this message/ }).click();
  expect(
    (await page.locator(".formatted-message").innerText()).length,
  ).toBeGreaterThan(23000);
});

test("delete works for either role and saved endpoint keys restore and clear separately", async ({
  page,
}) => {
  await page.getByRole("button", { name: "Step into the story" }).click();
  await page
    .getByRole("textbox", { name: "Message", exact: true })
    .fill("Delete my message");
  await page.getByRole("button", { name: "Send message", exact: true }).click();
  await expect(page.locator(".message.assistant")).toHaveCount(2);
  await page
    .locator(".message.user")
    .getByRole("button", { name: "Delete message", exact: true })
    .click();
  await expect(page.locator(".message.user")).toHaveCount(0);
  await page
    .locator(".message.assistant")
    .last()
    .getByRole("button", { name: "Delete message", exact: true })
    .click();
  await expect(page.locator(".message.assistant")).toHaveCount(1);
  await settings(page, "API");
  await page.getByLabel("API key", { exact: true }).fill("fixture-saved-key");
  await page
    .getByLabel("API base URL", { exact: true })
    .fill("https://another.example/v1");
  await expect(page.getByLabel("API key", { exact: true })).toHaveValue("");
  await page
    .getByLabel("API base URL", { exact: true })
    .fill("https://api.openai.com/v1");
  await expect(page.getByLabel("API key", { exact: true })).toHaveValue(
    "fixture-saved-key",
  );
  await page.reload();
  await page.getByRole("button", { name: "Step into the story" }).click();
  await settings(page, "API");
  await expect(page.getByLabel("API key", { exact: true })).toHaveValue(
    "fixture-saved-key",
  );
  await page
    .getByRole("button", { name: "Clear saved key", exact: true })
    .click();
  expect(
    await page.evaluate(() =>
      Object.values(
        JSON.parse(localStorage.getItem("chatter-api-keys")),
      ).includes("fixture-saved-key"),
    ),
  ).toBe(false);
  expect(
    await page.evaluate(
      () =>
        JSON.parse(localStorage.getItem("chatter-sessions")).seraphine.messages
          .length,
    ),
  ).toBe(1);
});

test("SSE handles split Unicode, CRLF, completion markers and incomplete streams", async () => {
  const content =
    'data: {"choices":[{"delta":{"content":"Hello 🌙"}}]}\r\n\r\ndata: {"choices":[{"delta":{"content":" world"},"finish_reason":"stop"}]}\r\n\r\ndata: [DONE]\r\n\r\n';
  const bytes = new TextEncoder().encode(content);
  const updates = [];
  const body = new ReadableStream({
    start(controller) {
      for (const byte of bytes) controller.enqueue(Uint8Array.of(byte));
      controller.close();
    },
  });
  expect(await readCompletionStream(body, (text) => updates.push(text))).toBe(
    "Hello 🌙 world",
  );
  expect(updates).toEqual(["Hello 🌙", "Hello 🌙 world"]);
  const partial = new ReadableStream({
    start(c) {
      c.enqueue(
        new TextEncoder().encode(
          'data: {"choices":[{"delta":{"content":"partial"}}]}\n\n',
        ),
      );
      c.close();
    },
  });
  await expect(readCompletionStream(partial)).rejects.toThrow(/ended early/);
});

test("true black uses black surfaces and lorebook entries are edited through forms", async ({
  page,
  isMobile,
}) => {
  await page.getByRole("button", { name: "Step into the story" }).click();
  await settings(page, "Appearance");
  await page.getByRole("button", { name: /True black/ }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "black");
  await page
    .getByRole("button", { name: "Close settings", exact: true })
    .click();
  await expect(page.locator(".conversation-header")).toHaveCSS(
    "background-color",
    "rgb(0, 0, 0)",
  );
  if (isMobile)
    await page
      .getByRole("button", { name: "Back to chats", exact: true })
      .click();
  await nav(page, isMobile)
    .getByRole("button", {
      name: isMobile ? "Create" : "Create character",
      exact: true,
    })
    .click();
  await page.getByLabel("Character name", { exact: true }).fill("Lore keeper");
  await page
    .getByRole("button", { name: "Open lorebook editor", exact: true })
    .click();
  const editor = page.getByRole("dialog", {
    name: "Lorebook editor",
    exact: true,
  });
  await editor.getByRole("button", { name: "Add entry", exact: true }).click();
  await editor.getByLabel("Entry name", { exact: true }).fill("Silver gate");
  await editor
    .getByLabel("Primary keywords", { exact: true })
    .fill("silver\ngate");
  await editor
    .getByLabel("Entry content", { exact: true })
    .fill("A silver gate opens only at midnight.");
  await editor
    .getByRole("button", { name: "Apply lorebook", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Save character", exact: true })
    .first()
    .click();
  const saved = await page.evaluate(
    () => JSON.parse(localStorage.getItem("chatter-characters"))[0],
  );
  expect(saved.characterBook.entries[0].name).toBe("Silver gate");
  expect(saved.characterBook.entries[0].keys).toEqual(["silver", "gate"]);
  expect(saved.characterBook.entries[0].content).toContain("only at midnight");
});
