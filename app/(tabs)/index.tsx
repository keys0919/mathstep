import { View, Text, Pressable, StyleSheet, Image, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useProgressStore } from '../../src/stores/progress.store';
import { useConfigStore } from '../../src/stores/config.store';
import { useSessionStore } from '../../src/stores/session.store';

const { width: SW, height: SH } = Dimensions.get('window');

const MAP_COLOR: Record<string, string> = {
  forest: '#4CAF50', flower: '#FF80AB', ocean: '#40C4FF', sky: '#CE93D8',
};
const MAP_LABEL: Record<string, string> = {
  forest: '숲', flower: '꽃밭', ocean: '바다정원', sky: '하늘정원',
};

// 정적 require로 번들링 보장
const CHAR_IMAGES = [
  require('../../assets/characters/1.png'),
  require('../../assets/characters/2.png'),
  require('../../assets/characters/3.png'),
  require('../../assets/characters/4.png'),
  require('../../assets/characters/5.png'),
];

const CHAR_STAGES = [
  { minSeeds: 0,  imgIdx: 0, label: '씨앗 단계',  messages: ['안녕! 같이 수학 공부 시작해보자! 🌱', '씨앗을 모아서 정원을 꾸며볼까?'] },
  { minSeeds: 5,  imgIdx: 1, label: '새싹 단계',  messages: ['오! 씨앗이 모이고 있어! 더 열심히!', '조금씩 자라고 있어, 잘하고 있어!'] },
  { minSeeds: 15, imgIdx: 2, label: '꽃 단계',    messages: ['정원이 예뻐졌어! 네 덕분이야! 🌸', '꽃이 활짝 피었어! 정말 대단해!'] },
  { minSeeds: 30, imgIdx: 3, label: '나무 단계',  messages: ['나무도 자라고 있어! 거의 다 왔어! 🌳', '이제 어려운 문제도 거뜬해!'] },
  { minSeeds: 50, imgIdx: 4, label: '마스터',     messages: ['수학 마스터! 정원이 완성됐어! 👑', '최고야! 정원의 왕이 됐어! ✨'] },
];

function getStage(totalSeeds: number) {
  let s = CHAR_STAGES[0];
  for (const st of CHAR_STAGES) { if (totalSeeds >= st.minSeeds) s = st; }
  return s;
}
function getNextThreshold(totalSeeds: number) {
  for (const st of CHAR_STAGES) { if (totalSeeds < st.minSeeds) return st.minSeeds; }
  return null;
}
function getMessage(stage: typeof CHAR_STAGES[0], streak: number) {
  if (streak >= 7) return `${streak}일 연속 학습 중! 🔥 정말 대단해!`;
  if (streak >= 3) return `${streak}일 연속! 🔥 잘하고 있어!`;
  return stage.messages[Math.floor(Date.now() / 86400000) % stage.messages.length];
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
  const stage = getStage(totalSeeds);
  const nextThreshold = getNextThreshold(totalSeeds);
  const message = getMessage(stage, state.streak);

  const imgSize = Math.min(SW - 32, SH * 0.44);

  const handleStart = () => {
    resetSession();
    router.push('/(session)/mult-table');
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>

      {/* 상단 바 */}
      <View style={styles.topBar}>
        <View style={styles.stageTag}>
          <Text style={styles.stageTagText}>{stage.label}</Text>
        </View>
        {state.streak > 0 && (
          <View style={styles.streakPill}>
            <Text style={styles.streakText}>🔥 {state.streak}일 연속</Text>
          </View>
        )}
      </View>

      {/* 캐릭터 히어로 */}
      <View style={styles.heroWrap}>
        <Image
          source={CHAR_IMAGES[stage.imgIdx]}
          style={[styles.heroImage, { width: imgSize, height: imgSize }]}
          resizeMode="cover"
        />
        {/* 말풍선 */}
        <View style={styles.bubble}>
          <Text style={styles.bubbleText}>{message}</Text>
        </View>
      </View>

      {/* 씨앗 현황 */}
      <View style={styles.seedStrip}>
        <SeedPill emoji="🌱" count={allSeeds.normal} color="#4CAF50" />
        <SeedPill emoji="🌺" count={allSeeds.rare} color="#FF80AB" />
        <SeedPill emoji="✨" count={allSeeds.special} color="#FF9800" />
        <View style={styles.seedSpacer} />
        {nextThreshold !== null ? (
          <Text style={styles.seedNextText}>다음 {nextThreshold - totalSeeds}개 🌱</Text>
        ) : (
          <Text style={[styles.seedNextText, { color: '#4CAF50' }]}>최고 단계 👑</Text>
        )}
      </View>

      {/* 맵 진행 */}
      <View style={styles.mapRow}>
        <Text style={styles.mapName}>{mapLabel} 맵</Text>
        <View style={styles.mapProgressWrap}>
          <View style={styles.mapTrack}>
            <View
              style={[
                styles.mapFill,
                {
                  backgroundColor: mapColor,
                  width: `${Math.round((state.sessionsCompleted / config.sessionsPerMap) * 100)}%`,
                },
              ]}
            />
          </View>
        </View>
        <Text style={[styles.mapCount, { color: mapColor }]}>
          {state.sessionsCompleted}/{config.sessionsPerMap}
        </Text>
      </View>

      <View style={styles.spacer} />

      {/* 시작 버튼 */}
      <Pressable
        style={({ pressed }) => [
          styles.startBtn,
          { backgroundColor: mapColor, transform: [{ scale: pressed ? 0.97 : 1 }] },
        ]}
        onPress={handleStart}
      >
        <Text style={styles.startBtnText}>세션 시작하기</Text>
      </Pressable>

      <View style={styles.bottomPad} />
    </View>
  );
}

function SeedPill({ emoji, count, color }: { emoji: string; count: number; color: string }) {
  return (
    <View style={[styles.seedPill, { borderColor: color + '44' }]}>
      <Text style={styles.seedPillEmoji}>{emoji}</Text>
      <Text style={[styles.seedPillCount, { color }]}>{count}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F9FBE7',
    paddingHorizontal: 16,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  stageTag: {
    backgroundColor: '#E8F5E9',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  stageTagText: {
    fontSize: 12,
    fontFamily: 'Pretendard-SemiBold',
    color: '#4CAF50',
  },
  streakPill: {
    backgroundColor: '#FFF3E0',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  streakText: {
    fontSize: 12,
    fontFamily: 'Pretendard-SemiBold',
    color: '#FF7043',
  },
  heroWrap: {
    alignItems: 'center',
    marginTop: 4,
    gap: 12,
  },
  heroImage: {
    borderRadius: 36,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 8,
  },
  bubble: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
    borderWidth: 1.5,
    borderColor: '#E8F5E9',
  },
  bubbleText: {
    fontSize: 15,
    fontFamily: 'Pretendard-SemiBold',
    color: '#2E3A23',
    textAlign: 'center',
  },
  seedStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
    paddingHorizontal: 4,
  },
  seedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1.5,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  seedPillEmoji: { fontSize: 14 },
  seedPillCount: {
    fontSize: 14,
    fontFamily: 'Pretendard-Bold',
    fontVariant: ['tabular-nums'],
  },
  seedSpacer: { flex: 1 },
  seedNextText: {
    fontSize: 12,
    fontFamily: 'Pretendard-Medium',
    color: '#6A7B5A',
  },
  mapRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  mapName: {
    fontSize: 14,
    fontFamily: 'Pretendard-SemiBold',
    color: '#2E3A23',
    minWidth: 60,
  },
  mapProgressWrap: {
    flex: 1,
  },
  mapTrack: {
    height: 8,
    backgroundColor: '#EEF2E6',
    borderRadius: 4,
    overflow: 'hidden',
  },
  mapFill: {
    height: '100%',
    borderRadius: 4,
  },
  mapCount: {
    fontSize: 13,
    fontFamily: 'Pretendard-Bold',
    fontVariant: ['tabular-nums'],
    minWidth: 36,
    textAlign: 'right',
  },
  spacer: { flex: 1 },
  startBtn: {
    height: 60,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 8,
  },
  startBtnText: {
    fontSize: 19,
    fontFamily: 'Pretendard-Bold',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  bottomPad: { height: 12 },
});
