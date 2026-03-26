import type { GridContext, PlanResult, SimulationResult, GrowthEvent } from "./types.js";
import { getContributionLevel } from "../grid/contribution.js";
import { findNearestUnwatered } from "./planner.js";

/**
 * Garden simulation: actors walk through the grid watering cells.
 * Much simpler than green-movement's sheep simulation:
 * - 1-5 actors (vs 40 sheep)
 * - Walk + Water cycle (vs complex eating state machine)
 * - BFS to nearest unwatered cell
 */
export function simulateGarden(
  ctx: GridContext,
  plan: PlanResult,
): SimulationResult {
  const { maxX, maxY, inBounds, dirs4, keyOf, quartiles, initialCountByKey, byKey, theme } = ctx;
  const { actorCount, spawnTick, waterTargets } = plan;

  const MAX_TICKS = 20000;
  const dwellFn = theme.rules?.dwellByLevel ?? ((lvl: number) => 1.2 + lvl * 0.3);
  const cellTime = theme.rules?.cellTime ?? 0.5;
  const dwellTicksByLevel = (level: number) =>
    Math.max(1, Math.ceil(dwellFn(level) / cellTime));

  // Per-actor state
  const pos: [number, number][] = plan.actorStates.map((s) => [...s.pos] as [number, number]);
  const targetKey: (string | null)[] = new Array(actorCount).fill(null);
  const wateringUntil: number[] = new Array(actorCount).fill(-1);
  const spawned: boolean[] = new Array(actorCount).fill(false);
  const finished: boolean[] = new Array(actorCount).fill(false);
  const visited: Set<string>[] = plan.actorStates.map(() => new Set<string>());

  // Global watered set (shared across actors)
  const globalWatered = new Set<string>();

  const positionsHistory: [number, number][][] = Array.from(
    { length: actorCount },
    () => [],
  );
  const growthEvents: GrowthEvent[] = [];

  let tick = 0;
  for (tick = 0; tick < MAX_TICKS; tick++) {
    let allDone = true;

    for (let i = 0; i < actorCount; i++) {
      if (finished[i]) continue;

      // Spawn check
      if (!spawned[i]) {
        if (tick < spawnTick[i]) {
          allDone = false;
          continue;
        }
        spawned[i] = true;
      }

      positionsHistory[i].push([...pos[i]]);

      // Currently watering?
      if (wateringUntil[i] >= tick) {
        allDone = false;
        continue;
      }

      // If we just finished watering, mark cell
      if (targetKey[i] !== null && wateringUntil[i] === tick - 1) {
        const key = targetKey[i]!;
        globalWatered.add(key);
        visited[i].add(key);

        const count = initialCountByKey.get(key) ?? 0;
        const level = getContributionLevel(count, quartiles);
        growthEvents.push({
          cellKey: key,
          toLevel: level,
          triggerTick: tick,
          actorIndex: i,
        });
        targetKey[i] = null;
      }

      // Find next target
      if (targetKey[i] === null) {
        const next = findNearestUnwateredGlobal(
          pos[i], globalWatered, waterTargets, i, actorCount, maxX,
        );
        if (next === null) {
          finished[i] = true;
          continue;
        }
        targetKey[i] = next;
        globalWatered.add(next); // Reserve so other actors don't target same cell
      }

      allDone = false;

      // Move toward target
      const [tx, ty] = targetKey[i]!.split(",").map(Number);
      const [cx, cy] = pos[i];

      if (cx === tx && cy === ty) {
        // Arrived at target, start watering
        const count = initialCountByKey.get(targetKey[i]!) ?? 0;
        const level = getContributionLevel(count, quartiles);
        const dwell = dwellTicksByLevel(level);
        wateringUntil[i] = tick + dwell;
        continue;
      }

      // Simple greedy movement toward target (Manhattan)
      const bestMove = findBestMove(pos[i], [tx, ty], i, pos, inBounds, maxX, maxY);
      if (bestMove) {
        pos[i] = bestMove;
      }
    }

    if (allDone) break;
  }

  return {
    positionsHistory,
    growthEvents,
    maxTick: tick,
  };
}

function findNearestUnwateredGlobal(
  actorPos: [number, number],
  globalWatered: Set<string>,
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

  // First pass: cells in this actor's zone
  for (const key of waterTargets) {
    if (globalWatered.has(key)) continue;
    const [cx, cy] = key.split(",").map(Number);
    if (cx < minCol || cx > maxCol) continue;
    const dist = Math.abs(cx - actorPos[0]) + Math.abs(cy - actorPos[1]);
    if (dist < bestDist) {
      bestDist = dist;
      best = key;
    }
  }

  // Second pass: any remaining cell
  if (!best) {
    for (const key of waterTargets) {
      if (globalWatered.has(key)) continue;
      const [cx, cy] = key.split(",").map(Number);
      const dist = Math.abs(cx - actorPos[0]) + Math.abs(cy - actorPos[1]);
      if (dist < bestDist) {
        bestDist = dist;
        best = key;
      }
    }
  }

  return best;
}

function findBestMove(
  from: [number, number],
  to: [number, number],
  self: number,
  allPos: [number, number][],
  inBounds: (c: number, r: number) => boolean,
  maxX: number,
  maxY: number,
): [number, number] | null {
  const [fx, fy] = from;
  const [tx, ty] = to;

  // Try moves in order of decreasing benefit
  const candidates: [number, number][] = [];
  const dx = tx - fx;
  const dy = ty - fy;

  // Prefer the axis with larger distance
  if (Math.abs(dx) >= Math.abs(dy)) {
    if (dx !== 0) candidates.push([fx + Math.sign(dx), fy]);
    if (dy !== 0) candidates.push([fx, fy + Math.sign(dy)]);
    if (dx !== 0 && dy !== 0) {
      candidates.push([fx, fy + Math.sign(dy)]);
    }
  } else {
    if (dy !== 0) candidates.push([fx, fy + Math.sign(dy)]);
    if (dx !== 0) candidates.push([fx + Math.sign(dx), fy]);
  }

  for (const [nx, ny] of candidates) {
    if (!inBounds(nx, ny)) continue;
    // Avoid collision with other actors
    let blocked = false;
    for (let j = 0; j < allPos.length; j++) {
      if (j === self) continue;
      if (allPos[j][0] === nx && allPos[j][1] === ny) {
        blocked = true;
        break;
      }
    }
    if (!blocked) return [nx, ny];
  }

  // Fallback: try any adjacent cell
  const dirs: [number, number][] = [[0, 1], [1, 0], [0, -1], [-1, 0]];
  for (const [ddx, ddy] of dirs) {
    const nx = fx + ddx;
    const ny = fy + ddy;
    if (!inBounds(nx, ny)) continue;
    let blocked = false;
    for (let j = 0; j < allPos.length; j++) {
      if (j === self) continue;
      if (allPos[j][0] === nx && allPos[j][1] === ny) {
        blocked = true;
        break;
      }
    }
    if (!blocked) return [nx, ny];
  }

  return null;
}
