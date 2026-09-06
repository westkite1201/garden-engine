import type { GridContext, PlanResult, SimulationResult, GrowthEvent } from "./types.js";
import { ACTOR_CELL_TIME, WATER_DWELL_BASE, WATER_DWELL_PER_LEVEL } from "../config/defaults.js";
import { getContributionLevel } from "../grid/contribution.js";
import { findNearestUnwatered } from "./planner.js";

/**
 * Bees reserve distinct flowers, then fly along shortest Manhattan paths.
 * Flight paths may cross: a resting or waiting bee must not block another bee.
 * Only flower reservations are exclusive, so every active cell is watered once.
 */
export function simulateGarden(
  ctx: GridContext,
  plan: PlanResult,
): SimulationResult {
  const { maxX, quartiles, initialCountByKey, theme } = ctx;
  const { actorCount, spawnTick, waterTargets } = plan;
  const MAX_TICKS = 20000;
  const dwellFn = theme.rules?.dwellByLevel
    ?? ((level: number) => WATER_DWELL_BASE + level * WATER_DWELL_PER_LEVEL);
  const cellTime = theme.rules?.cellTime ?? ACTOR_CELL_TIME;
  if (!Number.isFinite(cellTime) || cellTime <= 0) {
    throw new Error("Theme cellTime must be a positive finite number");
  }
  const dwellTicksByLevel = (level: number) => {
    const seconds = dwellFn(level);
    if (!Number.isFinite(seconds) || seconds < 0) {
      throw new Error("Theme dwellByLevel must return a non-negative finite number");
    }
    return Math.max(1, Math.ceil(seconds / cellTime));
  };

  const positions = plan.actorStates.map((state) => [...state.pos] as [number, number]);
  const targets = plan.actorStates.map((state) => state.targetCellKey);
  // Reserve starting flowers before any bee spawns, including staggered arrivals.
  const reserved = new Set(targets.filter((key): key is string => key !== null));
  const watered = new Set<string>();
  const wateringStart = new Array<number>(actorCount).fill(-1);
  const wateringUntil = new Array<number>(actorCount).fill(-1);
  const finished = new Array<boolean>(actorCount).fill(false);
  const positionsHistory: [number, number][][] = Array.from({ length: actorCount }, () => []);
  const growthEvents: GrowthEvent[] = [];

  let tick = 0;
  for (; tick < MAX_TICKS; tick++) {
    for (let i = 0; i < actorCount; i++) {
      if (finished[i] || tick < spawnTick[i]) continue;
      positionsHistory[i].push([...positions[i]]);

      if (wateringUntil[i] >= 0) {
        if (tick < wateringUntil[i]) continue;
        const cellKey = targets[i]!;
        watered.add(cellKey);
        growthEvents.push({
          cellKey,
          toLevel: getContributionLevel(initialCountByKey.get(cellKey) ?? 0, quartiles),
          wateringStartTick: wateringStart[i],
          triggerTick: tick,
          actorIndex: i,
        });
        targets[i] = null;
        wateringUntil[i] = -1;
      }

      if (targets[i] === null) {
        targets[i] = findNearestUnwatered(positions[i], reserved, waterTargets, i, actorCount, maxX);
        if (targets[i] === null) {
          finished[i] = true;
          continue;
        }
        reserved.add(targets[i]!);
      }

      const [tx, ty] = targets[i]!.split(",").map(Number);
      const [x, y] = positions[i];
      if (x === tx && y === ty) {
        const level = getContributionLevel(initialCountByKey.get(targets[i]!) ?? 0, quartiles);
        wateringStart[i] = tick;
        wateringUntil[i] = tick + dwellTicksByLevel(level);
      } else if (Math.abs(tx - x) >= Math.abs(ty - y)) {
        positions[i] = [x + Math.sign(tx - x), y];
      } else {
        positions[i] = [x, y + Math.sign(ty - y)];
      }
    }
    if (finished.every(Boolean)) break;
  }

  if (watered.size !== waterTargets.length) {
    throw new Error(`Garden simulation incomplete after ${tick} ticks: watered ${watered.size}/${waterTargets.length} cells`);
  }
  return { positionsHistory, growthEvents, maxTick: tick };
}
