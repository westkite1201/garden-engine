import assert from 'node:assert/strict';
import test from 'node:test';
import { mapGrid } from '../dist/grid/mapGrid.js';

test('historical final-week contributions are independent of the current weekday', () => {
  const grid = mapGrid([[{ date: '2026-08-30', count: 1 }, { date: '2026-09-05', count: 7 }]]);
  assert.equal(grid.length, 7);
  assert.deepEqual(grid[6], { x: 0, y: 6, count: 7, date: '2026-09-05' });
});

test('partial weeks stop at the last supplied day, even with unsorted input', () => {
  const grid = mapGrid([[{ date: '2026-09-08', count: 3 }, { date: '2026-09-06', count: 1 }]]);
  assert.equal(grid.length, 3);
  assert.equal(grid[2].count, 3);
});

test('empty API weeks cannot create phantom garden cells', () => {
  assert.deepEqual(mapGrid([]), []);
  assert.deepEqual(mapGrid([[]]), []);
  assert.equal(mapGrid([[{ date: '2026-09-06', count: 1 }], []]).length, 1);
});

test('invalid dates fail explicitly', () => {
  assert.throws(() => mapGrid([[{ date: 'not-a-date', count: 1 }]]), /Invalid contribution date/);
});
