import type { ThemePack } from "./types.js";

export const springTheme: ThemePack = {
  id: "spring",
  label: "Spring Garden",
  palette: {
    bg: "#0d1117",
    soil: "#161b22",        // GitHub dark empty cell (matches exactly)
    level1: "#0e4429",      // GitHub dark low
    level2: "#006d32",      // GitHub dark medium-low
    level3: "#26a641",      // GitHub dark medium-high
    level4: "#39d353",      // GitHub dark high
    accent: "#f9a8d4",      // cherry blossom pink
  },
  tiles: {
    empty: `<rect width="10" height="10" rx="2" fill="__COLOR__"/>`,
    lv1: `<rect width="10" height="10" rx="2" fill="__COLOR__"/>`,
    lv2: `<rect width="10" height="10" rx="2" fill="__COLOR__"/>`,
    lv3: `<rect width="10" height="10" rx="2" fill="__COLOR__"/>`,
    lv4: `<rect width="10" height="10" rx="2" fill="__COLOR__"/>`,
  },
  actor: {
    kind: "bee",
    widthPx: 10,
    viewBoxW: 10,
    viewBoxH: 10,
    svg: `<!-- Pixel-art bee (10x10 grid, 1px = 1 dot) -->
      <!-- Wing (top) -->
      <rect x="2" y="1" width="2" height="1" fill="#fff" opacity="0.6"/>
      <rect x="6" y="1" width="2" height="1" fill="#fff" opacity="0.6"/>
      <rect x="1" y="2" width="3" height="1" fill="#fff" opacity="0.45"/>
      <rect x="6" y="2" width="3" height="1" fill="#fff" opacity="0.45"/>
      <!-- Body (yellow + black stripes) -->
      <rect x="3" y="3" width="4" height="1" fill="#f6c541"/>
      <rect x="3" y="4" width="4" height="1" fill="#333"/>
      <rect x="3" y="5" width="4" height="1" fill="#f6c541"/>
      <rect x="3" y="6" width="4" height="1" fill="#333"/>
      <rect x="3" y="7" width="4" height="1" fill="#f6c541"/>
      <!-- Head -->
      <rect x="7" y="4" width="2" height="3" fill="#333"/>
      <!-- Eye -->
      <rect x="8" y="4" width="1" height="1" fill="#fff"/>
      <!-- Stinger -->
      <rect x="2" y="5" width="1" height="1" fill="#333"/>`,
  },
  effects: {
    intro: "none",
    outro: "full-bloom",
  },
  rules: {
    dwellByLevel: (level: number) => 0.8 + level * 0.2,
    actorCount: (activeCells: number) => {
      if (activeCells <= 0) return 0;
      if (activeCells < 30) return 1;
      if (activeCells < 100) return 2;
      return 3;
    },
    cellTime: 0.35,
  },
};
