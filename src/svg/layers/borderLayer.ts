import type { GridContext } from "../../engine/types.js";
import { CELL_SIZE, GAP } from "../../config/constants.js";

/**
 * Garden fence border: warm wooden dashed border like the reference's orange fence.
 */
export function buildBorderLayer(ctx: GridContext): string {
  const { maxX, maxY, gridLeftX, gridTopY } = ctx;
  const gridWidth = (maxX + 1) * (CELL_SIZE + GAP) - GAP;
  const gridHeight = (maxY + 1) * (CELL_SIZE + GAP) - GAP;

  const pad = 6;
  const x = gridLeftX - pad;
  const y = gridTopY - pad;
  const w = gridWidth + pad * 2;
  const h = gridHeight + pad * 2;
  const r = 6;

  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" ry="${r}"
    fill="none" stroke="#8B6914" stroke-width="3"
    stroke-dasharray="10 5" stroke-linecap="round" opacity="0.85"/>`;
}
