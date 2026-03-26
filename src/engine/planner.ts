import type { GridContext, PlanResult, ActorState } from "./types.js";
import { getContributionLevel } from "../grid/contribution.js";

/**
 * Plan watering targets and actor assignments.
 * Unlike green-movement (eating), actors VISIT cells to water them.
 * Cells with count > 0 are targets; actors start from grid edges.
 */
export function planTargets(ctx: GridContext): PlanResult {
  const { grid, maxX, maxY, initialCountByKey, quartiles, actorCount, keyOf } = ctx;

  if (actorCount === 0) {
    return {
      actorCount: 0,
      spawnPositions: [],
      waterTargets: [],
      actorStates: [],
      spawnTick: [],
    };
  }

  // Collect all cells that need watering (count > 0)
  const waterTargets: string[] = [];
  for (const cell of grid) {
    if (cell.count > 0) {
      const level = getContributionLevel(cell.count, quartiles);
      if (level > 0) {
        waterTargets.push(keyOf(cell.x, cell.y));
      }
    }
  }

  // Find spawn positions along the left edge (col 0)
  const spawnPositions: [number, number][] = [];
  const rowSpacing = Math.max(1, Math.floor((maxY + 1) / (actorCount + 1)));
  for (let i = 0; i < actorCount; i++) {
    const row = Math.min(maxY, rowSpacing * (i + 1));
    spawnPositions.push([0, row]);
  }

  // Divide targets among actors (column-based assignment)
  const colsPerActor = Math.ceil((maxX + 1) / actorCount);
  const actorStates: ActorState[] = [];

  for (let i = 0; i < actorCount; i++) {
    actorStates.push({
      pos: spawnPositions[i],
      targetCellKey: null,
      wateringUntil: -1,
      stuck: 0,
      visited: new Set(),
    });
  }

  // Stagger spawns: each actor spawns 8 ticks apart
  const spawnTick: number[] = [];
  for (let i = 0; i < actorCount; i++) {
    spawnTick.push(i * 8);
  }

  return {
    actorCount,
    spawnPositions,
    waterTargets,
    actorStates,
    spawnTick,
  };
}

/**
 * Assign a target cell to an actor: nearest unwatered cell in its zone.
 */
export function findNearestUnwatered(
  pos: [number, number],
  visited: Set<string>,
  waterTargets: string[],
  actorIndex: number,
  actorCount: number,
  maxX: number,
): string | null {
  const colsPerActor = Math.ceil((maxX + 1) / actorCount);
  const minCol = actorIndex * colsPerActor;
  const maxCol = Math.min(maxX, (actorIndex + 1) * colsPerActor - 1);

  let best: string | null = null;
  let bestDist = Infinity;

  for (const key of waterTargets) {
    if (visited.has(key)) continue;
    const [cx, cy] = key.split(",").map(Number);
    // Prefer cells in this actor's zone, but allow overflow
    const inZone = cx >= minCol && cx <= maxCol;
    const dist = Math.abs(cx - pos[0]) + Math.abs(cy - pos[1]);
    const adjustedDist = inZone ? dist : dist + 1000;
    if (adjustedDist < bestDist) {
      bestDist = adjustedDist;
      best = key;
    }
  }

  return best;
}
