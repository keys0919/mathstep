import { useState, useRef, useCallback } from 'react';
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

const CELL = 44;
const BRACKET_W = 28;
const DIV_AREA_W = 2 * CELL + BRACKET_W;

type FillEntry = { value: number; status: 'correct' | 'revealed' };

// 숫자를 3자리 오른쪽 정렬 셀 배열로 변환 (null = 빈 셀)
function toRightCells(n: number): (number | null)[] {
  const s = String(n);
  const result: (number | null)[] = new Array(3 - s.length).fill(null);
  for (const ch of s) result.push(Number(ch));
  return result;
}

export default function DivideScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { config } = useConfigStore();
  const { seeds, combo, addSeed, addBigNumBox, addBigNumQuestion, addLog, incrementCombo, resetCombo } = useSessionStore();

  const [problems] = useState(() => buildDivideSession(4));
  const [pIdx, setPIdx] = useState(0);

  // boxIdx: 0=십의자리, 1=일의자리
  const [boxIdx, setBoxIdx] = useState(0);
  const [fills, setFills] = useState<(FillEntry | null)[]>([null, null]);
  const [isWrong, setIsWrong] = useState(false);
  const hadErrorRef = useRef(false);

  const problem = problems[pIdx];
  const totalSeeds = seeds.normal + seeds.rare + seeds.special;

  const divStr = String(problem.dividend).split('').map(Number);
  const divDigit1 = Math.floor(problem.divisor / 10);
  const divDigit2 = problem.divisor % 10;

  const getBoxState = (digitIdx: number): MathBoxState => {
    if (digitIdx < boxIdx) return fills[digitIdx]?.status ?? 'inactive';
    if (digitIdx === boxIdx) return isWrong ? 'wrong' : 'active';
    return 'inactive';
  };

  const advanceProblem = useCallback(() => {
    addBigNumQuestion();
    addLog({ type: 'divide', problem: `${problem.dividend}÷${problem.divisor}`, correct: !hadErrorRef.current });
    hadErrorRef.current = false;
    const next = pIdx + 1;
    if (next >= problems.length) {
      router.push('/(session)/complete');
    } else {
      setPIdx(next);
      setBoxIdx(0);
      setFills([null, null]);
      setIsWrong(false);
    }
  }, [pIdx, problems, problem, addLog]);

  const handleChoice = useCallback(
    (choice: number) => {
      if (isWrong) return;
      const box = problem.boxes[boxIdx];
      const correct = choice === box.answer;
      addBigNumBox();

      if (correct) {
        const newFills = [...fills];
        newFills[boxIdx] = { value: choice, status: 'correct' };
        addSeed('normal');
        incrementCombo(config.comboThreshold1, config.comboThreshold2);

        const next = boxIdx + 1;
        if (next >= 2) {
          setFills(newFills);
          setTimeout(() => advanceProblem(), 800);
        } else {
          setBoxIdx(next);
          setFills(newFills);
        }
      } else {
        setIsWrong(true);
        hadErrorRef.current = true;
        resetCombo();
        setTimeout(() => {
          const newFills = [...fills];
          newFills[boxIdx] = { value: box.answer, status: 'revealed' };
          setIsWrong(false);
          const next = boxIdx + 1;
          if (next >= 2) {
            setFills(newFills);
            setTimeout(() => advanceProblem(), 600);
          } else {
            setBoxIdx(next);
            setFills(newFills);
          }
        }, 800);
      }
    },
    [isWrong, boxIdx, fills, problem, advanceProblem, config]
  );

  const currentBox = problem.boxes[boxIdx];

  // 십의 자리 힌트: divisor × (quotTens-1)*10, divisor × (quotTens+1)*10
  const tensHints = [
    { mult: Math.max(1, problem.quotTens - 1) * 10, product: problem.divisor * Math.max(1, problem.quotTens - 1) * 10 },
    { mult: Math.min(4, problem.quotTens + 1) * 10, product: problem.divisor * Math.min(4, problem.quotTens + 1) * 10 },
  ];

  // 일의 자리 힌트: divisor × (quotOnes-1), divisor × (quotOnes+1)
  const onesHints = [
    problem.quotOnes > 0 && { mult: problem.quotOnes - 1, product: problem.divisor * (problem.quotOnes - 1) },
    problem.quotOnes < 9 && { mult: problem.quotOnes + 1, product: problem.divisor * (problem.quotOnes + 1) },
  ].filter(Boolean) as { mult: number; product: number }[];

  const showIntermediate = fills[0] !== null;
  const showOnesResult = fills[1] !== null;

  // 계산 행 렌더링 헬퍼 (오른쪽 정렬, minus 선택)
  const renderCalcRow = (n: number, withMinus: boolean) => {
    const cells = toRightCells(n);
    const numLen = String(n).length;
    const padLen = 3 - numLen;
    const leftOffset = withMinus
      ? DIV_AREA_W + (padLen - 1) * CELL  // minus 기호 공간 확보
      : DIV_AREA_W + padLen * CELL;
    return (
      <View style={styles.row}>
        <View style={{ width: Math.max(0, leftOffset) }} />
        {withMinus && <Text style={styles.minus}>−</Text>}
        {cells.map((d, i) => (
          <View key={i} style={styles.cell}>
            {d !== null && (
              <Text style={[styles.digit, styles.calcText]}>{d}</Text>
            )}
          </View>
        ))}
      </View>
    );
  };

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

        {/* 몫 행: 십의 자리 박스 + 일의 자리 박스 */}
        <View style={styles.row}>
          <View style={{ width: DIV_AREA_W + CELL }} />
          <View style={styles.cell}>
            <MathBox state={getBoxState(0)} value={fills[0]?.value} width={CELL} />
          </View>
          <View style={styles.cell}>
            <MathBox state={getBoxState(1)} value={fills[1]?.value} width={CELL} />
          </View>
        </View>

        {/* 나눗셈 행 */}
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

        {/* 십의 자리 정답 후: tensProduct 빼기 → intermediate */}
        {showIntermediate && (
          <>
            {renderCalcRow(problem.tensProduct, true)}
            <View style={styles.dividerRow}>
              <View style={[styles.dividerLine, { width: DIV_AREA_W + CELL * 3 }]} />
            </View>
            {renderCalcRow(problem.intermediate, false)}
          </>
        )}

        {/* 일의 자리 정답 후: onesProduct 빼기 → remainder */}
        {showOnesResult && (
          <>
            {renderCalcRow(problem.onesProduct, true)}
            <View style={styles.dividerRow}>
              <View style={[styles.dividerLine, { width: DIV_AREA_W + CELL * 3 }]} />
            </View>
            {renderCalcRow(problem.remainder, false)}
          </>
        )}

        {/* 힌트 */}
        {!showIntermediate && (
          <View style={styles.hints}>
            <Text style={styles.hintsLabel}>십의 자리 힌트 (앞 두 자리 ÷ {problem.divisor})</Text>
            {tensHints.map((h, i) => (
              <Text key={i} style={styles.hintLine}>
                {problem.divisor} × {h.mult} = {h.product}
              </Text>
            ))}
          </View>
        )}

        {showIntermediate && !showOnesResult && (
          <View style={styles.hints}>
            <Text style={styles.hintsLabel}>일의 자리 힌트 (남은 수 {problem.intermediate} ÷ {problem.divisor})</Text>
            {onesHints.map((h, i) => (
              <Text key={i} style={styles.hintLine}>
                {problem.divisor} × {h.mult} = {h.product}
              </Text>
            ))}
          </View>
        )}
      </View>

      {/* 객관식 보기 */}
      {!showOnesResult && (
        <View style={styles.choices}>
          {currentBox.choices.map((choice, i) => (
            <ChoiceButton
              key={i}
              label={choice}
              state={isWrong ? 'disabled' : 'default'}
              onPress={() => handleChoice(choice)}
            />
          ))}
        </View>
      )}

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
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.11,
    shadowRadius: 20,
    elevation: 8,
    gap: 2,
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
    fontSize: 36,
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
    marginTop: 8,
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
