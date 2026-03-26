import type { GridContext, TimelineResult, SimulationResult } from "../../engine/types.js";
import { CELL_SIZE, GAP } from "../../config/constants.js";
import { ACTOR_CELL_TIME, ACTOR_FADE_IN, ACTOR_FADE_OUT } from "../../config/defaults.js";

/**
 * Actor animation layer: gardener walking through the grid.
 * Renders as a clean, small character that moves cell-by-cell.
 */
export function buildActorLayer(
  ctx: GridContext,
  timeline: TimelineResult,
  sim: SimulationResult,
): { actorGroups: string; actorKeyframes: string } {
  const { gridLeftX, gridTopY, theme } = ctx;
  const cellTime = theme.rules?.cellTime ?? ACTOR_CELL_TIME;
  const totalDur = timeline.totalDurationS;

  const groups: string[] = [];
  const keyframes: string[] = [];

  for (let i = 0; i < sim.positionsHistory.length; i++) {
    const positions = sim.positionsHistory[i];
    if (!positions || positions.length === 0) continue;

    const spawnS = timeline.actorSpawnAbsS[i];
    const exitS = timeline.actorExitAbsS[i];

    // Position keyframes: deduplicate consecutive same positions
    const kfName = `actor-move-${i}`;
    const moveStart = timeline.moveStartAbsS[i];
    const moveDuration = (positions.length - 1) * cellTime;
    if (moveDuration <= 0) continue;

    const steps: string[] = [];
    let lastPx = -1, lastPy = -1;
    for (let t = 0; t < positions.length; t++) {
      const [col, row] = positions[t];
      const px = gridLeftX + col * (CELL_SIZE + GAP) + CELL_SIZE / 2;
      const py = gridTopY + row * (CELL_SIZE + GAP) + CELL_SIZE / 2;

      // Only emit keyframe when position changes or at start/end
      if (t === 0 || t === positions.length - 1 || px !== lastPx || py !== lastPy) {
        const pct = positions.length > 1
          ? ((t / (positions.length - 1)) * 100).toFixed(2)
          : "0";
        steps.push(`${pct}% { transform: translate(${px}px, ${py}px); }`);
        lastPx = px;
        lastPy = py;
      }
    }

    keyframes.push(`@keyframes ${kfName} {
    ${steps.join("\n    ")}
  }`);

    // Fade in/out
    const fadeKfName = `actor-fade-${i}`;
    const s = (v: number) => totalDur > 0 ? (v / totalDur * 100).toFixed(2) : "0";

    keyframes.push(`@keyframes ${fadeKfName} {
    0% { opacity: 0; }
    ${s(spawnS)}% { opacity: 0; }
    ${s(spawnS + ACTOR_FADE_IN)}% { opacity: 1; }
    ${s(exitS)}% { opacity: 1; }
    ${s(Math.min(totalDur, exitS + ACTOR_FADE_OUT))}% { opacity: 0; }
    100% { opacity: 0; }
  }`);

    // Render actor as inline SVG at grid scale
    const actor = theme.actor;
    const scale = actor.widthPx / actor.viewBoxW;
    const halfW = (actor.viewBoxW * scale) / 2;
    const halfH = (actor.viewBoxH * scale) / 2;

    groups.push(
      `<g style="animation: ${kfName} ${moveDuration.toFixed(2)}s linear ${moveStart.toFixed(2)}s both, ${fadeKfName} ${totalDur.toFixed(2)}s linear 0s both;">
      <g transform="translate(${-halfW.toFixed(1)}, ${-halfH.toFixed(1)}) scale(${scale.toFixed(3)})">
        <svg viewBox="0 0 ${actor.viewBoxW} ${actor.viewBoxH}" width="${actor.viewBoxW}" height="${actor.viewBoxH}" overflow="visible">
          ${actor.svg}
        </svg>
      </g>
    </g>`,
    );
  }

  return {
    actorGroups: groups.join("\n  "),
    actorKeyframes: keyframes.join("\n  "),
  };
}
