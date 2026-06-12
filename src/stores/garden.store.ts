import { create } from 'zustand';
import { GardenData, GardenCell, MapId } from '../types/progress.types';
import { loadData, saveData } from '../utils/storage';
import { SeedType } from '../data/garden.data';

const GRID_SIZE = 16;

function defaultGarden(): GardenData {
  return {
    zones: {
      forest: Array(GRID_SIZE).fill(null),
      flower: Array(GRID_SIZE).fill(null),
      ocean:  Array(GRID_SIZE).fill(null),
      sky:    Array(GRID_SIZE).fill(null),
    },
    spentSeeds: { normal: 0, rare: 0, special: 0 },
    lastVisit: null,
  };
}

interface GardenStore {
  garden: GardenData;
  load: () => void;
  placeCell: (
    zone: MapId,
    idx: number,
    cell: GardenCell,
    cost: { type: SeedType; amount: number },
    earned: { normal: number; rare: number; special: number }
  ) => boolean;
  removeCell: (zone: MapId, idx: number) => void;
}

export const useGardenStore = create<GardenStore>((set) => ({
  garden: defaultGarden(),

  load: () => {
    const data = loadData();
    const g = data.garden ?? defaultGarden();
    const base = defaultGarden();
    const zones = {
      forest: g.zones?.forest ?? base.zones.forest,
      flower: g.zones?.flower ?? base.zones.flower,
      ocean:  g.zones?.ocean  ?? base.zones.ocean,
      sky:    g.zones?.sky    ?? base.zones.sky,
    };
    set({ garden: { ...g, zones } });
  },

  placeCell: (zone, idx, cell, cost, earned) => {
    let placed = false;
    set((s) => {
      const garden = s.garden;
      const spent = garden.spentSeeds;
      const available = earned[cost.type] - spent[cost.type];
      if (available < cost.amount) return s;

      const zoneGrid = [...(garden.zones[zone] ?? Array(GRID_SIZE).fill(null))];
      zoneGrid[idx] = cell;

      const nextGarden: GardenData = {
        ...garden,
        zones: { ...garden.zones, [zone]: zoneGrid },
        spentSeeds: { ...spent, [cost.type]: spent[cost.type] + cost.amount },
      };
      const data = loadData();
      saveData({ ...data, garden: nextGarden });
      placed = true;
      return { garden: nextGarden };
    });
    return placed;
  },

  removeCell: (zone, idx) => {
    set((s) => {
      const garden = s.garden;
      const zoneGrid = [...(garden.zones[zone] ?? Array(GRID_SIZE).fill(null))];
      zoneGrid[idx] = null;
      const nextGarden: GardenData = {
        ...garden,
        zones: { ...garden.zones, [zone]: zoneGrid },
      };
      const data = loadData();
      saveData({ ...data, garden: nextGarden });
      return { garden: nextGarden };
    });
  },
}));
