// The app always uses live request plumbing. Tests supply a provider response.
export async function installProviderFixture(page) {
  await page.addInitScript(() => {
    if (!localStorage.getItem("chatter-api"))
      localStorage.setItem(
        "chatter-api",
        JSON.stringify({
          provider: "openai",
          transport: "direct",
          baseUrl: "https://api.openai.com/v1",
          model: "fixture-model",
        }),
      );
  });
  let count = 0;
  await page.route("https://api.openai.com/v1/chat/completions", (route) =>
    route.fulfill({
      json: {
        choices: [
          {
            message: {
              content:
                ++count === 1
                  ? "Hello, Alex — response from the provider fixture."
                  : "A different response: take the unexpected path.",
            },
          },
        ],
      },
    }),
  );
}
