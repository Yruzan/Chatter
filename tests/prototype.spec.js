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
    .getByLabel("A little introduction")
    .fill("A friend among the stars.");
  await page.getByRole("button", { name: "A little more personality" }).click();
  await page
    .getByLabel("Personality & backstory")
    .fill("An astronomer searching for a new constellation.");
  await page
    .getByLabel("Their first message")
    .fill("The stars are bright tonight. Will you join me?");
  await page.getByRole("button", { name: "Bring them to life" }).click();
  await expect(page.getByRole("dialog")).toContainText("Luna");
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
