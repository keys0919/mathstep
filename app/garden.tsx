import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useProgressStore } from '../src/stores/progress.store';

const GROWTH_STAGES = [
  { threshold: 0,  emoji: '🌱', label: '새싹' },
  { threshold: 10, emoji: '🌿', label: '성장 중' },
  { threshold: 30, emoji: '🪴', label: '무럭무럭' },
  { threshold: 60, emoji: '🌳', label: '나무로 성장' },
  { threshold: 100, emoji: '🌲', label: '완성' },
];

function getGrowthStage(totalSeeds: number) {
  let stage = GROWTH_STAGES[0];
  for (const s of GROWTH_STAGES) {
    if (totalSeeds >= s.threshold) stage = s;
  }
  return stage;
}

function formatDate(dateStr: string): string {
  const [, m, d] = dateStr.split('-');
  return `${Number(m)}/${Number(d)}`;
}

export default function GardenScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { sessions } = useProgressStore();

  const allSeeds = sessions.reduce(
    (acc, s) => ({
      normal: acc.normal + s.seeds.normal,
      rare: acc.rare + s.seeds.rare,
      special: acc.special + s.seeds.special,
    }),
    { normal: 0, rare: 0, special: 0 }
  );
  const totalSeeds = allSeeds.normal + allSeeds.rare + allSeeds.special;
  const stage = getGrowthStage(totalSeeds);

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

        {/* 성장 단계 카드 */}
        <View style={styles.stageCard}>
          <Text style={styles.stageEmoji}>{stage.emoji}</Text>
          <Text style={styles.stageLabel}>{stage.label}</Text>
          <Text style={styles.stageSeedCount}>씨앗 {totalSeeds}개 보유</Text>
          <View style={styles.seedTotalRow}>
            <Text style={styles.seedTypeText}>🌱 {allSeeds.normal}</Text>
            <Text style={styles.seedTypeText}>🌺 {allSeeds.rare}</Text>
            <Text style={styles.seedTypeText}>✨ {allSeeds.special}</Text>
          </View>
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
                    {s.seeds.normal > 0 && (
                      <Text style={styles.seedChip}>🌱×{s.seeds.normal}</Text>
                    )}
                    {s.seeds.rare > 0 && (
                      <Text style={styles.seedChip}>🌺×{s.seeds.rare}</Text>
                    )}
                    {s.seeds.special > 0 && (
                      <Text style={styles.seedChip}>✨×{s.seeds.special}</Text>
                    )}
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
  stageCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  stageEmoji: {
    fontSize: 72,
    marginBottom: 4,
  },
  stageLabel: {
    fontSize: 18,
    fontFamily: 'Pretendard-SemiBold',
    color: '#2E3A23',
  },
  stageSeedCount: {
    fontSize: 14,
    fontFamily: 'Pretendard-Regular',
    color: '#6A7B5A',
  },
  seedTotalRow: {
    flexDirection: 'row',
    gap: 20,
    marginTop: 8,
  },
  seedTypeText: {
    fontSize: 16,
    fontFamily: 'Pretendard-Medium',
    color: '#2E3A23',
    fontVariant: ['tabular-nums'],
  },
  sectionLabel: {
    fontSize: 14,
    fontFamily: 'Pretendard-SemiBold',
    color: '#6A7B5A',
    paddingHorizontal: 4,
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
