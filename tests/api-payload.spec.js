import { test, expect } from "@playwright/test";
import { apiBase, completionPayload } from "../src/api";
import { defaultParameters, defaultApi } from "../src/settings";
const character = {
  name: "Mira",
  description: "{{char}} meets {{user}}",
  personality: "Curious",
  scenario: "An observatory",
  examples: [{ user: "Where?", character: "Among the stars" }],
};
const profile = { name: "Alex" };
test("API context includes character definitions, examples, selected variants and vision content", () => {
  const history = [
    { role: "user", text: "old question" },
    {
      role: "assistant",
      text: "outdated",
      variants: ["one", "two"],
      selectedVariant: 1,
    },
    { role: "user", text: "latest", image: "data:image/png;base64,AA==" },
  ];
  const payload = completionPayload(
    defaultApi,
    defaultParameters,
    character,
    profile,
    history,
  );
  expect(payload.messages[0].content).toContain("Mira meets Alex");
  expect(payload.messages[0].content).toContain("Among the stars");
  expect(payload.messages[0].content).toContain("An observatory");
  expect(payload.messages.at(-2).content).toBe("two");
  expect(payload.messages.at(-1).content[1]).toEqual({
    type: "image_url",
    image_url: { url: "data:image/png;base64,AA==" },
  });
  const withoutHistory = completionPayload(
    defaultApi,
    { ...defaultParameters, memory: false },
    character,
    profile,
    history,
  );
  expect(withoutHistory.messages).toHaveLength(2);
  expect(withoutHistory.messages[1].content[0].text).toBe("latest");
});
test("context limits preserve the latest turn and reject oversized character instructions", () => {
  const history = [
    { role: "user", text: "x".repeat(12000) },
    { role: "assistant", text: "earlier" },
    { role: "user", text: "latest" },
  ];
  const payload = completionPayload(
    defaultApi,
    defaultParameters,
    character,
    profile,
    history,
  );
  expect(payload.messages.at(-1).content).toBe("latest");
  expect(payload.messages.some((m) => m.content.length >= 12000)).toBe(false);
  expect(() =>
    completionPayload(
      defaultApi,
      defaultParameters,
      { ...character, description: "x".repeat(14000) },
      profile,
      history,
    ),
  ).toThrow(/context budget/);
  expect(() => apiBase("https://example.com/v1?key=secret")).toThrow();
  expect(() => apiBase("http://example.com/v1")).toThrow(/HTTPS/);
  expect(apiBase("http://127.0.0.1:11434/v1/")).toBe(
    "http://127.0.0.1:11434/v1",
  );
});
