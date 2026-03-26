import type { ThemePack } from "./types.js";
import { springTheme } from "./spring.js";

const themes = new Map<string, ThemePack>([
  ["spring", springTheme],
]);

export function loadTheme(id: string): ThemePack {
  const theme = themes.get(id);
  if (!theme) {
    const available = [...themes.keys()].join(", ");
    throw new Error(`Unknown theme "${id}". Available: ${available}`);
  }
  return theme;
}

export function listThemes(): string[] {
  return [...themes.keys()];
}
