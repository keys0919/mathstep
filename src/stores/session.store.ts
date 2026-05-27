import { create } from 'zustand';
import { Phase, MultTableResult } from '../types/problem.types';
import { SessionSeeds } from '../types/progress.types';

interface SessionStore {
  phase: Phase;
  seeds: SessionSeeds;
  combo: number;
  maxCombo: number;
  multTableResults: MultTableResult[];
  mentalCorrect: number;
  mentalTotal: number;
  bigNumBoxes: number;
  bigNumQuestions: number;

  setPhase: (phase: Phase) => void;
  addSeed: (type: keyof SessionSeeds) => void;
  incrementCombo: (threshold1: number, threshold2: number) => void;
  resetCombo: () => void;
  addMultTableResult: (result: MultTableResult) => void;
  addMentalResult: (correct: boolean) => void;
  addBigNumBox: () => void;
  addBigNumQuestion: () => void;
  reset: () => void;
}

export const useSessionStore = create<SessionStore>((set, get) => ({
  phase: 'mult-table',
  seeds: { normal: 0, rare: 0, special: 0 },
  combo: 0,
  maxCombo: 0,
  multTableResults: [],
  mentalCorrect: 0,
  mentalTotal: 0,
  bigNumBoxes: 0,
  bigNumQuestions: 0,

  setPhase: (phase) => set({ phase }),

  addSeed: (type) => {
    const { seeds } = get();
    set({ seeds: { ...seeds, [type]: seeds[type] + 1 } });
  },

  incrementCombo: (threshold1, threshold2) => {
    const { combo, maxCombo, seeds } = get();
    const next = combo + 1;
    const newMax = Math.max(maxCombo, next);
    let newSeeds = { ...seeds };
    if (next === threshold2) {
      newSeeds = { ...newSeeds, special: newSeeds.special + 1 };
    } else if (next === threshold1) {
      newSeeds = { ...newSeeds, rare: newSeeds.rare + 1 };
    }
    set({ combo: next, maxCombo: newMax, seeds: newSeeds });
  },

  resetCombo: () => set({ combo: 0 }),

  addMultTableResult: (result) => {
    set((s) => ({ multTableResults: [...s.multTableResults, result] }));
  },

  addMentalResult: (correct) => {
    set((s) => ({
      mentalCorrect: s.mentalCorrect + (correct ? 1 : 0),
      mentalTotal: s.mentalTotal + 1,
    }));
  },

  addBigNumBox: () => set((s) => ({ bigNumBoxes: s.bigNumBoxes + 1 })),
  addBigNumQuestion: () => set((s) => ({ bigNumQuestions: s.bigNumQuestions + 1 })),

  reset: () => set({
    phase: 'mult-table',
    seeds: { normal: 0, rare: 0, special: 0 },
    combo: 0,
    maxCombo: 0,
    multTableResults: [],
    mentalCorrect: 0,
    mentalTotal: 0,
    bigNumBoxes: 0,
    bigNumQuestions: 0,
  }),
}));
