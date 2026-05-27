import { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useProgressStore } from '../../src/stores/progress.store';
import { useConfigStore } from '../../src/stores/config.store';
import { useSessionStore } from '../../src/stores/session.store';
import { buildMultTableSession } from '../../src/utils/problems';
import ProgressBar from '../../src/components/ProgressBar';
import SeedCounter from '../../src/components/SeedCounter';
import ComboDisplay from '../../src/components/ComboDisplay';
import ChoiceButton from '../../src/components/ChoiceButton';

type Status = 'answering' | 'correct' | 'wrong';

export default function MultTableScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { multTable, recordMultTableResult, checkAndGraduate } = useProgressStore();
  const multLevel = useProgressStore((s) => s.state.multLevel ?? 0);
  const { config } = useConfigStore();
  const { seeds, combo, addSeed, addMultTableResult, incrementCombo, resetCombo } = useSessionStore();

  const [problems] = useState(() =>
    buildMultTableSession(multTable, config.multTablePerSession)
  );
  const [idx, setIdx] = useState(0);
  const [input, setInput] = useState('');
  const [elapsed, setElapsed] = useState(0);
  const [status, setStatus] = useState<Status>('answering');
  const [selected, setSelected] = useState<number | null>(null);

  const startTimeRef = useRef(Date.now());
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const inputRef = useRef<TextInput>(null);

  const problem = problems[idx];
  const totalSeeds = seeds.normal + seeds.rare + seeds.special;

  useEffect(() => {
    startTimeRef.current = Date.now();
    setElapsed(0);
    setStatus('answering');
    setInput('');
    setSelected(null);

    timerRef.current = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTimeRef.current) / 100) / 10);
    }, 100);

    if (multLevel === 1) {
      const t = setTimeout(() => inputRef.current?.focus(), 80);
      return () => {
        if (timerRef.current) clearInterval(timerRef.current);
        clearTimeout(t);
      };
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [idx, multLevel]);

  const advance = useCallback((correct: boolean, timeSec: number) => {
    recordMultTableResult(problem.a, problem.b, correct, timeSec, config.multTableTimeSec);
    addMultTableResult({ a: problem.a, b: problem.b, correct, timeSec });

    if (correct) {
      addSeed('normal');
      incrementCombo(config.comboThreshold1, config.comboThreshold2);
      if (timeSec <= config.multTableTimeSec) {
        checkAndGraduate(problem.a, problem.b, config.multTableGradSessions);
      }
    } else {
      resetCombo();
    }

    setTimeout(() => {
      const next = idx + 1;
      if (next >= problems.length) {
        router.push('/(session)/mental');
      } else {
        setIdx(next);
      }
    }, correct ? 600 : 1000);
  }, [problem, idx, problems, config]);

  // Level 0: 객관식
  const handleLevel0Choice = useCallback((choice: number) => {
    if (status !== 'answering') return;
    const timeSec = (Date.now() - startTimeRef.current) / 1000;
    if (timerRef.current) clearInterval(timerRef.current);
    const correct = choice === problem.answer;
    setSelected(choice);
    setStatus(correct ? 'correct' : 'wrong');
    advance(correct, timeSec);
  }, [status, problem, advance]);

  // Level 1: 타이핑
  const handleSubmit = useCallback(() => {
    if (status !== 'answering') return;
    const num = parseInt(input.trim(), 10);
    if (isNaN(num)) return;

    const timeSec = (Date.now() - startTimeRef.current) / 1000;
    if (timerRef.current) clearInterval(timerRef.current);

    const correct = num === problem.answer;
    setStatus(correct ? 'correct' : 'wrong');
    advance(correct, timeSec);
  }, [status, input, problem, advance]);

  const isOverTime = elapsed > config.multTableTimeSec;

  const choiceState0 = (choice: number) => {
    if (status === 'answering') return 'default' as const;
    if (choice === selected) return status as 'correct' | 'wrong';
    return 'disabled' as const;
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 16 }]}>

      {/* 헤더 */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>구구단{multLevel === 1 ? ' · 심화' : ''}</Text>
        <ProgressBar current={idx} total={problems.length} label={`${idx}/${problems.length}`} />
      </View>

      {/* 콤보 */}
      <View style={styles.comboArea}>
        <ComboDisplay combo={combo} threshold={config.comboThreshold1} />
      </View>

      {/* 문제 카드 */}
      <View style={styles.problemCard}>
        <Text style={styles.problemText}>
          {problem.a} × {problem.b} = ?
        </Text>
        {multLevel === 0 && status !== 'answering' && (
          <Text style={[styles.answerReveal, status === 'correct' ? styles.correct : styles.wrong]}>
            {problem.answer}
          </Text>
        )}
      </View>

      {/* 타이머 */}
      <Text style={[styles.timer, isOverTime && styles.timerOver]}>
        ⏱ {elapsed.toFixed(1)}초
      </Text>

      {/* Level 0: 객관식 버튼 */}
      {multLevel === 0 && (
        <View style={styles.choices}>
          {problem.choices.map((choice, i) => (
            <ChoiceButton
              key={i}
              label={choice}
              state={choiceState0(choice)}
              onPress={() => handleLevel0Choice(choice)}
            />
          ))}
        </View>
      )}

      {/* Level 1: 타이핑 입력 */}
      {multLevel === 1 && (
        <>
          <View style={[
            styles.inputRow,
            status === 'correct' && styles.inputCorrect,
            status === 'wrong' && styles.inputWrong,
          ]}>
            <TextInput
              ref={inputRef}
              style={styles.input}
              value={input}
              onChangeText={setInput}
              keyboardType="numeric"
              returnKeyType="done"
              onSubmitEditing={handleSubmit}
              editable={status === 'answering'}
              placeholder="정답 입력"
              placeholderTextColor="#B0BEC5"
              maxLength={3}
            />
            {status === 'answering' && input.length > 0 && (
              <Pressable onPress={() => setInput('')} style={styles.clearBtn}>
                <Text style={styles.clearText}>✕</Text>
              </Pressable>
            )}
            {status === 'correct' && <Text style={styles.feedbackIcon}>✓</Text>}
            {status === 'wrong' && (
              <Text style={styles.wrongReveal}>{problem.answer}</Text>
            )}
          </View>

          {status === 'answering' && input.length > 0 && (
            <Pressable style={styles.submitBtn} onPress={handleSubmit}>
              <Text style={styles.submitText}>확인</Text>
            </Pressable>
          )}
        </>
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
    marginBottom: 16,
  },
  problemCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingVertical: 40,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.11,
    shadowRadius: 20,
    elevation: 8,
    gap: 8,
  },
  problemText: {
    fontSize: 40,
    fontFamily: 'Pretendard-Bold',
    color: '#2E3A23',
    fontVariant: ['tabular-nums'],
    letterSpacing: 2,
  },
  answerReveal: {
    fontSize: 28,
    fontFamily: 'Pretendard-Bold',
    fontVariant: ['tabular-nums'],
  },
  correct: { color: '#4CAF50' },
  wrong: { color: '#EF5350' },
  timer: {
    textAlign: 'center',
    fontSize: 14,
    fontFamily: 'Pretendard-Regular',
    color: '#6A7B5A',
    marginBottom: 20,
  },
  timerOver: {
    color: '#EF5350',
    fontFamily: 'Pretendard-SemiBold',
  },
  choices: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 24,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    paddingHorizontal: 16,
    height: 56,
    marginBottom: 16,
  },
  inputCorrect: {
    borderColor: '#66BB6A',
    backgroundColor: '#E8F5E9',
  },
  inputWrong: {
    borderColor: '#EF5350',
    backgroundColor: '#FFEBEE',
  },
  input: {
    flex: 1,
    fontSize: 28,
    fontFamily: 'Pretendard-Bold',
    color: '#2E3A23',
    fontVariant: ['tabular-nums'],
  },
  clearBtn: { padding: 8 },
  clearText: { fontSize: 16, color: '#B0BEC5' },
  feedbackIcon: { fontSize: 24, color: '#66BB6A' },
  wrongReveal: {
    fontSize: 24,
    fontFamily: 'Pretendard-Bold',
    color: '#EF5350',
  },
  submitBtn: {
    backgroundColor: '#4CAF50',
    borderRadius: 16,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  submitText: {
    fontSize: 18,
    fontFamily: 'Pretendard-Bold',
    color: '#FFFFFF',
  },
  footer: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'flex-start',
  },
});
