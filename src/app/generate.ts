import "dotenv/config";
import { fetchContributionGrid } from "../github/fetchGrid.js";
import { mapGrid } from "../grid/mapGrid.js";
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

export async function generate(themeId: string): Promise<void> {
  const username = process.env.GITHUB_USERNAME?.trim() || undefined;
  console.log(`Fetching contribution data${username ? ` for ${username}` : ""}...`);

  const weeks = await fetchContributionGrid(username);
  const grid = mapGrid(weeks);
  console.log(`Grid: ${grid.length} cells`);

  if (grid.length === 0) {
    writeFileSync(OUT_PATH, `<svg xmlns="http://www.w3.org/2000/svg" width="0" height="0"/>`, "utf-8");
    console.log("Empty grid, wrote empty SVG.");
    return;
  }

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
  console.log(`Wrote ${OUT_PATH} (${sizeKB} KB)`);
}
