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
} from "lucide-react";
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
  character,
  onClose,
  onReset,
}) {
  const [tab, setTab] = useState("Parameters"),
    [showKey, setShowKey] = useState(false),
    [validation, setValidation] = useState(null);
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
      custom: { baseUrl: "", model: "" },
    }[provider];
    setApi({ ...preset, provider });
    setApiKey("");
    setValidation(null);
  };
  function validate() {
    try {
      const url = new URL(api.baseUrl);
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
      if (!api.model.trim()) throw new Error("Enter a model ID.");
      setValidation({
        ok: true,
        text: "Configuration format is valid. No API request was sent; this preview still uses demo replies.",
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
                  const names = ["Parameters", "API", "Appearance"];
                  const next =
                    e.key === "Home"
                      ? 0
                      : e.key === "End"
                        ? 2
                        : (i + (e.key === "ArrowRight" ? 1 : 2)) % 3;
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
                max={32768}
                step={1024}
                suffix=" tokens"
                onChange={(v) => param("contextSize", v)}
              />
              <Toggle
                label="Include conversation history"
                hint="Send previous turns when live AI is connected"
                checked={parameters.memory}
                onChange={(v) => param("memory", v)}
              />
              <label className="setting-input-label" htmlFor="prompt">
                System instructions
              </label>
              <textarea
                id="prompt"
                className="settings-textarea"
                value={parameters.prompt}
                maxLength={6000}
                rows={4}
                onChange={(e) => param("prompt", e.target.value)}
              />
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
              <div className="settings-demo-note">
                <Sparkles size={15} />
                <p>
                  Parameters are saved for a future API connection. Replies in
                  this prototype are scripted.
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
                  <strong>Demo replies are active</strong>
                  <p>Configure a provider for the next stage.</p>
                </div>
                <span className="small-pill">PREVIEW</span>
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
                <option value="ollama">Ollama (local)</option>
                <option value="custom">OpenAI-compatible</option>
              </select>
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
              </p>
              <label className="setting-input-label" htmlFor="api-model">
                Model ID
              </label>
              <input
                id="api-model"
                autoComplete="off"
                value={api.model}
                placeholder="provider/model-name"
                onChange={(e) => connection("model", e.target.value)}
              />
              <label className="setting-input-label" htmlFor="api-key">
                API key <span>Optional in this preview</span>
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
                  onChange={(e) => setApiKey(e.target.value)}
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
                  Keys stay in memory for this visit. They are never saved to
                  browser storage or sent by this prototype.
                </p>
              </div>
              {apiKey && (
                <button className="text-button" onClick={() => setApiKey("")}>
                  Clear key from this session
                </button>
              )}
              <button
                className="button secondary validate-api"
                onClick={validate}
              >
                <Check size={16} /> Validate configuration
              </button>
              {validation && (
                <p
                  className={`configuration-result ${validation.ok ? "valid" : "invalid"}`}
                  role="status"
                >
                  {validation.text}
                </p>
              )}
              <div className="settings-demo-note">
                <Cable size={17} />
                <p>
                  Validation checks the URL and model fields. A real connection
                  test and server-side key handling will be part of the API
                  integration.
                </p>
              </div>
            </>
          )}
          {tab === "Appearance" && (
            <>
              <div className="settings-section-title">
                <div>
                  <h3>Make yourself comfortable</h3>
                  <p>Changes apply to your chat immediately.</p>
                </div>
                <button
                  className="icon-button"
                  aria-label="Reset appearance"
                  title="Reset appearance"
                  onClick={() => setAppearance({ ...defaultAppearance })}
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
