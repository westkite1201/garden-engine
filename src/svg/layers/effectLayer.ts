import type { GridContext, TimelineResult } from "../../engine/types.js";

/**
 * Effect layer: intro (sunrise) and outro (bloom wave glow).
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
