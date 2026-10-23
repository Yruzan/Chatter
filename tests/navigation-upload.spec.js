import { test, expect } from "@playwright/test";
const navigation = (page, mobile) =>
  page.getByRole("navigation", {
    name: mobile ? "Mobile navigation" : "Main navigation",
    exact: true,
  });
async function openSidebar(page, mobile) {
  if (mobile)
    await page
      .getByRole("button", { name: "Open navigation menu", exact: true })
      .click();
  return mobile
    ? page.getByRole("dialog", { name: "Navigation menu", exact: true })
    : page.getByRole("complementary", { name: "Sidebar", exact: true });
}
async function portraitFile(page) {
  const data = await page.evaluate(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 64;
    canvas.height = 128;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#d86369";
    ctx.fillRect(0, 0, 64, 64);
    ctx.fillStyle = "#4376b0";
    ctx.fillRect(0, 64, 64, 64);
    return canvas.toDataURL("image/png").split(",")[1];
  });
  return {
    name: "my-character.png",
    mimeType: "image/png",
    buffer: Buffer.from(data, "base64"),
  };
}
async function enterRequiredFields(page, name) {
  await page.getByLabel("Character name", { exact: true }).fill(name);
  await page
    .getByLabel("Description", { exact: true })
    .fill("An original traveler with a story to tell.");
  await page
    .getByLabel("First message", { exact: true })
    .fill('*A friendly wave.* "Hello, {{user}}. I am {{char}}."');
}
test.beforeEach(async ({ page }) => {
  page.on("pageerror", (error) => {
    throw error;
  });
  await page.goto("/");
});

test("uploaded portraits crop, save, reload and appear in chat", async ({
  page,
  isMobile,
}) => {
  await navigation(page, isMobile)
    .getByRole("button", {
      name: isMobile ? "Create" : "Create character",
      exact: true,
    })
    .click();
  await enterRequiredFields(page, "My Uploaded Character");
  await page
    .getByLabel("Upload character image", { exact: true })
    .setInputFiles(await portraitFile(page));
  const crop = page.getByRole("img", {
    name: "Character portrait crop preview",
    exact: true,
  });
  await expect(crop).toBeVisible();
  const firstCrop = await crop.getAttribute("src");
  await page
    .getByRole("slider", { name: "Vertical position", exact: true })
    .press("Home");
  await expect(crop).not.toHaveAttribute("src", firstCrop);
  await page.getByRole("button", { name: "Done framing", exact: true }).click();
  await page
    .getByRole("button", { name: "Save character", exact: true })
    .first()
    .click();
  const stored = await page.evaluate(
    () => JSON.parse(localStorage.getItem("chatter-characters"))[0].portrait,
  );
  expect(stored).toMatch(/^data:image\/(webp|png);base64,/);
  const image = page.getByRole("dialog").locator(".custom-art img").first();
  await expect(image).toHaveAttribute("src", stored);
  expect(await image.evaluate((img) => img.naturalWidth)).toBe(512);
  await page.reload();
  await page
    .getByRole("button", { name: "View My Uploaded Character", exact: true })
    .click();
  await expect(
    page.getByRole("dialog").locator(".custom-art img"),
  ).toHaveAttribute("src", stored);
  await page
    .getByRole("button", { name: "Edit character", exact: true })
    .click();
  await expect(page.locator(".studio-current-portrait img")).toHaveAttribute(
    "src",
    stored,
  );
  await page
    .getByRole("button", { name: "Save changes", exact: true })
    .first()
    .click();
  await page
    .getByRole("button", { name: "Start chatting", exact: true })
    .click();
  await expect(
    page.locator(".conversation-person .custom-art img"),
  ).toHaveAttribute("src", stored);
  await expect(page.locator(".message.assistant")).toContainText(
    "Hello, Alex. I am My Uploaded Character.",
  );
});

test("invalid uploads preserve the portrait and storage failure keeps the editor open", async ({
  page,
  isMobile,
}) => {
  await navigation(page, isMobile)
    .getByRole("button", {
      name: isMobile ? "Create" : "Create character",
      exact: true,
    })
    .click();
  const input = page.getByLabel("Upload character image", { exact: true });
  await input.setInputFiles({
    name: "not-an-image.svg",
    mimeType: "image/svg+xml",
    buffer: Buffer.from("<svg/>"),
  });
  await expect(page.locator(".portrait-upload-error")).toContainText(
    "JPG, PNG, or WebP",
  );
  await input.setInputFiles(await portraitFile(page));
  const portrait = page.locator(".studio-current-portrait img");
  await expect(portrait).toBeVisible();
  const current = await portrait.getAttribute("src");
  await input.setInputFiles({
    name: "broken.png",
    mimeType: "image/png",
    buffer: Buffer.from("not a valid image"),
  });
  await expect(page.locator(".portrait-upload-error")).toContainText(
    "could not be opened",
  );
  await expect(portrait).toHaveAttribute("src", current);
  await enterRequiredFields(page, "Keep My Work");
  await page.evaluate(() => {
    window.originalStorageSetItem = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key, value) {
      if (key === "chatter-characters")
        throw new DOMException("Storage full", "QuotaExceededError");
      return window.originalStorageSetItem.call(this, key, value);
    };
  });
  await page
    .getByRole("button", { name: "Save character", exact: true })
    .first()
    .click();
  await expect(page.getByRole("status")).toContainText("Not saved");
  await expect(page.getByLabel("Character name", { exact: true })).toHaveValue(
    "Keep My Work",
  );
  await expect(page.locator(".studio-current-portrait img")).toHaveAttribute(
    "src",
    current,
  );
  await page.evaluate(() => {
    Storage.prototype.setItem = window.originalStorageSetItem;
  });
  await page
    .getByRole("button", { name: "Save character", exact: true })
    .first()
    .click();
  await expect(page.getByRole("dialog")).toContainText("Keep My Work");
});

test("sidebar shows real history and new chats preserve earlier conversations", async ({
  page,
  isMobile,
}) => {
  let sidebar = await openSidebar(page, isMobile);
  await expect(
    sidebar.getByRole("navigation", { name: "Main navigation", exact: true }),
  ).toBeVisible();
  await expect(sidebar.locator(".art")).toHaveCount(0);
  await expect(
    sidebar.getByRole("region", { name: "Chat history", exact: true }),
  ).toContainText("Start your first chat");
  await expect(sidebar.getByText("Kael", { exact: true })).toHaveCount(0);
  if (isMobile) {
    await page.keyboard.press("Escape");
    await expect(sidebar).toBeHidden();
    await expect(
      page.getByRole("button", { name: "Open navigation menu", exact: true }),
    ).toBeFocused();
    sidebar = await openSidebar(page, true);
    await page
      .getByRole("button", { name: "Close navigation backdrop", exact: true })
      .click();
    await expect(sidebar).toBeHidden();
    sidebar = await openSidebar(page, true);
  }
  await sidebar.getByRole("button", { name: "New chat", exact: true }).click();
  await page
    .getByRole("textbox", {
      name: "Search characters for a new chat",
      exact: true,
    })
    .fill("Seraphine");
  await page
    .getByRole("button", {
      name: "Start a new chat with Seraphine",
      exact: true,
    })
    .click();
  await page
    .getByRole("textbox", { name: "Message", exact: true })
    .fill("Find the moonlit path");
  await page.getByRole("button", { name: "Send message", exact: true }).click();
  await expect(page.locator(".message.assistant")).toHaveCount(2);
  sidebar = await openSidebar(page, isMobile);
  await expect(
    sidebar.getByRole("button", {
      name: "Open conversation Find the moonlit path with Seraphine",
      exact: true,
    }),
  ).toBeVisible();
  await sidebar.getByRole("button", { name: "New chat", exact: true }).click();
  await page
    .getByRole("button", {
      name: "Start a new chat with Seraphine",
      exact: true,
    })
    .click();
  await expect(page.locator(".message.user")).toHaveCount(0);
  await page
    .getByRole("textbox", { name: "Message", exact: true })
    .fill("Second chapter");
  await page.getByRole("button", { name: "Send message", exact: true }).click();
  await expect(page.locator(".message.assistant")).toHaveCount(2);
  expect(
    await page.evaluate(
      () =>
        Object.keys(JSON.parse(localStorage.getItem("chatter-sessions")))
          .length,
    ),
  ).toBe(2);
  sidebar = await openSidebar(page, isMobile);
  await sidebar
    .getByRole("textbox", { name: "Search chat history", exact: true })
    .fill("moonlit");
  await expect(sidebar.locator(".sidebar-history-item")).toHaveCount(1);
  await sidebar
    .getByRole("button", {
      name: "Open conversation Find the moonlit path with Seraphine",
      exact: true,
    })
    .click();
  await expect(page.locator(".message.user .message-bubble")).toHaveText(
    "Find the moonlit path",
  );
  await expect(page.locator(".messages")).not.toContainText("Second chapter");
  await page.reload();
  await navigation(page, isMobile)
    .getByRole("button", { name: "Chats", exact: false })
    .click();
  await expect(page.locator(".history-card")).toHaveCount(2);
});

test("navigation is available in the character editor without losing its draft", async ({
  page,
  isMobile,
}) => {
  await navigation(page, isMobile)
    .getByRole("button", {
      name: isMobile ? "Create" : "Create character",
      exact: true,
    })
    .click();
  await page
    .getByLabel("Character name", { exact: true })
    .fill("A saved draft");
  const sidebar = await openSidebar(page, isMobile);
  await sidebar.getByRole("button", { name: "Library", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "A world of characters", exact: true }),
  ).toBeVisible();
  if (isMobile) await expect(sidebar).toBeHidden();
  await navigation(page, isMobile)
    .getByRole("button", {
      name: isMobile ? "Create" : "Create character",
      exact: true,
    })
    .click();
  await expect(page.getByLabel("Character name", { exact: true })).toHaveValue(
    "A saved draft",
  );
});
