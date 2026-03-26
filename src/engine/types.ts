import type { GridCell } from "../grid/mapGrid.js";
import type { ThemePack } from "../theme/types.js";

export type GridContext = {
  grid: GridCell[];
  maxX: number;
  maxY: number;
  gridLeftX: number;
  gridTopY: number;
  totalWidth: number;
  totalHeight: number;
  byKey: Map<string, GridCell>;
  initialCountByKey: Map<string, number>;
  actorCount: number;
  inBounds: (col: number, row: number) => boolean;
  dirs4: [number, number][];
  keyOf: (c: number, r: number) => string;
  quartiles: number[];
  theme: ThemePack;
};

export type ActorState = {
  pos: [number, number];
  targetCellKey: string | null;
  wateringUntil: number;
  stuck: number;
  visited: Set<string>;
};

export type GrowthEvent = {
  cellKey: string;
  toLevel: number;
  triggerTick: number;
  actorIndex: number;
};

export type PlanResult = {
  actorCount: number;
  spawnPositions: [number, number][];
  waterTargets: string[];
  actorStates: ActorState[];
  spawnTick: number[];
};

export type SimulationResult = {
  positionsHistory: [number, number][][];
  growthEvents: GrowthEvent[];
  maxTick: number;
};

export type TimelineResult = {
  actorSpawnAbsS: number[];
  actorFadeInEndAbsS: number[];
  moveStartAbsS: number[];
  growthStartAbsS: Map<string, number>;
  growthLevel: Map<string, number>;
  bloomWaveStartAbsS: number;
  bloomWaveCenterCol: number;
  bloomWaveCenterRow: number;
  actorExitAbsS: number[];
  totalDurationS: number;
};
