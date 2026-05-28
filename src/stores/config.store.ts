import { create } from 'zustand';
import { Config } from '../types/progress.types';
import { loadData, saveData } from '../utils/storage';

interface ConfigStore {
  config: Config;
  load: () => void;
  update: (partial: Partial<Config>) => void;
}

export const useConfigStore = create<ConfigStore>((set, get) => ({
  config: {
    multTableTimeSec: 3,
    multTableGradSessions: 3,
    multTablePerSession: 7,
    mentalPerSession: 4,
    bigNumSessionMin: 10,
    comboThreshold1: 5,
    comboThreshold2: 10,
    sessionsPerMap: 10,
  },
  load: () => {
    const data = loadData();
    set({ config: data.config });
  },
  update: (partial) => {
    const next = { ...get().config, ...partial };
    set({ config: next });
    const data = loadData();
    saveData({ ...data, config: next });
  },
}));
