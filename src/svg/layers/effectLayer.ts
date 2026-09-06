import type { GridContext, TimelineResult } from "../../engine/types.js";
import { CELL_SIZE, GAP } from "../../config/constants.js";

/**
 * Effect layer: intro overlay and small glints during watering.
 */
export function buildEffectLayer(
  ctx: GridContext,
  timeline: TimelineResult,
): { effectGroups: string; effectKeyframes: string } {
  const { totalWidth, totalHeight, theme } = ctx;
  const totalDur = timeline.totalDurationS;
  const intro = theme.effects.intro;

  const groups: string[] = [];
  const keyframes: string[] = [];

  if (theme.effects.watering === "sparkle" && timeline.wateringIntervals.length > 0) {
    keyframes.push(`@keyframes watering-sparkle {
    0% { opacity: 0; transform: translateY(0.6px) scale(0.5); }
    35% { opacity: 0.85; }
    100% { opacity: 0; transform: translateY(-2px) scale(0.85); }
  }`);

    const particles = [
      { x: -4, y: 3, size: 0.8, color: "#fff3b0" },
      { x: 4, y: 3.5, size: 0.65, color: theme.palette.accent },
      { x: 0, y: 4.5, size: 0.75, color: "#fff3b0" },
    ];
    for (const interval of timeline.wateringIntervals) {
      const [col, row] = interval.cellKey.split(",").map(Number);
      const cx = ctx.gridLeftX + col * (CELL_SIZE + GAP) + CELL_SIZE / 2;
      const cy = ctx.gridTopY + row * (CELL_SIZE + GAP) + CELL_SIZE / 2;
      const dwell = interval.endAbsS - interval.startAbsS;
      const duration = (dwell * 0.5).toFixed(5);
      const sparkles = particles.map((particle, index) => {
        // All three glints finish before watering ends, including short dwells.
        const delay = (interval.startAbsS + dwell * (0.06 + index * 0.18)).toFixed(5);
        return `<g transform="translate(${particle.x}, ${particle.y}) scale(${particle.size})">
        <path class="watering-sparkle" d="M-0.35-1H0.35V-0.35H1V0.35H0.35V1H-0.35V0.35H-1V-0.35H-0.35Z" fill="${particle.color}" opacity="0" style="animation: watering-sparkle ${duration}s ease-out ${delay}s both;"/>
      </g>`;
      }).join("\n      ");
      groups.push(`<g class="watering-sparkles" data-cell="${interval.cellKey}" data-actor="${interval.actorIndex}" transform="translate(${cx}, ${cy})" pointer-events="none">
      ${sparkles}
    </g>`);
    }
  }

  // Intro effect: sunrise gradient overlay
  if (intro === "sunrise") {
    keyframes.push(`@keyframes sunrise-fade {
    0% { opacity: 0.6; }
    15% { opacity: 0; }
    100% { opacity: 0; }
  }`);

    groups.push(
      `<defs>
      <linearGradient id="sunrise-grad" x1="0" y1="1" x2="0" y2="0">
        <stop offset="0%" stop-color="#ff6b35" stop-opacity="0.4"/>
        <stop offset="40%" stop-color="#ffc947" stop-opacity="0.2"/>
        <stop offset="100%" stop-color="${theme.palette.bg}" stop-opacity="0"/>
      </linearGradient>
    </defs>
    <rect x="0" y="0" width="${totalWidth}" height="${totalHeight}" fill="url(#sunrise-grad)" style="animation: sunrise-fade ${totalDur}s linear 0s both; pointer-events: none;"/>`,
    );
  }

  return {
    effectGroups: groups.join("\n  "),
    effectKeyframes: keyframes.join("\n  "),
  };
}
