import type { ContributionDay } from "../github/fetchGrid.js";

export type GridCell = {
  x: number;
  y: number;
  count: number;
  date: string;
};

function dayOfWeek(dateStr: string): number {
  const d = new Date(dateStr + "T00:00:00Z");
  return d.getUTCDay();
}

export function mapGrid(weeks: ContributionDay[][]): GridCell[] {
  if (!Array.isArray(weeks) || weeks.length === 0) {
    return [];
  }
  const byKey = new Map<string, GridCell>();
  let maxX = -1;
  let lastWeekMaxY = -1;

  for (let x = 0; x < weeks.length; x++) {
    const week = weeks[x];
    for (const day of week) {
      const y = dayOfWeek(day.date);
      if (!Number.isFinite(y)) {
        throw new Error(`Invalid contribution date: ${day.date}`);
      }
      if (x > maxX) {
        maxX = x;
        lastWeekMaxY = y;
      } else {
        lastWeekMaxY = Math.max(lastWeekMaxY, y);
      }
      byKey.set(`${x},${y}`, { x, y, count: day.count, date: day.date });
    }
  }

  const cells: GridCell[] = [];

  for (let x = 0; x <= maxX; x++) {
    const isLastWeek = x === maxX;
    const maxY = isLastWeek ? lastWeekMaxY : 6;

    for (let y = 0; y <= maxY; y++) {
      const key = `${x},${y}`;
      cells.push(byKey.get(key) ?? { x, y, count: 0, date: "" });
    }
  }
  return cells;
}
