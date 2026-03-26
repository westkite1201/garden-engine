import { mapGrid, type GridCell } from "../grid/mapGrid.js";
import type { ContributionDay } from "../github/fetchGrid.js";
import { loadTheme } from "../theme/registry.js";
import { buildContext } from "../engine/context.js";
import { planTargets } from "../engine/planner.js";
import { simulateGarden } from "../engine/simulate.js";
import { buildTimeline } from "../engine/timeline.js";
import { buildSoilLayer } from "../svg/layers/soilLayer.js";
import { buildGrowthLayer } from "../svg/layers/growthLayer.js";
import { buildActorLayer } from "../svg/layers/actorLayer.js";
import { buildEffectLayer } from "../svg/layers/effectLayer.js";
import { buildBorderLayer } from "../svg/layers/borderLayer.js";
import { composeSvg } from "../svg/render/composeSvg.js";
import { writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { README_TARGET_WIDTH } from "../config/constants.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_PATH = join(__dirname, "..", "..", "assets", "garden.svg");

/** Generate fake contribution data resembling a real GitHub profile */
function generateDummyWeeks(): ContributionDay[][] {
  const weeks: ContributionDay[][] = [];
  const now = new Date();
  const oneYearAgo = new Date(now);
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

  // Seed for deterministic randomness
  let seed = 42;
  function rand() {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return (seed >> 16) / 32768;
  }

  const startDate = new Date(oneYearAgo);
  // Align to Sunday
  startDate.setDate(startDate.getDate() - startDate.getUTCDay());

  for (let w = 0; w < 53; w++) {
    const week: ContributionDay[] = [];
    for (let d = 0; d < 7; d++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + w * 7 + d);
      if (date > now) break;

      // Simulate realistic contribution patterns
      const dayOfWeek = date.getUTCDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const r = rand();

      let count = 0;
      if (isWeekend) {
        // Lower activity on weekends
        if (r > 0.6) count = Math.floor(rand() * 5) + 1;
      } else {
        // Weekdays: more active
        if (r > 0.25) {
          count = Math.floor(rand() * 12) + 1;
          // Occasional burst days
          if (rand() > 0.85) count += Math.floor(rand() * 15);
        }
      }

      // Create some streaks and gaps
      const weekPhase = Math.sin(w * 0.3) * 0.5 + 0.5;
      if (rand() > weekPhase) count = 0;

      week.push({
        date: date.toISOString().split("T")[0],
        count,
      });
    }
    if (week.length > 0) weeks.push(week);
  }

  return weeks;
}

const themeId = process.argv[2]?.replace("--theme=", "") ?? "spring";

console.log("Generating test SVG with dummy contribution data...");

const weeks = generateDummyWeeks();
const grid = mapGrid(weeks);
console.log(`Grid: ${grid.length} cells`);

const activeCells = grid.filter((c) => c.count > 0).length;
console.log(`Active cells (count > 0): ${activeCells}`);

const theme = loadTheme(themeId);
console.log(`Theme: ${theme.label}`);

const ctx = buildContext(grid, theme);
console.log(`Actors: ${ctx.actorCount}`);

const plan = planTargets(ctx);
console.log(`Water targets: ${plan.waterTargets.length}`);

const sim = simulateGarden(ctx, plan);
console.log(`Simulation: ${sim.maxTick} ticks, ${sim.growthEvents.length} growth events`);

const timeline = buildTimeline(ctx, plan, sim);
console.log(`Duration: ${timeline.totalDurationS.toFixed(1)}s`);
console.log(`Bloom wave at: ${timeline.bloomWaveStartAbsS.toFixed(1)}s`);

const borderRects = buildBorderLayer(ctx);
const soilRects = buildSoilLayer(ctx, timeline);
const { growthRects, growthKeyframes } = buildGrowthLayer(ctx, timeline);
const { actorGroups, actorKeyframes } = buildActorLayer(ctx, timeline, sim);
const { effectGroups, effectKeyframes } = buildEffectLayer(ctx, timeline);

const targetW = README_TARGET_WIDTH;
const displayWidth = targetW > 0 ? targetW : ctx.totalWidth;
const displayHeight = targetW > 0
  ? Math.round(ctx.totalHeight * (targetW / ctx.totalWidth))
  : ctx.totalHeight;

const svg = composeSvg({
  totalWidth: ctx.totalWidth,
  totalHeight: ctx.totalHeight,
  displayWidth,
  displayHeight,
  backgroundColor: theme.palette.bg,
  borderRects,
  soilRects,
  growthRects,
  growthKeyframes,
  actorGroups,
  actorKeyframes,
  effectGroups,
  effectKeyframes,
});

writeFileSync(OUT_PATH, svg, "utf-8");
const sizeKB = (Buffer.byteLength(svg, "utf-8") / 1024).toFixed(1);
console.log(`\nWrote ${OUT_PATH} (${sizeKB} KB)`);
console.log("Open in browser to see the animation!");
