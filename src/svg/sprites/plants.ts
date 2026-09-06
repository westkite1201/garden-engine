import { CELL_SIZE } from "../../config/constants.js";

// Keep the original six petal colors, with a small shaded edge for contrast.
const FLOWER_COLORS = [
  { P: "#f9a8d4", p: "#ad427b", H: "#ffe2f0", c: "#fbbf24" },
  { P: "#c4b5fd", p: "#7960ad", H: "#eee5ff", c: "#fde68a" },
  { P: "#fca5a5", p: "#b45255", H: "#ffe1d6", c: "#fcd34d" },
  { P: "#93c5fd", p: "#4e75a8", H: "#e1f0ff", c: "#fef08a" },
  { P: "#fdba74", p: "#ac723d", H: "#ffe7c5", c: "#fef9c3" },
  { P: "#f0abfc", p: "#a054ad", H: "#ffe0ff", c: "#fbbf24" },
];

const LEAVES = {
  o: "#15351f", l: "#245538", L: "#4e9a58", H: "#a8d98a",
  s: "#22c55e", h: "#4ade80", t: "#78502e", T: "#d39c62",
};

// Sprout and leaf stages retain their original pixels and positions.
const SPROUT = [
  "..........",
  "..........",
  "..........",
  "....h.....",
  "...hsh....",
  "....s.....",
  "....s.....",
  "..........",
  "..........",
  "..........",
];

const LEAF = [
  "..........",
  "..........",
  "...hsh....",
  "..h.s.h...",
  "....s.....",
  "....s.....",
  "....s.....",
  "..........",
  "..........",
  "..........",
];

const BUD = [
  "...ooo....",
  "..opHpo...",
  "..oPPPo...",
  "...hsh....",
  "..h.s.h...",
  "....s.....",
  "....s.....",
  "....s.....",
  "..........",
  "..........",
];

const BLOSSOM = [
  "...p.p....",
  "..pPHPp...",
  ".pPPcPPp..",
  "..pPPPp...",
  "...hsh....",
  "..h.s.h...",
  "....s.....",
  "....s.....",
  "....o.....",
  "..........",
];

const SUNFLOWER = [
  "....P.....",
  "..PPHPP...",
  ".PPHcHPP..",
  "..PPcPP...",
  "...PPP....",
  "...hsh....",
  "..h.s.h...",
  "....s.....",
  "....o.....",
  "..........",
];

const ROUND_TREE = [
  "...ooo....",
  "..oLHLo...",
  ".oLHLLlo..",
  ".oLLLllo..",
  "..oLLlo...",
  "...oto....",
  "...tTt....",
  "...tTt....",
  "..otTto...",
  "..........",
];

const PINE_TREE = [
  "....H.....",
  "...oLo....",
  "..oLHlo...",
  "...oLo....",
  "..oLLlo...",
  ".oLLLllo..",
  "...oto....",
  "...tTt....",
  "...ooo....",
  "..........",
];

/** Stable plant species and colors for a given garden position. */
export function cellHash(col: number, row: number): number {
  let h = col * 7919 + row * 104729 + 31;
  h = ((h >> 16) ^ h) * 0x45d9f3b;
  h = ((h >> 16) ^ h) * 0x45d9f3b;
  return ((h >> 16) ^ h) >>> 0;
}

/** Merge pixel runs into one path per color to keep the standalone SVG small. */
function sprite(pattern: string[], colors: Record<string, string>, x: number, y: number): string {
  const paths = new Map<string, string[]>();
  for (let row = 0; row < pattern.length; row++) {
    for (let col = 0; col < pattern[row].length;) {
      const symbol = pattern[row][col];
      let end = col + 1;
      while (pattern[row][end] === symbol) end++;
      if (symbol !== ".") {
        const color = colors[symbol];
        if (!color) throw new Error(`Unknown plant sprite color: ${symbol}`);
        const runs = paths.get(color) ?? [];
        runs.push(`M${col} ${row}h${end - col}v1h-${end - col}z`);
        paths.set(color, runs);
      }
      col = end;
    }
  }
  const width = Math.max(...pattern.map(row => row.length));
  const left = x + (CELL_SIZE - width) / 2;
  const top = y + CELL_SIZE - pattern.length;
  return `<g transform="translate(${left} ${top})" shape-rendering="crispEdges">${[...paths]
    .map(([fill, runs]) => `<path fill="${fill}" d="${runs.join("")}"/>`).join("")}</g>`;
}

/** Slightly fuller flowers and clearer trunks, all inside the original 10px cell. */
export function plantSvg(level: number, col: number, row: number, x: number, y: number): string {
  if (level < 1 || level > 4) return "";
  let kind = ["", "sprout", "leaf", "bud", "blossom"][level];
  let pattern = [SPROUT, LEAF, BUD, BLOSSOM][level - 1];
  let colors: Record<string, string> = { ...LEAVES, ...FLOWER_COLORS[cellHash(col, row) % FLOWER_COLORS.length] };

  if (level === 4) {
    // Keep the existing tree and sunflower distribution.
    if (cellHash(col + 9973, row + 6271) % 100 < 20) {
      const isRound = cellHash(col, row) % 2 === 0;
      kind = isRound ? "oak" : "pine";
      pattern = isRound ? ROUND_TREE : PINE_TREE;
      colors = { ...LEAVES };
    } else if (cellHash(col + 7777, row + 8888) % 100 < 12) {
      kind = "sunflower";
      pattern = SUNFLOWER;
      colors = { ...LEAVES, P: "#fbbf24", H: "#fff0a6", c: "#92400e" };
    }
  }

  return `<g data-plant="${kind}">${sprite(pattern, colors, x, y)}</g>`;
}
