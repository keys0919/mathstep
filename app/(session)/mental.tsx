import { useState, useRef, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useConfigStore } from '../../src/stores/config.store';
import { useSessionStore } from '../../src/stores/session.store';
import { useProgressStore } from '../../src/stores/progress.store';
import { buildMentalSession } from '../../src/utils/problems';
import MathBox, { MathBoxState } from '../../src/components/MathBox';
import ChoiceButton from '../../src/components/ChoiceButton';
import ProgressBar from '../../src/components/ProgressBar';
import SeedCounter from '../../src/components/SeedCounter';
import ComboDisplay from '../../src/components/ComboDisplay';

const OP_LABEL: Record<string, string> = { '+': '+', '-': '−', '*': '×' };
const COLS = 3;
const CELL = 44;

type FillEntry = { value: number; status: 'correct' | 'revealed' };

function digitChoices(d: number): number[] {
  const pool = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].filter((n) => n !== d);
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  const result = [d, pool[0], pool[1]];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function getHint(op: string, a: number, b: number): string {
  const aTens = Math.floor(a / 10) * 10;
  const bTens = Math.floor(b / 10) * 10;
  if (op === '+') return `${aTens} + ${bTens} = ${aTens + bTens}`;
  if (op === '-') return `${aTens} − ${bTens} = ${aTens - bTens}`;
  return `${Math.floor(a / 10) * 10} × ${b} = ${Math.floor(a / 10) * 10 * b}`;
}

// 각 자리 올림/빌림 계산
// returns [ones→tens carry, tens→hundreds carry]
function computeCarries(op: string, a: number, b: number): [number | null, number | null] {
  if (op === '+') {
    const c0 = Math.floor((a % 10 + b % 10) / 10);
    return [c0 || null, null];
  }
  if (op === '-') {
    const borrow = (a % 10 < b % 10) ? 1 : 0;
    return [borrow || null, null];
  }
  // 곱셈
  const c0 = Math.floor((a % 10) * b / 10);
  const c1 = Math.floor((Math.floor(a / 10) * b + c0) / 10);
  return [c0 || null, c1 || null];
}

export default function MentalScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { config } = useConfigStore();
  const { seeds, combo, addSeed, addMentalResult, incrementCombo, resetCombo } = useSessionStore();
  const mentalLevel = useProgressStore((s) => s.state.mentalLevel ?? 0);

  const [problems] = useState(() => buildMentalSession(config.mentalPerSession));
  const [idx, setIdx] = useState(0);

  // Level 0 상태
  const [selected, setSelected] = useState<number | null>(null);
  const [status, setStatus] = useState<'answering' | 'correct' | 'wrong'>('answering');

  // Level 1 상태
  const [boxIdx, setBoxIdx] = useState(0);
  const [fills, setFills] = useState<(FillEntry | null)[]>(() =>
    new Array(String(problems[0].answer).length).fill(null)
  );
  const [isWrong, setIsWrong] = useState(false);
  const hadWrongRef = useRef(false);

  const problem = problems[idx];
  const totalSeeds = seeds.normal + seeds.rare + seeds.special;

  const answerDigits = String(problem.answer).split('').map(Number);
  const padCols = COLS - answerDigits.length;
  // 활성화 순서: 일의 자리(오른쪽)부터
  const activationOrder = Array.from({ length: answerDigits.length }, (_, i) => answerDigits.length - 1 - i);

  // 올림/빌림 계산 (문제 변경 시마다)
  const problemCarries = useMemo(
    () => computeCarries(problem.op, problem.a, problem.b),
    [problem]
  );

  const advanceProblem = useCallback(
    (next: number) => {
      if (next >= problems.length) {
        router.push('/(session)/multiply');
        return;
      }
      setIdx(next);
      if (mentalLevel === 0) {
        setBoxIdx(0);
        setFills(new Array(String(problems[next].answer).length).fill(null));
        setIsWrong(false);
        hadWrongRef.current = false;
      } else {
        setSelected(null);
        setStatus('answering');
      }
    },
    [problems, mentalLevel]
  );

  // Level 0: 전체 답 선택
  const handleLevel0Choice = useCallback(
    (choice: number) => {
      if (status !== 'answering') return;
      const correct = choice === problem.answer;
      setSelected(choice);
      setStatus(correct ? 'correct' : 'wrong');
      addMentalResult(correct);
      if (correct) {
        addSeed('normal');
        incrementCombo(config.comboThreshold1, config.comboThreshold2);
      } else {
        resetCombo();
      }
      setTimeout(() => advanceProblem(idx + 1), correct ? 700 : 1200);
    },
    [status, idx, problem, advanceProblem, config]
  );

  // Level 1: 자릿수별 입력 (오른쪽→왼쪽)
  const handleLevel1Choice = useCallback(
    (choice: number) => {
      if (isWrong) return;
      const fillIdx = activationOrder[boxIdx];
      const correct = choice === answerDigits[fillIdx];

      if (correct) {
        const newFills = [...fills];
        newFills[fillIdx] = { value: choice, status: 'correct' };
        addSeed('normal');
        incrementCombo(config.comboThreshold1, config.comboThreshold2);

        const next = boxIdx + 1;
        if (next >= answerDigits.length) {
          addMentalResult(!hadWrongRef.current);
          setFills(newFills);
          setTimeout(() => advanceProblem(idx + 1), 500);
        } else {
          setBoxIdx(next);
          setFills(newFills);
        }
      } else {
        setIsWrong(true);
        hadWrongRef.current = true;
        resetCombo();
        setTimeout(() => {
          const newFills = [...fills];
          newFills[fillIdx] = { value: answerDigits[fillIdx], status: 'revealed' };
          setIsWrong(false);
          const next = boxIdx + 1;
          if (next >= answerDigits.length) {
            addMentalResult(false);
            setFills(newFills);
            setTimeout(() => advanceProblem(idx + 1), 300);
          } else {
            setBoxIdx(next);
            setFills(newFills);
          }
        }, 800);
      }
    },
    [isWrong, boxIdx, fills, answerDigits, activationOrder, idx, advanceProblem, config]
  );

  const currentDigitChoices = useMemo(() => {
    if (mentalLevel !== 0) return [];
    const fillIdx = activationOrder[Math.min(boxIdx, activationOrder.length - 1)];
    return digitChoices(answerDigits[fillIdx]);
  }, [mentalLevel, boxIdx, idx]); // eslint-disable-line react-hooks/exhaustive-deps

  const getLevel1BoxState = (digitIdx: number): MathBoxState => {
    const step = activationOrder.indexOf(digitIdx);
    if (step < boxIdx) return fills[digitIdx]?.status ?? 'inactive';
    if (step === boxIdx) return isWrong ? 'wrong' : 'active';
    return 'inactive';
  };

  const level0BoxState = (status === 'answering' ? 'active' : status) as MathBoxState;

  const choiceState0 = (choice: number) => {
    if (status === 'answering') return 'default' as const;
    if (choice === selected) return status as 'correct' | 'wrong';
    return 'disabled' as const;
  };

  const toCells = (n: number): (string | null)[] => {
    const s = String(n);
    return [...Array(COLS - s.length).fill(null), ...s.split('')];
  };

  const aCells = toCells(problem.a);
  const bCells = toCells(problem.b);
  const selectedDigits =
    selected !== null
      ? String(selected).padStart(answerDigits.length, '0').split('').map(Number)
      : null;

  const hintText = getHint(problem.op, problem.a, problem.b);

  const digitLabels2 = ['십', '일'];
  const digitLabels3 = ['백', '십', '일'];
  const digitLabels = answerDigits.length === 2 ? digitLabels2 : digitLabels3;
  const currentLabel = mentalLevel === 1
    ? digitLabels[activationOrder[Math.min(boxIdx, activationOrder.length - 1)]]
    : '';

  // 올림/빌림 힌트: 일의 자리 풀이 후(boxIdx>=1) 십의 자리 열에 표시
  // 십의 자리 풀이 후(boxIdx>=2) 백의 자리 열에 표시 (3자리 답인 경우)
  const showCarryRow = mentalLevel === 0;
  const getCarryForCol = (digitIdx: number): number | null => {
    // digitIdx: answerDigits 배열에서의 인덱스 (0=가장 왼쪽)
    // ones→tens carry: answerDigits.length-2 위치, boxIdx>=1일 때
    if (digitIdx === answerDigits.length - 2 && boxIdx >= 1) return problemCarries[0];
    // tens→hundreds carry: answerDigits.length-3 위치, boxIdx>=2, 3자리일 때
    if (answerDigits.length === 3 && digitIdx === 0 && boxIdx >= 2) return problemCarries[1];
    return null;
  };

  const carryLabel = problem.op === '-' ? '빌림' : '올림';

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 16 }]}>

      {/* 헤더 */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          두자리 암산{mentalLevel === 1 ? ' · 심화' : ''}
        </Text>
        <ProgressBar current={idx} total={problems.length} label={`${idx}/${problems.length}`} />
      </View>

      {/* 콤보 */}
      <View style={styles.comboArea}>
        <ComboDisplay combo={combo} threshold={config.comboThreshold1} />
      </View>

      {/* 필산 카드 */}
      <View style={styles.card}>
        <View style={styles.grid}>

          {/* 올림/빌림 행 (Level 1 전용, boxIdx >= 1일 때) */}
          {showCarryRow && (
            <View style={styles.row}>
              <View style={styles.opCol} />
              {Array.from({ length: padCols }).map((_, i) => (
                <View key={`cr-pad-${i}`} style={styles.carryCell} />
              ))}
              {answerDigits.map((_, i) => {
                const carry = getCarryForCol(i);
                return (
                  <View key={`cr-${i}`} style={styles.carryCell}>
                    {carry !== null && (
                      <Text style={styles.carryText}>{carry}</Text>
                    )}
                  </View>
                );
              })}
            </View>
          )}

          {/* a 행 */}
          <View style={styles.row}>
            <View style={styles.opCol} />
            {aCells.map((ch, i) => (
              <View key={i} style={styles.cell}>
                {ch !== null && <Text style={styles.digit}>{ch}</Text>}
              </View>
            ))}
          </View>

          {/* 연산자 + b 행 */}
          <View style={styles.row}>
            <View style={styles.opCol}>
              <Text style={styles.op}>{OP_LABEL[problem.op]}</Text>
            </View>
            {bCells.map((ch, i) => (
              <View key={i} style={styles.cell}>
                {ch !== null && <Text style={styles.digit}>{ch}</Text>}
              </View>
            ))}
          </View>

          {/* 가로줄 */}
          <View style={styles.dividerRow}>
            <View style={[styles.divider, { width: (COLS + 0.8) * CELL }]} />
          </View>

          {/* 정답 박스 행 */}
          <View style={styles.row}>
            <View style={styles.opCol} />
            {Array.from({ length: padCols }).map((_, i) => (
              <View key={`pad-${i}`} style={styles.cell} />
            ))}
            {answerDigits.map((digit, i) => (
              <View key={i} style={styles.cell}>
                {mentalLevel === 1 ? (
                  <MathBox
                    state={level0BoxState}
                    value={
                      status === 'answering'
                        ? undefined
                        : selectedDigits
                        ? selectedDigits[i]
                        : digit
                    }
                    width={CELL}
                  />
                ) : (
                  <MathBox
                    state={getLevel1BoxState(i)}
                    value={fills[i]?.value}
                    width={CELL}
                  />
                )}
              </View>
            ))}
          </View>
        </View>

        {/* Level 1: 힌트 (전체 답 방식) */}
        {mentalLevel === 1 && status === 'answering' && (
          <View style={styles.hint}>
            <Text style={styles.hintLabel}>힌트</Text>
            <Text style={styles.hintText}>{hintText}</Text>
          </View>
        )}

        {/* Level 0: 현재 자리 레이블 + 올림 안내 */}
        {mentalLevel === 0 && (
          <View style={styles.level1Footer}>
            <Text style={styles.digitLabel}>{currentLabel}의 자리</Text>
            {boxIdx >= 1 && problemCarries[0] !== null && (
              <Text style={styles.carryLabel}>{carryLabel} {problemCarries[0]}</Text>
            )}
          </View>
        )}
      </View>

      {/* 객관식 보기 */}
      <View style={styles.choices}>
        {mentalLevel === 1
          ? problem.choices.map((choice, i) => (
              <ChoiceButton
                key={i}
                label={choice}
                state={choiceState0(choice)}
                onPress={() => handleLevel0Choice(choice)}
              />
            ))
          : currentDigitChoices.map((choice, i) => (
              <ChoiceButton
                key={i}
                label={choice}
                state={isWrong ? 'disabled' : 'default'}
                onPress={() => handleLevel1Choice(choice)}
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
    marginBottom: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.11,
    shadowRadius: 20,
    elevation: 8,
  },
  grid: {
    gap: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  opCol: {
    width: 36,
    height: CELL,
    justifyContent: 'center',
    alignItems: 'center',
  },
  op: {
    fontSize: 32,
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
    height: 20,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  carryText: {
    fontSize: 14,
    fontFamily: 'Pretendard-Bold',
    color: '#FF7043',
    fontVariant: ['tabular-nums'],
  },
  digit: {
    fontSize: 36,
    fontFamily: 'Pretendard-Bold',
    color: '#2E3A23',
    fontVariant: ['tabular-nums'],
  },
  dividerRow: {
    paddingLeft: 36,
    paddingVertical: 4,
  },
  divider: {
    height: 2,
    backgroundColor: '#2E3A23',
  },
  hint: {
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#F9FBE7',
    borderRadius: 12,
    alignItems: 'center',
    gap: 2,
  },
  hintLabel: {
    fontSize: 11,
    fontFamily: 'Pretendard-SemiBold',
    color: '#6A7B5A',
  },
  hintText: {
    fontSize: 18,
    fontFamily: 'Pretendard-Medium',
    color: '#2E3A23',
    fontVariant: ['tabular-nums'],
  },
  level1Footer: {
    marginTop: 12,
    alignItems: 'center',
    gap: 4,
  },
  digitLabel: {
    fontSize: 13,
    fontFamily: 'Pretendard-Medium',
    color: '#6A7B5A',
  },
  carryLabel: {
    fontSize: 12,
    fontFamily: 'Pretendard-SemiBold',
    color: '#FF7043',
  },
  choices: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 24,
  },
  footer: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'flex-start',
  },
});
