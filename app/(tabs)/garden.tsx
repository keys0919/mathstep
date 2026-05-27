import { View, Text, StyleSheet, ScrollView, Image, ImageSourcePropType } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useProgressStore } from '../../src/stores/progress.store';
import { useConfigStore } from '../../src/stores/config.store';
import { MapId } from '../../src/types/progress.types';

const CHAR_IMAGES = [
  require('../../assets/characters/1.png'),
  require('../../assets/characters/2.png'),
  require('../../assets/characters/3.png'),
  require('../../assets/characters/4.png'),
  require('../../assets/characters/5.png'),
];

const CHAR_STAGES = [
  { minSeeds: 0,  imgIdx: 0, label: '씨앗 단계' },
  { minSeeds: 5,  imgIdx: 1, label: '새싹 단계' },
  { minSeeds: 15, imgIdx: 2, label: '꽃 단계' },
  { minSeeds: 30, imgIdx: 3, label: '나무 단계' },
  { minSeeds: 50, imgIdx: 4, label: '마스터' },
];

function getStage(n: number) {
  let s = CHAR_STAGES[0];
  for (const st of CHAR_STAGES) { if (n >= st.minSeeds) s = st; }
  return s;
}

const MAP_ORDER: MapId[] = ['forest', 'flower', 'ocean', 'sky'];

// Kenney Nature Kit 스프라이트 (static require)
const NATURE = {
  tree_oak:        require('../../assets/nature/tree_oak.png'),
  tree_small:      require('../../assets/nature/tree_small.png'),
  tree_palm:       require('../../assets/nature/tree_palm.png'),
  tree_pine:       require('../../assets/nature/tree_pine.png'),
  tree_pine_small: require('../../assets/nature/tree_pine_small.png'),
  plant_bush:      require('../../assets/nature/plant_bush.png'),
  plant_bush_lg:   require('../../assets/nature/plant_bush_large.png'),
  flower_red:      require('../../assets/nature/flower_red.png'),
  flower_purple:   require('../../assets/nature/flower_purple.png'),
  flower_yellow:   require('../../assets/nature/flower_yellow.png'),
  grass_leafs:     require('../../assets/nature/grass_leafs.png'),
  sprout_a:        require('../../assets/nature/sprout_a.png'),
  sprout_b:        require('../../assets/nature/sprout_b.png'),
};

const ICONS = {
  locked: require('../../assets/icons/locked.png'),
  trophy: require('../../assets/icons/trophy.png'),
  star:   require('../../assets/icons/star.png'),
};

type SpriteSpec = { src: ImageSourcePropType; w: number; h: number };
type ZoneConfig = {
  label: string; bg: string; accent: string;
  sprites: SpriteSpec[];
};

const MAP_ZONES: Record<MapId, ZoneConfig> = {
  forest: {
    label: '숲',      bg: '#A5D6A7', accent: '#388E3C',
    sprites: [
      { src: NATURE.tree_oak,   w: 38, h: 68 },
      { src: NATURE.plant_bush, w: 28, h: 20 },
    ],
  },
  flower: {
    label: '꽃밭',    bg: '#F48FB1', accent: '#C2185B',
    sprites: [
      { src: NATURE.flower_red,    w: 18, h: 34 },
      { src: NATURE.flower_purple, w: 18, h: 34 },
      { src: NATURE.flower_yellow, w: 18, h: 34 },
    ],
  },
  ocean: {
    label: '바다',    bg: '#81D4FA', accent: '#0277BD',
    sprites: [
      { src: NATURE.tree_palm,   w: 44, h: 68 },
      { src: NATURE.grass_leafs, w: 26, h: 18 },
    ],
  },
  sky: {
    label: '하늘',    bg: '#CE93D8', accent: '#7B1FA2',
    sprites: [
      { src: NATURE.tree_pine,       w: 30, h: 56 },
      { src: NATURE.tree_pine_small, w: 20, h: 40 },
    ],
  },
};

function formatDate(dateStr: string) {
  const [, m, d] = dateStr.split('-');
  return `${Number(m)}/${Number(d)}`;
}

export default function GardenScreen() {
  const insets = useSafeAreaInsets();
  const { sessions, state } = useProgressStore();
  const { config } = useConfigStore();

  const allSeeds = sessions.reduce(
    (acc, s) => ({
      normal: acc.normal + s.seeds.normal,
      rare: acc.rare + s.seeds.rare,
      special: acc.special + s.seeds.special,
    }),
    { normal: 0, rare: 0, special: 0 }
  );
  const totalSeeds = allSeeds.normal + allSeeds.rare + allSeeds.special;
  const stage = getStage(totalSeeds);
  const nextStage = CHAR_STAGES.find(s => s.minSeeds > totalSeeds);
  const completedMaps: MapId[] = state.completedMaps ?? [];
  const recent = [...sessions].reverse().slice(0, 5);

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* 헤더 */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>내 정원</Text>
          <Text style={styles.headerSub}>씨앗을 모아 정원을 키워봐요</Text>
        </View>

        {/* 캐릭터 + 단계 카드 */}
        <View style={styles.charCard}>
          <Image source={CHAR_IMAGES[stage.imgIdx]} style={styles.charImg} resizeMode="cover" />
          <View style={styles.charRight}>
            <Text style={styles.charStageLabel}>{stage.label}</Text>
            <Text style={styles.charSeedCount}>씨앗 총 {totalSeeds}개</Text>
            {nextStage ? (
              <>
                <View style={styles.charTrack}>
                  <View
                    style={[
                      styles.charFill,
                      {
                        width: `${Math.round(
                          ((totalSeeds - stage.minSeeds) /
                            (nextStage.minSeeds - stage.minSeeds)) * 100
                        )}%`,
                      },
                    ]}
                  />
                </View>
                <Text style={styles.charNextLabel}>
                  다음 단계까지 {nextStage.minSeeds - totalSeeds}개
                </Text>
              </>
            ) : (
              <View style={styles.masteredRow}>
                <Image source={ICONS.trophy} style={[styles.trophyIcon, { tintColor: '#FF9800' }]} />
                <Text style={styles.charMaxed}>최고 단계 달성!</Text>
              </View>
            )}
          </View>
        </View>

        {/* 맵 여정 */}
        <Text style={styles.sectionTitle}>나의 여정</Text>
        <View style={styles.journeyList}>
          {MAP_ORDER.map((mapId) => {
            const zone = MAP_ZONES[mapId];
            const isDone = completedMaps.includes(mapId);
            const isCurrent = state.currentMap === mapId;
            const isLocked = !isDone && !isCurrent;
            const progress = isCurrent
              ? Math.round((state.sessionsCompleted / config.sessionsPerMap) * 100)
              : isDone ? 100 : 0;

            return (
              <View key={mapId} style={[styles.zoneCard, isLocked && styles.zoneLocked]}>
                {/* 컬러 사이드바 + 스프라이트 */}
                <View style={[styles.zoneSidebar, { backgroundColor: isLocked ? '#E0E0E0' : zone.bg }]}>
                  {isLocked ? (
                    <Image
                      source={ICONS.locked}
                      style={[styles.lockedIcon, { tintColor: '#BDBDBD' }]}
                      resizeMode="contain"
                    />
                  ) : (
                    <View style={styles.spritesRow}>
                      {zone.sprites.map((sp, i) => (
                        <Image
                          key={i}
                          source={sp.src}
                          style={{ width: sp.w, height: sp.h }}
                          resizeMode="contain"
                        />
                      ))}
                    </View>
                  )}
                </View>

                {/* 내용 */}
                <View style={styles.zoneContent}>
                  <View style={styles.zoneTop}>
                    <Text style={[styles.zoneLabel, isLocked && styles.zoneLabelLocked]}>
                      {zone.label}
                    </Text>
                    {isDone && (
                      <View style={[styles.zoneBadge, { backgroundColor: zone.accent }]}>
                        <Image source={ICONS.star} style={[styles.badgeIcon, { tintColor: '#FFF' }]} />
                        <Text style={styles.zoneBadgeText}>완성</Text>
                      </View>
                    )}
                    {isCurrent && (
                      <View style={[styles.zoneBadge, { backgroundColor: '#FF9800' }]}>
                        <Text style={styles.zoneBadgeText}>진행 중</Text>
                      </View>
                    )}
                  </View>

                  {!isLocked ? (
                    <>
                      <View style={styles.zoneProgressTrack}>
                        <View
                          style={[
                            styles.zoneProgressFill,
                            { width: `${progress}%`, backgroundColor: zone.accent },
                          ]}
                        />
                      </View>
                      <Text style={[styles.zoneProgressLabel, { color: zone.accent }]}>
                        {isCurrent
                          ? `${state.sessionsCompleted} / ${config.sessionsPerMap} 세션`
                          : '완성!'}
                      </Text>
                    </>
                  ) : (
                    <Text style={styles.zoneLockMsg}>이전 맵을 완성하면 열려요</Text>
                  )}
                </View>
              </View>
            );
          })}
        </View>

        {/* 씨앗 인벤토리 */}
        <Text style={styles.sectionTitle}>씨앗 인벤토리</Text>
        <View style={styles.seedInventory}>
          <SeedSlot
            sprite={NATURE.sprout_a}
            count={allSeeds.normal}
            label="세션 완료"
            color="#4CAF50"
            bg="#E8F5E9"
          />
          <SeedSlot
            sprite={NATURE.flower_red}
            count={allSeeds.rare}
            label="콤보 10+"
            color="#E91E63"
            bg="#FCE4EC"
          />
          <SeedSlot
            sprite={ICONS.star}
            count={allSeeds.special}
            label="100% 정답"
            color="#FF9800"
            bg="#FFF3E0"
            tintColor="#FF9800"
          />
        </View>

        {/* 최근 기록 */}
        {recent.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>최근 기록</Text>
            <View style={styles.recentList}>
              {recent.map((s, i) => {
                const day = s.seeds.normal + s.seeds.rare + s.seeds.special;
                return (
                  <View
                    key={i}
                    style={[styles.recentRow, i === recent.length - 1 && styles.recentRowLast]}
                  >
                    <Text style={styles.recentDate}>{formatDate(s.date)}</Text>
                    <View style={styles.recentSeeds}>
                      {s.seeds.normal > 0 && <Text style={styles.seedChip}>🌱×{s.seeds.normal}</Text>}
                      {s.seeds.rare > 0 && <Text style={styles.seedChip}>🌺×{s.seeds.rare}</Text>}
                      {s.seeds.special > 0 && <Text style={styles.seedChip}>✨×{s.seeds.special}</Text>}
                    </View>
                    <Text style={styles.recentCombo}>
                      {s.maxCombo > 0 ? `🔥${s.maxCombo}` : ''}
                    </Text>
                    <Text style={styles.recentTotal}>{day}개</Text>
                  </View>
                );
              })}
            </View>
          </>
        )}

        <View style={{ height: 20 }} />
      </ScrollView>
    </View>
  );
}

function SeedSlot({
  sprite, count, label, color, bg, tintColor,
}: {
  sprite: ImageSourcePropType;
  count: number; label: string; color: string; bg: string;
  tintColor?: string;
}) {
  return (
    <View style={[styles.seedSlot, { backgroundColor: bg }]}>
      <Image
        source={sprite}
        style={[styles.seedSlotSprite, tintColor ? { tintColor } : undefined]}
        resizeMode="contain"
      />
      <Text style={[styles.seedSlotCount, { color }]}>{count}</Text>
      <Text style={styles.seedSlotLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F9FBE7' },
  scroll: { paddingHorizontal: 16, paddingTop: 8 },
  header: { marginBottom: 16, gap: 2 },
  headerTitle: { fontSize: 24, fontFamily: 'Pretendard-Bold', color: '#2E3A23' },
  headerSub: { fontSize: 13, fontFamily: 'Pretendard-Regular', color: '#6A7B5A' },

  charCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    flexDirection: 'row',
    overflow: 'hidden',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  charImg: { width: 110, height: 110 },
  charRight: { flex: 1, padding: 14, justifyContent: 'center', gap: 4 },
  charStageLabel: { fontSize: 17, fontFamily: 'Pretendard-Bold', color: '#2E3A23' },
  charSeedCount: { fontSize: 12, fontFamily: 'Pretendard-Regular', color: '#6A7B5A' },
  charTrack: {
    height: 6, backgroundColor: '#EEF2E6', borderRadius: 3, overflow: 'hidden', marginTop: 4,
  },
  charFill: { height: '100%', backgroundColor: '#4CAF50', borderRadius: 3 },
  charNextLabel: { fontSize: 11, fontFamily: 'Pretendard-Regular', color: '#6A7B5A', marginTop: 2 },
  masteredRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  trophyIcon: { width: 16, height: 16 },
  charMaxed: { fontSize: 13, fontFamily: 'Pretendard-SemiBold', color: '#FF9800' },

  sectionTitle: {
    fontSize: 15, fontFamily: 'Pretendard-SemiBold', color: '#2E3A23', marginBottom: 10,
  },

  journeyList: { gap: 10, marginBottom: 20 },
  zoneCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    flexDirection: 'row',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 3,
  },
  zoneLocked: { opacity: 0.55 },
  zoneSidebar: {
    width: 86,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 10,
    paddingTop: 10,
    minHeight: 88,
  },
  lockedIcon: { width: 32, height: 32 },
  spritesRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 2,
    paddingHorizontal: 4,
  },
  zoneContent: { flex: 1, padding: 14, justifyContent: 'center', gap: 6 },
  zoneTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  zoneLabel: { fontSize: 16, fontFamily: 'Pretendard-Bold', color: '#2E3A23', flex: 1 },
  zoneLabelLocked: { color: '#9E9E9E' },
  zoneBadge: {
    borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3,
    flexDirection: 'row', alignItems: 'center', gap: 3,
  },
  badgeIcon: { width: 10, height: 10 },
  zoneBadgeText: { fontSize: 11, fontFamily: 'Pretendard-SemiBold', color: '#FFFFFF' },
  zoneProgressTrack: {
    height: 8, backgroundColor: '#EEF2E6', borderRadius: 4, overflow: 'hidden',
  },
  zoneProgressFill: { height: '100%', borderRadius: 4 },
  zoneProgressLabel: { fontSize: 12, fontFamily: 'Pretendard-Medium' },
  zoneLockMsg: { fontSize: 12, fontFamily: 'Pretendard-Regular', color: '#9E9E9E' },

  seedInventory: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  seedSlot: {
    flex: 1, borderRadius: 16, padding: 12, alignItems: 'center', gap: 6,
  },
  seedSlotSprite: { width: 40, height: 40 },
  seedSlotCount: { fontSize: 22, fontFamily: 'Pretendard-Bold', fontVariant: ['tabular-nums'] },
  seedSlotLabel: { fontSize: 11, fontFamily: 'Pretendard-Regular', color: '#6A7B5A', textAlign: 'center' },

  recentList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  recentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F8EE',
    gap: 6,
  },
  recentRowLast: { borderBottomWidth: 0 },
  recentDate: {
    fontSize: 13, fontFamily: 'Pretendard-Medium', color: '#6A7B5A',
    width: 36, fontVariant: ['tabular-nums'],
  },
  recentSeeds: { flex: 1, flexDirection: 'row', gap: 5, flexWrap: 'wrap' },
  seedChip: { fontSize: 12, fontFamily: 'Pretendard-Regular', color: '#2E3A23' },
  recentCombo: { fontSize: 12, fontFamily: 'Pretendard-Medium', color: '#FF7043', minWidth: 36 },
  recentTotal: {
    fontSize: 13, fontFamily: 'Pretendard-SemiBold', color: '#2E3A23',
    minWidth: 28, textAlign: 'right', fontVariant: ['tabular-nums'],
  },
});
