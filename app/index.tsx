import { View, Text, Pressable, StyleSheet, Image, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useProgressStore } from '../src/stores/progress.store';
import { useConfigStore } from '../src/stores/config.store';
import { useSessionStore } from '../src/stores/session.store';
import ProgressBar from '../src/components/ProgressBar';

const { width: SCREEN_W } = Dimensions.get('window');

const MAP_COLOR: Record<string, string> = {
  forest: '#4CAF50',
  flower: '#FF80AB',
  ocean: '#40C4FF',
  sky: '#CE93D8',
};

const MAP_LABEL: Record<string, string> = {
  forest: '숲',
  flower: '꽃밭',
  ocean: '바다정원',
  sky: '하늘정원',
};

const CHARACTER_STAGES = [
  {
    minSeeds: 0,
    image: require('../assets/characters/1.png'),
    messages: [
      '안녕! 같이 수학 공부 시작해보자! 🌱',
      '씨앗을 모아서 정원을 꾸며볼까?',
      '오늘 첫 번째 씨앗을 모아보자!',
    ],
  },
  {
    minSeeds: 5,
    image: require('../assets/characters/2.png'),
    messages: [
      '오! 씨앗이 모이고 있어! 더 열심히 해봐!',
      '조금씩 자라고 있어, 잘하고 있어!',
      '구구단 연습하면 씨앗이 쑥쑥 늘어나!',
    ],
  },
  {
    minSeeds: 15,
    image: require('../assets/characters/3.png'),
    messages: [
      '정원이 이렇게 예뻐졌어! 네 덕분이야! 🌸',
      '꽃이 활짝 피었어! 정말 대단해!',
      '콤보 10개 달성하면 희귀 씨앗도 생겨!',
    ],
  },
  {
    minSeeds: 30,
    image: require('../assets/characters/4.png'),
    messages: [
      '나무도 자라고 있어! 거의 다 왔어! 🌳',
      '이제 어려운 문제도 거뜬해! 대단해!',
      '100% 정답이면 특별 씨앗도 생겨! ✨',
    ],
  },
  {
    minSeeds: 50,
    image: require('../assets/characters/5.png'),
    messages: [
      '수학 마스터! 정원이 완성됐어! 👑',
      '최고야! 정원의 왕이 됐어! ✨',
      '어떤 문제도 겁나지 않아! 대단해!',
    ],
  },
];

function getCharacterStage(totalSeeds: number) {
  let stage = CHARACTER_STAGES[0];
  for (const s of CHARACTER_STAGES) {
    if (totalSeeds >= s.minSeeds) stage = s;
  }
  return stage;
}

function getNextThreshold(totalSeeds: number): number | null {
  for (const s of CHARACTER_STAGES) {
    if (totalSeeds < s.minSeeds) return s.minSeeds;
  }
  return null;
}

function getDailyMessage(stage: (typeof CHARACTER_STAGES)[0], streak: number): string {
  if (streak >= 7) return `${streak}일 연속 학습 중! 정말 대단해! 🔥`;
  if (streak >= 3) return `${streak}일 연속! 잘하고 있어! 🔥`;
  const dayIndex = Math.floor(Date.now() / 86400000) % stage.messages.length;
  return stage.messages[dayIndex];
}

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { state, sessions } = useProgressStore();
  const { config } = useConfigStore();
  const resetSession = useSessionStore((s) => s.reset);

  const mapColor = MAP_COLOR[state.currentMap] ?? '#4CAF50';
  const mapLabel = MAP_LABEL[state.currentMap] ?? '숲';

  const allSeeds = sessions.reduce(
    (acc, s) => ({
      normal: acc.normal + s.seeds.normal,
      rare: acc.rare + s.seeds.rare,
      special: acc.special + s.seeds.special,
    }),
    { normal: 0, rare: 0, special: 0 }
  );
  const totalSeeds = allSeeds.normal + allSeeds.rare + allSeeds.special;

  const charStage = getCharacterStage(totalSeeds);
  const nextThreshold = getNextThreshold(totalSeeds);
  const message = getDailyMessage(charStage, state.streak);

  const charSize = Math.min(SCREEN_W * 0.72, 280);

  const handleStart = () => {
    resetSession();
    router.push('/(session)/mult-table');
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 20 }]}>

      {/* 스트릭 배지 */}
      {state.streak > 0 && (
        <View style={styles.streakBadge}>
          <Text style={styles.streakText}>🔥 {state.streak}일 연속</Text>
        </View>
      )}

      {/* 캐릭터 + 말풍선 */}
      <View style={styles.characterSection}>
        <Image
          source={charStage.image}
          style={[styles.characterImage, { width: charSize, height: charSize }]}
          resizeMode="contain"
        />
        <View style={styles.speechBubble}>
          <Text style={styles.speechText}>{message}</Text>
        </View>
      </View>

      {/* 씨앗 현황 */}
      <View style={styles.seedsCard}>
        <View style={styles.seedsRow}>
          <Text style={styles.seedsTotal}>씨앗 {totalSeeds}개</Text>
          {nextThreshold !== null ? (
            <Text style={styles.seedsNext}>
              다음 단계까지 {nextThreshold - totalSeeds}개 🌱
            </Text>
          ) : (
            <Text style={[styles.seedsNext, styles.seedsMaxed]}>최고 단계 달성! ✨</Text>
          )}
        </View>
        <View style={styles.seedTypes}>
          <Text style={styles.seedType}>🌱 ×{allSeeds.normal}</Text>
          <Text style={styles.seedType}>🌺 ×{allSeeds.rare}</Text>
          <Text style={styles.seedType}>✨ ×{allSeeds.special}</Text>
        </View>
      </View>

      {/* 맵 진행 */}
      <View style={styles.mapCard}>
        <View style={styles.mapHeader}>
          <Text style={styles.mapLabel}>{mapLabel} 맵</Text>
          <Text style={styles.mapSub}>{state.sessionsCompleted} / {config.sessionsPerMap}</Text>
        </View>
        <ProgressBar current={state.sessionsCompleted} total={config.sessionsPerMap} color={mapColor} />
      </View>

      <View style={styles.spacer} />

      {/* 시작 버튼 */}
      <Pressable
        style={({ pressed }) => [styles.startBtn, { backgroundColor: pressed ? '#388E3C' : mapColor }]}
        onPress={handleStart}
      >
        <Text style={styles.startBtnText}>세션 시작하기</Text>
      </Pressable>

      <View style={styles.bottomRow}>
        <Pressable style={styles.textBtn} onPress={() => router.push('/garden')}>
          <Text style={styles.textBtnLabel}>정원 보기</Text>
        </Pressable>
        <Pressable style={styles.textBtn} onPress={() => router.push('/history' as never)}>
          <Text style={styles.textBtnLabel}>히스토리</Text>
        </Pressable>
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F9FBE7',
    paddingHorizontal: 20,
  },
  streakBadge: {
    alignSelf: 'flex-end',
    backgroundColor: '#FFF3E0',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginBottom: 4,
  },
  streakText: {
    fontSize: 13,
    fontFamily: 'Pretendard-SemiBold',
    color: '#FF7043',
  },
  characterSection: {
    alignItems: 'center',
    gap: 10,
  },
  characterImage: {
    borderRadius: 32,
  },
  speechBubble: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  speechText: {
    fontSize: 15,
    fontFamily: 'Pretendard-SemiBold',
    color: '#2E3A23',
    textAlign: 'center',
  },
  seedsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 14,
    gap: 8,
    marginTop: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
  },
  seedsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  seedsTotal: {
    fontSize: 16,
    fontFamily: 'Pretendard-Bold',
    color: '#2E3A23',
  },
  seedsNext: {
    fontSize: 12,
    fontFamily: 'Pretendard-Regular',
    color: '#6A7B5A',
  },
  seedsMaxed: {
    color: '#4CAF50',
    fontFamily: 'Pretendard-SemiBold',
  },
  seedTypes: {
    flexDirection: 'row',
    gap: 16,
  },
  seedType: {
    fontSize: 14,
    fontFamily: 'Pretendard-Medium',
    color: '#2E3A23',
    fontVariant: ['tabular-nums'],
  },
  mapCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 14,
    gap: 10,
    marginTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
  },
  mapHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  mapLabel: {
    fontSize: 15,
    fontFamily: 'Pretendard-Bold',
    color: '#2E3A23',
  },
  mapSub: {
    fontSize: 13,
    fontFamily: 'Pretendard-Medium',
    color: '#6A7B5A',
    fontVariant: ['tabular-nums'],
  },
  spacer: {
    flex: 1,
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
    gap: 40,
    marginTop: 12,
  },
  textBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  textBtnLabel: {
    fontSize: 15,
    fontFamily: 'Pretendard-Medium',
    color: '#6A7B5A',
  },
});
