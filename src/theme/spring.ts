import type { ThemePack } from "./types.js";

export const springTheme: ThemePack = {
  id: "spring",
  label: "Spring Garden",
  palette: {
    bg: "#0d1117",
    soil: "#2a1f14",        // warm dark brown — visible as tilled earth
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
    facing: "right",
    css: `@keyframes bee-wing-flutter {
    0%, 100% { transform: scaleY(1) rotate(-3deg); }
    50% { transform: scaleY(0.35) rotate(3deg); }
  }
  .bee-wings {
    transform-origin: 5px 3px;
    animation: bee-wing-flutter 0.18s ease-in-out var(--wing-phase, 0s) infinite;
  }`,
    svg: `<!-- Pixel-art bee (10x10 grid, 1px = 1 dot) -->
      <!-- Wing (top) -->
      <g class="bee-wings">
        <rect x="2" y="1" width="2" height="1" fill="#fff" opacity="0.6"/>
        <rect x="6" y="1" width="2" height="1" fill="#fff" opacity="0.6"/>
        <rect x="1" y="2" width="3" height="1" fill="#fff" opacity="0.45"/>
        <rect x="6" y="2" width="3" height="1" fill="#fff" opacity="0.45"/>
      </g>
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
    watering: "sparkle",
  },
  rules: {
    dwellByLevel: (level: number) => 0.8 + level * 0.2,
    actorCount: (activeCells: number, totalContributions: number) => {
      if (activeCells <= 0) return 0;

      const activityCount = totalContributions < 100 ? 1
        : totalContributions < 300 ? 2
        : totalContributions < 600 ? 3
        : totalContributions < 1000 ? 4
        : totalContributions < 2000 ? 6
        : totalContributions < 4000 ? 8
        : 12;
      // Add one bee per 30 active days, then apply the swarm/flower limits.
      const workloadCount = Math.ceil(activeCells / 30);
      return Math.min(12, activeCells, Math.max(activityCount, workloadCount));
    },
    cellTime: 0.35,
  },
};
