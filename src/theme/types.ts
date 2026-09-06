export type Palette = {
  bg: string;
  soil: string;
  level1: string;
  level2: string;
  level3: string;
  level4: string;
  accent: string;
};

export type TileSet = {
  empty: string;
  lv1: string;
  lv2: string;
  lv3: string;
  lv4: string;
  rare?: string;
};

export type ActorKind = "gardener" | "fairy" | "bee" | "robot";

export type ActorDef = {
  kind: ActorKind;
  svg: string;
  widthPx: number;
  viewBoxW: number;
  viewBoxH: number;
  /** Native sprite direction; when set, mirror to follow horizontal travel. */
  facing?: "left" | "right";
  /** Sprite animation styles, included once per garden. */
  css?: string;
};

export type IntroEffect = "sunrise" | "sparkle" | "watering" | "none";
export type OutroEffect = "full-bloom" | "petal-wave" | "fireflies" | "none";

export type EffectDef = {
  intro: IntroEffect;
  outro: OutroEffect;
  watering?: "sparkle";
};

export type ThemeRules = {
  dwellByLevel?: (level: number) => number;
  actorCount?: (activeCells: number, totalContributions: number) => number;
  cellTime?: number;
};

export type ThemePack = {
  id: string;
  label: string;
  palette: Palette;
  tiles: TileSet;
  actor: ActorDef;
  effects: EffectDef;
  rules?: ThemeRules;
};
