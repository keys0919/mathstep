import { useEffect, useRef } from 'react';
import { View, Text, Pressable, StyleSheet, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSessionStore } from '../../src/stores/session.store';
import { useProgressStore } from '../../src/stores/progress.store';
import { useConfigStore } from '../../src/stores/config.store';
import { todayStr } from '../../src/utils/storage';

const MAP_LABEL: Record<string, string> = {
  forest: '숲', flower: '꽃밭', ocean: '바다정원', sky: '하늘정원',
};
const MAP_COLOR: Record<string, string> = {
  forest: '#4CAF50', flower: '#FF80AB', ocean: '#40C4FF', sky: '#CE93D8',
};

export default function CompleteScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { seeds, maxCombo, multTableResults, mentalCorrect, mentalTotal, bigNumBoxes, bigNumQuestions } = useSessionStore();
  const { saveSession, state } = useProgressStore();
  const { config } = useConfigStore();

  const savedRef = useRef(false);
  const seedScale = useRef(new Animated.Value(0)).current;
  const statsOpacity = useRef(new Animated.Value(0)).current;

  const totalSeeds = seeds.normal + seeds.rare + seeds.special;
  const mapColor = MAP_COLOR[state.currentMap] ?? '#4CAF50';
  const mapLabel = MAP_LABEL[state.currentMap] ?? '숲';

  useEffect(() => {
    if (savedRef.current) return;
    savedRef.current = true;

    const correctResults = multTableResults.filter((r) => r.correct);
    const avgTimeSec =
      correctResults.length > 0
        ? correctResults.reduce((acc, r) => acc + r.timeSec, 0) / correctResults.length
        : 0;

    saveSession({
      date: todayStr(),
      seeds,
      maxCombo,
      multTable: {
        correct: correctResults.length,
        total: multTableResults.length,
        avgTimeSec: Math.round(avgTimeSec * 10) / 10,
      },
      mental: { correct: mentalCorrect, total: mentalTotal },
      bigNum: { boxesCompleted: bigNumBoxes, questionsCompleted: bigNumQuestions },
    });

    Animated.sequence([
      Animated.spring(seedScale, { toValue: 1, useNativeDriver: true, friction: 6, tension: 80 }),
      Animated.timing(statsOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 32, paddingBottom: insets.bottom + 24 }]}>

      {/* 완료 헤더 */}
      <View style={styles.header}>
        <Text style={styles.emoji}>🎉</Text>
        <Text style={styles.title}>세션 완료!</Text>
        <Text style={styles.subtitle}>오늘도 정말 잘했어!</Text>
      </View>

      {/* 씨앗 카드 */}
      <Animated.View style={[styles.seedCard, { transform: [{ scale: seedScale }] }]}>
        <Text style={styles.seedCardTitle}>오늘 획득한 씨앗</Text>
        <Text style={styles.totalSeeds}>{totalSeeds}개</Text>
        <View style={styles.seedRow}>
          <SeedItem emoji="🌱" count={seeds.normal} label="일반" />
          <SeedItem emoji="🌺" count={seeds.rare} label="희귀" />
          <SeedItem emoji="✨" count={seeds.special} label="특별" />
        </View>
      </Animated.View>

      {/* 통계 카드 */}
      <Animated.View style={[styles.statsCard, { opacity: statsOpacity }]}>
        {maxCombo > 0 && <StatRow label="최고 콤보" value={`${maxCombo}콤보`} />}
        {multTableResults.length > 0 && (
          <StatRow
            label="구구단"
            value={`${multTableResults.filter((r) => r.correct).length}/${multTableResults.length}`}
          />
        )}
        {mentalTotal > 0 && (
          <StatRow label="암산" value={`${mentalCorrect}/${mentalTotal}`} />
        )}
        <StatRow
          label={`${mapLabel} 맵`}
          value={`${state.sessionsCompleted}/${config.sessionsPerMap}`}
        />
      </Animated.View>

      <View style={styles.spacer} />

      {/* 홈 버튼 */}
      <Pressable
        style={({ pressed }) => [styles.homeBtn, { backgroundColor: pressed ? '#388E3C' : mapColor }]}
        onPress={() => router.replace('/')}
      >
        <Text style={styles.homeBtnText}>홈으로 가기</Text>
      </Pressable>

      <Pressable style={styles.gardenBtn} onPress={() => router.replace('/garden')}>
        <Text style={styles.gardenBtnText}>정원 보기</Text>
      </Pressable>

    </View>
  );
}

function SeedItem({ emoji, count, label }: { emoji: string; count: number; label: string }) {
  return (
    <View style={styles.seedItem}>
      <Text style={styles.seedEmoji}>{emoji}</Text>
      <Text style={styles.seedCount}>{count}</Text>
      <Text style={styles.seedLabel}>{label}</Text>
    </View>
  );
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statRow}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F9FBE7',
    paddingHorizontal: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 28,
    gap: 6,
  },
  emoji: {
    fontSize: 64,
    marginBottom: 4,
  },
  title: {
    fontSize: 28,
    fontFamily: 'Pretendard-Bold',
    color: '#2E3A23',
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Pretendard-Regular',
    color: '#6A7B5A',
  },
  seedCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    gap: 8,
  },
  seedCardTitle: {
    fontSize: 14,
    fontFamily: 'Pretendard-Regular',
    color: '#6A7B5A',
  },
  totalSeeds: {
    fontSize: 36,
    fontFamily: 'Pretendard-Bold',
    color: '#2E3A23',
    fontVariant: ['tabular-nums'],
  },
  seedRow: {
    flexDirection: 'row',
    gap: 24,
    marginTop: 4,
  },
  seedItem: {
    alignItems: 'center',
    gap: 2,
  },
  seedEmoji: {
    fontSize: 28,
  },
  seedCount: {
    fontSize: 20,
    fontFamily: 'Pretendard-Bold',
    color: '#2E3A23',
    fontVariant: ['tabular-nums'],
  },
  seedLabel: {
    fontSize: 12,
    fontFamily: 'Pretendard-Regular',
    color: '#6A7B5A',
  },
  statsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 15,
    fontFamily: 'Pretendard-Regular',
    color: '#6A7B5A',
  },
  statValue: {
    fontSize: 15,
    fontFamily: 'Pretendard-SemiBold',
    color: '#2E3A23',
    fontVariant: ['tabular-nums'],
  },
  spacer: {
    flex: 1,
  },
  homeBtn: {
    height: 56,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
    marginBottom: 12,
  },
  homeBtnText: {
    fontSize: 18,
    fontFamily: 'Pretendard-Bold',
    color: '#FFFFFF',
  },
  gardenBtn: {
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gardenBtnText: {
    fontSize: 15,
    fontFamily: 'Pretendard-Medium',
    color: '#6A7B5A',
  },
});
