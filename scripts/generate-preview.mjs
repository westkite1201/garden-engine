import { writeFileSync } from 'node:fs';
import { buildContext } from '../dist/engine/context.js';
import { planTargets } from '../dist/engine/planner.js';
import { simulateGarden } from '../dist/engine/simulate.js';
import { buildTimeline } from '../dist/engine/timeline.js';
import { springTheme } from '../dist/theme/spring.js';
import { cellHash } from '../dist/svg/sprites/plants.js';
import { buildSoilLayer } from '../dist/svg/layers/soilLayer.js';
import { buildGrowthLayer } from '../dist/svg/layers/growthLayer.js';
import { buildBorderLayer } from '../dist/svg/layers/borderLayer.js';
import { composeSvg } from '../dist/svg/render/composeSvg.js';

// A deterministic close-up sample; this is not a user's contribution calendar.
const grid = Array.from({ length: 28 * 7 }, (_, i) => {
  const x = Math.floor(i / 7), y = i % 7;
  const hash = cellHash(x, y);
  return { x, y, date: '', count: hash % 5 === 0 ? 0 : 1 + hash % 18 };
});
const ctx = buildContext(grid, springTheme);
const plan = planTargets(ctx);
const timeline = buildTimeline(ctx, plan, simulateGarden(ctx, plan));
const svg = composeSvg({
  totalWidth: ctx.totalWidth, totalHeight: ctx.totalHeight,
  displayWidth: 800, displayHeight: Math.round(800 * ctx.totalHeight / ctx.totalWidth),
  backgroundColor: springTheme.palette.bg,
  borderRects: buildBorderLayer(ctx), soilRects: buildSoilLayer(ctx),
  ...buildGrowthLayer(ctx, timeline),
  actorGroups: '', actorKeyframes: '', effectGroups: '', effectKeyframes: '',
}).replace('<defs>', '<defs><style>* { animation-delay: -1000s !important; }</style>')
  .replace(/[ \t]+$/gm, '');
writeFileSync(new URL('../assets/preview.svg', import.meta.url), svg);
console.log('Wrote assets/preview.svg (sample garden close-up)');
