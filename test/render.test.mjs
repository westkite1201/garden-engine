import assert from 'node:assert/strict';
import test from 'node:test';
import { buildActorLayer } from '../dist/svg/layers/actorLayer.js';
import { buildGrowthLayer } from '../dist/svg/layers/growthLayer.js';
import { buildEffectLayer } from '../dist/svg/layers/effectLayer.js';
import { springTheme } from '../dist/theme/spring.js';
import { ACTOR_FADE_IN, GROWTH_DELAY_AFTER_WATER } from '../dist/config/defaults.js';
import { makeGrid, randomGrid, runGarden } from './helpers.mjs';

test('watering pauses remain stationary in the generated linear animation', () => {
  const { ctx, timeline, sim } = runGarden(randomGrid(31));
  const { actorKeyframes } = buildActorLayer(ctx, timeline, sim);
  let holds = 0;
  for (let i = 0; i < sim.positionsHistory.length; i++) {
    const block = actorKeyframes.match(new RegExp(`@keyframes actor-move-${i} \\{([\\s\\S]*?)\\n  \\}`))[1];
    const frames = [...block.matchAll(/([\d.]+)% \{ transform: translate\(([-\d.]+)px, ([-\d.]+)px\); \}/g)]
      .map(m => ({ fraction: Number(m[1]) / 100, x: Number(m[2]), y: Number(m[3]) }));
    const duration = (sim.positionsHistory[i].length - 1) * ctx.theme.rules.cellTime;
    for (let j = 1; j < frames.length; j++) {
      const a = frames[j - 1], b = frames[j];
      const seconds = (b.fraction - a.fraction) * duration;
      if (a.x !== b.x || a.y !== b.y) {
        assert.ok(seconds <= ctx.theme.rules.cellTime + 0.0001, 'movement must not be interpolated across the watering pause');
      } else if (seconds > ctx.theme.rules.cellTime) {
        holds++;
      }
    }
  }
  assert.ok(holds > 0, 'the rendered routes must include watering pauses');
});

test('growth follows watering on the same clock as actor movement', () => {
  const { ctx, plan, timeline, sim } = runGarden(randomGrid(65));
  for (const event of sim.growthEvents) {
    const localTick = event.triggerTick - plan.spawnTick[event.actorIndex];
    const expected = timeline.moveStartAbsS[event.actorIndex] + localTick * ctx.theme.rules.cellTime + GROWTH_DELAY_AFTER_WATER;
    assert.ok(Math.abs(timeline.growthStartAbsS.get(event.cellKey) - expected) < 1e-9);
  }
  assert.equal(timeline.moveStartAbsS[0], ACTOR_FADE_IN);
});

test('bloom waves animate visible cell groups with independent plant appearance', () => {
  const { ctx, timeline, sim } = runGarden(makeGrid(i => i < 12 ? i + 1 : 0));
  const { growthRects } = buildGrowthLayer(ctx, timeline);
  assert.equal([...growthRects.matchAll(/<g [^>]*animation: bloom-pop/g)].length, sim.growthEvents.length);
  assert.match(growthRects, /<g [^>]*animation: bloom-pop[^>]*>\s*<rect[^>]*fill="#[a-f0-9]+"/);
  assert.match(growthRects, /<g [^>]*animation: plant-appear/);
  assert.doesNotMatch(growthRects, /<rect[^>]*fill="none"[^>]*animation: bloom-pop/);
});

test('actors face each horizontal departure and hold that direction through pauses and vertical flight', () => {
  const { ctx, timeline, sim } = runGarden(makeGrid(i => i === 0 ? 1 : 0));
  const route = [[2, 2], [2, 2], [1, 2], [1, 2], [1, 3], [2, 3], [2, 3], [1, 3]];
  const expectedDirections = [-1, -1, -1, -1, 1, 1, -1];
  for (const nativeFacing of ['left', 'right']) {
    const theme = { ...ctx.theme, actor: { ...ctx.theme.actor, facing: nativeFacing } };
    const { actorGroups, actorKeyframes } = buildActorLayer({ ...ctx, theme }, timeline, { ...sim, positionsHistory: [route] });
    const block = actorKeyframes.match(/@keyframes actor-facing-0 \{([\s\S]*?)\n  \}/)[1];
    const frames = [...block.matchAll(/([\d.]+)% \{ transform: scaleX\((-?1)\); \}/g)]
      .map(m => ({ fraction: Number(m[1]) / 100, direction: Number(m[2]) }));
    for (let t = 0; t < route.length - 1; t++) {
      const fraction = (t + 0.001) / (route.length - 1);
      const current = frames.filter(frame => frame.fraction <= fraction).at(-1);
      assert.equal(current.direction * (nativeFacing === 'right' ? 1 : -1), expectedDirections[t]);
    }
    assert.match(actorGroups, /class="actor-facing"[^>]*animation: actor-facing-0 [\d.]+s step-end/,
      'flips need discrete timing on a separate wrapper so travel is not mirrored');
  }
});

test('watering intervals cover a stationary visit and end just before growth for staggered actors', () => {
  const { ctx, plan, sim, timeline } = runGarden(randomGrid(65));
  assert.ok(plan.actorCount > 1);
  assert.equal(timeline.wateringIntervals.length, sim.growthEvents.length);
  for (const [index, event] of sim.growthEvents.entries()) {
    const interval = timeline.wateringIntervals[index];
    assert.equal(interval.cellKey, event.cellKey);
    assert.equal(interval.actorIndex, event.actorIndex);
    const firstTick = event.wateringStartTick - plan.spawnTick[event.actorIndex];
    const lastTick = event.triggerTick - plan.spawnTick[event.actorIndex];
    assert.ok(firstTick >= 0 && lastTick > firstTick);
    const history = sim.positionsHistory[event.actorIndex];
    for (let t = firstTick; t <= lastTick; t++) {
      assert.equal(history[t].join(','), event.cellKey, 'sparkles must not start before arrival or continue after departure');
    }
    const expectedStart = timeline.moveStartAbsS[event.actorIndex] + firstTick * ctx.theme.rules.cellTime;
    assert.ok(Math.abs(interval.startAbsS - expectedStart) < 1e-9);
    assert.ok(Math.abs(interval.endAbsS + GROWTH_DELAY_AFTER_WATER - timeline.growthStartAbsS.get(event.cellKey)) < 1e-9);
  }
});

test('each watered cell gets three glints confined to its watering interval, even at minimum dwell', () => {
  for (const dwellByLevel of [springTheme.rules.dwellByLevel, () => 0]) {
    const theme = { ...springTheme, rules: { ...springTheme.rules, dwellByLevel } };
    const { ctx, timeline } = runGarden(randomGrid(31), theme);
    const { effectGroups, effectKeyframes } = buildEffectLayer(ctx, timeline);
    const glints = [...effectGroups.matchAll(/animation: watering-sparkle ([\d.]+)s ease-out ([\d.]+)s both/g)];
    assert.equal(glints.length, timeline.wateringIntervals.length * 3);
    timeline.wateringIntervals.forEach((interval, i) => {
      for (const glint of glints.slice(i * 3, i * 3 + 3)) {
        const duration = Number(glint[1]), start = Number(glint[2]);
        assert.ok(duration > 0 && start >= interval.startAbsS - 0.00001);
        assert.ok(start + duration <= interval.endAbsS + 0.00001);
      }
    });
    assert.match(effectKeyframes, /0% \{ opacity: 0;/);
    assert.match(effectKeyframes, /100% \{ opacity: 0;/, 'sparkles must disappear at the end of their animation');
  }
});

test('empty gardens and themes without watering effects produce no glints', () => {
  const empty = runGarden(makeGrid(() => 0));
  assert.equal(buildEffectLayer(empty.ctx, empty.timeline).effectGroups, '');
  assert.equal(buildActorLayer(empty.ctx, empty.timeline, empty.sim).actorKeyframes, '');
  const theme = { ...springTheme, actor: { ...springTheme.actor, facing: undefined }, effects: { intro: 'none', outro: 'none' } };
  const plain = runGarden(makeGrid(() => 1), theme);
  assert.equal(buildEffectLayer(plain.ctx, plain.timeline).effectGroups, '');
  assert.doesNotMatch(buildActorLayer(plain.ctx, plain.timeline, plain.sim).actorKeyframes, /@keyframes actor-facing/);
});
