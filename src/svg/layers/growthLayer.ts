import type { GridContext, TimelineResult } from "../../engine/types.js";
import { CELL_SIZE, GAP, BORDER_RADIUS } from "../../config/constants.js";
import {
  BLOOM_WAVE_SPEED,
  BLOOM_POP_DURATION,
  GROWTH_DURATION,
} from "../../config/defaults.js";
import { getColor } from "../../grid/contribution.js";
import { cellHash, plantSvg } from "../sprites/plants.js";

/** 1px dot helper */
function d(x: number, y: number, fill: string): string {
  return `<rect x="${x}" y="${y}" width="1" height="1" fill="${fill}"/>`;
}

/** Pixel-art pebbles / small stones on empty cell (10x10) */
function stoneSvg(x: number, y: number, col: number, row: number): string {
  const variant = cellHash(col + 2222, row + 3333) % 3;
  const S1 = "#6b7280"; // grey stone
  const S2 = "#9ca3af"; // light grey
  const S3 = "#4b5563"; // dark grey
  if (variant === 0) {
    // Two small pebbles
    return `<g>${d(x+2,y+6,S1)}${d(x+3,y+6,S2)}${d(x+3,y+7,S1)}${d(x+6,y+5,S3)}${d(x+7,y+5,S2)}${d(x+6,y+6,S2)}${d(x+7,y+6,S1)}</g>`;
  } else if (variant === 1) {
    // One medium rock
    return `<g>${d(x+3,y+5,S3)}${d(x+4,y+5,S1)}${d(x+5,y+5,S3)}${d(x+3,y+6,S1)}${d(x+4,y+6,S2)}${d(x+5,y+6,S1)}${d(x+4,y+7,S3)}</g>`;
  }
  // Three tiny pebbles scattered
  return `<g>${d(x+2,y+5,S2)}${d(x+5,y+4,S1)}${d(x+7,y+6,S3)}${d(x+3,y+7,S1)}</g>`;
}

/** Pixel-art water puddle on empty cell (10x10) */
function puddleSvg(x: number, y: number): string {
  const W1 = "#3b82f6"; // water blue
  const W2 = "#60a5fa"; // light blue
  const W3 = "#93c5fd"; // highlight
  //    WW
  //   WWWW
  //   WWhW
  //    WW
  return `<g>${d(x+4,y+4,W1)}${d(x+5,y+4,W2)}${d(x+3,y+5,W1)}${d(x+4,y+5,W2)}${d(x+5,y+5,W1)}${d(x+6,y+5,W2)}${d(x+3,y+6,W2)}${d(x+4,y+6,W1)}${d(x+5,y+6,W3)}${d(x+6,y+6,W1)}${d(x+4,y+7,W2)}${d(x+5,y+7,W1)}</g>`;
}

/** Pixel-art weeds / grass tufts on empty cell (10x10) */
function weedSvg(x: number, y: number, col: number, row: number): string {
  const variant = cellHash(col + 4444, row + 5555) % 2;
  const g1 = "#65a30d"; // olive green
  const g2 = "#84cc16"; // lime
  if (variant === 0) {
    // Two small grass tufts
    return `<g>${d(x+2,y+5,g1)}${d(x+3,y+4,g2)}${d(x+3,y+5,g1)}${d(x+6,y+5,g1)}${d(x+7,y+4,g2)}${d(x+7,y+5,g1)}</g>`;
  }
  // Three blades of grass
  return `<g>${d(x+3,y+4,g2)}${d(x+3,y+5,g1)}${d(x+5,y+3,g2)}${d(x+5,y+4,g1)}${d(x+5,y+5,g1)}${d(x+7,y+5,g2)}${d(x+7,y+6,g1)}</g>`;
}

/** Pixel-art ladybug decoration (placed on top of lv3-4 plants) */
function ladybugSvg(x: number, y: number): string {
  const R = "#dc2626"; // red body
  const B = "#1c1917"; // black spots/head
  const W = "#ffffff"; // eye
  //    B
  //   RBR
  //   RBR
  //    B
  return `<g>${d(x+7,y+1,B)}${d(x+6,y+2,R)}${d(x+7,y+2,B)}${d(x+8,y+2,R)}${d(x+6,y+3,R)}${d(x+7,y+3,B)}${d(x+8,y+3,R)}${d(x+7,y+4,B)}${d(x+8,y+1,W)}</g>`;
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

/**
 * Growth animation layer:
 * 1. Cell color: soil → target contribution level (keyframe)
 * 2. Plants appear after watering, above the original contribution colors
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

  // Plants appear after the bee waters their cell.
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

    // Scale the visible cell and its plant together. The nested appearance
    // animation has its own transform, so it cannot override the bloom wave.
    const dist = Math.abs(col - timeline.bloomWaveCenterCol) + Math.abs(row - timeline.bloomWaveCenterRow);
    const bloomDelay = timeline.bloomWaveStartAbsS + dist * BLOOM_WAVE_SPEED;
    rects.push(
      `<g class="growth-cell" data-cell="${key}" style="transform-origin:${cx}px ${cy}px; animation: bloom-pop ${BLOOM_POP_DURATION}s ease ${bloomDelay.toFixed(2)}s;">`,
    );

    // 1. Growth animation: soil → target level color
    rects.push(
      `<rect x="${x}" y="${y}" width="${CELL_SIZE}" height="${CELL_SIZE}" rx="${BORDER_RADIUS}" fill="${palette.soil}" style="animation: grow-to-${level} ${GROWTH_DURATION}s ease ${startS.toFixed(2)}s forwards;"/>`,
    );

    // 2. The plant appears as its contribution cell finishes growing.
    const plantDelay = startS + GROWTH_DURATION * 0.7;
    const plant = plantSvg(level, col, row, x, y);
    if (plant) {
      rects.push(
        `<g style="opacity:0; transform-origin:${cx}px ${cy}px; animation: plant-appear 0.5s ease ${plantDelay.toFixed(2)}s forwards;">${plant}</g>`,
      );
    }

    // 2b. Ladybug on ~10% of lv3-4 plants
    if (level >= 3 && cellHash(col + 6161, row + 7272) % 100 < 10) {
      const bugDelay = plantDelay + 0.3;
      rects.push(
        `<g style="opacity:0; transform-origin:${cx}px ${cy}px; animation: plant-appear 0.4s ease ${bugDelay.toFixed(2)}s forwards;">${ladybugSvg(x, y)}</g>`,
      );
    }

    rects.push("</g>");
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
    } else if (roll < 23) {
      // ~8%: stones / pebbles
      rects.push(`<g opacity="0.5">${stoneSvg(x, y, cell.x, cell.y)}</g>`);
    } else if (roll < 28) {
      // ~5%: water puddle
      rects.push(`<g opacity="0.5">${puddleSvg(x, y)}</g>`);
    } else if (roll < 38) {
      // ~10%: weeds / grass
      rects.push(`<g opacity="0.5">${weedSvg(x, y, cell.x, cell.y)}</g>`);
    }
  }

  return {
    growthRects: rects.join("\n    "),
    growthKeyframes: [...keyframeSet].join("\n  "),
  };
}
