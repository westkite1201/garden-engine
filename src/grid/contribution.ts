import type { Palette } from "../theme/types.js";

export function getContributionLevel(
  count: number,
  quartiles: number[],
): number {
  if (count === 0) return 0;
  if (!quartiles || quartiles.length < 3) return 1;
  if (count < quartiles[0]) return 1;
  if (count < quartiles[1]) return 2;
  if (count < quartiles[2]) return 3;
  return 4;
}

export function getColor(level: number, palette: Palette): string {
  switch (level) {
    case 0:
      return palette.soil;
    case 1:
      return palette.level1;
    case 2:
      return palette.level2;
    case 3:
      return palette.level3;
    case 4:
      return palette.level4;
    default:
      return palette.soil;
  }
}

export function calculateQuartiles(counts: number[]): number[] {
  const nonZero = counts.filter((c) => c > 0).sort((a, b) => a - b);
  if (nonZero.length === 0) return [0, 0, 0];

  const q1 = nonZero[Math.floor(nonZero.length * 0.25)] || 1;
  const q2 = nonZero[Math.floor(nonZero.length * 0.5)] || 1;
  const q3 = nonZero[Math.floor(nonZero.length * 0.75)] || 1;

  return [q1, q2, q3];
}
