import { themeColors } from "./themeColors";
import { defaultAppearance } from "./settings";
export const themePresets = [
  {
    id: "forest",
    name: "Forest",
    description: "Botanical calm",
    hue: 145,
    background: "#101513",
    accent: "#9ae8c8",
    chat: { ...defaultAppearance },
  },
  {
    id: "blue",
    name: "Black & blue",
    description: "Electric after dark",
    hue: 215,
    background: "#070b12",
    accent: "#69b2ff",
    chat: {
      textColor: "#dce8fa",
      actionColor: "#88b5e8",
      dialogueColor: "#bedcff",
      assistantColor: "#101b2a",
      userColor: "#183456",
    },
  },
  {
    id: "violet",
    name: "Purple glow",
    description: "A little neon magic",
    hue: 270,
    background: "#0b0712",
    accent: "#c49aff",
    chat: {
      textColor: "#e8dff6",
      actionColor: "#b6a0d6",
      dialogueColor: "#e2c9ff",
      assistantColor: "#1c132b",
      userColor: "#35204f",
    },
  },
  {
    id: "mono",
    name: "Monochrome",
    description: "Quiet. Clear. Timeless.",
    hue: 0,
    background: "#0a0a0a",
    accent: "#e1e1e1",
    chat: {
      textColor: "#e3e3e3",
      actionColor: "#a8a8a8",
      dialogueColor: "#ffffff",
      assistantColor: "#191919",
      userColor: "#303030",
    },
  },
  {
    id: "ember",
    name: "Midnight ember",
    description: "Warm light, late stories",
    hue: 32,
    background: "#100b07",
    accent: "#ffc080",
    chat: {
      textColor: "#f1e1d3",
      actionColor: "#cbaa8a",
      dialogueColor: "#ffd6ad",
      assistantColor: "#261c14",
      userColor: "#463020",
    },
  },
];
function recolor(token, preset) {
  let hex = token;
  if (hex.length <= 4) hex = [...hex].map((c) => c + c).join("");
  const rgb = [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const alpha = hex.length === 8 ? parseInt(hex.slice(6), 16) / 255 : 1;
  const [r, g, b] = rgb;
  const light = (Math.min(...rgb) + Math.max(...rgb)) / 2;
  if (preset.id === "mono")
    return `rgb(${rgb.map(() => Math.round(light * 255)).join(" ")} / ${alpha})`;
  // Keep error/warning hues recognizable; recolor the old botanical surfaces.
  if (r > g * 1.2 && r > b * 1.2 && light > 0.25) return `#${hex}`;
  const chroma = Math.max(...rgb) - Math.min(...rgb);
  const saturation = light < 0.35 ? 20 : chroma > 0.16 ? 65 : 18;
  const adjusted = light < 0.35 ? Math.max(0.015, light * 0.65) : light;
  return `hsl(${preset.hue} ${saturation}% ${adjusted * 100}% / ${alpha})`;
}
export function applyTheme(id) {
  const preset = themePresets.find((t) => t.id === id) || themePresets[0];
  const root = document.documentElement;
  root.dataset.theme = preset.id;
  for (const token of themeColors) {
    if (preset.id === "forest") root.style.removeProperty(`--tone-${token}`);
    else root.style.setProperty(`--tone-${token}`, recolor(token, preset));
  }
  root.style.setProperty("--green", preset.accent);
  root.style.setProperty("--bg", preset.background);
  root.style.backgroundColor = preset.background;
}
