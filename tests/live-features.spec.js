import { test, expect } from "@playwright/test";
import { installProviderFixture } from "./provider-fixture";
import { makeCard, cardPNG } from "./card-fixtures";
import { normalizeCard, cardFromPNG } from "../src/characterCards";
import { completionPayload } from "../src/api";
import { defaultApi, defaultParameters } from "../src/settings";
const nav = (page, mobile) =>
  page.getByRole("navigation", {
    name: mobile ? "Mobile navigation" : "Main navigation",
    exact: true,
  });
async function creator(page, mobile) {
  await nav(page, mobile)
    .getByRole("button", {
      name: mobile ? "Create" : "Create character",
      exact: true,
    })
    .click();
}
async function openSettings(page, tab) {
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

test("global prompts bracket the request, with persona and card context inside", () => {
  const card = normalizeCard(makeCard());
  const params = {
    ...defaultParameters,
    prompt: "FIRST {{char}} with {{user}}",
    postPrompt: "LAST {{user}}",
    memory: false,
  };
  const payload = completionPayload(
    defaultApi,
    params,
    card,
    { name: "River", description: "A traveling librarian" },
    [
      { role: "user", text: "old" },
      { role: "user", text: "Silver stars above the observatory" },
    ],
  );
  expect(payload.messages[0]).toEqual({
    role: "system",
    content: `FIRST ${card.name} with River`,
  });
  expect(payload.messages.at(-1)).toEqual({
    role: "system",
    content: "LAST River",
  });
  expect(payload.messages.at(-2).content).toBe(
    "Card final instruction for River",
  );
  const context = payload.messages[1].content;
  expect(context).toContain("A traveling librarian");
  expect(context).toContain("Card instruction");
  expect(context).toContain("The observatory has a silver telescope.");
  expect(context).toContain("Silver stars reveal the gate.");
  expect(context).not.toContain("Do not send disabled lore.");
  expect(payload.messages.some((m) => m.content === "old")).toBe(false);
  expect(() =>
    completionPayload(
      defaultApi,
      { ...params, postPrompt: "x".repeat(15000) },
      card,
      { name: "River" },
      [{ role: "user", text: "Hi" }],
    ),
  ).toThrow(/context budget/);
});

test("Unicode PNG metadata supports V2/V3 text formats and rejects corrupted cards", async () => {
  for (const version of [2, 3])
    for (const format of ["tEXt", "zTXt", "iTXt"]) {
      const parsed = normalizeCard(
        await cardFromPNG(cardPNG(makeCard(version), { format })),
      );
      expect(parsed.name).toBe("星のミラ 🌙");
      expect(parsed.cardData.data.creator_notes_multilingual.ja).toBe(
        "星の物語",
      );
      expect(parsed.cardData.data.extensions.custom.retained).toBe(true);
    }
  const v2 = cardPNG(makeCard(2));
  const withBoth = cardPNG(makeCard(3), { image: v2 });
  expect((await cardFromPNG(withBoth)).spec).toBe("chara_card_v3");
  const damaged = Buffer.from(withBoth);
  damaged[damaged.length - 13] ^= 1;
  await expect(cardFromPNG(damaged)).rejects.toThrow(/checksum/);
  await expect(cardFromPNG(v2.subarray(0, 30))).rejects.toThrow(/truncated/);
});

test("V2 JSON and V3 PNG imports preserve editable fields, portraits and source metadata", async ({
  page,
  isMobile,
}) => {
  await creator(page, isMobile);
  const card = makeCard(2);
  await page
    .getByLabel("Import character card file", { exact: true })
    .setInputFiles({
      name: "mira.json",
      mimeType: "application/json",
      buffer: Buffer.from(JSON.stringify(card)),
    });
  await expect(page.getByLabel("Character name", { exact: true })).toHaveValue(
    card.data.name,
  );
  await expect(
    page.getByLabel("Card example dialogue", { exact: true }),
  ).toHaveValue(card.data.mes_example);
  await expect(
    page.getByLabel("Character system prompt", { exact: true }),
  ).toHaveValue(card.data.system_prompt);
  // Replace the editor with a V3 PNG and make sure its actual illustration loads.
  const image = await page.evaluate(() => {
    const c = document.createElement("canvas");
    c.width = c.height = 64;
    const ctx = c.getContext("2d");
    ctx.fillStyle = "#ff77aa";
    ctx.fillRect(0, 0, 64, 64);
    return c.toDataURL("image/png").split(",")[1];
  });
  await page
    .getByLabel("Import character card file", { exact: true })
    .setInputFiles({
      name: "mira-v3.png",
      mimeType: "image/png",
      buffer: cardPNG(makeCard(3), {
        format: "iTXt",
        image: Buffer.from(image, "base64"),
      }),
    });
  await expect(page.locator(".studio-current-portrait img")).toHaveAttribute(
    "src",
    /^data:image\/webp/,
  );
  await expect(page.getByLabel("Character name", { exact: true })).toHaveValue(
    card.data.name,
  );
  await page
    .getByRole("button", { name: "Save character", exact: true })
    .first()
    .click();
  await expect(page.getByRole("dialog")).toContainText(card.data.name);
  const stored = await page.evaluate(
    () => JSON.parse(localStorage.getItem("chatter-characters"))[0],
  );
  expect(stored.creator).toBe("CardAuthor");
  expect(stored.cardData.spec).toBe("chara_card_v3");
  expect(stored.cardData.data.assets[0].uri).toBe("ccdefault:");
  expect(stored.cardData.data.extensions.custom.retained).toBe(true);
  expect(stored.alternateGreetings).toHaveLength(2);
  await page
    .getByRole("button", { name: "Start chatting", exact: true })
    .click();
  await page.getByLabel("Opening message", { exact: true }).selectOption("0");
  await expect(
    page.locator(".message.assistant .message-bubble"),
  ).toContainText("A second hello, Alex");
  await page.reload();
  await nav(page, isMobile)
    .getByRole("button", { name: "Profile", exact: true })
    .click();
  await page
    .getByRole("button", { name: `Edit ${card.data.name}`, exact: true })
    .click();
  await expect(
    page.getByLabel("Character version", { exact: true }),
  ).toHaveValue("1.2");
  await expect(
    page.getByLabel("Character lorebook JSON", { exact: true }),
  ).toHaveValue(/silver telescope/);
});

test("invalid imports preserve unsaved work and invalid lorebook JSON cannot save", async ({
  page,
  isMobile,
}) => {
  await creator(page, isMobile);
  await page
    .getByLabel("Character name", { exact: true })
    .fill("Keep my draft");
  await page
    .getByLabel("Import character card file", { exact: true })
    .setInputFiles({
      name: "bad.json",
      mimeType: "application/json",
      buffer: Buffer.from('{"spec":"wrong"}'),
    });
  await expect(page.getByRole("alert")).toContainText("V2 or V3");
  await expect(page.getByLabel("Character name", { exact: true })).toHaveValue(
    "Keep my draft",
  );
  await page
    .getByLabel("Character lorebook JSON", { exact: true })
    .fill("{not json");
  await page
    .getByRole("button", { name: "Save character", exact: true })
    .first()
    .click();
  await expect(
    page.getByLabel("Character lorebook JSON", { exact: true }),
  ).toHaveAttribute("aria-invalid", "true");
  expect(
    await page.evaluate(() =>
      JSON.parse(localStorage.getItem("chatter-characters")),
    ),
  ).toEqual([]);
});

test("persona and both prompts persist and are sent on real request plumbing", async ({
  page,
}) => {
  const requests = [];
  await page.route(
    "https://api.openai.com/v1/chat/completions",
    async (route) => {
      requests.push(route.request().postDataJSON());
      await route.fulfill({
        json: {
          choices: [
            { message: { content: "A live response for your persona" } },
          ],
        },
      });
    },
  );
  await page.getByRole("button", { name: "Step into the story" }).click();
  await openSettings(page, "Persona");
  await page.getByLabel("Persona name", { exact: true }).fill("River");
  await page
    .getByLabel("Persona description", { exact: true })
    .fill("A wandering librarian");
  await page.getByRole("tab", { name: "Parameters", exact: true }).click();
  await page
    .getByLabel("System prompt", { exact: true })
    .fill("First instructions for {{user}}");
  await page
    .getByLabel("Post prompt", { exact: true })
    .fill("Final instructions for {{char}}");
  await page
    .getByRole("button", { name: "Close settings", exact: true })
    .click();
  await page
    .getByRole("textbox", { name: "Message", exact: true })
    .fill("Tell me a story");
  await page.getByRole("button", { name: "Send message", exact: true }).click();
  await expect(page.locator(".message.assistant").last()).toContainText(
    "A live response for your persona",
  );
  expect(requests[0].messages[0].content).toBe("First instructions for River");
  expect(requests[0].messages.at(-1).content).toBe(
    "Final instructions for Seraphine",
  );
  expect(requests[0].messages[1].content).toContain("A wandering librarian");
  expect(
    await page.evaluate(
      () => JSON.parse(localStorage.getItem("chatter-profile")).name,
    ),
  ).toBe("Alex");
  await page.reload();
  await page.getByRole("button", { name: "Step into the story" }).click();
  await openSettings(page, "Persona");
  await expect(page.getByLabel("Persona name", { exact: true })).toHaveValue(
    "River",
  );
  await expect(
    page.getByRole("switch", { name: "Use live AI", exact: false }),
  ).toHaveCount(0);
});

test("theme presets apply across the website and survive reload", async ({
  page,
  isMobile,
}) => {
  await page.getByRole("button", { name: "Step into the story" }).click();
  await openSettings(page, "Appearance");
  for (const [name, id] of [
    ["Black & blue", "blue"],
    ["Purple glow", "violet"],
    ["Monochrome", "mono"],
    ["Midnight ember", "ember"],
  ]) {
    await page.getByRole("button", { name, exact: false }).click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", id);
    await expect(
      page.getByRole("button", { name, exact: false }),
    ).toHaveAttribute("aria-pressed", "true");
  }
  await page.getByRole("button", { name: "Purple glow", exact: false }).click();
  await page
    .getByRole("button", { name: "Close settings", exact: true })
    .click();
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "violet");
  await nav(page, isMobile)
    .getByRole("button", { name: "Library", exact: true })
    .click();
  await expect(page.locator(".topbar")).not.toHaveCSS(
    "background-color",
    "rgb(16, 21, 19)",
  );
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

test("mobile chat has no document scroll below its composer at the bottom", async ({
  page,
  isMobile,
}) => {
  test.skip(!isMobile, "Mobile viewport regression");
  await page.evaluate(() =>
    localStorage.setItem(
      "chatter-sessions",
      JSON.stringify({
        seraphine: {
          characterId: "seraphine",
          messages: Array.from({ length: 25 }, (_, i) => ({
            role: i % 2 ? "user" : "assistant",
            text: `Message ${i} with enough text to make this conversation scroll.`,
          })),
          updated: 1,
        },
      }),
    ),
  );
  await page.reload();
  await page.getByRole("button", { name: "Step into the story" }).click();
  await page.locator(".message-scroll").evaluate((el) => {
    el.scrollTop = el.scrollHeight;
  });
  const bounds = await page.evaluate(() => ({
    doc: document.scrollingElement.scrollHeight,
    height: innerHeight,
    bottom: document
      .querySelector(".composer-container")
      .getBoundingClientRect().bottom,
    scrollable:
      document.querySelector(".message-scroll").scrollHeight >
      document.querySelector(".message-scroll").clientHeight,
  }));
  expect(bounds.doc).toBeLessThanOrEqual(bounds.height + 1);
  expect(bounds.bottom).toBeCloseTo(bounds.height, 0);
  expect(bounds.scrollable).toBe(true);
  await page.setViewportSize({ width: 390, height: 540 });
  await expect
    .poll(() =>
      page
        .locator(".composer-container")
        .evaluate((el) => Math.round(el.getBoundingClientRect().bottom)),
    )
    .toBe(540);
});
