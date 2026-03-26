import type { GridCell } from "../grid/mapGrid.js";
import type { ThemePack } from "../theme/types.js";
import type { GridContext } from "./types.js";
import { CELL_SIZE, GAP, GRID_MARGIN } from "../config/constants.js";
import { calculateQuartiles } from "../grid/contribution.js";

export function buildContext(grid: GridCell[], theme: ThemePack): GridContext {
  const maxX = Math.max(0, ...grid.map((c) => c.x));
  const maxY = Math.max(0, ...grid.map((c) => c.y));
  const gridWidth = (maxX + 1) * (CELL_SIZE + GAP);
  const gridHeight = (maxY + 1) * (CELL_SIZE + GAP);
  const gridLeftX = GRID_MARGIN;
  const gridTopY = GRID_MARGIN;
  const totalWidth = gridLeftX + gridWidth + GRID_MARGIN;
  const totalHeight = gridTopY + gridHeight + GRID_MARGIN;

  const byKey = new Map<string, GridCell>();
  for (const c of grid) byKey.set(`${c.x},${c.y}`, c);

  const initialCountByKey = new Map<string, number>();
  for (const c of grid) initialCountByKey.set(`${c.x},${c.y}`, c.count);

  const activeCells = grid.filter((c) => c.count > 0).length;
  const actorCountFn = theme.rules?.actorCount;
  const actorCount = actorCountFn ? actorCountFn(activeCells) : Math.min(3, Math.max(1, Math.floor(activeCells / 50)));

  const inBounds = (col: number, row: number) =>
    col >= 0 && col <= maxX && row >= 0 && row <= maxY;

  const dirs4: [number, number][] = [
    [0, 1],
    [1, 0],
    [-1, 0],
    [0, -1],
  ];

  const keyOf = (c: number, r: number) => `${c},${r}`;

  const allCounts = grid.map((c) => c.count);
  const quartiles = calculateQuartiles(allCounts);

  return {
    grid,
    maxX,
    maxY,
    gridLeftX,
    gridTopY,
    totalWidth,
    totalHeight,
    byKey,
    initialCountByKey,
    actorCount,
    inBounds,
    dirs4,
    keyOf,
    quartiles,
    theme,
  };
}
