import { CELL_SIZE, GAP } from "../config/constants.js";

export function getCellTopLeft(
  gridLeftX: number,
  gridTopY: number,
  col: number,
  row: number,
): { x: number; y: number } {
  return {
    x: gridLeftX + col * (CELL_SIZE + GAP),
    y: gridTopY + row * (CELL_SIZE + GAP),
  };
}

export function getCellCenterPx(
  gridLeftX: number,
  gridTopY: number,
  col: number,
  row: number,
): { x: number; y: number } {
  const tl = getCellTopLeft(gridLeftX, gridTopY, col, row);
  return {
    x: tl.x + CELL_SIZE / 2,
    y: tl.y + CELL_SIZE / 2,
  };
}
