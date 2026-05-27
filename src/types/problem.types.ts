export type Phase = 'mult-table' | 'mental' | 'multiply' | 'divide' | 'complete';

export type MentalOp = '+' | '-' | '*';

export interface MultTableProblem {
  a: number;
  b: number;
  answer: number;
  choices: number[];
}

export interface MentalProblem {
  op: MentalOp;
  a: number;
  b: number;
  answer: number;
  choices: number[];
}

export interface MultiplyProblem {
  a: number;
  b: number;
  partial1: number;
  partial2: number;
  sum: number;
  p1Len: number;
  boxes: BoxDef[];
  // 합산 단계 올림 수: [십→백, 백→천] (0이면 올림 없음)
  sumCarries: [number, number];
}

export interface DivideProblem {
  dividend: number;
  divisor: number;
  quotient: number;
  quotTens: number;
  quotOnes: number;
  remainder: number;
  product: number;
  tensProduct: number;
  intermediate: number;
  onesProduct: number;
  boxes: BoxDef[];
}

export interface BoxDef {
  id: string;
  answer: number;
  choices: number[];
}

export interface MultTableResult {
  a: number;
  b: number;
  correct: boolean;
  timeSec: number;
}
