import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, useWindowDimensions, Image, ImageSourcePropType,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useProgressStore } from '../../src/stores/progress.store';
import { useGardenStore } from '../../src/stores/garden.store';
import { MapId, GardenCell } from '../../src/types/progress.types';
import { SHOP_ITEMS, ShopItem, SEED_ICON, ShopCategory } from '../../src/data/garden.data';

const SEED_IMG = {
  normal:  require('../../assets/nature/sprout_a.png') as ImageSourcePropType,
  rare:    require('../../assets/nature/flower_red.png') as ImageSourcePropType,
  special: require('../../assets/icons/star.png') as ImageSourcePropType,
};

const MAP_ORDER: MapId[] = ['forest', 'flower', 'ocean', 'sky'];
const ANIMAL_MAX = 2;

const ZONE_CONFIG: Record<MapId, { label: string; bg: string; accent: string; ground: string }> = {
  forest: { label: '🌲 숲',   bg: '#DCEDC8', accent: '#388E3C', ground: '#A5D6A7' },
  flower: { label: '🌸 꽃밭', bg: '#FCE4EC', accent: '#C2185B', ground: '#F8BBD0' },
  ocean:  { label: '🌊 바다', bg: '#E1F5FE', accent: '#0277BD', ground: '#FFF9C4' },
  sky:    { label: '☁️ 하늘', bg: '#EDE7F6', accent: '#7B1FA2', ground: '#B3E5FC' },
};

// Plant growth stages: 5min → 30min → grown
function getPlantStage(plantedAt?: number): 0 | 1 | 2 {
  if (!plantedAt) return 2;
  const ms = Date.now() - plantedAt;
  if (ms < 5 * 60_000)  return 0;
  if (ms < 30 * 60_000) return 1;
  return 2;
}

function getCellDisplay(cell: GardenCell | null): string {
  if (!cell) return '';
  if (cell.type === 'plant') {
    const stage = getPlantStage(cell.plantedAt);
    if (stage === 0) return '🌱';
    if (stage === 1) return '🌿';
    return SHOP_ITEMS.find(i => i.id === cell.itemId)?.emoji ?? '🌿';
  }
  return SHOP_ITEMS.find(i => i.id === cell.itemId)?.emoji ?? '?';
}

export default function GardenScreen() {
  const { width: screenW } = useWindowDimensions();
  const CELL_SIZE = Math.floor((screenW - 16 * 2 - 12 * 2 - 4 * 3) / 4);
  const insets = useSafeAreaInsets();
  const { sessions, state } = useProgressStore();
  const { garden, load, placeCell, removeCell } = useGardenStore();

  const [shopVisible, setShopVisible] = useState(false);
  const [shopTab, setShopTab] = useState<ShopCategory>('plant');
  const [selected, setSelected] = useState<ShopItem | null>(null);
  const [removeTarget, setRemoveTarget] = useState<{ zone: MapId; idx: number } | null>(null);
  const [, setTick] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); load(); }, []);
  useEffect(() => {
    const t = setInterval(() => setTick(n => n + 1), 60_000);
    return () => clearInterval(t);
  }, []);

  const earned = sessions.reduce(
    (acc, s) => ({
      normal:  acc.normal  + s.seeds.normal,
      rare:    acc.rare    + s.seeds.rare,
      special: acc.special + s.seeds.special,
    }),
    { normal: 0, rare: 0, special: 0 }
  );
  const spent = garden.spentSeeds;
  const avail = {
    normal:  earned.normal  - spent.normal,
    rare:    earned.rare    - spent.rare,
    special: earned.special - spent.special,
  };

  const completedMaps: MapId[] = state.completedMaps ?? [];

  function isZoneOpen(id: MapId) {
    if (id === 'forest') return true;
    const i = MAP_ORDER.indexOf(id);
    return completedMaps.includes(MAP_ORDER[i - 1]);
  }

  function handleCellPress(zone: MapId, idx: number) {
    const cells = garden.zones[zone] ?? [];
    const cell = cells[idx] ?? null;

    if (cell) {
      setRemoveTarget({ zone, idx });
      return;
    }
    if (!selected) return;

    if (selected.category === 'animal') {
      const count = cells.filter(c => c?.type === 'animal').length;
      if (count >= ANIMAL_MAX) return;
    }

    const newCell: GardenCell = {
      type: selected.category as GardenCell['type'],
      itemId: selected.id,
      plantedAt: selected.category === 'plant' ? Date.now() : undefined,
    };
    const ok = placeCell(zone, idx, newCell, selected.cost, earned);
    if (ok) setSelected(null);
  }

  function handleSelectItem(item: ShopItem) {
    if (avail[item.cost.type] < item.cost.amount) return;
    if (item.unlockZone && !isZoneOpen(item.unlockZone)) return;
    setSelected(item);
    setShopVisible(false);
  }

  const shopCategories: { key: ShopCategory; label: string }[] = [
    { key: 'plant',  label: '식물' },
    { key: 'animal', label: '동물' },
    { key: 'deco',   label: '장식' },
  ];

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>

      {/* 씨앗 잔액 + 상점 버튼 */}
      <View style={styles.topBar}>
        <View style={styles.seedRow}>
          <SeedChip img={SEED_IMG.normal}  count={avail.normal}  bg="#E8F5E9" tint="#4CAF50" />
          <SeedChip img={SEED_IMG.rare}    count={avail.rare}    bg="#FCE4EC" tint="#E91E63" />
          <SeedChip img={SEED_IMG.special} count={avail.special} bg="#FFF3E0" tint="#FF9800" />
        </View>
        <Pressable style={styles.shopBtn} onPress={() => setShopVisible(true)}>
          <Text style={styles.shopBtnText}>🛒 상점</Text>
        </Pressable>
      </View>

      {/* 배치 모드 바 */}
      {selected && (
        <View style={styles.placeBar}>
          <Text style={styles.placeBarText}>
            {selected.emoji} {selected.name} — 심을 칸을 탭하세요
          </Text>
          <Pressable onPress={() => setSelected(null)}>
            <Text style={styles.cancelText}>취소</Text>
          </Pressable>
        </View>
      )}

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {MAP_ORDER.map((mapId) => {
          const zc = ZONE_CONFIG[mapId];
          const open = isZoneOpen(mapId);
          const isDone = completedMaps.includes(mapId);
          const isCurrent = state.currentMap === mapId;

          if (!open) {
            return (
              <View key={mapId} style={styles.lockedCard}>
                <Text style={styles.lockedEmoji}>🔒</Text>
                <Text style={styles.lockedText}>{zc.label} — 이전 맵을 완성하면 열려요</Text>
              </View>
            );
          }

          const cells: (GardenCell | null)[] = garden.zones[mapId] ?? Array(16).fill(null);
          const animalCount = cells.filter(c => c?.type === 'animal').length;

          return (
            <View key={mapId} style={[styles.zoneCard, { backgroundColor: zc.bg }]}>
              <View style={styles.zoneHeader}>
                <Text style={[styles.zoneTitle, { color: zc.accent }]}>{zc.label}</Text>
                <View style={styles.zoneBadges}>
                  {isDone && (
                    <View style={[styles.badge, { backgroundColor: zc.accent }]}>
                      <Text style={styles.badgeText}>완성 ⭐</Text>
                    </View>
                  )}
                  {isCurrent && !isDone && (
                    <View style={[styles.badge, { backgroundColor: '#FF9800' }]}>
                      <Text style={styles.badgeText}>진행중</Text>
                    </View>
                  )}
                  {animalCount > 0 && (
                    <Text style={[styles.animalCount, { color: zc.accent }]}>
                      동물 {animalCount}/{ANIMAL_MAX}
                    </Text>
                  )}
                </View>
              </View>

              <View style={styles.grid}>
                {cells.map((cell, idx) => {
                  const isEmpty = !cell;
                  const isAnimalFull = selected?.category === 'animal' && animalCount >= ANIMAL_MAX;
                  const canPlace = !!selected && isEmpty && !isAnimalFull;
                  const display = getCellDisplay(cell);

                  return (
                    <Pressable
                      key={idx}
                      style={[
                        styles.cell,
                        { width: CELL_SIZE, height: CELL_SIZE, backgroundColor: zc.ground },
                        canPlace && styles.cellHighlight,
                      ]}
                      onPress={() => handleCellPress(mapId, idx)}
                    >
                      {display ? (
                        <Text style={[
                          styles.cellEmoji,
                          cell?.type === 'animal' && styles.cellEmojiAnimal,
                        ]}>
                          {display}
                        </Text>
                      ) : canPlace ? (
                        <Text style={styles.cellPlus}>+</Text>
                      ) : null}
                    </Pressable>
                  );
                })}
              </View>
            </View>
          );
        })}
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* 상점 오버레이 */}
      {mounted && shopVisible && (
        <View style={StyleSheet.absoluteFill}>
          <Pressable style={styles.overlayBg} onPress={() => setShopVisible(false)} />
          <View style={styles.sheet}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>🛒 상점</Text>
              <Pressable onPress={() => setShopVisible(false)}>
                <Text style={styles.closeBtn}>✕</Text>
              </Pressable>
            </View>

            <View style={styles.tabRow}>
              {shopCategories.map(({ key, label }) => (
                <Pressable
                  key={key}
                  style={[styles.tab, shopTab === key && styles.tabActive]}
                  onPress={() => setShopTab(key)}
                >
                  <Text style={[styles.tabText, shopTab === key && styles.tabTextActive]}>
                    {label}
                  </Text>
                </Pressable>
              ))}
            </View>

            <ScrollView style={styles.itemList}>
              {SHOP_ITEMS.filter(i => i.category === shopTab).map(item => {
                const canAfford = avail[item.cost.type] >= item.cost.amount;
                const locked = item.unlockZone ? !isZoneOpen(item.unlockZone) : false;
                const disabled = !canAfford || locked;

                return (
                  <Pressable
                    key={item.id}
                    style={[styles.itemRow, disabled && styles.itemRowOff]}
                    onPress={() => handleSelectItem(item)}
                  >
                    <Text style={styles.itemEmoji}>{item.emoji}</Text>
                    <View style={styles.itemInfo}>
                      <Text style={[styles.itemName, disabled && styles.itemNameOff]}>
                        {item.name}
                      </Text>
                      {locked && item.unlockZone && (
                        <Text style={styles.itemLock}>
                          🔒 {ZONE_CONFIG[item.unlockZone].label} 해제 필요
                        </Text>
                      )}
                      {item.category === 'plant' && !locked && (
                        <Text style={styles.itemHint}>심으면 시간이 지나며 자라요</Text>
                      )}
                      {item.category === 'animal' && !locked && (
                        <Text style={styles.itemHint}>구역당 최대 {ANIMAL_MAX}마리</Text>
                      )}
                    </View>
                    <View style={[styles.costBadge, !canAfford && styles.costBadgeOff]}>
                      <Text style={[styles.costText, !canAfford && styles.costTextOff]}>
                        {SEED_ICON[item.cost.type]} {item.cost.amount}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </View>
      )}

      {/* 제거 확인 오버레이 */}
      {mounted && !!removeTarget && (
        <Pressable style={[StyleSheet.absoluteFill, styles.overlayBg]} onPress={() => setRemoveTarget(null)}>
          <View style={styles.removeSheet}>
            <Text style={styles.removeEmoji}>
              {getCellDisplay(garden.zones[removeTarget.zone]?.[removeTarget.idx] ?? null)}
            </Text>
            <Text style={styles.removeTitle}>제거할까요?</Text>
            <Text style={styles.removeHint}>씨앗은 돌아오지 않아요</Text>
            <View style={styles.removeRow}>
              <Pressable
                style={[styles.removeBtn, styles.removeBtnNo]}
                onPress={() => setRemoveTarget(null)}
              >
                <Text style={styles.removeBtnNoText}>취소</Text>
              </Pressable>
              <Pressable
                style={[styles.removeBtn, styles.removeBtnYes]}
                onPress={() => { removeCell(removeTarget.zone, removeTarget.idx); setRemoveTarget(null); }}
              >
                <Text style={styles.removeBtnYesText}>제거</Text>
              </Pressable>
            </View>
          </View>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F1F8E9' },

  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1, borderBottomColor: '#E8F5E9',
  },
  seedRow: { flexDirection: 'row', gap: 10 },
  seedChip: { fontSize: 15, fontFamily: 'Pretendard-SemiBold', color: '#2E3A23' },
  shopBtn: {
    backgroundColor: '#4CAF50', borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 6,
  },
  shopBtnText: { fontSize: 14, fontFamily: 'Pretendard-Bold', color: '#FFF' },

  placeBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 8,
    backgroundColor: '#FFF9C4',
    borderBottomWidth: 1, borderBottomColor: '#F9A825',
  },
  placeBarText: { fontSize: 14, fontFamily: 'Pretendard-Medium', color: '#5D4037', flex: 1 },
  cancelText: { fontSize: 14, fontFamily: 'Pretendard-SemiBold', color: '#E53935' },

  scroll: { paddingHorizontal: 16, paddingTop: 12, gap: 12 },

  lockedCard: {
    backgroundColor: '#EEEEEE', borderRadius: 20,
    flexDirection: 'row', alignItems: 'center', gap: 10,
    padding: 16,
  },
  lockedEmoji: { fontSize: 24 },
  lockedText: { fontSize: 14, fontFamily: 'Pretendard-Regular', color: '#9E9E9E' },

  zoneCard: {
    borderRadius: 20, padding: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 8, elevation: 3,
  },
  zoneHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 10,
  },
  zoneTitle: { fontSize: 16, fontFamily: 'Pretendard-Bold' },
  zoneBadges: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  badge: { borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText: { fontSize: 11, fontFamily: 'Pretendard-SemiBold', color: '#FFF' },
  animalCount: { fontSize: 11, fontFamily: 'Pretendard-Medium' },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  cell: {
    borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  cellHighlight: {
    borderWidth: 2, borderColor: '#FFD54F', borderStyle: 'dashed',
    backgroundColor: 'rgba(255,213,79,0.3)',
  },
  cellEmoji: { fontSize: 28 },
  cellEmojiAnimal: { fontSize: 32 },
  cellPlus: { fontSize: 22, color: 'rgba(255,255,255,0.6)', fontFamily: 'Pretendard-Bold' },

  overlayBg: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)' },

  sheet: {
    backgroundColor: '#FFF', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    maxHeight: '80%', paddingBottom: 24,
  },
  sheetHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 20, borderBottomWidth: 1, borderBottomColor: '#F5F5F5',
  },
  sheetTitle: { fontSize: 18, fontFamily: 'Pretendard-Bold', color: '#2E3A23' },
  closeBtn: { fontSize: 18, color: '#9E9E9E', padding: 4 },

  tabRow: {
    flexDirection: 'row', paddingHorizontal: 16, gap: 8, paddingVertical: 12,
  },
  tab: {
    flex: 1, paddingVertical: 8, borderRadius: 20,
    backgroundColor: '#F5F5F5', alignItems: 'center',
  },
  tabActive: { backgroundColor: '#4CAF50' },
  tabText: { fontSize: 14, fontFamily: 'Pretendard-SemiBold', color: '#9E9E9E' },
  tabTextActive: { color: '#FFF' },

  itemList: { paddingHorizontal: 16 },
  itemRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F5F5F5',
  },
  itemRowOff: { opacity: 0.4 },
  itemEmoji: { fontSize: 32, width: 40, textAlign: 'center' },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 15, fontFamily: 'Pretendard-SemiBold', color: '#2E3A23' },
  itemNameOff: { color: '#9E9E9E' },
  itemLock: { fontSize: 11, fontFamily: 'Pretendard-Regular', color: '#EF5350', marginTop: 2 },
  itemHint: { fontSize: 11, fontFamily: 'Pretendard-Regular', color: '#9E9E9E', marginTop: 2 },
  costBadge: {
    backgroundColor: '#E8F5E9', borderRadius: 12,
    paddingHorizontal: 10, paddingVertical: 5,
  },
  costBadgeOff: { backgroundColor: '#F5F5F5' },
  costText: { fontSize: 13, fontFamily: 'Pretendard-Bold', color: '#388E3C' },
  costTextOff: { color: '#BDBDBD' },

  removeSheet: {
    backgroundColor: '#FFF', borderRadius: 24,
    margin: 32, padding: 28, alignItems: 'center', gap: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15, shadowRadius: 24, elevation: 8,
  },
  removeEmoji: { fontSize: 48, marginBottom: 4 },
  removeTitle: { fontSize: 18, fontFamily: 'Pretendard-Bold', color: '#2E3A23' },
  removeHint: { fontSize: 13, fontFamily: 'Pretendard-Regular', color: '#9E9E9E', marginBottom: 8 },
  removeRow: { flexDirection: 'row', gap: 12, marginTop: 4 },
  removeBtn: { flex: 1, paddingVertical: 12, borderRadius: 16, alignItems: 'center' },
  removeBtnNo: { backgroundColor: '#F5F5F5' },
  removeBtnYes: { backgroundColor: '#EF5350' },
  removeBtnNoText: { fontSize: 15, fontFamily: 'Pretendard-SemiBold', color: '#757575' },
  removeBtnYesText: { fontSize: 15, fontFamily: 'Pretendard-Bold', color: '#FFF' },
});

function SeedChip({ img, count, bg, tint }: {
  img: ImageSourcePropType; count: number; bg: string; tint: string;
}) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4,
      backgroundColor: bg, borderRadius: 12, paddingHorizontal: 8, paddingVertical: 4 }}>
      <Image source={img} style={{ width: 16, height: 16, tintColor: tint }} resizeMode="contain" />
      <Text style={{ fontSize: 13, fontFamily: 'Pretendard-SemiBold', color: tint }}>{count}</Text>
    </View>
  );
}
