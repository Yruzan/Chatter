import { installProviderFixture } from "./provider-fixture";
import { test, expect } from "@playwright/test";
const nav = (page, mobile) =>
  page.getByRole("navigation", {
    name: mobile ? "Mobile navigation" : "Main navigation",
    exact: true,
  });
test.beforeEach(async ({ page }) => {
  page.on("pageerror", (error) => {
    throw error;
  });
  await installProviderFixture(page);
  await page.goto("/");
});
test("responsive navigation, character discovery and details", async ({
  page,
  isMobile,
}) => {
  await expect(nav(page, isMobile)).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "A little escape.", exact: false }),
  ).toBeVisible();
  await expect(page.locator(".character-card")).toHaveCount(6);
  await page.getByRole("button", { name: "Comfort", exact: true }).click();
  await expect(page.locator(".character-card")).toHaveCount(3);
  await page.getByRole("button", { name: "For you", exact: true }).click();
  await page.getByRole("textbox", { name: "Search characters" }).fill("Kael");
  await expect(page.locator(".character-card")).toHaveCount(1);
  await page.getByRole("button", { name: "View Kael", exact: true }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(
    page
      .getByRole("dialog")
      .getByRole("heading", { name: "Kael", exact: true }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBeTruthy();
});
test("send, regenerate, persist and reset a conversation", async ({
  page,
  isMobile,
}) => {
  await page.getByRole("button", { name: "Step into the story" }).click();
  await expect(page.locator(".message.assistant")).toHaveCount(1);
  await page
    .getByRole("textbox", { name: "Message", exact: true })
    .fill("Hello there");
  await page.getByRole("button", { name: "Send message" }).click();
  await expect(page.locator(".message.user")).toHaveCount(1);
  await expect(page.locator(".message.assistant")).toHaveCount(2);
  await expect(page.locator(".message.assistant").last()).toContainText(
    "Hello, Alex",
  );
  await page.getByRole("button", { name: "Regenerate reply" }).click();
  await expect(page.locator(".message.assistant").last()).toContainText(
    "unexpected path",
  );
  await page.reload();
  await nav(page, isMobile)
    .getByRole("button", { name: "Chats", exact: false })
    .click();
  await page
    .locator(".history-card")
    .filter({ hasText: "Seraphine" })
    .locator("button")
    .first()
    .click();
  await expect(page.locator(".message.user")).toHaveCount(1);
  await page.getByTitle("Chat settings").click();
  await page.getByRole("button", { name: "Creative", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Creative", exact: true }),
  ).toHaveClass("selected");
  await page
    .getByRole("button", { name: "Start a fresh conversation" })
    .click();
  await expect(page.locator(".message.user")).toHaveCount(0);
});
test("favorite collection persists", async ({ page, isMobile }) => {
  await page.getByRole("button", { name: "Save Kael", exact: true }).click();
  await nav(page, isMobile)
    .getByRole("button", { name: "Library", exact: true })
    .click();
  await page.getByRole("button", { name: "Saved", exact: false }).click();
  await expect(page.locator(".character-card")).toHaveCount(3);
  await page.reload();
  await nav(page, isMobile)
    .getByRole("button", { name: "Library", exact: true })
    .click();
  await page.getByRole("button", { name: "Saved", exact: false }).click();
  await expect(
    page.getByRole("button", { name: "View Kael", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Unsave Kael", exact: true }).click();
  await expect(page.locator(".character-card")).toHaveCount(2);
});
test("create an original character and edit the profile", async ({
  page,
  isMobile,
}) => {
  await nav(page, isMobile)
    .getByRole("button", {
      name: isMobile ? "Create" : "Create character",
      exact: true,
    })
    .click();
  await page.getByLabel("Character name").fill("Luna");
  await page
    .getByLabel("Bio", { exact: true })
    .fill("A friend among the stars.");
  await page
    .getByLabel("Description", { exact: true })
    .fill("An astronomer searching for a new constellation.");
  await page
    .getByLabel("First message", { exact: false })
    .fill("The stars are bright tonight. Will you join me?");
  await page
    .getByLabel("Personality", { exact: true })
    .fill("Gentle, observant, and quietly adventurous.");
  await page
    .getByLabel("Scenario", { exact: true })
    .fill("You meet at an observatory above the clouds.");
  await page.getByRole("textbox", { name: "Add a tag" }).fill("Astronomy");
  await page.getByRole("textbox", { name: "Add a tag" }).press("Enter");
  await page
    .getByRole("textbox", { name: "Example 1 user message", exact: true })
    .fill("What are you looking for?");
  await page
    .getByRole("textbox", { name: "Example 1 character message", exact: true })
    .fill('*She smiles.* "Something no one has ever seen."');
  await page
    .getByRole("button", { name: "Save character", exact: true })
    .first()
    .click();
  await expect(page.getByRole("dialog")).toContainText("Luna");
  const created = await page.evaluate(
    () => JSON.parse(localStorage.getItem("chatter-characters"))[0],
  );
  expect(created.personality).toContain("Gentle");
  expect(created.scenario).toContain("observatory");
  expect(created.tags).toContain("Astronomy");
  expect(created.examples[0].character).toContain("Something no one");
  await page
    .getByRole("button", { name: "Edit character", exact: true })
    .click();
  await expect(page.getByLabel("Description", { exact: true })).toHaveValue(
    created.description,
  );
  await expect(page.getByLabel("Personality", { exact: true })).toHaveValue(
    created.personality,
  );
  await expect(
    page.getByRole("textbox", {
      name: "Example 1 character message",
      exact: true,
    }),
  ).toHaveValue(created.examples[0].character);
  await page
    .getByLabel("Bio", { exact: true })
    .fill("A new chapter among the stars.");
  await page
    .getByRole("button", { name: "Save changes", exact: true })
    .first()
    .click();
  await expect(page.getByRole("dialog")).toContainText(
    "A new chapter among the stars.",
  );
  await page
    .getByRole("button", { name: "Start chatting", exact: true })
    .click();
  await expect(page.locator(".message.assistant")).toContainText(
    "The stars are bright tonight",
  );
  if (isMobile)
    await page.getByRole("button", { name: "Back to chats" }).click();
  await nav(page, isMobile)
    .getByRole("button", { name: "Profile", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Luna", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Edit profile" }).click();
  await page.getByLabel("Display name").fill("River");
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page.getByRole("heading", { name: "River." })).toBeVisible();
  await page.reload();
  await nav(page, isMobile)
    .getByRole("button", { name: "Profile", exact: true })
    .click();
  await expect(page.getByRole("heading", { name: "River." })).toBeVisible();
});

test("appearance changes update real chat formatting and persist", async ({
  page,
}) => {
  await page.getByRole("button", { name: "Step into the story" }).click();
  await page.getByTitle("Chat settings").click();
  await page.getByRole("tab", { name: "Appearance", exact: true }).click();
  await page
    .getByLabel("Asterisk action color", { exact: true })
    .fill("#ff9966");
  await page
    .getByLabel("Quotation dialogue color", { exact: true })
    .fill("#99aaff");
  await page.getByLabel("Regular text color", { exact: true }).fill("#eeeeee");
  await page.getByLabel("Chat font", { exact: true }).selectOption("serif");
  await page
    .getByRole("switch", { name: "Bold quoted dialogue", exact: true })
    .check();
  await page
    .getByRole("switch", { name: "Show asterisk markers", exact: true })
    .check();
  await expect(page.locator(".messages .msg-action").first()).toHaveCSS(
    "color",
    "rgb(255, 153, 102)",
  );
  await expect(page.locator(".messages .msg-dialogue").first()).toHaveCSS(
    "color",
    "rgb(153, 170, 255)",
  );
  await expect(page.locator(".messages .msg-dialogue").first()).toHaveCSS(
    "font-weight",
    "600",
  );
  await expect(page.locator(".messages .formatted-message").first()).toHaveCSS(
    "font-family",
    "Georgia, serif",
  );
  await expect(page.locator(".messages .msg-action").first()).toContainText(
    "*",
  );
  await page.reload();
  await page.getByRole("button", { name: "Step into the story" }).click();
  await expect(page.locator(".messages .msg-action").first()).toHaveCSS(
    "color",
    "rgb(255, 153, 102)",
  );
  await page.getByTitle("Chat settings").click();
  await page.getByRole("tab", { name: "Appearance", exact: true }).click();
  await page
    .getByRole("button", { name: "Reset appearance", exact: true })
    .click();
  await expect(page.locator(".messages .msg-action").first()).toHaveCSS(
    "color",
    "rgb(159, 197, 169)",
  );
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("dialog", { name: "Chat settings panel", exact: true }),
  ).toHaveCount(0);
});

test("API drafts validate honestly and save keys separately from API configuration", async ({
  page,
}) => {
  await page.getByRole("button", { name: "Step into the story" }).click();
  await page.getByTitle("Chat settings").click();
  await page.getByRole("tab", { name: "API", exact: true }).click();
  await expect(page.getByText("Live API replies")).toBeVisible();
  await page.getByLabel("Provider", { exact: true }).selectOption("custom");
  await page
    .getByLabel("API base URL", { exact: true })
    .fill("http://example.com/v1");
  await page.getByLabel("Model ID", { exact: true }).fill("my-model");
  const fakeKey = "prototype-test-key-not-a-real-credential";
  await page.getByLabel("API key", { exact: true }).fill(fakeKey);
  await page
    .getByRole("button", { name: "Validate configuration", exact: true })
    .click();
  await expect(page.locator(".configuration-result")).toContainText("HTTPS");
  await page
    .getByLabel("API base URL", { exact: true })
    .fill("https://example.com/v1");
  await page.getByLabel("API key", { exact: true }).fill(fakeKey);
  await page
    .getByRole("button", { name: "Validate configuration", exact: true })
    .click();
  await expect(page.locator(".configuration-result")).toContainText(
    "No API request was sent",
  );
  expect(
    await page.evaluate(() =>
      Object.entries(localStorage)
        .filter(([name]) => name !== "chatter-api-keys")
        .map(([, value]) => value)
        .join(" "),
    ),
  ).not.toContain(fakeKey);
  await page.reload();
  await page.getByRole("button", { name: "Step into the story" }).click();
  await page.getByTitle("Chat settings").click();
  await page.getByRole("tab", { name: "API", exact: true }).click();
  await expect(page.getByLabel("API base URL", { exact: true })).toHaveValue(
    "https://example.com/v1",
  );
  await expect(page.getByLabel("API key", { exact: true })).toHaveValue(
    fakeKey,
  );
});

test("character drafts survive navigation and remix preserves original characters", async ({
  page,
  isMobile,
}) => {
  await nav(page, isMobile)
    .getByRole("button", {
      name: isMobile ? "Create" : "Create character",
      exact: true,
    })
    .click();
  await page
    .getByLabel("Character name", { exact: false })
    .fill("Unfinished Star");
  await page
    .getByLabel("Personality", { exact: true })
    .fill("Curious but easily distracted.");
  await page
    .getByRole("button", { name: "Back to exploring", exact: true })
    .click();
  await nav(page, isMobile)
    .getByRole("button", {
      name: isMobile ? "Create" : "Create character",
      exact: true,
    })
    .click();
  await expect(page.getByLabel("Character name", { exact: false })).toHaveValue(
    "Unfinished Star",
  );
  await expect(page.getByLabel("Personality", { exact: true })).toHaveValue(
    "Curious but easily distracted.",
  );
  if (isMobile) {
    await page.getByRole("button", { name: "Preview", exact: true }).click();
    await expect(
      page.getByRole("dialog", { name: "Live character preview" }),
    ).toContainText("Unfinished Star");
    await page.keyboard.press("Escape");
  }
  await page
    .getByRole("button", { name: "Back to exploring", exact: true })
    .click();
  await page
    .getByRole("button", { name: "View Seraphine", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Remix character", exact: true })
    .click();
  await expect(page.getByLabel("Character name", { exact: false })).toHaveValue(
    "Seraphine",
  );
  await page
    .getByLabel("Character name", { exact: false })
    .fill("Seraphine, reimagined");
  await page
    .getByRole("button", { name: "Save character", exact: true })
    .first()
    .click();
  await expect(page.getByRole("dialog")).toContainText("Seraphine, reimagined");
  await page.getByRole("button", { name: "Close dialog", exact: true }).click();
  await nav(page, isMobile)
    .getByRole("button", { name: "Home", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "View Seraphine", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", {
      name: "View Seraphine, reimagined",
      exact: true,
    }),
  ).toBeVisible();
});

test("older characters and preferences keep their data when edited", async ({
  page,
  isMobile,
}) => {
  await page.evaluate(() => {
    localStorage.setItem(
      "chatter-characters",
      JSON.stringify([
        {
          id: "legacy-character",
          name: "An Old Friend",
          tagline: "An older saved bio.",
          description: "An older character definition.",
          greeting: '"Welcome back."',
          tags: ["Fantasy"],
          art: 0,
          creator: "alex",
          chats: "0",
        },
      ]),
    );
    localStorage.setItem(
      "chatter-sessions",
      JSON.stringify({
        "legacy-character": {
          updated: 1,
          messages: [
            { role: "assistant", text: '"Welcome back."' },
            { role: "user", text: "This conversation must survive." },
          ],
        },
      }),
    );
    localStorage.setItem(
      "chatter-preferences",
      JSON.stringify({
        temperature: 0.6,
        style: "Balanced",
        prompt: "Keep my original instructions.",
        memory: true,
      }),
    );
  });
  await page.reload();
  await nav(page, isMobile)
    .getByRole("button", { name: "Profile", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Edit An Old Friend", exact: true })
    .click();
  await expect(page.getByLabel("Bio", { exact: true })).toHaveValue(
    "An older saved bio.",
  );
  await expect(page.getByLabel("Description", { exact: true })).toHaveValue(
    "An older character definition.",
  );
  await page
    .getByLabel("Personality", { exact: true })
    .fill("Warm and reassuring.");
  await page
    .getByRole("button", { name: "Save changes", exact: true })
    .first()
    .click();
  const stored = await page.evaluate(() => ({
    characters: JSON.parse(localStorage.getItem("chatter-characters")),
    sessions: JSON.parse(localStorage.getItem("chatter-sessions")),
  }));
  expect(stored.characters).toHaveLength(1);
  expect(stored.characters[0].id).toBe("legacy-character");
  expect(stored.sessions["legacy-character"].messages[1].text).toBe(
    "This conversation must survive.",
  );
  await page.getByRole("button", { name: "Close dialog", exact: true }).click();
  await nav(page, isMobile)
    .getByRole("button", { name: "Home", exact: true })
    .click();
  await page.getByRole("button", { name: "Step into the story" }).click();
  await page.getByTitle("Chat settings").click();
  await expect(page.getByLabel("System prompt", { exact: true })).toHaveValue(
    "Keep my original instructions.",
  );
  const output = page.getByRole("slider", { name: /Maximum response/ });
  await output.press("End");
  await expect(output).toHaveValue("4096");
  await page.getByRole("slider", { name: /Context window/ }).press("Home");
  await expect(output).toHaveValue("2048");
  expect(
    await page.evaluate(
      () => JSON.parse(localStorage.getItem("chatter-preferences")).contextSize,
    ),
  ).toBe(2048);
  await page
    .getByRole("button", { name: "Reset generation parameters", exact: true })
    .click();
  await expect(page.getByLabel("System prompt", { exact: true })).toHaveValue(
    "Keep my original instructions.",
  );
  await expect(
    page.getByRole("slider", { name: /Context window/ }),
  ).toHaveValue("2048");
});
