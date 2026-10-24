export const defaultParameters = {
  temperature: 0.8,
  topP: 0.95,
  maxTokens: 512,
  contextSize: 8192,
  frequencyPenalty: 0,
  presencePenalty: 0,
  style: "Balanced",
  prompt:
    "Stay in character. Write expressive, thoughtful responses. Use *asterisks* for actions and quotation marks for spoken dialogue.",
  memory: true,
};
export const defaultAppearance = {
  font: "sans",
  fontSize: 14,
  lineHeight: 1.85,
  density: "comfortable",
  textColor: "#d8e6db",
  actionColor: "#9fc5a9",
  dialogueColor: "#eee0bf",
  assistantColor: "#1b2b20",
  userColor: "#284634",
  actionsItalic: true,
  dialogueBold: false,
  showMarkers: false,
  bubbles: true,
};
export const defaultApi = {
  provider: "openai",
  transport: "server",
  baseUrl: "https://api.openai.com/v1",
  model: "gpt-4.1-mini",
};
export function appearanceStyle(a = defaultAppearance) {
  return {
    "--chat-font":
      {
        sans: '"DM Sans", sans-serif',
        serif: "Georgia, serif",
        mono: "ui-monospace, monospace",
      }[a.font] || '"DM Sans", sans-serif',
    "--chat-font-size": `${a.fontSize}px`,
    "--chat-line-height": a.lineHeight,
    "--chat-text": a.textColor,
    "--chat-action": a.actionColor,
    "--chat-dialogue": a.dialogueColor,
    "--chat-assistant": a.assistantColor,
    "--chat-user": a.userColor,
    "--chat-action-style": a.actionsItalic ? "italic" : "normal",
    "--chat-dialogue-weight": a.dialogueBold ? 600 : 400,
    "--chat-message-gap": a.density === "compact" ? "14px" : "25px",
  };
}
