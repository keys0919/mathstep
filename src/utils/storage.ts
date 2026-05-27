import { AppData, Config, AppState, MultTableData } from '../types/progress.types';

const STORAGE_KEY = 'mathstep';

const DEFAULT_CONFIG: Config = {
  multTableTimeSec: 3,
  multTableGradSessions: 3,
  multTablePerSession: 10,
  mentalPerSession: 5,
  bigNumSessionMin: 10,
  comboThreshold1: 5,
  comboThreshold2: 10,
  sessionsPerMap: 10,
};

const DEFAULT_STATE: AppState = {
  currentMap: 'forest',
  sessionsCompleted: 0,
  streak: 0,
  lastStudyDate: null,
  mentalLevel: 0,
};

const DEFAULT_MULT_TABLE: MultTableData = {
  graduated: [],
  weak: {},
};

function defaultData(): AppData {
  return {
    config: { ...DEFAULT_CONFIG },
    state: { ...DEFAULT_STATE },
    multTable: { graduated: [], weak: {} },
    sessions: [],
  };
}

export function loadData(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultData();
    const parsed = JSON.parse(raw) as Partial<AppData>;
    return {
      config: { ...DEFAULT_CONFIG, ...parsed.config },
      state: { ...DEFAULT_STATE, ...parsed.state },
      multTable: { ...DEFAULT_MULT_TABLE, ...parsed.multTable },
      sessions: parsed.sessions ?? [],
    };
  } catch {
    return defaultData();
  }
}

export function saveData(data: AppData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
