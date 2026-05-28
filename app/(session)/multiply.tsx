import { useState, useCallback, useRef, useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useConfigStore } from '../../src/stores/config.store';
import { useSessionStore } from '../../src/stores/session.store';
import { buildMultiplySession } from '../../src/utils/problems';
import MathBox, { MathBoxState } from '../../src/components/MathBox';
import ChoiceButton from '../../src/components/ChoiceButton';
import ProgressBar from '../../src/components/ProgressBar';
import SeedCounter from '../../src/components/SeedCounter';
import ComboDisplay from '../../src/components/ComboDisplay';

const OP_W = 36;
const CELL = 44;
const COLS = 4; // 천, 백, 십, 일

type FillEntry = { value: number; status: 'correct' | 'revealed' };

// box 인덱스 범위
// boxes[0..2]  = partial1 (백,십,일)
// boxes[3..5]  = partial2 (백,십,일)
// boxes[6..9]  = sum     (천,백,십,일)
const P1_START = 0;
const P2_START = 3;
const SUM_START = 6;

// 활성화 순서: 각 행에서 오른쪽(일)→왼쪽(백/천)
const ACTIVATION_ORDER = [2, 1, 0, 5, 4, 3, 9, 8, 7, 6];

export default function MultiplyScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { config } = useConfigStore();
  const { seeds, combo, addSeed, addBigNumBox, addBigNumQuestion, addLog, incrementCombo, resetCombo } = useSessionStore();

  const [problems] = useState(() => buildMultiplySession(2));
  const [pIdx, setPIdx] = useState(0);
  const [boxIdx, setBoxIdx] = useState(0);
  const [fills, setFills] = useState<(FillEntry | null)[]>(() =>
    new Array(problems[0].boxes.length).fill(null)
  );
  const [isWrong, setIsWrong] = useState(false);
  const hadErrorRef = useRef(false);
  // 합산 단계 올림 수 입력 상태
  const [pendingCarryCheck, setPendingCarryCheck] = useState(false);
  const pendingNextStepRef = useRef(0);
  const pendingCarryIdxRef = useRef<0 | 1>(0); // 0=십→백, 1=백→천
  // 올림 수별 fills: [십→백 carry filled?, 백→천 carry filled?]
  const [carryFills, setCarryFills] = useState<(number | null)[]>([null, null]);

  const problem = problems[pIdx];
  const totalSeeds = seeds.normal + seeds.rare + seeds.special;

  const p1Cells = String(problem.partial1).padStart(3, '0').split('').map(Number);
  const p2Cells = String(problem.partial2).padStart(3, '0').split('').map(Number);
  const sumCells = String(problem.sum).padStart(4, '0').split('').map(Number);

  const getBoxState = (gIdx: number): MathBoxState => {
    if (fills[gIdx] !== null) return fills[gIdx]!.status;
    const step = ACTIVATION_ORDER.indexOf(gIdx);
    if (step === boxIdx && !pendingCarryCheck) return isWrong ? 'wrong' : 'active';
    return 'inactive';
  };

  const getBoxValue = (gIdx: number): number | undefined => fills[gIdx]?.value;

  const advanceTo = useCallback(
    (next: number, newFills: (FillEntry | null)[]) => {
      if (next >= problem.boxes.length) {
        addBigNumQuestion();
        addLog({ type: 'multiply', problem: `${problem.a}×${problem.b}`, correct: !hadErrorRef.current });
        hadErrorRef.current = false;
        const nextP = pIdx + 1;
        if (nextP >= problems.length) {
          router.push('/(session)/divide');
        } else {
          setBoxIdx(0);
          setFills(new Array(problems[nextP].boxes.length).fill(null));
          setCarryFills([null, null]);
          setPendingCarryCheck(false);
          setPIdx(nextP);
        }
      } else {
        setBoxIdx(next);
        setFills(newFills);
      }
    },
    [problem, problems, pIdx, addBigNumQuestion, router]
  );

  // 합산 올림 수 체크 트리거 여부 (boxIdx → next 이동 직전)
  const checkSumCarry = useCallback(
    (next: number, newFills: (FillEntry | null)[]) => {
      // step 7 완료(sum 십의자리) → 십→백 올림 체크
      if (boxIdx === 7 && problem.sumCarries[0] > 0) {
        pendingNextStepRef.current = next;
        pendingCarryIdxRef.current = 0;
        setFills(newFills);
        setPendingCarryCheck(true);
        return;
      }
      // step 8 완료(sum 백의자리) → 백→천 올림 체크
      if (boxIdx === 8 && problem.sumCarries[1] > 0) {
        pendingNextStepRef.current = next;
        pendingCarryIdxRef.current = 1;
        setFills(newFills);
        setPendingCarryCheck(true);
        return;
      }
      advanceTo(next, newFills);
    },
    [boxIdx, problem, advanceTo]
  );

  const handleCarryChoice = useCallback(
    (choice: number) => {
      const carryIdx = pendingCarryIdxRef.current;
      const correct = choice === problem.sumCarries[carryIdx];
      const newCarryFills = [...carryFills];
      newCarryFills[carryIdx] = correct ? choice : problem.sumCarries[carryIdx];
      setCarryFills(newCarryFills);
      setPendingCarryCheck(false);
      advanceTo(pendingNextStepRef.current, fills);
    },
    [carryFills, fills, problem, advanceTo]
  );

  const handleChoice = useCallback(
    (choice: number) => {
      if (isWrong || pendingCarryCheck) return;
      const gIdx = ACTIVATION_ORDER[boxIdx];
      const box = problem.boxes[gIdx];
      const correct = choice === box.answer;
      addBigNumBox();

      if (correct) {
        const newFills = [...fills];
        newFills[gIdx] = { value: choice, status: 'correct' };
        addSeed('normal');
        incrementCombo(config.comboThreshold1, config.comboThreshold2);
        setTimeout(() => checkSumCarry(boxIdx + 1, newFills), 300);
      } else {
        setIsWrong(true);
        hadErrorRef.current = true;
        resetCombo();
        setTimeout(() => {
          const newFills = [...fills];
          newFills[gIdx] = { value: box.answer, status: 'revealed' };
          setIsWrong(false);
          checkSumCarry(boxIdx + 1, newFills);
        }, 800);
      }
    },
    [boxIdx, fills, isWrong, pendingCarryCheck, problem, checkSumCarry]
  );

  const currentBox = problem.boxes[ACTIVATION_ORDER[Math.min(boxIdx, ACTIVATION_ORDER.length - 1)]];

  const carryChoices = useMemo(() => {
    const carry = problem.sumCarries[pendingCarryIdxRef.current];
    return carry <= 1 ? [0, 1] : [carry - 1, carry, carry + 1];
  }, [pendingCarryCheck, problem]); // eslint-disable-line react-hooks/exhaustive-deps

  // 합산 단계 올림 수: sumCells 위에 표시 (carryFills에 값이 있을 때)
  // sumCells 배열 인덱스: 0=천, 1=백, 2=십, 3=일
  // carryFills[0] = 십→백 올림 → sumCells[1] (백의 자리) 위에 표시
  // carryFills[1] = 백→천 올림 → sumCells[0] (천의 자리) 위에 표시
  const getSumCarryForCol = (sumColIdx: number): number | null => {
    if (sumColIdx === 1 && carryFills[0] !== null) return carryFills[0];
    if (sumColIdx === 0 && carryFills[1] !== null) return carryFills[1];
    return null;
  };

  // 헬퍼: 숫자 셀
  const D = (n: number, key: string) => (
    <View key={key} style={styles.cell}>
      <Text style={styles.digit}>{n}</Text>
    </View>
  );

  // 헬퍼: 빈 셀
  const E = (key: string) => <View key={key} style={styles.cell} />;

  // 헬퍼: 들여쓰기 셀 (partial2 우측)
  const Indent = () => <View style={[styles.cell, styles.indentCell]} />;

  // 헬퍼: MathBox 셀
  const B = (gIdx: number, key: string) => (
    <View key={key} style={styles.cell}>
      <MathBox state={getBoxState(gIdx)} value={getBoxValue(gIdx)} width={CELL} />
    </View>
  );

  const aStr = String(problem.a).split('').map(Number);
  const bStr = String(problem.b).split('').map(Number);

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 16 }]}>

      {/* 헤더 */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>세자리수 곱셈</Text>
        <ProgressBar current={pIdx} total={problems.length} label={`${pIdx}/${problems.length}`} />
      </View>

      {/* 콤보 */}
      <View style={styles.comboArea}>
        <ComboDisplay combo={combo} threshold={config.comboThreshold1} />
      </View>

      {/* 필산 카드 */}
      <View style={styles.card}>
        <View style={styles.grid}>

          {/* a 행: col 0 빈, col 1~3 = a의 세 자리 */}
          <View style={styles.row}>
            <View style={styles.opCol} />
            {E('a-0')}
            {aStr.map((d, i) => D(d, `a-${i + 1}`))}
          </View>

          {/* × b 행: col 0~1 빈, col 2~3 = b의 두 자리 */}
          <View style={styles.row}>
            <View style={styles.opCol}>
              <Text style={styles.op}>×</Text>
            </View>
            {E('b-0')}
            {E('b-1')}
            {bStr.map((d, i) => D(d, `b-${i + 2}`))}
          </View>

          {/* 가로줄 1 */}
          <Divider />

          {/* partial1 행: col 0 빈, col 1~3 = 3자리 부분곱 박스 */}
          <View style={styles.row}>
            <View style={styles.opCol} />
            {E('p1-0')}
            {p1Cells.map((_, i) => B(P1_START + i, `p1-${i + 1}`))}
          </View>

          {/* partial2 행: col 0~2 = 3자리 부분곱 박스 + 들여쓰기 */}
          <View style={styles.row}>
            <View style={styles.opCol} />
            {p2Cells.map((_, i) => B(P2_START + i, `p2-${i}`))}
            <Indent />
          </View>

          {/* 가로줄 2 */}
          <Divider />

          {/* 합산 올림 수 행: sum 박스 위에 올림 수 표시 */}
          <View style={styles.row}>
            <View style={styles.opCol} />
            {sumCells.map((_, i) => {
              const carry = getSumCarryForCol(i);
              return (
                <View key={`scr-${i}`} style={styles.carryCell}>
                  {carry !== null && carry > 0 && (
                    <Text style={styles.carryText}>{carry}</Text>
                  )}
                </View>
              );
            })}
          </View>

          {/* sum 행: col 0~3 = 4자리 합산 박스 */}
          <View style={styles.row}>
            <View style={styles.opCol} />
            {sumCells.map((_, i) => B(SUM_START + i, `sum-${i}`))}
          </View>

        </View>
      </View>

      {/* 현재 칸 위치 힌트 */}
      {pendingCarryCheck ? (
        <View style={styles.carryPrompt}>
          <Text style={styles.carryPromptText}>올림 수는?</Text>
        </View>
      ) : (
        <Text style={styles.hint}>
          {boxIdx < P2_START
            ? `${problem.a} × ${problem.b % 10} 계산 중`
            : boxIdx < SUM_START
            ? `${problem.a} × ${Math.floor(problem.b / 10)} 계산 중`
            : '합산 중'}
        </Text>
      )}

      {/* 객관식 보기 */}
      <View style={styles.choices}>
        {pendingCarryCheck
          ? carryChoices.map((choice, i) => (
              <ChoiceButton
                key={i}
                label={choice}
                state="default"
                onPress={() => handleCarryChoice(choice)}
              />
            ))
          : currentBox.choices.map((choice, i) => (
              <ChoiceButton
                key={i}
                label={choice}
                state={isWrong ? 'disabled' : 'default'}
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

function Divider() {
  return (
    <View style={styles.dividerRow}>
      <View style={[styles.dividerLine, { width: (COLS + 0.8) * CELL }]} />
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
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.11,
    shadowRadius: 20,
    elevation: 8,
  },
  grid: {
    gap: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  opCol: {
    width: OP_W,
    height: CELL,
    justifyContent: 'center',
    alignItems: 'center',
  },
  op: {
    fontSize: 28,
    fontFamily: 'Pretendard-Bold',
    color: '#2E3A23',
  },
  cell: {
    width: CELL,
    height: CELL,
    justifyContent: 'center',
    alignItems: 'center',
  },
  carryCell: {
    width: CELL,
    height: 18,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  carryText: {
    fontSize: 13,
    fontFamily: 'Pretendard-Bold',
    color: '#FF7043',
    fontVariant: ['tabular-nums'],
  },
  indentCell: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
  },
  digit: {
    fontSize: 36,
    fontFamily: 'Pretendard-Bold',
    color: '#2E3A23',
    fontVariant: ['tabular-nums'],
  },
  dividerRow: {
    paddingLeft: OP_W,
    paddingVertical: 4,
  },
  dividerLine: {
    height: 2,
    backgroundColor: '#2E3A23',
  },
  hint: {
    textAlign: 'center',
    fontSize: 13,
    fontFamily: 'Pretendard-Regular',
    color: '#6A7B5A',
    marginBottom: 16,
  },
  carryPrompt: {
    backgroundColor: '#FFF3E0',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 32,
    alignSelf: 'center',
    marginBottom: 16,
  },
  carryPromptText: {
    fontSize: 20,
    fontFamily: 'Pretendard-Bold',
    color: '#FF7043',
    textAlign: 'center',
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
