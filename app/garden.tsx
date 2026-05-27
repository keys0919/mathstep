import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useProgressStore } from '../src/stores/progress.store';
import { useConfigStore } from '../src/stores/config.store';
import { MapId } from '../src/types/progress.types';

const MAP_ORDER: MapId[] = ['forest', 'flower', 'ocean', 'sky'];

const MAP_INFO: Record<MapId, { label: string; emoji: string; color: string }> = {
  forest: { label: '숲', emoji: '🌲', color: '#4CAF50' },
  flower: { label: '꽃밭', emoji: '🌸', color: '#FF80AB' },
  ocean:  { label: '바다', emoji: '🪸', color: '#40C4FF' },
  sky:    { label: '하늘', emoji: '⭐', color: '#CE93D8' },
};

function formatDate(dateStr: string): string {
  const [, m, d] = dateStr.split('-');
  return `${Number(m)}/${Number(d)}`;
}

export default function GardenScreen() {
  const router = useRouter();
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

  const completedMaps: MapId[] = state.completedMaps ?? [];
  const recent = [...sessions].reverse().slice(0, 7);

  return (
    <View style={[styles.screen, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* 헤더 */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backText}>← 뒤로</Text>
          </Pressable>
          <Text style={styles.title}>내 정원</Text>
        </View>

        {/* 맵 격자 */}
        <View style={styles.mapGrid}>
          {MAP_ORDER.map((mapId) => {
            const info = MAP_INFO[mapId];
            const isDone = completedMaps.includes(mapId);
            const isCurrent = state.currentMap === mapId;
            const isLocked = !isDone && !isCurrent;
            return (
              <View
                key={mapId}
                style={[
                  styles.mapCell,
                  isDone && styles.mapCellDone,
                  isCurrent && styles.mapCellCurrent,
                  isLocked && styles.mapCellLocked,
                ]}
              >
                <Text style={[styles.mapEmoji, isLocked && styles.emojiLocked]}>
                  {isLocked ? '🔒' : info.emoji}
                </Text>
                <Text style={[styles.mapLabel, isLocked && styles.labelLocked]}>
                  {info.label}
                </Text>
                {isDone && <Text style={styles.mapDoneTag}>완성!</Text>}
                {isCurrent && (
                  <Text style={styles.mapProgressText}>
                    {state.sessionsCompleted}/{config.sessionsPerMap}
                  </Text>
                )}
              </View>
            );
          })}
        </View>

        {/* 씨앗 현황 + 획득 조건 */}
        <Text style={styles.sectionLabel}>씨앗 현황</Text>
        <View style={styles.seedCard}>
          <SeedRow emoji="🌱" count={allSeeds.normal} condition="세션 완료" color="#4CAF50" />
          <View style={styles.seedDivider} />
          <SeedRow emoji="🌺" count={allSeeds.rare} condition={`콤보 ${config.comboThreshold2}+ 달성`} color="#FF80AB" />
          <View style={styles.seedDivider} />
          <SeedRow emoji="✨" count={allSeeds.special} condition="100% 정답" color="#FF9800" />
        </View>

        {/* 최근 세션 기록 */}
        <Text style={styles.sectionLabel}>최근 기록</Text>

        {recent.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>아직 세션 기록이 없어요.</Text>
          </View>
        ) : (
          <View style={styles.sessionList}>
            {recent.map((s, i) => {
              const daySeeds = s.seeds.normal + s.seeds.rare + s.seeds.special;
              return (
                <View key={i} style={styles.sessionRow}>
                  <Text style={styles.sessionDate}>{formatDate(s.date)}</Text>
                  <View style={styles.sessionSeeds}>
                    {s.seeds.normal > 0 && <Text style={styles.seedChip}>🌱×{s.seeds.normal}</Text>}
                    {s.seeds.rare > 0 && <Text style={styles.seedChip}>🌺×{s.seeds.rare}</Text>}
                    {s.seeds.special > 0 && <Text style={styles.seedChip}>✨×{s.seeds.special}</Text>}
                  </View>
                  <Text style={styles.sessionTotal}>{daySeeds}개</Text>
                  {s.maxCombo > 0 && (
                    <Text style={styles.sessionCombo}>{s.maxCombo}콤보</Text>
                  )}
                </View>
              );
            })}
          </View>
        )}

      </ScrollView>
    </View>
  );
}

function SeedRow({ emoji, count, condition, color }: { emoji: string; count: number; condition: string; color: string }) {
  return (
    <View style={styles.seedRow}>
      <Text style={styles.seedEmoji}>{emoji}</Text>
      <View style={styles.seedInfo}>
        <Text style={styles.seedCondition}>{condition}</Text>
      </View>
      <Text style={[styles.seedCount, { color }]}>×{count}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F9FBE7',
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 32,
    gap: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 4,
  },
  backBtn: {
    padding: 4,
  },
  backText: {
    fontSize: 15,
    fontFamily: 'Pretendard-Medium',
    color: '#6A7B5A',
  },
  title: {
    fontSize: 20,
    fontFamily: 'Pretendard-Bold',
    color: '#2E3A23',
  },
  mapGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  mapCell: {
    width: '47%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingVertical: 20,
    alignItems: 'center',
    gap: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  mapCellDone: {
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  mapCellCurrent: {
    borderWidth: 2,
    borderColor: '#FFB300',
  },
  mapCellLocked: {
    backgroundColor: '#F5F5F5',
    shadowOpacity: 0,
    elevation: 0,
  },
  mapEmoji: {
    fontSize: 48,
  },
  emojiLocked: {
    opacity: 0.4,
  },
  mapLabel: {
    fontSize: 15,
    fontFamily: 'Pretendard-SemiBold',
    color: '#2E3A23',
  },
  labelLocked: {
    color: '#BDBDBD',
  },
  mapDoneTag: {
    fontSize: 12,
    fontFamily: 'Pretendard-Medium',
    color: '#4CAF50',
    marginTop: 2,
  },
  mapProgressText: {
    fontSize: 12,
    fontFamily: 'Pretendard-Regular',
    color: '#FFB300',
    marginTop: 2,
    fontVariant: ['tabular-nums'],
  },
  sectionLabel: {
    fontSize: 14,
    fontFamily: 'Pretendard-SemiBold',
    color: '#6A7B5A',
    paddingHorizontal: 4,
  },
  seedCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingVertical: 4,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  seedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    gap: 12,
  },
  seedDivider: {
    height: 1,
    backgroundColor: '#F0F4E8',
  },
  seedEmoji: {
    fontSize: 28,
    width: 36,
    textAlign: 'center',
  },
  seedInfo: {
    flex: 1,
  },
  seedCondition: {
    fontSize: 14,
    fontFamily: 'Pretendard-Medium',
    color: '#2E3A23',
  },
  seedCount: {
    fontSize: 18,
    fontFamily: 'Pretendard-Bold',
    fontVariant: ['tabular-nums'],
  },
  emptyBox: {
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 15,
    fontFamily: 'Pretendard-Regular',
    color: '#9E9E9E',
  },
  sessionList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  sessionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F4E8',
    gap: 8,
  },
  sessionDate: {
    fontSize: 14,
    fontFamily: 'Pretendard-Medium',
    color: '#6A7B5A',
    width: 40,
    fontVariant: ['tabular-nums'],
  },
  sessionSeeds: {
    flex: 1,
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  seedChip: {
    fontSize: 13,
    fontFamily: 'Pretendard-Regular',
    color: '#2E3A23',
  },
  sessionTotal: {
    fontSize: 14,
    fontFamily: 'Pretendard-SemiBold',
    color: '#2E3A23',
    fontVariant: ['tabular-nums'],
    minWidth: 32,
    textAlign: 'right',
  },
  sessionCombo: {
    fontSize: 12,
    fontFamily: 'Pretendard-Regular',
    color: '#FF7043',
    minWidth: 44,
    textAlign: 'right',
  },
});
