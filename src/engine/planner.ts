import type { GridContext, PlanResult, ActorState } from "./types.js";

/**
 * Plan watering targets and actor assignments.
 * Give each bee a distinct starting flower, spread across the active garden.
 */
export function planTargets(ctx: GridContext): PlanResult {
  const { grid, actorCount, keyOf } = ctx;

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
  const waterTargets = grid.filter((cell) => cell.count > 0)
    .sort((a, b) => a.x - b.x || a.y - b.y)
    .map((cell) => keyOf(cell.x, cell.y));

  const startingTargets = Array.from({ length: actorCount }, (_, i) =>
    waterTargets[Math.floor(i * waterTargets.length / actorCount)],
  );
  const spawnPositions = startingTargets.map((key) => key.split(",").map(Number) as [number, number]);
  const actorStates: ActorState[] = [];

  for (let i = 0; i < actorCount; i++) {
    actorStates.push({
      pos: spawnPositions[i],
      targetCellKey: startingTargets[i],
      wateringUntil: -1,
      stuck: 0,
      visited: new Set(),
    });
  }

  // A short stagger keeps a large swarm from spending most of the loop spawning.
  const spawnTick: number[] = [];
  for (let i = 0; i < actorCount; i++) {
    spawnTick.push(i * 2);
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
