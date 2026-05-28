import { MapId } from '../types/progress.types';

export type SeedType = 'normal' | 'rare' | 'special';
export type ShopCategory = 'plant' | 'animal' | 'deco';

export interface ShopItem {
  id: string;
  category: ShopCategory;
  name: string;
  emoji: string;
  cost: { type: SeedType; amount: number };
  unlockZone?: MapId;
}

export const SHOP_ITEMS: ShopItem[] = [
  // 식물 (일반 씨앗)
  { id: 'bush',      category: 'plant',  name: '덤불',   emoji: '🌿', cost: { type: 'normal', amount: 1 } },
  { id: 'flower_r',  category: 'plant',  name: '빨간꽃', emoji: '🌹', cost: { type: 'normal', amount: 2 } },
  { id: 'flower_p',  category: 'plant',  name: '보라꽃', emoji: '🌸', cost: { type: 'normal', amount: 2 } },
  { id: 'flower_y',  category: 'plant',  name: '노란꽃', emoji: '🌻', cost: { type: 'normal', amount: 2 } },
  { id: 'tree_oak',  category: 'plant',  name: '참나무', emoji: '🌳', cost: { type: 'normal', amount: 5 } },
  { id: 'tree_palm', category: 'plant',  name: '야자수', emoji: '🌴', cost: { type: 'normal', amount: 5 }, unlockZone: 'ocean' },
  { id: 'tree_pine', category: 'plant',  name: '소나무', emoji: '🌲', cost: { type: 'normal', amount: 4 }, unlockZone: 'sky' },

  // 동물 (희귀 씨앗)
  { id: 'rabbit',    category: 'animal', name: '토끼',   emoji: '🐰', cost: { type: 'rare', amount: 2 } },
  { id: 'cat',       category: 'animal', name: '고양이', emoji: '🐱', cost: { type: 'rare', amount: 3 } },
  { id: 'dog',       category: 'animal', name: '강아지', emoji: '🐶', cost: { type: 'rare', amount: 3 } },
  { id: 'frog',      category: 'animal', name: '개구리', emoji: '🐸', cost: { type: 'rare', amount: 2 } },
  { id: 'fox',       category: 'animal', name: '여우',   emoji: '🦊', cost: { type: 'rare', amount: 4 }, unlockZone: 'flower' },
  { id: 'duck',      category: 'animal', name: '오리',   emoji: '🐥', cost: { type: 'rare', amount: 3 }, unlockZone: 'ocean' },
  { id: 'penguin',   category: 'animal', name: '펭귄',   emoji: '🐧', cost: { type: 'rare', amount: 4 }, unlockZone: 'ocean' },
  { id: 'bear',      category: 'animal', name: '곰',     emoji: '🐻', cost: { type: 'rare', amount: 5 }, unlockZone: 'sky' },

  // 장식 (특별 씨앗)
  { id: 'mushroom',  category: 'deco',   name: '버섯',   emoji: '🍄', cost: { type: 'special', amount: 1 } },
  { id: 'stone',     category: 'deco',   name: '돌멩이', emoji: '🪨', cost: { type: 'special', amount: 1 } },
  { id: 'fence',     category: 'deco',   name: '울타리', emoji: '🪵', cost: { type: 'special', amount: 2 } },
];

export const SEED_ICON: Record<SeedType, string> = {
  normal:  '🌱',
  rare:    '🌺',
  special: '✨',
};
