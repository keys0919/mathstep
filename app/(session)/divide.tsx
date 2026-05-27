import { useState, useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useConfigStore } from '../../src/stores/config.store';
import { useSessionStore } from '../../src/stores/session.store';
import { buildDivideSession } from '../../src/utils/problems';
import MathBox, { MathBoxState } from '../../src/components/MathBox';
import ChoiceButton from '../../src/components/ChoiceButton';
import ProgressBar from '../../src/components/ProgressBar';
import SeedCounter from '../../src/components/SeedCounter';
import ComboDisplay from '../../src/components/ComboDisplay';

// 레이아웃 상수
const CELL = 44;
const BRACKET_W = 28;
const DIV_AREA_W = 2 * CELL + BRACKET_W; // 나누는 수 영역 (2자리 + ')')
const QUOT_W = 2 * CELL;                 // 몫 박스 너비 (2자리)

// 몫 박스 좌측 오프셋: DIV_AREA_W + 1 CELL (첫 자리 digit 제외)
const QUOT_OFFSET = DIV_AREA_W + CELL;

export default function DivideScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { config } = useConfigStore();
  const { seeds, combo, addSeed, addBigNumBox, addBigNumQuestion, incrementCombo, resetCombo } = useSessionStore();

  const [problems] = useState(() => buildDivideSession(4));
  const [pIdx, setPIdx] = useState(0);
  const [status, setStatus] = useState<'answering' | 'correct' | 'wrong'>('answering');
  const [selected, setSelected] = useState<number | null>(null);

  const problem = problems[pIdx];
  const totalSeeds = seeds.normal + seeds.rare + seeds.special;

  const quotBox = problem.boxes[0];
  const quotState: MathBoxState =
    status === 'answering' ? 'active' : status === 'correct' ? 'correct' : 'wrong';

  const handleChoice = useCallback(
    (choice: number) => {
      if (status !== 'answering') return;
      const correct = choice === quotBox.answer;
      setSelected(choice);
      setStatus(correct ? 'correct' : 'wrong');
      addBigNumBox();

      if (correct) {
        addSeed('normal');
        addBigNumQuestion();
        incrementCombo(config.comboThreshold1, config.comboThreshold2);
      } else {
        resetCombo();
      }

      setTimeout(() => {
        const next = pIdx + 1;
        if (next >= problems.length) {
          router.push('/(session)/complete');
        } else {
          setPIdx(next);
          setStatus('answering');
          setSelected(null);
        }
      }, correct ? 800 : 1200);
    },
    [status, pIdx, problems, quotBox]
  );

  const choiceButtonState = (choice: number) => {
    if (status === 'answering') return 'default' as const;
    if (choice === selected) return status as 'correct' | 'wrong';
    return 'disabled' as const;
  };

  const divStr = String(problem.dividend).split('').map(Number);
  const divDigit1 = Math.floor(problem.divisor / 10);
  const divDigit2 = problem.divisor % 10;

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 16 }]}>

      {/* 헤더 */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>세자리수 나눗셈</Text>
        <ProgressBar current={pIdx} total={problems.length} label={`${pIdx}/${problems.length}`} />
      </View>

      {/* 콤보 */}
      <View style={styles.comboArea}>
        <ComboDisplay combo={combo} threshold={config.comboThreshold1} />
      </View>

      {/* 필산 카드 */}
      <View style={styles.card}>

        {/* 몫 행 — QUOT_OFFSET 만큼 들여쓰기 후 박스 */}
        <View style={styles.row}>
          <View style={{ width: QUOT_OFFSET }} />
          <MathBox
            state={quotState}
            value={status !== 'answering' ? problem.quotient : undefined}
            width={QUOT_W}
          />
        </View>

        {/* 나눗셈 행: 나누는 수 ) 피제수 */}
        <View style={styles.row}>
          <View style={[styles.divisorArea, { width: DIV_AREA_W }]}>
            <Text style={styles.digit}>{divDigit1}</Text>
            <Text style={styles.digit}>{divDigit2}</Text>
            <Text style={styles.bracket}>)</Text>
          </View>
          {divStr.map((d, i) => (
            <View key={i} style={styles.cell}>
              <Text style={styles.digit}>{d}</Text>
            </View>
          ))}
        </View>

        {/* 가로줄 */}
        <View style={styles.dividerRow}>
          <View style={[styles.dividerLine, { width: DIV_AREA_W + CELL * 3 }]} />
        </View>

        {/* 정답 후: 계산 과정 표시 */}
        {status === 'correct' && (
          <>
            <View style={styles.row}>
              <View style={{ width: QUOT_OFFSET - CELL }} />
              <Text style={styles.minus}>−</Text>
              <View style={styles.cell}>
                <Text style={[styles.digit, styles.calcText]}>{Math.floor(problem.product / 100)}</Text>
              </View>
              <View style={styles.cell}>
                <Text style={[styles.digit, styles.calcText]}>{Math.floor((problem.product % 100) / 10)}</Text>
              </View>
              <View style={styles.cell}>
                <Text style={[styles.digit, styles.calcText]}>{problem.product % 10}</Text>
              </View>
            </View>
            <View style={styles.dividerRow}>
              <View style={[styles.dividerLine, { width: DIV_AREA_W + CELL * 3 }]} />
            </View>
            <View style={styles.row}>
              <View style={{ width: QUOT_OFFSET }} />
              <View style={styles.cell}>
                <Text style={[styles.digit, styles.calcText]}>{Math.floor(problem.remainder / 10)}</Text>
              </View>
              <View style={styles.cell}>
                <Text style={[styles.digit, styles.calcText]}>{problem.remainder % 10}</Text>
              </View>
            </View>
          </>
        )}

        {/* 어림셈 힌트 */}
        {status === 'answering' && (
          <View style={styles.hints}>
            <Text style={styles.hintsLabel}>어림셈 힌트</Text>
            {problem.hints.map((h, i) => (
              <Text key={i} style={styles.hintLine}>
                {problem.divisor} × {h.multiplier} = {h.product}
              </Text>
            ))}
          </View>
        )}

      </View>

      {/* 객관식 보기 */}
      <View style={styles.choices}>
        {quotBox.choices.map((choice, i) => (
          <ChoiceButton
            key={i}
            label={choice}
            state={choiceButtonState(choice)}
            onPress={() => handleChoice(choice)}
          />
        ))}
      </View>

      {/* 씨앗 카운터 */}
      <View style={styles.footer}>
        <SeedCounter count={totalSeeds} />
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F9FBE7',
    paddingHorizontal: 16,
  },
  header: {
    gap: 8,
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 15,
    fontFamily: 'Pretendard-SemiBold',
    color: '#6A7B5A',
  },
  comboArea: {
    alignItems: 'flex-end',
    minHeight: 36,
    marginBottom: 12,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    gap: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  divisorArea: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cell: {
    width: CELL,
    height: CELL,
    justifyContent: 'center',
    alignItems: 'center',
  },
  digit: {
    fontSize: 32,
    fontFamily: 'Pretendard-Bold',
    color: '#2E3A23',
    fontVariant: ['tabular-nums'],
    textAlign: 'center',
    width: CELL,
  },
  bracket: {
    fontSize: 36,
    fontFamily: 'Pretendard-Regular',
    color: '#2E3A23',
    width: BRACKET_W,
    textAlign: 'center',
  },
  minus: {
    fontSize: 28,
    fontFamily: 'Pretendard-Bold',
    color: '#6A7B5A',
    width: CELL,
    textAlign: 'center',
  },
  calcText: {
    color: '#4CAF50',
  },
  dividerRow: {
    paddingVertical: 4,
  },
  dividerLine: {
    height: 2,
    backgroundColor: '#2E3A23',
  },
  hints: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#F9FBE7',
    borderRadius: 12,
    gap: 4,
  },
  hintsLabel: {
    fontSize: 12,
    fontFamily: 'Pretendard-SemiBold',
    color: '#6A7B5A',
    marginBottom: 4,
  },
  hintLine: {
    fontSize: 16,
    fontFamily: 'Pretendard-Medium',
    color: '#2E3A23',
    fontVariant: ['tabular-nums'],
  },
  choices: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 20,
  },
  footer: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'flex-start',
  },
});
