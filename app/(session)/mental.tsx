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

  const advanceProblem = useCallback(
    (next: number) => {
      if (next >= problems.length) {
        router.push('/(session)/multiply');
        return;
      }
      setIdx(next);
      if (mentalLevel === 1) {
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

  // Level 1: 현재 자리 선택지 (문제/박스 변경 시 재생성)
  const currentDigitChoices = useMemo(() => {
    if (mentalLevel !== 1) return [];
    const fillIdx = activationOrder[Math.min(boxIdx, activationOrder.length - 1)];
    return digitChoices(answerDigits[fillIdx]);
  }, [mentalLevel, boxIdx, idx]); // eslint-disable-line react-hooks/exhaustive-deps

  // Level 1 박스 상태
  const getLevel1BoxState = (digitIdx: number): MathBoxState => {
    const step = activationOrder.indexOf(digitIdx);
    if (step < boxIdx) return fills[digitIdx]?.status ?? 'inactive';
    if (step === boxIdx) return isWrong ? 'wrong' : 'active';
    return 'inactive';
  };

  // Level 0 박스 상태
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

  // Level 1 현재 자리 레이블
  const digitLabels2 = ['십', '일'];
  const digitLabels3 = ['백', '십', '일'];
  const digitLabels = answerDigits.length === 2 ? digitLabels2 : digitLabels3;
  const currentLabel = mentalLevel === 1
    ? digitLabels[activationOrder[Math.min(boxIdx, activationOrder.length - 1)]]
    : '';

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
                {mentalLevel === 0 ? (
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

        {/* Level 0: 힌트 */}
        {mentalLevel === 0 && status === 'answering' && (
          <View style={styles.hint}>
            <Text style={styles.hintLabel}>힌트</Text>
            <Text style={styles.hintText}>{hintText}</Text>
          </View>
        )}

        {/* Level 1: 현재 자리 레이블 */}
        {mentalLevel === 1 && (
          <Text style={styles.digitLabel}>{currentLabel}의 자리</Text>
        )}
      </View>

      {/* 객관식 보기 */}
      <View style={styles.choices}>
        {mentalLevel === 0
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
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  grid: {
    gap: 6,
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
  digit: {
    fontSize: 36,
    fontFamily: 'Pretendard-Bold',
    color: '#2E3A23',
    fontVariant: ['tabular-nums'],
  },
  dividerRow: {
    paddingLeft: 36,
    paddingVertical: 2,
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
  digitLabel: {
    marginTop: 12,
    fontSize: 13,
    fontFamily: 'Pretendard-Medium',
    color: '#6A7B5A',
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
