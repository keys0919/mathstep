import { View, Text, Pressable, StyleSheet, Image, ImageSourcePropType, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useProgressStore } from '../../src/stores/progress.store';
import { useConfigStore } from '../../src/stores/config.store';
import { useSessionStore } from '../../src/stores/session.store';

// ─── 상수 ────────────────────────────────────────────────────────────
const MAP_COLOR: Record<string, string> = {
  forest: '#4CAF50', flower: '#E91E8C', ocean: '#0288D1', sky: '#7B1FA2',
};
const MAP_BG: Record<string, string> = {
  forest: '#A5D6A7', flower: '#F48FB1', ocean: '#81D4FA', sky: '#CE93D8',
};
const MAP_LABEL: Record<string, string> = {
  forest: '숲', flower: '꽃밭', ocean: '바다', sky: '하늘',
};

// ─── 에셋 (static require) ────────────────────────────────────────────
const CHAR_IMAGES = [
  require('../../assets/characters/1.png'),
  require('../../assets/characters/2.png'),
  require('../../assets/characters/3.png'),
  require('../../assets/characters/4.png'),
  require('../../assets/characters/5.png'),
];

const NATURE: Record<string, ImageSourcePropType> = {
  // 숲
  tree_oak:   require('../../assets/nature/tree_oak.png'),
  plant_bush: require('../../assets/nature/plant_bush.png'),
  // 꽃밭
  flower_red:    require('../../assets/nature/flower_red.png'),
  flower_purple: require('../../assets/nature/flower_purple.png'),
  flower_yellow: require('../../assets/nature/flower_yellow.png'),
  // 바다
  tree_palm:  require('../../assets/nature/tree_palm.png'),
  grass_leafs: require('../../assets/nature/grass_leafs.png'),
  // 하늘
  tree_pine:       require('../../assets/nature/tree_pine.png'),
  tree_pine_small: require('../../assets/nature/tree_pine_small.png'),
  // 씨앗
  sprout_a: require('../../assets/nature/sprout_a.png'),
  flower_r: require('../../assets/nature/flower_red.png'),
};

const ICONS: Record<string, ImageSourcePropType> = {
  star:   require('../../assets/icons/star.png'),
  trophy: require('../../assets/icons/trophy.png'),
};

// 맵별 zone 스프라이트
const MAP_SPRITES: Record<string, { src: ImageSourcePropType; w: number; h: number }[]> = {
  forest: [
    { src: NATURE.tree_oak,   w: 40, h: 72 },
    { src: NATURE.plant_bush, w: 30, h: 22 },
  ],
  flower: [
    { src: NATURE.flower_red,    w: 20, h: 36 },
    { src: NATURE.flower_purple, w: 20, h: 36 },
    { src: NATURE.flower_yellow, w: 20, h: 36 },
  ],
  ocean: [
    { src: NATURE.tree_palm,   w: 44, h: 70 },
    { src: NATURE.grass_leafs, w: 28, h: 20 },
  ],
  sky: [
    { src: NATURE.tree_pine,       w: 32, h: 58 },
    { src: NATURE.tree_pine_small, w: 22, h: 42 },
  ],
};

// ─── 캐릭터 단계 ──────────────────────────────────────────────────────
const CHAR_STAGES = [
  { minSeeds: 0,  imgIdx: 0, label: '씨앗 단계',
    messages: ['안녕! 같이 수학 공부 시작해보자!', '씨앗을 모아서 정원을 꾸며볼까?'] },
  { minSeeds: 5,  imgIdx: 1, label: '새싹 단계',
    messages: ['오! 씨앗이 모이고 있어! 더 열심히!', '조금씩 자라고 있어, 잘하고 있어!'] },
  { minSeeds: 15, imgIdx: 2, label: '꽃 단계',
    messages: ['정원이 예뻐졌어! 네 덕분이야!', '꽃이 활짝 피었어! 정말 대단해!'] },
  { minSeeds: 30, imgIdx: 3, label: '나무 단계',
    messages: ['나무도 자라고 있어! 거의 다 왔어!', '이제 어려운 문제도 거뜬해!'] },
  { minSeeds: 50, imgIdx: 4, label: '마스터',
    messages: ['수학 마스터! 정원이 완성됐어!', '최고야! 정원의 왕이 됐어!'] },
];

function getStage(n: number) {
  let s = CHAR_STAGES[0];
  for (const st of CHAR_STAGES) { if (n >= st.minSeeds) s = st; }
  return s;
}
function getNextThreshold(n: number) {
  for (const st of CHAR_STAGES) { if (n < st.minSeeds) return st.minSeeds; }
  return null;
}
function getMessage(stage: typeof CHAR_STAGES[0], streak: number) {
  if (streak >= 7) return `${streak}일 연속 학습 중! 정말 대단해!`;
  if (streak >= 3) return `${streak}일 연속! 잘하고 있어!`;
  return stage.messages[Math.floor(Date.now() / 86400000) % stage.messages.length];
}

// ─── 컴포넌트 ─────────────────────────────────────────────────────────
export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width: SW } = useWindowDimensions();   // ← hook으로 이동 (SSR 안전)

  const { state, sessions } = useProgressStore();
  const { config } = useConfigStore();
  const resetSession = useSessionStore((s) => s.reset);

  const mapColor  = MAP_COLOR[state.currentMap]  ?? '#4CAF50';
  const mapBg     = MAP_BG[state.currentMap]     ?? '#A5D6A7';
  const mapLabel  = MAP_LABEL[state.currentMap]  ?? '숲';
  const sprites   = MAP_SPRITES[state.currentMap] ?? MAP_SPRITES.forest;

  const allSeeds = sessions.reduce(
    (acc, s) => ({
      normal:  acc.normal  + s.seeds.normal,
      rare:    acc.rare    + s.seeds.rare,
      special: acc.special + s.seeds.special,
    }),
    { normal: 0, rare: 0, special: 0 }
  );
  const totalSeeds   = allSeeds.normal + allSeeds.rare + allSeeds.special;
  const stage        = getStage(totalSeeds);
  const nextThreshold = getNextThreshold(totalSeeds);
  const message      = getMessage(stage, state.streak);
  const progress     = Math.round((state.sessionsCompleted / config.sessionsPerMap) * 100);

  const charSize = Math.min(SW - 80, 240);   // 최대 240, 좌우 여백 확보

  const handleStart = () => {
    resetSession();
    router.push('/(session)/mult-table');
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>

      {/* ── 상단 바 ── */}
      <View style={styles.topBar}>
        <View style={[styles.stageTag, { backgroundColor: mapColor + '22' }]}>
          <Text style={[styles.stageTagText, { color: mapColor }]}>{stage.label}</Text>
        </View>
        {state.streak > 0 && (
          <View style={styles.streakPill}>
            <Text style={styles.streakText}>🔥 {state.streak}일 연속</Text>
          </View>
        )}
      </View>

      {/* ── 캐릭터 카드 ── */}
      <View style={[styles.charCard, { backgroundColor: mapBg + 'AA' }]}>
        {/* 스프라이트 장식 (왼쪽) */}
        <View style={styles.charSpritesLeft}>
          {sprites.slice(0, 1).map((sp, i) => (
            <Image key={i} source={sp.src} style={{ width: sp.w * 0.8, height: sp.h * 0.8 }} resizeMode="contain" />
          ))}
        </View>

        {/* 캐릭터 이미지 */}
        <View style={[styles.charImgWrap, { width: charSize, height: charSize, backgroundColor: mapBg }]}>
          <Image
            source={CHAR_IMAGES[stage.imgIdx]}
            style={styles.charImg}
            resizeMode="contain"
          />
        </View>

        {/* 스프라이트 장식 (오른쪽) */}
        <View style={styles.charSpritesRight}>
          {sprites.slice(1).map((sp, i) => (
            <Image key={i} source={sp.src} style={{ width: sp.w * 0.8, height: sp.h * 0.8 }} resizeMode="contain" />
          ))}
        </View>
      </View>

      {/* 말풍선 */}
      <View style={[styles.bubble, { borderColor: mapColor + '33' }]}>
        <Text style={styles.bubbleText}>{message}</Text>
      </View>

      {/* ── 정원 진행 카드 (동기부여 핵심) ── */}
      <View style={styles.gardenCard}>
        <View style={styles.gardenCardLeft}>
          <Text style={styles.gardenCardTitle}>{mapLabel} 정원</Text>
          <Text style={styles.gardenCardSub}>
            {state.sessionsCompleted < config.sessionsPerMap
              ? `완성까지 ${config.sessionsPerMap - state.sessionsCompleted}세션 남았어요`
              : '완성! 다음 맵이 열렸어요'}
          </Text>
          <View style={styles.gardenTrack}>
            <View style={[styles.gardenFill, { width: `${progress}%`, backgroundColor: mapColor }]} />
          </View>
          <Text style={[styles.gardenCount, { color: mapColor }]}>
            {state.sessionsCompleted} / {config.sessionsPerMap}
          </Text>
        </View>
        <View style={[styles.gardenSpritesBox, { backgroundColor: mapBg + '66' }]}>
          {sprites.map((sp, i) => (
            <Image key={i} source={sp.src} style={{ width: sp.w * 0.75, height: sp.h * 0.75 }} resizeMode="contain" />
          ))}
        </View>
      </View>

      {/* ── 씨앗 현황 (Kenney 스프라이트) ── */}
      <View style={styles.seedRow}>
        <SeedSlot sprite={NATURE.sprout_a} count={allSeeds.normal}  color="#4CAF50" bg="#E8F5E9" />
        <SeedSlot sprite={NATURE.flower_r} count={allSeeds.rare}    color="#E91E63" bg="#FCE4EC" />
        <SeedSlot sprite={ICONS.star}      count={allSeeds.special} color="#FF9800" bg="#FFF3E0" tintColor="#FF9800" />
        <View style={styles.seedSpacer} />
        {nextThreshold !== null ? (
          <Text style={styles.seedNextText}>다음 단계까지{'\n'}{nextThreshold - totalSeeds}개</Text>
        ) : (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Image source={ICONS.trophy} style={[styles.trophyIcon, { tintColor: '#FF9800' }]} />
            <Text style={[styles.seedNextText, { color: '#FF9800' }]}>마스터</Text>
          </View>
        )}
      </View>

      <View style={styles.spacer} />

      {/* ── 시작 버튼 ── */}
      <Pressable
        style={({ pressed }) => [
          styles.startBtn,
          { backgroundColor: mapColor, transform: [{ scale: pressed ? 0.97 : 1 }] },
        ]}
        onPress={handleStart}
      >
        <Text style={styles.startBtnText}>세션 시작하기</Text>
        <Text style={styles.startBtnSub}>완료하면 씨앗 +1 획득</Text>
      </Pressable>

      <View style={{ height: insets.bottom + 24 }} />
    </View>
  );
}

function SeedSlot({
  sprite, count, color, bg, tintColor,
}: {
  sprite: ImageSourcePropType;
  count: number; color: string; bg: string;
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
    </View>
  );
}

// ─── 스타일 ────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F9FBE7',
    paddingHorizontal: 16,
  },

  // 상단 바
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  stageTag: {
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  stageTagText: {
    fontSize: 12,
    fontFamily: 'Pretendard-SemiBold',
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

  // 캐릭터 카드
  charCard: {
    borderRadius: 28,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingHorizontal: 8,
    paddingBottom: 8,
    paddingTop: 16,
    overflow: 'hidden',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  charSpritesLeft: {
    alignItems: 'flex-end',
    justifyContent: 'flex-end',
    paddingBottom: 4,
    width: 48,
  },
  charSpritesRight: {
    alignItems: 'flex-start',
    justifyContent: 'flex-end',
    paddingBottom: 4,
    width: 48,
  },
  charImgWrap: {
    overflow: 'hidden',
    borderRadius: 20,
  },
  charImg: {
    width: '100%',
    height: '100%',
  },

  // 말풍선
  bubble: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingVertical: 11,
    paddingHorizontal: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1.5,
    marginBottom: 12,
  },
  bubbleText: {
    fontSize: 14,
    fontFamily: 'Pretendard-SemiBold',
    color: '#2E3A23',
    textAlign: 'center',
  },

  // 정원 진행 카드
  gardenCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 14,
    overflow: 'hidden',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 3,
    minHeight: 88,
  },
  gardenCardLeft: {
    flex: 1,
    paddingVertical: 14,
    gap: 4,
  },
  gardenCardTitle: {
    fontSize: 15,
    fontFamily: 'Pretendard-Bold',
    color: '#2E3A23',
  },
  gardenCardSub: {
    fontSize: 12,
    fontFamily: 'Pretendard-Regular',
    color: '#6A7B5A',
  },
  gardenTrack: {
    height: 7,
    backgroundColor: '#EEF2E6',
    borderRadius: 4,
    overflow: 'hidden',
    marginTop: 4,
  },
  gardenFill: {
    height: '100%',
    borderRadius: 4,
  },
  gardenCount: {
    fontSize: 12,
    fontFamily: 'Pretendard-SemiBold',
    fontVariant: ['tabular-nums'],
    marginTop: 2,
  },
  gardenSpritesBox: {
    width: 88,
    height: '100%',
    minHeight: 88,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 2,
    paddingHorizontal: 4,
    paddingBottom: 6,
  },

  // 씨앗 현황
  seedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  seedSlot: {
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 8,
    alignItems: 'center',
    flexDirection: 'row',
    gap: 5,
  },
  seedSlotSprite: { width: 22, height: 22 },
  seedSlotCount: {
    fontSize: 15,
    fontFamily: 'Pretendard-Bold',
    fontVariant: ['tabular-nums'],
  },
  seedSpacer: { flex: 1 },
  seedNextText: {
    fontSize: 11,
    fontFamily: 'Pretendard-Medium',
    color: '#6A7B5A',
    textAlign: 'right',
  },
  trophyIcon: { width: 16, height: 16 },

  spacer: { flex: 1, minHeight: 16 },

  // 시작 버튼
  startBtn: {
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 8,
    gap: 2,
  },
  startBtnText: {
    fontSize: 19,
    fontFamily: 'Pretendard-Bold',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  startBtnSub: {
    fontSize: 12,
    fontFamily: 'Pretendard-Regular',
    color: '#FFFFFF',
    opacity: 0.8,
  },
});
