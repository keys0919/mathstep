import { create } from 'zustand';
import { AppState, MultTableData, SessionRecord, MapId, DailyMission } from '../types/progress.types';
import { loadData, saveData, todayStr } from '../utils/storage';

const MAP_ORDER: MapId[] = ['forest', 'flower', 'ocean', 'sky'];

function generateMission(sessions: SessionRecord[], today: string): DailyMission {
  const recent = sessions.slice(-3);
  const multTotal = recent.reduce((s, r) => s + r.multTable.total, 0);
  const multCorrect = recent.reduce((s, r) => s + r.multTable.correct, 0);
  const avgMultAcc = multTotal > 0 ? multCorrect / multTotal : 1;
  const avgCombo = recent.length > 0
    ? recent.reduce((s, r) => s + r.maxCombo, 0) / recent.length
    : 0;

  if (multTotal > 0 && avgMultAcc < 0.85) {
    return { date: today, type: 'mult_perfect', target: 1, completed: false, rewardType: 'rare' };
  }
  if (avgCombo < 5) {
    return { date: today, type: 'combo', target: 5, completed: false, rewardType: 'rare' };
  }
  if (avgCombo < 8) {
    return { date: today, type: 'combo', target: 8, completed: false, rewardType: 'special' };
  }
  return { date: today, type: 'no_error', target: 1, completed: false, rewardType: 'special' };
}

interface SaveSessionResult {
  missionCompleted: boolean;
  shieldGranted: boolean;
  bonusUnlocked: boolean;
}

interface ProgressStore {
  state: AppState;
  multTable: MultTableData;
  sessions: SessionRecord[];

  load: () => void;
  saveSession: (record: SessionRecord) => SaveSessionResult;
  recordMultTableResult: (a: number, b: number, correct: boolean, timeSec: number, timeLimitSec: number) => void;
  checkAndGraduate: (a: number, b: number, gradSessions: number) => boolean;
  useShield: () => boolean;
}

export const useProgressStore = create<ProgressStore>((set) => ({
  state: {
    currentMap: 'forest',
    sessionsCompleted: 0,
    streak: 0,
    lastStudyDate: null,
    mentalLevel: 0,
    multLevel: 0,
    completedMaps: [],
    shields: 0,
    bonusUnlocked: false,
    dailyMission: null,
  },
  multTable: { graduated: [], weak: {} },
  sessions: [],

  load: () => {
    const data = loadData();
    const today = todayStr();
    let state = data.state;
    let needSave = false;
    if (!state.dailyMission || state.dailyMission.date !== today) {
      state = { ...state, dailyMission: generateMission(data.sessions, today), bonusUnlocked: false };
      needSave = true;
    }
    if (needSave) saveData({ ...data, state });
    set({ state, multTable: data.multTable, sessions: data.sessions });
  },

  saveSession: (record): SaveSessionResult => {
    const data = loadData();
    const today = todayStr();
    const wasFirstToday = data.state.lastStudyDate !== today;

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
    let completedMaps = [...(data.state.completedMaps ?? [])];
    if (sessionsCompleted >= sessionsPerMap) {
      const idx = MAP_ORDER.indexOf(currentMap);
      if (idx < MAP_ORDER.length - 1) {
        if (!completedMaps.includes(currentMap)) completedMaps.push(currentMap);
        currentMap = MAP_ORDER[idx + 1];
        finalSessions = 0;
      }
    }

    // 스트릭 보너스 씨앗
    const bonusRecord = { ...record, seeds: { ...record.seeds } };
    if (streak > 0 && streak % 7 === 0) {
      bonusRecord.seeds.special += 1;
    } else if (streak > 0 && streak % 3 === 0) {
      bonusRecord.seeds.rare += 1;
    }

    // 미션 완료 체크
    const mission = data.state.dailyMission;
    let missionCompleted = false;
    if (mission && mission.date === today && !mission.completed) {
      if (mission.type === 'combo' && record.maxCombo >= mission.target) {
        missionCompleted = true;
      } else if (mission.type === 'mult_perfect' && record.multTable.total > 0 &&
        record.multTable.correct === record.multTable.total) {
        missionCompleted = true;
      } else if (mission.type === 'mental_perfect' && record.mental.total > 0 &&
        record.mental.correct === record.mental.total) {
        missionCompleted = true;
      } else if (mission.type === 'no_error' && record.logs.length > 0 &&
        record.logs.every(l => l.correct)) {
        missionCompleted = true;
      }
      if (missionCompleted) bonusRecord.seeds[mission.rewardType] += 1;
    }

    // 퍼펙트 체크 (실드 지급 + 보너스 세션 해금)
    const isPerfect = record.logs.length > 0 && record.logs.every(l => l.correct);
    const shieldGranted = isPerfect && wasFirstToday;
    const nextBonusUnlocked = isPerfect && wasFirstToday;
    const nextShields = (data.state.shields ?? 0) + (shieldGranted ? 1 : 0);

    // 레벨 승급
    const nextSessions = [...data.sessions, bonusRecord];
    let mentalLevel = data.state.mentalLevel ?? 0;
    if (mentalLevel === 0) {
      const recent = nextSessions.slice(-3);
      const totalCorrect = recent.reduce((s, r) => s + r.mental.correct, 0);
      const totalCount = recent.reduce((s, r) => s + r.mental.total, 0);
      if (recent.length >= 3 && totalCount > 0 && totalCorrect / totalCount >= 0.8) {
        mentalLevel = 1;
      }
    }
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
      completedMaps,
      shields: nextShields,
      bonusUnlocked: nextBonusUnlocked,
      dailyMission: mission && missionCompleted ? { ...mission, completed: true } : mission,
    };

    saveData({ ...data, state: nextState, sessions: nextSessions });
    set({ state: nextState, sessions: nextSessions });
    return { missionCompleted, shieldGranted, bonusUnlocked: nextBonusUnlocked };
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
    if (!entry) return false;

    const next = { ...entry, gradSessionCount: entry.gradSessionCount + 1 };
    let graduated = [...data.multTable.graduated];
    let justGraduated = false;
    if (next.gradSessionCount >= gradSessions) {
      const already = graduated.some(([x, y]) => x === a && y === b);
      if (!already) {
        graduated = [...graduated, [a, b]];
        justGraduated = true;
      }
    }
    const nextMultTable: MultTableData = {
      graduated,
      weak: { ...data.multTable.weak, [key]: next },
    };
    saveData({ ...data, multTable: nextMultTable });
    set({ multTable: nextMultTable });
    return justGraduated;
  },

  useShield: () => {
    const data = loadData();
    if ((data.state.shields ?? 0) <= 0) return false;
    const nextState = { ...data.state, shields: data.state.shields - 1 };
    saveData({ ...data, state: nextState });
    set((s) => ({ state: { ...s.state, shields: s.state.shields - 1 } }));
    return true;
  },
}));
