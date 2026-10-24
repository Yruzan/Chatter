import React, { useEffect, useRef, useState } from "react";
import {
  X,
  SlidersHorizontal,
  Cable,
  Palette,
  RotateCcw,
  RefreshCw,
  Check,
  Eye,
  EyeOff,
  ShieldCheck,
  Sparkles,
  ChevronDown,
  UserRound,
} from "lucide-react";
import { apiBase, loadModels, requestReply } from "../api";
import { themePresets } from "../themes";
import BufferedTextarea from "./BufferedTextarea";
import FormattedMessage from "./FormattedMessage";
import {
  defaultParameters,
  defaultAppearance,
  defaultApi,
  appearanceStyle,
} from "../settings";

function Range({
  label,
  name,
  value,
  min,
  max,
  step = 1,
  onChange,
  hint,
  suffix = "",
}) {
  return (
    <div className="setting-field">
      <label htmlFor={`setting-${name}`}>
        {label}
        <output htmlFor={`setting-${name}`}>
          {value}
          {suffix}
        </output>
      </label>
      <input
        id={`setting-${name}`}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      {hint && <p className="field-hint">{hint}</p>}
    </div>
  );
}
function Toggle({ label, hint, checked, onChange }) {
  return (
    <label className="setting-toggle">
      <span>
        {label}
        {hint && <small>{hint}</small>}
      </span>
      <input
        type="checkbox"
        role="switch"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className="switch-track" aria-hidden="true" />
    </label>
  );
}
function Color({ label, value, onChange }) {
  return (
    <label className="color-setting">
      <span>{label}</span>
      <span className="color-input-wrap">
        <input
          aria-label={label}
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        <code>{value.toUpperCase()}</code>
      </span>
    </label>
  );
}
export default function ChatSettings({
  parameters,
  setParameters,
  appearance,
  setAppearance,
  api,
  setApi,
  apiKey,
  setApiKey,
  persona,
  setPersona,
  theme,
  setTheme,
  models,
  setModels,
  character,
  onClose,
  onReset,
}) {
  const [tab, setTab] = useState("Parameters"),
    [showKey, setShowKey] = useState(false),
    [validation, setValidation] = useState(null),
    [manualModel, setManualModel] = useState(false),
    [busy, setBusy] = useState("");
  const operation = useRef(null);
  useEffect(() => {
    setManualModel(false);
    setValidation(null);
    setBusy("");
    return () => operation.current?.abort();
  }, [api.baseUrl, api.provider, api.transport, apiKey]);
  const ref = useRef(null),
    closeRef = useRef(null);
  useEffect(() => {
    ref.current?.querySelector(".settings-content")?.scrollTo({ top: 0 });
  }, [tab]);
  useEffect(() => {
    const before = document.activeElement;
    closeRef.current?.focus();
    const key = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
      if (e.key === "Tab" && window.matchMedia("(max-width: 1200px)").matches) {
        const items = [
          ...ref.current.querySelectorAll("button,input,select,textarea"),
        ].filter((el) => !el.disabled && el.getClientRects().length);
        if (
          e.shiftKey &&
          (document.activeElement === items[0] ||
            document.activeElement === ref.current)
        ) {
          e.preventDefault();
          items.at(-1)?.focus();
        } else if (!e.shiftKey && document.activeElement === items.at(-1)) {
          e.preventDefault();
          items[0]?.focus();
        }
      }
    };
    document.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("keydown", key);
      before?.focus();
    };
  }, []);
  const param = (key, value) =>
    setParameters((p) => ({
      ...p,
      [key]: value,
      ...(key === "contextSize"
        ? { maxTokens: Math.min(p.maxTokens, value) }
        : {}),
    }));
  const look = (key, value) => setAppearance((a) => ({ ...a, [key]: value }));
  const connection = (key, value) => {
    setApi((a) => ({ ...a, [key]: value }));
    setValidation(null);
  };
  const selectProvider = (provider) => {
    const preset = {
      openai: defaultApi,
      openrouter: {
        baseUrl: "https://openrouter.ai/api/v1",
        model: "openai/gpt-4.1-mini",
      },
      ollama: { baseUrl: "http://localhost:11434/v1", model: "llama3.2" },
      geraikita: { baseUrl: "https://ai.geraikita.com/v1/claude", model: "" },
      "geraikita-paid": { baseUrl: "https://ai.geraikita.com/v1", model: "" },
      custom: { baseUrl: "", model: "" },
    }[provider];
    setApi({ ...preset, provider, transport: "server" });
    setValidation(null);
  };
  function validate() {
    try {
      apiBase(api.baseUrl);
      if (!api.model.trim()) throw new Error("Enter a model ID.");
      setValidation({
        ok: true,
        text: "Configuration format is valid. No API request was sent. Use Test connection to contact your provider.",
      });
    } catch (error) {
      setValidation({
        ok: false,
        text:
          error.message === "Invalid URL"
            ? "Enter a complete API base URL."
            : error.message,
      });
    }
  }
  async function contact(kind) {
    if (operation.current && !operation.current.signal.aborted) return;
    const controller = new AbortController();
    operation.current = controller;
    setBusy(kind);
    setValidation(null);
    try {
      if (kind === "models") {
        const found = await loadModels(api, apiKey, controller.signal);
        if (controller.signal.aborted) return;
        setModels(found);
        setManualModel(false);
        if (!found.includes(api.model)) {
          connection("model", found[0]);
        }
        setValidation({
          ok: true,
          text: `${found.length} models loaded from your API. Select one below.`,
        });
      } else {
        const answer = await requestReply(
          api,
          apiKey,
          { ...parameters, maxTokens: Math.min(parameters.maxTokens, 256) },
          character,
          {
            name: persona.name?.trim() || "User",
            description: persona.description || "",
          },
          [{ role: "user", text: "Reply with: Connection successful" }],
          controller.signal,
        );
        if (!controller.signal.aborted)
          setValidation({
            ok: true,
            text: `Live request succeeded: ${answer.slice(0, 180)}`,
          });
      }
    } catch (error) {
      if (!controller.signal.aborted)
        setValidation({ ok: false, text: error.message });
    } finally {
      if (!controller.signal.aborted) setBusy("");
      if (operation.current === controller) operation.current = null;
    }
  }
  return (
    <>
      <button
        className="settings-scrim"
        aria-label="Close chat settings backdrop"
        onClick={onClose}
      />
      <aside
        className="chat-settings expanded-settings"
        ref={ref}
        role="dialog"
        aria-modal={window.matchMedia("(max-width: 1200px)").matches}
        aria-label="Chat settings panel"
      >
        <div className="settings-top">
          <div>
            <span className="eyebrow">YOUR CONVERSATION, YOUR WAY</span>
            <h2>
              Chat settings<span>.</span>
            </h2>
          </div>
          <button
            ref={closeRef}
            className="icon-button"
            onClick={onClose}
            aria-label="Close settings"
          >
            <X size={20} />
          </button>
        </div>
        <div
          className="settings-tab-list"
          role="tablist"
          aria-label="Chat settings categories"
        >
          {[
            [SlidersHorizontal, "Parameters"],
            [Cable, "API"],
            [Palette, "Appearance"],
            [UserRound, "Persona"],
          ].map(([Icon, name], i) => (
            <button
              key={name}
              role="tab"
              aria-selected={tab === name}
              aria-controls={`settings-panel-${name}`}
              id={`settings-tab-${name}`}
              tabIndex={tab === name ? 0 : -1}
              onClick={() => setTab(name)}
              onKeyDown={(e) => {
                if (
                  ["ArrowRight", "ArrowLeft", "Home", "End"].includes(e.key)
                ) {
                  e.preventDefault();
                  const names = ["Parameters", "API", "Appearance", "Persona"];
                  const next =
                    e.key === "Home"
                      ? 0
                      : e.key === "End"
                        ? names.length - 1
                        : (i +
                            (e.key === "ArrowRight" ? 1 : names.length - 1)) %
                          names.length;
                  setTab(names[next]);
                  ref.current
                    .querySelector(`#settings-tab-${names[next]}`)
                    .focus();
                }
              }}
            >
              <Icon size={15} />
              {name}
            </button>
          ))}
        </div>
        <div
          className="settings-content"
          role="tabpanel"
          id={`settings-panel-${tab}`}
          aria-labelledby={`settings-tab-${tab}`}
        >
          {tab === "Parameters" && (
            <>
              <div className="settings-section-title">
                <div>
                  <h3>Generation</h3>
                  <p>Find the rhythm of your conversation.</p>
                </div>
                <button
                  className="icon-button"
                  aria-label="Reset generation parameters"
                  title="Reset generation parameters"
                  onClick={() =>
                    setParameters((previous) => ({
                      ...previous,
                      temperature: defaultParameters.temperature,
                      topP: defaultParameters.topP,
                      maxTokens: Math.min(
                        defaultParameters.maxTokens,
                        previous.contextSize,
                      ),
                      frequencyPenalty: defaultParameters.frequencyPenalty,
                      presencePenalty: defaultParameters.presencePenalty,
                      style: defaultParameters.style,
                    }))
                  }
                >
                  <RotateCcw size={16} />
                </button>
              </div>
              <label className="settings-label">Response preset</label>
              <div className="style-options">
                {["Creative", "Balanced", "Precise"].map((style) => (
                  <button
                    key={style}
                    className={parameters.style === style ? "selected" : ""}
                    onClick={() =>
                      setParameters((p) => ({
                        ...p,
                        style,
                        temperature: {
                          Creative: 1.2,
                          Balanced: 0.8,
                          Precise: 0.3,
                        }[style],
                        topP: { Creative: 1, Balanced: 0.95, Precise: 0.8 }[
                          style
                        ],
                      }))
                    }
                  >
                    {style}
                  </button>
                ))}
              </div>
              <Range
                label="Temperature"
                name="temperature"
                value={parameters.temperature}
                min={0}
                max={2}
                step={0.05}
                onChange={(v) => param("temperature", v)}
                hint="Lower is more consistent. Higher takes more creative turns."
              />
              <Range
                label="Top P"
                name="topP"
                value={parameters.topP}
                min={0.05}
                max={1}
                step={0.05}
                onChange={(v) => param("topP", v)}
                hint="Limits how broadly the model explores possible words."
              />
              <Range
                label="Maximum response"
                name="maxTokens"
                value={parameters.maxTokens}
                min={64}
                max={Math.min(4096, parameters.contextSize)}
                step={64}
                suffix=" tokens"
                onChange={(v) => param("maxTokens", v)}
              />
              <details className="advanced-settings">
                <summary>
                  Repetition controls <ChevronDown size={15} />
                </summary>
                <Range
                  label="Frequency penalty"
                  name="frequencyPenalty"
                  value={parameters.frequencyPenalty}
                  min={-2}
                  max={2}
                  step={0.1}
                  onChange={(v) => param("frequencyPenalty", v)}
                  hint="Reduce repeated words and phrases."
                />
                <Range
                  label="Presence penalty"
                  name="presencePenalty"
                  value={parameters.presencePenalty}
                  min={-2}
                  max={2}
                  step={0.1}
                  onChange={(v) => param("presencePenalty", v)}
                  hint="Encourage the story to explore new ideas."
                />
              </details>
              <div className="settings-section-title divided">
                <div>
                  <h3>Context & instructions</h3>
                  <p>Give each reply a little direction.</p>
                </div>
              </div>
              <Range
                label="Context window"
                name="contextSize"
                value={parameters.contextSize}
                min={2048}
                max={Math.max(32768, parameters.contextSize)}
                step={1024}
                suffix=" tokens"
                onChange={(v) => param("contextSize", v)}
              />
              <label className="setting-input-label" htmlFor="custom-context">
                Custom context window (tokens)
              </label>
              <input
                id="custom-context"
                type="number"
                min={2048}
                step={1024}
                value={parameters.contextSize}
                onChange={(e) => {
                  const value = Number(e.target.value);
                  if (Number.isSafeInteger(value) && value >= 2048)
                    param("contextSize", value);
                }}
              />
              <p className="field-hint">
                Prompts have no character cap. The request still needs to fit
                your provider’s context window.
              </p>
              <Toggle
                label="Include conversation history"
                hint="Send previous turns, within your context budget"
                checked={parameters.memory}
                onChange={(v) => param("memory", v)}
              />
              <Toggle
                label="Stream responses"
                hint="Show the reply as it arrives. Disable for APIs without streaming support."
                checked={!!parameters.streaming}
                onChange={(value) => param("streaming", value)}
              />
              <label className="setting-input-label" htmlFor="prompt">
                System prompt
              </label>
              <BufferedTextarea
                id="prompt"
                className="settings-textarea"
                value={parameters.prompt}
                rows={4}
                onCommit={(value) => param("prompt", value)}
              />
              <p className="field-hint">
                The first message in every chat request. Supports {"{{char}}"}{" "}
                and {"{{user}}"}.
              </p>
              <label className="setting-input-label" htmlFor="post-prompt">
                Post prompt
              </label>
              <BufferedTextarea
                id="post-prompt"
                className="settings-textarea"
                value={parameters.postPrompt || ""}
                rows={4}
                onCommit={(value) => param("postPrompt", value)}
                placeholder="Final instructions after the conversation…"
              />
              <p className="field-hint">
                Appended as the final system message in every request, after
                character instructions and chat history.
              </p>
              <div className="context-card">
                <span>Character context</span>
                <strong>{character.name}</strong>
                <p>
                  {[
                    character.personality && "Personality",
                    character.scenario && "Scenario",
                    character.examples?.length && "Example dialogue",
                    "First message",
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              </div>
              <div className="settings-info-note">
                <Sparkles size={15} />
                <p>
                  Every reply uses your configured live provider. Parameters and
                  prompts are included in the request.
                </p>
              </div>
              <button className="text-button danger" onClick={onReset}>
                <RefreshCw size={14} /> Start a fresh conversation
              </button>
            </>
          )}
          {tab === "API" && (
            <>
              <div className="api-status">
                <span className="status-dot" />
                <div>
                  <strong>Live API replies</strong>
                  <p>
                    Configure your provider, load models, and test the
                    connection.
                  </p>
                </div>
                <span className="small-pill">LIVE</span>
              </div>
              <div className="settings-section-title">
                <div>
                  <h3>API connection</h3>
                  <p>Bring your preferred model to the story.</p>
                </div>
              </div>
              <label className="setting-input-label" htmlFor="api-provider">
                Provider
              </label>
              <select
                id="api-provider"
                value={api.provider}
                onChange={(e) => selectProvider(e.target.value)}
              >
                <option value="openai">OpenAI</option>
                <option value="openrouter">OpenRouter</option>
                <option value="geraikita">GeraiKita (free tier)</option>
                <option value="geraikita-paid">GeraiKita (paid)</option>
                <option value="ollama">Ollama (local)</option>
                <option value="custom">OpenAI-compatible</option>
              </select>
              <label className="setting-input-label" htmlFor="api-transport">
                Connection
              </label>
              <select
                id="api-transport"
                value={api.transport || "server"}
                onChange={(e) => connection("transport", e.target.value)}
              >
                <option value="server">Chatter server (recommended)</option>
                <option value="direct">Direct from browser</option>
              </select>
              <p className="field-hint">
                {api.transport === "direct"
                  ? "Requires the provider to permit browser requests (CORS)."
                  : "Routes requests through this website’s server, avoiding provider CORS restrictions."}
              </p>
              <label className="setting-input-label" htmlFor="api-base">
                API base URL
              </label>
              <input
                id="api-base"
                type="url"
                autoComplete="off"
                value={api.baseUrl}
                placeholder="https://api.example.com/v1"
                onChange={(e) => connection("baseUrl", e.target.value)}
              />
              <p className="field-hint">
                Use the base URL, without /chat/completions.
                {api.baseUrl.includes("ai.geraikita.com") &&
                  " GeraiKita free-tier keys use /v1/claude; paid keys use /v1. Keep the route that matches your key."}
              </p>
              <label className="setting-input-label" htmlFor="api-key">
                API key{" "}
                <span>Optional for providers without authentication</span>
              </label>
              <div className="api-key-input">
                <input
                  id="api-key"
                  aria-label="API key"
                  autoComplete="off"
                  spellCheck={false}
                  type={showKey ? "text" : "password"}
                  value={apiKey}
                  placeholder="Enter a key when you’re ready"
                  onChange={(e) => {
                    setApiKey(e.target.value);
                  }}
                />
                <button
                  className="icon-button"
                  aria-label={showKey ? "Hide API key" : "Show API key"}
                  onClick={() => setShowKey(!showKey)}
                >
                  {showKey ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
              <div className="key-privacy">
                <ShieldCheck size={15} />
                <p>
                  Keys are saved in this browser for each API URL and restored
                  after refresh. Browser storage is not encrypted; use Clear
                  saved key on shared devices. Keys are forwarded only to your
                  selected API.
                </p>
              </div>
              {apiKey && (
                <button className="text-button" onClick={() => setApiKey("")}>
                  Clear saved key
                </button>
              )}
              <div className="model-controls">
                <button
                  className="button secondary"
                  disabled={!!busy}
                  onClick={() => contact("models")}
                >
                  <RefreshCw size={15} />{" "}
                  {busy === "models" ? "Loading models…" : "Load models"}
                </button>
                {models.length > 0 && (
                  <button
                    className="text-button"
                    onClick={() => setManualModel(!manualModel)}
                  >
                    {manualModel
                      ? "Choose from API list"
                      : "Enter model manually"}
                  </button>
                )}
              </div>
              <p className="field-hint">
                Load available models using the endpoint and key above. You can
                also enter a model ID manually.
              </p>
              <label className="setting-input-label" htmlFor="api-model">
                Model ID
              </label>
              {models.length > 0 && !manualModel ? (
                <select
                  id="api-model"
                  className="api-model-select"
                  value={api.model}
                  disabled={!!busy}
                  onChange={(e) => connection("model", e.target.value)}
                >
                  {!models.includes(api.model) && (
                    <option value={api.model}>
                      {api.model || "Choose a model"}
                    </option>
                  )}
                  {models.map((model) => (
                    <option key={model} value={model}>
                      {model}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  id="api-model"
                  autoComplete="off"
                  value={api.model}
                  placeholder="Load models or enter an ID"
                  disabled={!!busy}
                  onChange={(e) => connection("model", e.target.value)}
                />
              )}
              <button
                className="button secondary validate-api"
                onClick={validate}
              >
                <Check size={16} /> Validate configuration
              </button>
              <button
                className="button secondary validate-api"
                disabled={!!busy}
                onClick={() => contact("test")}
              >
                <Cable size={16} />{" "}
                {busy === "test" ? "Testing connection…" : "Test connection"}
              </button>
              {validation && (
                <p
                  className={`configuration-result ${validation.ok ? "valid" : "invalid"}`}
                  role="status"
                >
                  {validation.text}
                </p>
              )}
              <div className="settings-info-note">
                <Cable size={17} />
                <p>
                  Test connection sends a short chat request and may use paid
                  tokens. Server connection works with providers that block
                  browser access. If model listing is unsupported, enter its
                  model ID manually. Image attachments need a vision model.
                </p>
              </div>
            </>
          )}
          {tab === "Persona" && (
            <>
              <div className="settings-section-title">
                <div>
                  <h3>Your role in the story</h3>
                  <p>
                    This persona is used for {"{{user}}"}, independently of your
                    account profile.
                  </p>
                </div>
              </div>
              <label className="setting-input-label" htmlFor="persona-name">
                Persona name
              </label>
              <input
                id="persona-name"
                value={persona.name || ""}
                maxLength={100}
                onChange={(e) =>
                  setPersona((p) => ({ ...p, name: e.target.value }))
                }
              />
              <label
                className="setting-input-label"
                htmlFor="persona-description"
              >
                Persona description
              </label>
              <BufferedTextarea
                id="persona-description"
                className="settings-textarea"
                rows={8}
                value={persona.description || ""}
                onCommit={(value) =>
                  setPersona((p) => ({ ...p, description: value }))
                }
                placeholder="Appearance, personality, background—who are you in this story?"
              />
              <p className="field-hint">
                Saved on this device and included in every chat request.
                Existing message text stays as written.
              </p>
            </>
          )}
          {tab === "Appearance" && (
            <>
              <div className="settings-section-title">
                <div>
                  <h3>Website theme</h3>
                  <p>One palette for every page, menu, and conversation.</p>
                </div>
              </div>
              <div
                className="theme-presets"
                role="group"
                aria-label="Website theme"
              >
                {themePresets.map((preset) => (
                  <button
                    key={preset.id}
                    className="theme-preset"
                    aria-pressed={theme === preset.id}
                    onClick={() => {
                      setTheme(preset.id);
                      setAppearance((a) => ({ ...a, ...preset.chat }));
                    }}
                  >
                    <span
                      className="theme-swatch"
                      style={{
                        background: preset.background,
                        color: preset.accent,
                      }}
                    >
                      <i />
                      <i />
                      <i />
                    </span>
                    <strong>{preset.name}</strong>
                    <small>{preset.description}</small>
                  </button>
                ))}
              </div>
              <div className="settings-section-title">
                <div>
                  <h3>Make yourself comfortable</h3>
                  <p>Changes apply to your chat immediately.</p>
                </div>
                <button
                  className="icon-button"
                  aria-label="Reset appearance"
                  title="Reset appearance"
                  onClick={() =>
                    setAppearance({
                      ...defaultAppearance,
                      ...themePresets.find((p) => p.id === theme)?.chat,
                    })
                  }
                >
                  <RotateCcw size={16} />
                </button>
              </div>
              <label className="setting-input-label" htmlFor="chat-font">
                Chat font
              </label>
              <select
                id="chat-font"
                value={appearance.font}
                onChange={(e) => look("font", e.target.value)}
              >
                <option value="sans">Modern · DM Sans</option>
                <option value="serif">Bookish · Georgia</option>
                <option value="mono">Monospace</option>
              </select>
              <Range
                label="Font size"
                name="fontSize"
                value={appearance.fontSize}
                min={12}
                max={22}
                suffix=" px"
                onChange={(v) => look("fontSize", v)}
              />
              <Range
                label="Line spacing"
                name="lineHeight"
                value={appearance.lineHeight}
                min={1.4}
                max={2.2}
                step={0.05}
                onChange={(v) => look("lineHeight", v)}
              />
              <div className="settings-section-title divided">
                <div>
                  <h3>Words & formatting</h3>
                  <p>A different color for every kind of expression.</p>
                </div>
              </div>
              <Color
                label="Regular text color"
                value={appearance.textColor}
                onChange={(v) => look("textColor", v)}
              />
              <Color
                label="Asterisk action color"
                value={appearance.actionColor}
                onChange={(v) => look("actionColor", v)}
              />
              <Color
                label="Quotation dialogue color"
                value={appearance.dialogueColor}
                onChange={(v) => look("dialogueColor", v)}
              />
              <Toggle
                label="Italicize *actions*"
                checked={appearance.actionsItalic}
                onChange={(v) => look("actionsItalic", v)}
              />
              <Toggle
                label="Bold quoted dialogue"
                checked={appearance.dialogueBold}
                onChange={(v) => look("dialogueBold", v)}
              />
              <Toggle
                label="Show asterisk markers"
                checked={appearance.showMarkers}
                onChange={(v) => look("showMarkers", v)}
              />
              <div
                className="format-preview"
                style={appearanceStyle(appearance)}
              >
                <span className="eyebrow">LIVE PREVIEW</span>
                <p>
                  <FormattedMessage
                    text={
                      'The room falls quiet. *She glances up with a smile.*\n\n"I was hoping you would come back."'
                    }
                    showMarkers={appearance.showMarkers}
                  />
                </p>
              </div>
              <div className="settings-section-title divided">
                <div>
                  <h3>Conversation layout</h3>
                  <p>Give your words room to breathe.</p>
                </div>
              </div>
              <Color
                label="Character bubble color"
                value={appearance.assistantColor}
                onChange={(v) => look("assistantColor", v)}
              />
              <Color
                label="Your bubble color"
                value={appearance.userColor}
                onChange={(v) => look("userColor", v)}
              />
              <label className="setting-input-label" htmlFor="chat-density">
                Message spacing
              </label>
              <select
                id="chat-density"
                value={appearance.density}
                onChange={(e) => look("density", e.target.value)}
              >
                <option value="comfortable">Comfortable</option>
                <option value="compact">Compact</option>
              </select>
              <Toggle
                label="Show message bubbles"
                checked={appearance.bubbles}
                onChange={(v) => look("bubbles", v)}
              />
            </>
          )}
        </div>
        <footer className="settings-saved">
          <Check size={13} /> Preferences saved on this device
        </footer>
      </aside>
    </>
  );
}
