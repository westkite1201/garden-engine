import type { GridContext, TimelineResult } from "../../engine/types.js";
import { CELL_SIZE, GAP, BORDER_RADIUS } from "../../config/constants.js";
import {
  BLOOM_WAVE_SPEED,
  BLOOM_POP_DURATION,
  GROWTH_DURATION,
} from "../../config/defaults.js";
import { getColor } from "../../grid/contribution.js";

// Flower color palettes — each has petal + center color
const FLOWER_COLORS = [
  { petal: "#f9a8d4", center: "#fbbf24" },  // 체리블로썸 핑크 + 노랑
  { petal: "#c4b5fd", center: "#fde68a" },  // 라벤더 + 연노랑
  { petal: "#fca5a5", center: "#fcd34d" },  // 코랄 레드 + 골드
  { petal: "#93c5fd", center: "#fef08a" },  // 스카이 블루 + 레몬
  { petal: "#fdba74", center: "#fef9c3" },  // 오렌지 + 크림
  { petal: "#f0abfc", center: "#fbbf24" },  // 자홍 + 노랑
];

/** Deterministic hash: same cell position always gets same flower color */
function cellHash(col: number, row: number): number {
  let h = col * 7919 + row * 104729 + 31;
  h = ((h >> 16) ^ h) * 0x45d9f3b;
  h = ((h >> 16) ^ h) * 0x45d9f3b;
  return ((h >> 16) ^ h) >>> 0;
}

/** 1px dot helper */
function d(x: number, y: number, fill: string): string {
  return `<rect x="${x}" y="${y}" width="1" height="1" fill="${fill}"/>`;
}

/** Pixel-art stump on empty cell (10x10) */
function stumpSvg(x: number, y: number): string {
  const B = "#78350f"; // dark bark
  const b = "#92400e"; // bark highlight
  const r = "#6b5c4a"; // ring
  //    BBB
  //   BrBrB
  //    bbb
  //     b
  return `<g>${d(x+3,y+4,B)}${d(x+4,y+4,B)}${d(x+5,y+4,B)}${d(x+2,y+5,B)}${d(x+3,y+5,r)}${d(x+4,y+5,B)}${d(x+5,y+5,r)}${d(x+6,y+5,B)}${d(x+3,y+6,b)}${d(x+4,y+6,b)}${d(x+5,y+6,b)}${d(x+4,y+7,b)}</g>`;
}

/** Pixel-art mushroom on empty cell (10x10) */
function mushroomSvg(x: number, y: number, col: number, row: number): string {
  // Two mushroom color variants based on cell position
  const variant = cellHash(col + 1337, row + 42) % 2;
  const cap = variant === 0 ? "#ef4444" : "#a78bfa"; // red or purple cap
  const dot = "#fef3c7"; // cream spots
  const S  = "#e5e1d8"; // stem
  //    ccc
  //   cDcDc
  //    SSS
  //     S
  return `<g>${d(x+3,y+4,cap)}${d(x+4,y+4,cap)}${d(x+5,y+4,cap)}${d(x+2,y+5,cap)}${d(x+3,y+5,dot)}${d(x+4,y+5,cap)}${d(x+5,y+5,dot)}${d(x+6,y+5,cap)}${d(x+3,y+6,S)}${d(x+4,y+6,S)}${d(x+5,y+6,S)}${d(x+4,y+7,S)}</g>`;
}

/** Pixel-art round deciduous tree (10x10 cell) */
function roundTreeSvg(x: number, y: number): string {
  const C = "#15803d"; // canopy dark
  const c = "#4ade80"; // canopy highlight
  const B = "#92400e"; // bark
  //    CCC
  //   CcCcC
  //   CCCCC
  //    CCC
  //     B
  //     B
  return `<g>${d(x+3,y+1,C)}${d(x+4,y+1,C)}${d(x+5,y+1,C)}${d(x+2,y+2,C)}${d(x+3,y+2,c)}${d(x+4,y+2,C)}${d(x+5,y+2,c)}${d(x+6,y+2,C)}${d(x+2,y+3,C)}${d(x+3,y+3,C)}${d(x+4,y+3,C)}${d(x+5,y+3,C)}${d(x+6,y+3,C)}${d(x+3,y+4,C)}${d(x+4,y+4,C)}${d(x+5,y+4,C)}${d(x+4,y+5,B)}${d(x+4,y+6,B)}</g>`;
}

/** Pixel-art pine / conifer tree (10x10 cell) */
function pineTreeSvg(x: number, y: number): string {
  const P = "#166534"; // pine dark
  const p = "#15803d"; // pine light
  const B = "#92400e"; // bark
  //     P
  //    PpP
  //   PpPpP
  //    PpP
  //   PpPpP
  //     B
  //     B
  return `<g>${d(x+4,y+0,P)}${d(x+3,y+1,P)}${d(x+4,y+1,p)}${d(x+5,y+1,P)}${d(x+2,y+2,P)}${d(x+3,y+2,p)}${d(x+4,y+2,P)}${d(x+5,y+2,p)}${d(x+6,y+2,P)}${d(x+3,y+3,P)}${d(x+4,y+3,p)}${d(x+5,y+3,P)}${d(x+2,y+4,P)}${d(x+3,y+4,p)}${d(x+4,y+4,P)}${d(x+5,y+4,p)}${d(x+6,y+4,P)}${d(x+4,y+5,B)}${d(x+4,y+6,B)}</g>`;
}

/** Returns true ~rate% of the time, deterministically by cell position */
function isTree(col: number, row: number, rate: number): boolean {
  // Use a different seed offset so tree distribution differs from flower color
  const h = cellHash(col + 9973, row + 6271);
  return (h % 100) < rate;
}

/**
 * Pixel-art plant SVGs for each growth level.
 * All shapes use 1px rect dots for consistent pixel style.
 * x, y = cell top-left corner. Cell is 10x10.
 * Lv4 cells have ~20% chance to be a tree instead of a flower.
 */
function plantSvg(level: number, col: number, row: number, x: number, y: number): string {
  const fc = FLOWER_COLORS[cellHash(col, row) % FLOWER_COLORS.length];
  const g = "#4ade80"; // sprout green
  const G = "#22c55e"; // leaf/stem green

  switch (level) {
    case 1:
      // Sprout: tiny stem + 2 leaf dots
      //     g
      //    gGg
      //     G
      //     G
      return `<g>${d(x+4,y+3,g)}${d(x+3,y+4,g)}${d(x+4,y+4,G)}${d(x+5,y+4,g)}${d(x+4,y+5,G)}${d(x+4,y+6,G)}</g>`;

    case 2:
      // Leaf: taller stem + bigger leaves
      //    gGg
      //   g G g
      //     G
      //     G
      //     G
      return `<g>${d(x+3,y+2,g)}${d(x+4,y+2,G)}${d(x+5,y+2,g)}${d(x+2,y+3,g)}${d(x+4,y+3,G)}${d(x+6,y+3,g)}${d(x+4,y+4,G)}${d(x+4,y+5,G)}${d(x+4,y+6,G)}</g>`;

    case 3:
      // Bud: stem + leaves + colored bud on top
      //     p
      //    ppp
      //    gGg
      //     G
      //     G
      return `<g>${d(x+4,y+1,fc.petal)}${d(x+3,y+2,fc.petal)}${d(x+4,y+2,fc.petal)}${d(x+5,y+2,fc.petal)}${d(x+3,y+3,g)}${d(x+4,y+3,G)}${d(x+5,y+3,g)}${d(x+4,y+4,G)}${d(x+4,y+5,G)}${d(x+4,y+6,G)}</g>`;

    case 4:
      // ~20% chance: tree instead of flower
      if (isTree(col, row, 20)) {
        // 50/50 split between round and pine
        return cellHash(col, row) % 2 === 0
          ? roundTreeSvg(x, y)
          : pineTreeSvg(x, y);
      }
      // Full bloom: open flower with colored petals + center + stem
      //    p p
      //   ppcpp
      //    ppp
      //    gGg
      //     G
      //     G
      return `<g>${d(x+3,y+0,fc.petal)}${d(x+5,y+0,fc.petal)}${d(x+2,y+1,fc.petal)}${d(x+3,y+1,fc.petal)}${d(x+4,y+1,fc.center)}${d(x+5,y+1,fc.petal)}${d(x+6,y+1,fc.petal)}${d(x+3,y+2,fc.petal)}${d(x+4,y+2,fc.petal)}${d(x+5,y+2,fc.petal)}${d(x+3,y+3,g)}${d(x+4,y+3,G)}${d(x+5,y+3,g)}${d(x+4,y+4,G)}${d(x+4,y+5,G)}${d(x+4,y+6,G)}</g>`;

    default:
      return "";
  }
}

/**
 * Growth animation layer:
 * 1. Cell color: soil → target contribution level (keyframe)
 * 2. Pixel-art plant/flower fades in after growth completes
 * 3. Bloom wave scale pop at the end
 */
export function buildGrowthLayer(
  ctx: GridContext,
  timeline: TimelineResult,
): { growthRects: string; growthKeyframes: string } {
  const { gridLeftX, gridTopY, theme } = ctx;
  const palette = theme.palette;

  const rects: string[] = [];
  const keyframeSet = new Set<string>();

  // Growth color keyframes for each target level (1-4)
  for (let targetLevel = 1; targetLevel <= 4; targetLevel++) {
    const steps: string[] = [];
    steps.push(`0% { fill: ${palette.soil}; }`);

    if (targetLevel === 1) {
      steps.push(`100% { fill: ${getColor(1, palette)}; }`);
    } else if (targetLevel === 2) {
      steps.push(`50% { fill: ${getColor(1, palette)}; }`);
      steps.push(`100% { fill: ${getColor(2, palette)}; }`);
    } else if (targetLevel === 3) {
      steps.push(`33% { fill: ${getColor(1, palette)}; }`);
      steps.push(`66% { fill: ${getColor(2, palette)}; }`);
      steps.push(`100% { fill: ${getColor(3, palette)}; }`);
    } else {
      steps.push(`25% { fill: ${getColor(1, palette)}; }`);
      steps.push(`50% { fill: ${getColor(2, palette)}; }`);
      steps.push(`75% { fill: ${getColor(3, palette)}; }`);
      steps.push(`100% { fill: ${getColor(4, palette)}; }`);
    }

    keyframeSet.add(`@keyframes grow-to-${targetLevel} {\n    ${steps.join("\n    ")}\n  }`);
  }

  // Plant fade-in keyframe
  keyframeSet.add(`@keyframes plant-appear {
    0% { opacity: 0; transform: scale(0.3); }
    60% { opacity: 1; transform: scale(1.1); }
    100% { opacity: 1; transform: scale(1); }
  }`);

  // Bloom wave: scale pop at the end
  keyframeSet.add(`@keyframes bloom-pop {
    0% { transform: scale(1); }
    50% { transform: scale(1.15); }
    100% { transform: scale(1); }
  }`);

  for (const [key, startS] of timeline.growthStartAbsS) {
    const level = timeline.growthLevel.get(key) ?? 1;
    const [col, row] = key.split(",").map(Number);
    const x = gridLeftX + col * (CELL_SIZE + GAP);
    const y = gridTopY + row * (CELL_SIZE + GAP);
    const cx = x + CELL_SIZE / 2;
    const cy = y + CELL_SIZE / 2;

    // 1. Growth animation: soil → target level color
    rects.push(
      `<rect x="${x}" y="${y}" width="${CELL_SIZE}" height="${CELL_SIZE}" rx="${BORDER_RADIUS}" fill="${palette.soil}" style="animation: grow-to-${level} ${GROWTH_DURATION}s ease ${startS.toFixed(2)}s forwards;"/>`,
    );

    // 2. Pixel-art plant/flower appears after growth color finishes
    const plantDelay = startS + GROWTH_DURATION * 0.7;
    const plant = plantSvg(level, col, row, x, y);
    if (plant) {
      rects.push(
        `<g style="opacity:0; transform-origin:${cx}px ${cy}px; animation: plant-appear 0.5s ease ${plantDelay.toFixed(2)}s forwards;">${plant}</g>`,
      );
    }

    // 3. Bloom wave pop
    const dist = Math.abs(col - timeline.bloomWaveCenterCol) + Math.abs(row - timeline.bloomWaveCenterRow);
    const bloomDelay = timeline.bloomWaveStartAbsS + dist * BLOOM_WAVE_SPEED;

    rects.push(
      `<rect x="${x}" y="${y}" width="${CELL_SIZE}" height="${CELL_SIZE}" rx="${BORDER_RADIUS}" fill="none" style="transform-origin:${cx}px ${cy}px; animation: bloom-pop ${BLOOM_POP_DURATION}s ease ${bloomDelay.toFixed(2)}s;"/>`,
    );
  }

  // Empty-cell decorations: stumps (~10%) and mushrooms (~5%)
  // These are static (no animation), placed from the start
  for (const cell of ctx.grid) {
    if (cell.count > 0) continue;
    const key = `${cell.x},${cell.y}`;
    if (timeline.growthStartAbsS.has(key)) continue;

    const x = gridLeftX + cell.x * (CELL_SIZE + GAP);
    const y = gridTopY + cell.y * (CELL_SIZE + GAP);
    const h = cellHash(cell.x + 5381, cell.y + 8527);
    const roll = h % 100;

    if (roll < 10) {
      // ~10%: stump
      rects.push(`<g opacity="0.6">${stumpSvg(x, y)}</g>`);
    } else if (roll < 15) {
      // ~5%: mushroom
      rects.push(`<g opacity="0.6">${mushroomSvg(x, y, cell.x, cell.y)}</g>`);
    }
  }

  return {
    growthRects: rects.join("\n    "),
    growthKeyframes: [...keyframeSet].join("\n  "),
  };
}
