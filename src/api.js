// Keys are passed only to the endpoint chosen by the user; never persisted.
export function apiBase(baseUrl) {
  let url;
  try {
    url = new URL(baseUrl.trim());
  } catch {
    throw new Error("Enter a complete API base URL.");
  }
  if (
    url.protocol !== "https:" &&
    !(
      url.protocol === "http:" &&
      ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)
    )
  )
    throw new Error("Use an HTTPS endpoint, or HTTP for a local provider.");
  if (url.username || url.password || url.search || url.hash)
    throw new Error(
      "Use a base URL without credentials, query parameters, or fragments.",
    );
  return url.href.replace(/\/+$/, "");
}

async function apiRequest(api, key, path, { body, signal } = {}) {
  const base = apiBase(api.baseUrl);
  const controller = new AbortController();
  const abort = () => controller.abort();
  signal?.addEventListener("abort", abort, { once: true });
  if (signal?.aborted) controller.abort();
  let timedOut = false;
  const timeout = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, 60000);
  try {
    const response = await fetch(`${base}${path}`, {
      method: body ? "POST" : "GET",
      headers: {
        Accept: "application/json",
        ...(body ? { "Content-Type": "application/json" } : {}),
        ...(key.trim() ? { Authorization: `Bearer ${key.trim()}` } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
      signal: controller.signal,
      credentials: "omit",
      redirect: "error",
      referrerPolicy: "no-referrer",
    });
    if (!response.ok) {
      const explanations = {
        401: "Check your API key.",
        403: "This key or account cannot access the endpoint.",
        404: "Check the base URL and model ID.",
        429: "Rate limit or quota reached. Try again later.",
        400: "The provider rejected this model or generation settings.",
      };
      throw new Error(
        `API error ${response.status}. ${explanations[response.status] || "The provider could not complete the request. Try again."}`,
      );
    }
    try {
      return await response.json();
    } catch {
      throw new Error("The endpoint did not return valid JSON.");
    }
  } catch (error) {
    if (timedOut)
      throw new Error("The API timed out after 60 seconds. Please retry.");
    if (signal?.aborted) throw new DOMException("Stopped", "AbortError");
    if (error instanceof TypeError)
      throw new Error(
        "Cannot reach the API. Check its URL, network, and browser CORS access. HTTPS pages cannot call HTTP providers.",
      );
    throw error;
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener("abort", abort);
  }
}

export async function loadModels(api, key, signal) {
  const data = await apiRequest(api, key, "/models", { signal });
  if (!Array.isArray(data.data))
    throw new Error(
      "This endpoint does not return an OpenAI-compatible model list. Enter a model ID manually.",
    );
  const models = [
    ...new Set(
      data.data
        .map((m) => m?.id)
        .filter((id) => typeof id === "string" && id.trim()),
    ),
  ].sort();
  if (!models.length)
    throw new Error(
      "No models were returned. Check your account access or enter a model ID manually.",
    );
  return models;
}

export function messageText(message) {
  return message.variants?.[message.selectedVariant ?? 0] ?? message.text ?? "";
}
const fill = (text, character, profile) =>
  (text || "")
    .replaceAll("{{char}}", character.name)
    .replaceAll("{{user}}", profile.name);

export function completionPayload(
  api,
  parameters,
  character,
  profile,
  history,
) {
  if (!api.model.trim())
    throw new Error("Choose or enter a model ID in API settings.");
  const system = [
    parameters.prompt,
    `You are ${character.name}. The user's name is ${profile.name}.`,
    character.tagline,
    character.description,
    character.personality && `Personality: ${character.personality}`,
    character.scenario && `Scenario: ${character.scenario}`,
    ...(character.examples || []).map(
      (e) =>
        `Example dialogue:\nUser: ${e.user || ""}\n${character.name}: ${e.character || ""}`,
    ),
  ]
    .filter(Boolean)
    .map((text) => fill(text, character, profile))
    .join("\n\n");
  let turns = (parameters.memory ? history : history.slice(-1)).map((m) => ({
    role: m.role,
    content: m.image
      ? [
          { type: "text", text: messageText(m) },
          { type: "image_url", image_url: { url: m.image } },
        ]
      : messageText(m),
  }));
  // Conservative text budget (UTF-8 bytes), with an image allowance. Providers
  // tokenize differently; their context errors remain visible and retryable.
  const cost = (m) =>
    typeof m.content === "string"
      ? new TextEncoder().encode(m.content).length + 8
      : new TextEncoder().encode(m.content[0].text).length + 2056;
  const budget = parameters.contextSize - parameters.maxTokens;
  const systemCost = cost({ content: system });
  while (
    turns.length > 1 &&
    systemCost + turns.reduce((n, m) => n + cost(m), 0) > budget
  )
    turns.shift();
  if (systemCost + turns.reduce((n, m) => n + cost(m), 0) > budget)
    throw new Error(
      "The character and latest message exceed the context budget. Increase the context window or shorten the instructions/message.",
    );
  return {
    model: api.model.trim(),
    messages: [{ role: "system", content: system }, ...turns],
    temperature: parameters.temperature,
    top_p: parameters.topP,
    max_tokens: parameters.maxTokens,
    frequency_penalty: parameters.frequencyPenalty,
    presence_penalty: parameters.presencePenalty,
    stream: false,
  };
}

export async function requestReply(
  api,
  key,
  parameters,
  character,
  profile,
  history,
  signal,
) {
  const body = completionPayload(api, parameters, character, profile, history);
  const data = await apiRequest(api, key, "/chat/completions", {
    body,
    signal,
  });
  const text = data.choices?.[0]?.message?.content;
  if (typeof text !== "string" || !text.trim())
    throw new Error(
      "The model returned no text. Try a different model or increase the response limit.",
    );
  return text;
}

export async function copyText(text) {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return;
    }
  } catch {
    /* Plain HTTP and restricted browsers need the legacy copy path. */
  }
  const before = document.activeElement;
  const selection = window.getSelection();
  const ranges = selection
    ? Array.from({ length: selection.rangeCount }, (_, i) =>
        selection.getRangeAt(i).cloneRange(),
      )
    : [];
  const input = document.createElement("textarea");
  input.value = text;
  input.setAttribute("readonly", "");
  input.style.cssText = "position:fixed;top:0;left:0;opacity:0;font-size:16px";
  // Inside an open dialog, so focus traps don't prevent selection.
  (document.querySelector('[role="dialog"]') || document.body).append(input);
  try {
    input.focus();
    input.select();
    input.setSelectionRange(0, input.value.length);
    if (!document.execCommand("copy"))
      throw new Error(
        "Copy was blocked. Select the message text to copy it manually.",
      );
  } finally {
    input.remove();
    before?.focus({ preventScroll: true });
    if (selection) {
      selection.removeAllRanges();
      ranges.forEach((range) => selection.addRange(range));
    }
  }
}
