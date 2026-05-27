import { create } from 'zustand';
import { AppState, MultTableData, SessionRecord, MapId } from '../types/progress.types';
import { loadData, saveData, todayStr } from '../utils/storage';

const MAP_ORDER: MapId[] = ['forest', 'flower', 'ocean', 'sky'];

interface ProgressStore {
  state: AppState;
  multTable: MultTableData;
  sessions: SessionRecord[];

  load: () => void;
  saveSession: (record: SessionRecord) => void;
  recordMultTableResult: (a: number, b: number, correct: boolean, timeSec: number, timeLimitSec: number) => void;
  checkAndGraduate: (a: number, b: number, gradSessions: number) => void;
}

export const useProgressStore = create<ProgressStore>((set, get) => ({
  state: {
    currentMap: 'forest',
    sessionsCompleted: 0,
    streak: 0,
    lastStudyDate: null,
    mentalLevel: 0,
    multLevel: 0,
  },
  multTable: { graduated: [], weak: {} },
  sessions: [],

  load: () => {
    const data = loadData();
    set({
      state: data.state,
      multTable: data.multTable,
      sessions: data.sessions,
    });
  },

  saveSession: (record) => {
    const data = loadData();
    const today = todayStr();

    // 스트릭 계산
    const last = data.state.lastStudyDate;
    const yesterday = (() => {
      const d = new Date();
      d.setDate(d.getDate() - 1);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    })();
    const streak = last === yesterday ? data.state.streak + 1 : last === today ? data.state.streak : 1;

    // 맵 진행
    const sessionsCompleted = data.state.sessionsCompleted + 1;
    const sessionsPerMap = data.config.sessionsPerMap;
    let currentMap = data.state.currentMap;
    let finalSessions = sessionsCompleted;
    if (sessionsCompleted >= sessionsPerMap) {
      const idx = MAP_ORDER.indexOf(currentMap);
      if (idx < MAP_ORDER.length - 1) {
        currentMap = MAP_ORDER[idx + 1];
        finalSessions = 0;
      }
    }

    const nextSessions = [...data.sessions, record];

    // 암산 레벨 승급: 최근 3세션 정답률 ≥ 80%
    let mentalLevel = data.state.mentalLevel ?? 0;
    if (mentalLevel === 0) {
      const recent = nextSessions.slice(-3);
      const totalCorrect = recent.reduce((s, r) => s + r.mental.correct, 0);
      const totalCount = recent.reduce((s, r) => s + r.mental.total, 0);
      if (recent.length >= 3 && totalCount > 0 && totalCorrect / totalCount >= 0.8) {
        mentalLevel = 1;
      }
    }

    // 구구단 레벨 승급: 최근 3세션 정답률 ≥ 80%
    let multLevel = data.state.multLevel ?? 0;
    if (multLevel === 0) {
      const recent = nextSessions.slice(-3);
      const totalCorrect = recent.reduce((s, r) => s + r.multTable.correct, 0);
      const totalCount = recent.reduce((s, r) => s + r.multTable.total, 0);
      if (recent.length >= 3 && totalCount > 0 && totalCorrect / totalCount >= 0.8) {
        multLevel = 1;
      }
    }

    const nextState: AppState = {
      ...data.state,
      currentMap,
      sessionsCompleted: finalSessions,
      streak,
      lastStudyDate: today,
      mentalLevel,
      multLevel,
    };

    saveData({ ...data, state: nextState, sessions: nextSessions });
    set({ state: nextState, sessions: nextSessions });
  },

  recordMultTableResult: (a, b, correct, timeSec, timeLimitSec) => {
    const data = loadData();
    const key = `${a}x${b}`;
    const prev = data.multTable.weak[key] ?? { errors: 0, slowCount: 0, lastSeen: '', gradSessionCount: 0 };
    const updated = {
      ...prev,
      lastSeen: todayStr(),
      errors: correct ? prev.errors : prev.errors + 1,
      slowCount: (correct && timeSec > timeLimitSec) ? prev.slowCount + 1 : prev.slowCount,
    };
    const nextMultTable: MultTableData = {
      ...data.multTable,
      weak: { ...data.multTable.weak, [key]: updated },
    };
    saveData({ ...data, multTable: nextMultTable });
    set({ multTable: nextMultTable });
  },

  checkAndGraduate: (a, b, gradSessions) => {
    const data = loadData();
    const key = `${a}x${b}`;
    const entry = data.multTable.weak[key];
    if (!entry) return;

    const next = { ...entry, gradSessionCount: entry.gradSessionCount + 1 };
    let graduated = [...data.multTable.graduated];
    if (next.gradSessionCount >= gradSessions) {
      const already = graduated.some(([x, y]) => x === a && y === b);
      if (!already) graduated = [...graduated, [a, b]];
    }
    const nextMultTable: MultTableData = {
      graduated,
      weak: { ...data.multTable.weak, [key]: next },
    };
    saveData({ ...data, multTable: nextMultTable });
    set({ multTable: nextMultTable });
  },
}));
