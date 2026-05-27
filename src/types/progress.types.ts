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

export interface SessionRecord {
  date: string;
  seeds: SessionSeeds;
  maxCombo: number;
  multTable: { correct: number; total: number; avgTimeSec: number };
  mental: { correct: number; total: number };
  bigNum: { boxesCompleted: number; questionsCompleted: number };
}

export interface AppData {
  config: Config;
  state: AppState;
  multTable: MultTableData;
  sessions: SessionRecord[];
}
