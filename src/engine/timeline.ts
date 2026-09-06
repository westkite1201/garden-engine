import type { GridContext, PlanResult, SimulationResult, TimelineResult } from "./types.js";
import {
  ACTOR_CELL_TIME,
  ACTOR_FADE_IN,
  GROWTH_DELAY_AFTER_WATER,
  GROWTH_DURATION,
  BLOOM_WAVE_SPEED,
  BLOOM_POP_DURATION,
  ACTOR_FADE_OUT,
} from "../config/defaults.js";

export function buildTimeline(
  ctx: GridContext,
  plan: PlanResult,
  sim: SimulationResult,
): TimelineResult {
  const cellTime = ctx.theme.rules?.cellTime ?? ACTOR_CELL_TIME;
  const { actorCount, spawnTick } = plan;

  // Actor spawn times (absolute seconds)
  const actorSpawnAbsS = spawnTick.map((t) => t * cellTime);
  const actorFadeInEndAbsS = actorSpawnAbsS.map((s) => s + ACTOR_FADE_IN);
  const moveStartAbsS = actorFadeInEndAbsS.slice();

  // Growth events: when each cell starts growing
  const growthStartAbsS = new Map<string, number>();
  const growthLevel = new Map<string, number>();
  const wateringIntervals: TimelineResult["wateringIntervals"] = [];

  for (const evt of sim.growthEvents) {
    // Movement also starts after the fade-in; keep watering and growth in sync.
    const triggerAbsS = evt.triggerTick * cellTime + ACTOR_FADE_IN;
    wateringIntervals.push({
      cellKey: evt.cellKey,
      actorIndex: evt.actorIndex,
      startAbsS: evt.wateringStartTick * cellTime + ACTOR_FADE_IN,
      endAbsS: triggerAbsS,
    });
    growthStartAbsS.set(evt.cellKey, triggerAbsS + GROWTH_DELAY_AFTER_WATER);
    growthLevel.set(evt.cellKey, evt.toLevel);
  }

  // Find the latest growth event to compute bloom wave start
  let latestGrowthEnd = 0;
  for (const startS of growthStartAbsS.values()) {
    const endS = startS + GROWTH_DURATION;
    if (endS > latestGrowthEnd) latestGrowthEnd = endS;
  }

  // Bloom wave starts after all growth finishes + small buffer
  const bloomWaveStartAbsS = latestGrowthEnd + 0.5;
  const bloomWaveCenterCol = Math.floor(ctx.maxX / 2);
  const bloomWaveCenterRow = Math.floor(ctx.maxY / 2);

  // Compute max bloom wave distance
  let maxDist = 0;
  for (const [key] of growthStartAbsS) {
    const [x, y] = key.split(",").map(Number);
    const dist = Math.abs(x - bloomWaveCenterCol) + Math.abs(y - bloomWaveCenterRow);
    if (dist > maxDist) maxDist = dist;
  }

  // Actor exit: after bloom wave completes
  const bloomWaveEndS = bloomWaveStartAbsS + maxDist * BLOOM_WAVE_SPEED + BLOOM_POP_DURATION;
  const actorExitAbsS = Array.from({ length: actorCount }, (_, i) => {
    // Stagger exits slightly
    return bloomWaveEndS + 0.5 + i * 0.3;
  });

  const totalDurationS = Math.max(
    bloomWaveEndS + 1.0,
    ...actorExitAbsS.map((s) => s + ACTOR_FADE_OUT + 1.0),
  );

  return {
    actorSpawnAbsS,
    actorFadeInEndAbsS,
    moveStartAbsS,
    growthStartAbsS,
    growthLevel,
    wateringIntervals,
    bloomWaveStartAbsS,
    bloomWaveCenterCol,
    bloomWaveCenterRow,
    actorExitAbsS,
    totalDurationS,
  };
}
