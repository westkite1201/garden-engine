import assert from 'node:assert/strict';
import { buildContext } from '../dist/engine/context.js';
import { planTargets } from '../dist/engine/planner.js';
import { simulateGarden } from '../dist/engine/simulate.js';
import { buildTimeline } from '../dist/engine/timeline.js';
import { springTheme } from '../dist/theme/spring.js';

export function makeGrid(countAt, length = 365) {
  return Array.from({ length }, (_, i) => ({ x: Math.floor(i / 7), y: i % 7, date: '', count: countAt(i) }));
}

export function randomGrid(seed, length = 365) {
  let state = seed;
  const rand = () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 2 ** 32;
  };
  return makeGrid(() => rand() < 0.4 ? Math.floor(rand() * 20) + 1 : 0, length);
}

export function runGarden(grid, theme = springTheme) {
  const ctx = buildContext(grid, theme);
  const plan = planTargets(ctx);
  const sim = simulateGarden(ctx, plan);
  const timeline = buildTimeline(ctx, plan, sim);
  return { ctx, plan, sim, timeline };
}

export function assertComplete({ ctx, plan, sim, timeline }) {
  const expected = ctx.grid.filter(c => c.count > 0).map(c => `${c.x},${c.y}`).sort();
  const actual = sim.growthEvents.map(e => e.cellKey).sort();
  assert.deepEqual(actual, expected, 'every active cell must grow exactly once');
  assert.ok(sim.maxTick < 20000, 'simulation must finish without exhausting its budget');
  assert.equal(new Set(plan.spawnPositions.map(p => p.join(','))).size, plan.actorCount);
  for (const event of sim.growthEvents) {
    const position = sim.positionsHistory[event.actorIndex][event.triggerTick - plan.spawnTick[event.actorIndex]];
    assert.equal(position.join(','), event.cellKey, 'a bee must be on the flower when watering finishes');
  }
  for (const [i, history] of sim.positionsHistory.entries()) {
    assert.ok(sim.growthEvents.some(event => event.actorIndex === i), 'each planned bee must get a flower');
    for (let tick = 0; tick < history.length; tick++) {
      const [x, y] = history[tick];
      assert.ok(ctx.inBounds(x, y), 'flight must stay within the garden');
      if (tick > 0) {
        const previous = history[tick - 1];
        assert.ok(Math.abs(x - previous[0]) + Math.abs(y - previous[1]) <= 1, 'a bee cannot teleport');
      }
    }
    const end = timeline.moveStartAbsS[i] + (history.length - 1) * (ctx.theme.rules?.cellTime ?? 0.8);
    assert.ok(end < timeline.actorExitAbsS[i], 'bees must finish their routes before fading out');
  }
}
