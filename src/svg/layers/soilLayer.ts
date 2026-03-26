import type { GridContext, TimelineResult } from "../../engine/types.js";
import { CELL_SIZE, GAP, BORDER_RADIUS } from "../../config/constants.js";

/**
 * Base grid layer: renders ALL cells as soil (empty) color.
 * Growth layer will animate cells from soil → contribution color.
 */
export function buildSoilLayer(ctx: GridContext, _timeline?: TimelineResult): string {
  const { grid, gridLeftX, gridTopY, theme } = ctx;
  const parts: string[] = [];

  for (const cell of grid) {
    const x = gridLeftX + cell.x * (CELL_SIZE + GAP);
    const y = gridTopY + cell.y * (CELL_SIZE + GAP);

    parts.push(
      `<rect x="${x}" y="${y}" width="${CELL_SIZE}" height="${CELL_SIZE}" rx="${BORDER_RADIUS}" fill="${theme.palette.soil}"/>`,
    );
  }

  return parts.join("\n    ");
}
