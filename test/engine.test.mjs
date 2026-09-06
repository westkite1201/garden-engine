import assert from 'node:assert/strict';
import test from 'node:test';
import { buildContext } from '../dist/engine/context.js';
import { planTargets } from '../dist/engine/planner.js';
import { simulateGarden } from '../dist/engine/simulate.js';
import { springTheme } from '../dist/theme/spring.js';
import { makeGrid, randomGrid, runGarden, assertComplete } from './helpers.mjs';

function activityGrid(activeDays, total) {
  return makeGrid(i => i === 0 && activeDays > 0 ? total - activeDays + 1 : i < activeDays ? 1 : 0);
}

for (const [total, expected] of [[12, 1], [99, 1], [100, 2], [299, 2], [300, 3], [599, 3], [600, 4], [999, 4], [1000, 6], [1999, 6], [2000, 8], [3999, 8], [4000, 12]]) {
  test(`${total} contributions across 12 days assigns ${expected} bees`, () => {
    assert.equal(buildContext(activityGrid(12, total), springTheme).actorCount, expected);
  });
}

test('bee count accounts for workload, empty gardens, and available flowers', () => {
  for (const [days, total, expected] of [[0, 0, 0], [1, 10000, 1], [2, 10000, 2], [30, 30, 1], [31, 31, 2], [61, 61, 3], [365, 365, 12]]) {
    const ctx = buildContext(activityGrid(days, total), springTheme);
    assert.equal(ctx.actorCount, expected);
    assert.equal(ctx.activeCells, days);
    assert.equal(ctx.totalContributions, total);
  }
});

test('zero, one, sparse, and fully active gardens complete', () => {
  for (const grid of [makeGrid(() => 0), makeGrid(i => i === 364 ? 1 : 0), makeGrid(i => i % 13 === 0 ? 5 : 0), makeGrid(() => 10)]) {
    assertComplete(runGarden(grid));
  }
});

test('the original three-bee failure patterns all complete (200 seeds)', () => {
  const theme = { ...springTheme, rules: { ...springTheme.rules, actorCount: () => 3 } };
  for (let seed = 1; seed <= 200; seed++) {
    assertComplete(runGarden(randomGrid(seed), theme));
  }
});

test('adaptive swarms complete on full and partial final weeks (200 seeds)', () => {
  for (let seed = 1; seed <= 200; seed++) {
    assertComplete(runGarden(randomGrid(seed, 365 + seed % 7)));
  }
});

test('twelve bees can serve a compact cluster without blocked routes or duplicate flowers', () => {
  assertComplete(runGarden(activityGrid(12, 5000)));
});

test('a narrow garden and reserved starting flowers support every bee', () => {
  const grid = Array.from({ length: 12 }, (_, x) => ({ x, y: 0, count: 500, date: '' }));
  assertComplete(runGarden(grid));
});

test('the same input produces the same routes and events', () => {
  assert.deepEqual(runGarden(randomGrid(31)).sim, runGarden(randomGrid(31)).sim);
});

test('an incomplete simulation fails instead of emitting a partial garden', () => {
  const theme = { ...springTheme, rules: { ...springTheme.rules, dwellByLevel: () => 100000 } };
  const ctx = buildContext(makeGrid(i => i === 0 ? 1 : 0), theme);
  assert.throws(() => simulateGarden(ctx, planTargets(ctx)), /simulation incomplete.*watered 0\/1/);
});
