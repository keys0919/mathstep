import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useProgressStore } from '../src/stores/progress.store';
import { useConfigStore } from '../src/stores/config.store';
import { useSessionStore } from '../src/stores/session.store';
import ProgressBar from '../src/components/ProgressBar';

const MAP_LABEL: Record<string, string> = {
  forest: '숲',
  flower: '꽃밭',
  ocean: '바다정원',
  sky: '하늘정원',
};

const MAP_COLOR: Record<string, string> = {
  forest: '#4CAF50',
  flower: '#FF80AB',
  ocean: '#40C4FF',
  sky: '#CE93D8',
};

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { state } = useProgressStore();
  const { config } = useConfigStore();
  const resetSession = useSessionStore((s) => s.reset);

  const mapLabel = MAP_LABEL[state.currentMap] ?? '숲';
  const mapColor = MAP_COLOR[state.currentMap] ?? '#4CAF50';
  const sessionProgress = state.sessionsCompleted;
  const sessionsPerMap = config.sessionsPerMap;

  const growthStage = (() => {
    const s = sessionProgress;
    if (s <= 2) return '새싹 단계까지 ' + (3 - s) + '세션 남음';
    if (s <= 5) return '꽃 단계까지 ' + (6 - s) + '세션 남음';
    if (s <= 8) return '만개까지 ' + (9 - s) + '세션 남음';
    return '맵 완성까지 ' + (sessionsPerMap - s) + '세션 남음';
  })();

  const handleStart = () => {
    resetSession();
    router.push('/(session)/mult-table');
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* 캐릭터 + 인사 */}
        <View style={styles.characterArea}>
          <Text style={styles.character}>🐰</Text>
          <Text style={styles.greeting}>오늘도 함께 해보자!</Text>
        </View>

        {/* 맵 진행 카드 */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>{mapLabel} 맵</Text>
            <Text style={styles.cardSub}>{sessionProgress} / {sessionsPerMap}</Text>
          </View>
          <ProgressBar
            current={sessionProgress}
            total={sessionsPerMap}
            color={mapColor}
          />
          <Text style={styles.growthHint}>{growthStage}</Text>
        </View>

        {/* 스트릭 */}
        {state.streak > 0 && (
          <View style={styles.streakRow}>
            <Text style={styles.streakDot}>●</Text>
            <Text style={styles.streakText}>{state.streak}일 연속 학습 중!</Text>
          </View>
        )}

        {/* 오늘 세션 구성 */}
        <View style={styles.sessionInfo}>
          <Text style={styles.sessionInfoLabel}>오늘 세션 구성</Text>
          <Text style={styles.sessionInfoValue}>
            구구단 {config.multTablePerSession} · 암산 {config.mentalPerSession} · 세자리수
          </Text>
        </View>

        {/* 세션 시작 버튼 */}
        <Pressable
          style={({ pressed }) => [styles.startBtn, { backgroundColor: pressed ? '#388E3C' : mapColor }]}
          onPress={handleStart}
        >
          <Text style={styles.startBtnText}>세션 시작하기</Text>
        </Pressable>

        {/* 하단 보조 버튼 */}
        <View style={styles.bottomRow}>
          <Pressable style={styles.textBtn} onPress={() => router.push('/garden')}>
            <Text style={styles.textBtnLabel}>정원 보기</Text>
          </Pressable>
          <Pressable style={styles.textBtn} onPress={() => router.push('/garden')}>
            <Text style={styles.textBtnLabel}>히스토리</Text>
          </Pressable>
        </View>

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
    paddingTop: 16,
    paddingBottom: 32,
    gap: 20,
  },
  characterArea: {
    alignItems: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  character: {
    fontSize: 80,
  },
  greeting: {
    fontSize: 20,
    fontFamily: 'Pretendard-SemiBold',
    color: '#2E3A23',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 17,
    fontFamily: 'Pretendard-Bold',
    color: '#2E3A23',
  },
  cardSub: {
    fontSize: 14,
    fontFamily: 'Pretendard-Medium',
    color: '#6A7B5A',
  },
  growthHint: {
    fontSize: 13,
    fontFamily: 'Pretendard-Regular',
    color: '#6A7B5A',
  },
  streakRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 4,
  },
  streakDot: {
    fontSize: 10,
    color: '#FF7043',
  },
  streakText: {
    fontSize: 15,
    fontFamily: 'Pretendard-SemiBold',
    color: '#FF7043',
  },
  sessionInfo: {
    gap: 4,
    paddingHorizontal: 4,
  },
  sessionInfoLabel: {
    fontSize: 13,
    fontFamily: 'Pretendard-Regular',
    color: '#6A7B5A',
  },
  sessionInfoValue: {
    fontSize: 16,
    fontFamily: 'Pretendard-Medium',
    color: '#2E3A23',
  },
  startBtn: {
    height: 56,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  startBtnText: {
    fontSize: 18,
    fontFamily: 'Pretendard-Bold',
    color: '#FFFFFF',
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 32,
  },
  textBtn: {
    padding: 8,
  },
  textBtnLabel: {
    fontSize: 15,
    fontFamily: 'Pretendard-Medium',
    color: '#6A7B5A',
  },
});
