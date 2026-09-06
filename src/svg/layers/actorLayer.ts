import type { GridContext, TimelineResult, SimulationResult } from "../../engine/types.js";
import { CELL_SIZE, GAP } from "../../config/constants.js";
import { ACTOR_CELL_TIME, ACTOR_FADE_IN, ACTOR_FADE_OUT } from "../../config/defaults.js";

/**
 * Actor animation layer: separate travel, facing, and sprite animations.
 */
export function buildActorLayer(
  ctx: GridContext,
  timeline: TimelineResult,
  sim: SimulationResult,
): { actorGroups: string; actorKeyframes: string } {
  const { gridLeftX, gridTopY, theme } = ctx;
  const actor = theme.actor;
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
    for (let t = 0; t < positions.length; t++) {
      const [col, row] = positions[t];
      const px = gridLeftX + col * (CELL_SIZE + GAP) + CELL_SIZE / 2;
      const py = gridTopY + row * (CELL_SIZE + GAP) + CELL_SIZE / 2;

      // Keep both ends of a hold, otherwise linear interpolation turns watering
      // into a slow drift toward the next cell.
      const previous = positions[t - 1];
      const next = positions[t + 1];
      if (!previous || !next
        || col !== previous[0] || row !== previous[1]
        || col !== next[0] || row !== next[1]) {
        const pct = positions.length > 1
          ? ((t / (positions.length - 1)) * 100).toFixed(5)
          : "0";
        steps.push(`${pct}% { transform: translate(${px}px, ${py}px); }`);
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
    const scale = actor.widthPx / actor.viewBoxW;
    const halfW = (actor.viewBoxW * scale) / 2;
    const halfH = (actor.viewBoxH * scale) / 2;

    let facingStyle = "";
    if (actor.facing) {
      const nativeDirection = actor.facing === "right" ? 1 : -1;
      const firstHorizontal = positions.findIndex((pos, t) => positions[t + 1]
        && positions[t + 1][0] !== pos[0]);
      let direction = firstHorizontal < 0 ? nativeDirection
        : Math.sign(positions[firstHorizontal + 1][0] - positions[firstHorizontal][0]);
      const facingSteps = [`0% { transform: scaleX(${direction * nativeDirection}); }`];
      for (let t = 0; t < positions.length - 1; t++) {
        const dx = positions[t + 1][0] - positions[t][0];
        // Turn at departure; vertical flight and watering retain the last facing.
        if (dx === 0 || Math.sign(dx) === direction) continue;
        direction = Math.sign(dx);
        const pct = (t / (positions.length - 1) * 100).toFixed(5);
        facingSteps.push(`${pct}% { transform: scaleX(${direction * nativeDirection}); }`);
      }
      facingSteps.push(`100% { transform: scaleX(${direction * nativeDirection}); }`);
      const facingKfName = `actor-facing-${i}`;
      keyframes.push(`@keyframes ${facingKfName} {
    ${facingSteps.join("\n    ")}
  }`);
      facingStyle = ` style="transform-origin: 0px 0px; animation: ${facingKfName} ${moveDuration.toFixed(2)}s step-end ${moveStart.toFixed(2)}s both;"`;
    }

    groups.push(
      `<g style="--wing-phase: ${(-i * 0.047).toFixed(3)}s; animation: ${kfName} ${moveDuration.toFixed(2)}s linear ${moveStart.toFixed(2)}s both, ${fadeKfName} ${totalDur.toFixed(2)}s linear 0s both;">
      <g class="actor-facing"${facingStyle}>
        <g transform="translate(${-halfW.toFixed(1)}, ${-halfH.toFixed(1)}) scale(${scale.toFixed(3)})">
          <svg viewBox="0 0 ${actor.viewBoxW} ${actor.viewBoxH}" width="${actor.viewBoxW}" height="${actor.viewBoxH}" overflow="visible">
            ${actor.svg}
          </svg>
        </g>
      </g>
    </g>`,
    );
  }

  return {
    actorGroups: groups.join("\n  "),
    actorKeyframes: [groups.length > 0 ? actor.css : "", ...keyframes].filter(Boolean).join("\n  "),
  };
}
