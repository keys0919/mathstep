import { MultTableData } from '../types/progress.types';
import { MultTableProblem, MentalProblem, MentalOp, MultiplyProblem, DivideProblem, BoxDef } from '../types/problem.types';

function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function buildMultTableSession(
  multTable: MultTableData,
  count: number
): MultTableProblem[] {
  const pool: MultTableProblem[] = [];

  for (let a = 2; a <= 9; a++) {
    for (let b = 2; b <= 9; b++) {
      const key = `${a}x${b}`;
      const isGraduated = multTable.graduated.some(([x, y]) => x === a && y === b);
      if (isGraduated) continue;

      // 7~9단 집중: 한쪽이라도 7 이상이면 가중치 3, 아니면 1
      const baseWeight = (a >= 7 || b >= 7) ? 3 : 1;

      const entry = multTable.weak[key];
      const weakBonus = entry && (entry.errors > 0 || entry.slowCount > 0) ? 2 : 0;

      const weight = baseWeight + weakBonus;
      for (let i = 0; i < weight; i++) {
        pool.push({ a, b, answer: a * b });
      }
    }
  }

  // 전부 졸업된 경우 → 7~9단 유지 연습
  if (pool.length === 0) {
    for (let a = 7; a <= 9; a++) {
      for (let b = 2; b <= 9; b++) {
        pool.push({ a, b, answer: a * b });
      }
    }
  }

  shuffle(pool);

  const result: MultTableProblem[] = [];
  for (let i = 0; i < count; i++) {
    const last = result[result.length - 1];
    let candidate = pool[i % pool.length];

    // 직전 문제 중복 방지
    if (last && candidate.a === last.a && candidate.b === last.b) {
      const alt = pool.find((p) => !(p.a === last.a && p.b === last.b));
      if (alt) candidate = alt;
    }

    result.push({ ...candidate });
  }

  return result;
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function mentalChoices(answer: number): number[] {
  const digits = String(answer).length;
  const min = Math.pow(10, digits - 1);
  const max = Math.pow(10, digits) - 1;

  const candidates = shuffle([10, 20, -10, -20]);
  const set = new Set<number>([answer]);

  for (const offset of candidates) {
    if (set.size >= 3) break;
    const v = answer + offset;
    if (v >= min && v <= max && v !== answer) set.add(v);
  }

  // 같은 자릿수 범위 내에서 보완
  for (let step = 1; set.size < 3; step++) {
    const pos = answer + step * 10;
    const neg = answer - step * 10;
    if (!set.has(pos) && pos >= min && pos <= max) set.add(pos);
    if (set.size < 3 && !set.has(neg) && neg >= min && neg <= max) set.add(neg);
  }

  return shuffle([...set]);
}

export function buildMentalSession(count: number): MentalProblem[] {
  const ops: MentalOp[] = ['+', '-', '*'];
  const problems: MentalProblem[] = [];

  for (let i = 0; i < count; i++) {
    const op = ops[i % ops.length];
    let a: number, b: number, answer: number;

    if (op === '+') {
      a = randomInt(15, 80);
      b = randomInt(10, 99 - a);
      answer = a + b;
    } else if (op === '-') {
      a = randomInt(30, 99);
      b = randomInt(10, a - 5);
      answer = a - b;
    } else {
      a = randomInt(12, 49);
      b = randomInt(2, 9);
      answer = a * b;
    }

    problems.push({ op, a, b, answer, choices: mentalChoices(answer) });
  }

  return shuffle(problems);
}

// 한 자리 digit의 객관식 3보기 (0~9 중 정답 + 2개 오답)
function digitChoices(d: number): number[] {
  const pool = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].filter((n) => n !== d);
  shuffle(pool);
  return shuffle([d, pool[0], pool[1]]);
}

export function buildMultiplySession(count: number): MultiplyProblem[] {
  const problems: MultiplyProblem[] = [];

  while (problems.length < count) {
    // a: 세자리, b: 두자리 (onesB ∈ 1~4 → partial1 ≤ 249×4=996, 항상 3자리)
    const a = randomInt(100, 249);
    const tensB = randomInt(1, 2);
    const onesB = randomInt(1, 4);
    const b = tensB * 10 + onesB;

    const partial1 = a * onesB;   // 3자리
    const partial2 = a * tensB;   // 3자리
    const sum = a * b;             // 4자리

    const p1Digits = String(partial1).padStart(3, '0').split('').map(Number);
    const p2Digits = String(partial2).padStart(3, '0').split('').map(Number);
    const sumDigits = String(sum).padStart(4, '0').split('').map(Number);

    const boxes: BoxDef[] = [
      ...p1Digits.map((d, i): BoxDef => ({ id: `p1-${i}`, answer: d, choices: digitChoices(d) })),
      ...p2Digits.map((d, i): BoxDef => ({ id: `p2-${i}`, answer: d, choices: digitChoices(d) })),
      ...sumDigits.map((d, i): BoxDef => ({ id: `sum-${i}`, answer: d, choices: digitChoices(d) })),
    ];

    problems.push({ a, b, partial1, partial2, sum, p1Len: 3, boxes });
  }

  return problems;
}

export function buildDivideSession(count: number): DivideProblem[] {
  const problems: DivideProblem[] = [];

  while (problems.length < count) {
    const divisor = randomInt(11, 29);
    const quotient = randomInt(14, 34);
    const remainder = randomInt(1, divisor - 1);
    const dividend = divisor * quotient + remainder;

    if (dividend < 100 || dividend > 999) continue;

    const product = divisor * quotient;

    // 어림셈 힌트: quotient의 십의자리 × 10, × 20
    const h1Mult = Math.floor(quotient / 10) * 10; // e.g. 10 (for quotient=14)
    const h2Mult = h1Mult + 10;                     // e.g. 20

    // 몫 선택지: ±2 (전체 몫값 기준)
    const w1 = Math.max(11, quotient - 2);
    const w2 = quotient + 2;
    const choices = shuffle([w1, quotient, w2]);

    const boxes: BoxDef[] = [
      { id: 'quot', answer: quotient, choices },
    ];

    problems.push({
      dividend,
      divisor,
      quotient,
      remainder,
      product,
      boxes,
      hints: [
        { multiplier: h1Mult, product: divisor * h1Mult },
        { multiplier: h2Mult, product: divisor * h2Mult },
      ],
    });
  }

  return problems;
}
