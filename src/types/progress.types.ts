export type MapId = 'forest' | 'flower' | 'ocean' | 'sky';

export interface Config {
  multTableTimeSec: number;
  multTableGradSessions: number;
  multTablePerSession: number;
  mentalPerSession: number;
  bigNumSessionMin: number;
  comboThreshold1: number;
  comboThreshold2: number;
  sessionsPerMap: number;
}

export interface AppState {
  currentMap: MapId;
  sessionsCompleted: number;
  streak: number;
  lastStudyDate: string | null;
  mentalLevel: 0 | 1;
  multLevel: 0 | 1;
  completedMaps: MapId[];
}

export interface MultTableEntry {
  errors: number;
  slowCount: number;
  lastSeen: string;
  gradSessionCount: number;
}

export interface MultTableData {
  graduated: [number, number][];
  weak: Record<string, MultTableEntry>;
}

export interface SessionSeeds {
  normal: number;
  rare: number;
  special: number;
}

export interface ProblemLog {
  type: 'mult' | 'mental' | 'multiply' | 'divide';
  problem: string;   // e.g. "7×8", "43+28", "234×3", "693÷3"
  correct: boolean;
  timeSec?: number;
}

export interface SessionRecord {
  date: string;
  seeds: SessionSeeds;
  maxCombo: number;
  multTable: { correct: number; total: number; avgTimeSec: number };
  mental: { correct: number; total: number };
  bigNum: { boxesCompleted: number; questionsCompleted: number };
  logs: ProblemLog[];
}

export type AnimalId = 'cat' | 'dog' | 'rabbit' | 'frog' | 'penguin' | 'duck' | 'fox' | 'bear';
export type PlantId = 'bush' | 'flower_r' | 'flower_p' | 'flower_y' | 'tree_oak' | 'tree_palm' | 'tree_pine';
export type DecoId = 'mushroom' | 'stone' | 'fence';

export interface GardenCell {
  type: 'plant' | 'animal' | 'deco';
  itemId: string;
  plantedAt?: number; // ms timestamp, plants only
}

export interface GardenData {
  zones: Record<MapId, (GardenCell | null)[]>; // 16 cells per zone (4×4)
  spentSeeds: { normal: number; rare: number; special: number };
  lastVisit: string | null;
}

export interface AppData {
  config: Config;
  state: AppState;
  multTable: MultTableData;
  sessions: SessionRecord[];
  garden: GardenData;
}
