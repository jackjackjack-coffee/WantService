// dartlab credit 엔진의 핵심 프리미티브를 TypeScript 로 이식한 것.
// 원본: dartlab/src/dartlab/credit/scoring/creditScorecard.py (scoreMetric / axisScore / weightedScore),
//       dartlab/src/dartlab/synth/creditGradeTable.py (20단계 등급표 · PD · outlook),
//       dartlab/src/dartlab/credit/features/_sectorThresholdsA.py (기본 업종 기준표).
// 점수 규약: 0 = 최우량(AAA), 100 = 최위험(D). 값이 클수록 위험.

export interface ThresholdDef {
  lowerIsBetter: boolean;
  /** (지표값, 위험점수) — 반드시 지표값 오름차순.
   *  원본 dartlab 은 lower_is_better=False 표를 내림차순으로 정의하고 계산 시 반전하지만,
   *  본 이식본은 모든 표를 오름차순으로 통일해 반전 단계를 없앴다. */
  breakpoints: [number, number][];
}

/** 단일 지표 → 0-100 위험 점수 (Moody's 식 선형 보간, 범위 밖 클램프) */
export function scoreMetric(value: number | null, def: ThresholdDef): number | null {
  if (value === null || Number.isNaN(value)) return null;
  const bps = def.breakpoints;
  if (bps.length === 0) return null;

  if (value <= bps[0][0]) return bps[0][1];
  if (value >= bps[bps.length - 1][0]) return bps[bps.length - 1][1];

  for (let i = 0; i < bps.length - 1; i++) {
    const [v0, s0] = bps[i];
    const [v1, s1] = bps[i + 1];
    if (v0 <= value && value <= v1) {
      if (v1 === v0) return s0;
      const ratio = (value - v0) / (v1 - v0);
      return Math.round((s0 + ratio * (s1 - s0)) * 100) / 100;
    }
  }
  return bps[bps.length - 1][1];
}

/** 축 내 지표 점수 평균 (None 제외). 모두 None 이면 null. */
export function axisScore(scores: (number | null)[]): number | null {
  const valid = scores.filter((s): s is number => s !== null);
  if (valid.length === 0) return null;
  return Math.round((valid.reduce((a, b) => a + b, 0) / valid.length) * 100) / 100;
}

/** 축 가중평균 — null 축은 가중치 재분배로 제외. 전부 null 이면 중립 50. */
export function weightedScore(axes: { score: number | null; weight: number }[]): number {
  const valid = axes.filter((a) => a.score !== null);
  if (valid.length === 0) return 50.0;
  const totalWeight = valid.reduce((a, b) => a + b.weight, 0);
  if (totalWeight <= 0) return 50.0;
  const sum = valid.reduce((a, b) => a + (b.score as number) * b.weight, 0);
  return Math.round((sum / totalWeight) * 100) / 100;
}

// ── 20단계 등급 테이블 (상한점수, 등급, 설명, 1년PD%) ──
// KIS 실측(1998-2025) + S&P 글로벌 PD 종합 — dartlab creditGradeTable SSOT 이식.
const GRADE_20_TABLE: [number, string, string, number][] = [
  [3, "AAA", "투자적격 최상위", 0.0],
  [5, "AA+", "투자적격 상위+", 0.01],
  [8, "AA", "투자적격 상위", 0.02],
  [10, "AA-", "투자적격 상위-", 0.03],
  [13, "A+", "투자적격+", 0.04],
  [16, "A", "투자적격", 0.06],
  [19, "A-", "투자적격-", 0.08],
  [22, "BBB+", "투자적격 하한+", 0.15],
  [27, "BBB", "투자적격 하한", 0.25],
  [32, "BBB-", "투자적격 하한-", 0.4],
  [37, "BB+", "투기등급+", 0.75],
  [42, "BB", "투기등급", 1.5],
  [48, "BB-", "투기등급-", 2.5],
  [55, "B+", "투기등급 하위+", 4.0],
  [62, "B", "투기등급 하위", 7.0],
  [70, "B-", "투기등급 하위-", 10.0],
  [78, "CCC", "상당한 부실 위험", 15.0],
  [85, "CC", "부실 임박", 25.0],
  [93, "C", "부도 직전", 40.0],
  [100, "D", "부도", 100.0],
];

const GRADE_ORDER = GRADE_20_TABLE.map((r) => r[1]);

/** 종합 위험 점수(0-100) → (등급, 설명, 1년 PD%) */
export function mapTo20Grade(score: number): { grade: string; desc: string; pd: number } {
  const s = Math.max(0, Math.min(100, score));
  for (const [threshold, grade, desc, pd] of GRADE_20_TABLE) {
    if (s < threshold) return { grade, desc, pd };
  }
  return { grade: "D", desc: "부도", pd: 100.0 };
}

/** 등급을 n notch 상향(+)/하향(-) */
export function notchGrade(grade: string, notches: number): string {
  const idx = GRADE_ORDER.indexOf(grade);
  if (idx < 0) return grade;
  const next = Math.max(0, Math.min(GRADE_ORDER.length - 1, idx - notches));
  return GRADE_ORDER[next];
}

/** 투자적격(BBB- 이상) 여부 */
export function isInvestmentGrade(grade: string): boolean {
  const idx = GRADE_ORDER.indexOf(grade);
  if (idx < 0) return false;
  return idx <= GRADE_ORDER.indexOf("BBB-");
}

/** 점수 시계열(최신→과거) → 전망. 점수 하락(개선)=긍정적, ±5점 임계. */
export function creditOutlook(scoreHistory: number[]): "긍정적" | "안정적" | "부정적" | "N/A" {
  if (scoreHistory.length < 2) return "N/A";
  const delta = scoreHistory[0] - scoreHistory[scoreHistory.length - 1];
  if (delta < -5) return "긍정적";
  if (delta > 5) return "부정적";
  return "안정적";
}

// ── 기본(제조업) 기준표 — dartlab _defaultThresholds 이식 (본 서비스에서 쓰는 지표만) ──

export const THRESHOLDS: Record<string, ThresholdDef> = {
  // 레버리지: 부채비율 (%)
  debtRatio: {
    lowerIsBetter: true,
    breakpoints: [
      [0, 0],
      [30, 2],
      [50, 5],
      [80, 10],
      [120, 18],
      [180, 30],
      [250, 48],
      [350, 68],
      [500, 85],
      [800, 95],
    ],
  },
  // 유동성: 유동비율 (%)
  currentRatio: {
    lowerIsBetter: false,
    breakpoints: [
      [30, 85],
      [50, 68],
      [80, 48],
      [100, 32],
      [120, 20],
      [150, 12],
      [200, 5],
      [300, 0],
    ],
  },
  // 아래 지표들은 dartlab 7축 중 요약 재무만으로 계산 가능한 축을 위해
  // dartlab _engineScoring / 신평사 공개 기준을 참고해 같은 형식으로 단순화한 기준표.
  operatingMargin: {
    lowerIsBetter: false,
    breakpoints: [
      [-20, 90],
      [-5, 70],
      [0, 45],
      [3, 30],
      [8, 15],
      [15, 5],
      [25, 0],
    ],
  },
  netMargin: {
    lowerIsBetter: false,
    breakpoints: [
      [-20, 88],
      [-5, 65],
      [0, 42],
      [2, 30],
      [6, 15],
      [12, 5],
      [20, 0],
    ],
  },
  roe: {
    lowerIsBetter: false,
    breakpoints: [
      [-20, 85],
      [-5, 65],
      [0, 42],
      [4, 28],
      [8, 15],
      [15, 5],
      [25, 0],
    ],
  },
  // OCF/매출 (%) — dartlab _scoreCashFlow 의 구간을 보간형으로 재기술
  ocfToSales: {
    lowerIsBetter: false,
    breakpoints: [
      [-20, 70],
      [-5, 55],
      [0, 40],
      [5, 25],
      [10, 12],
      [20, 0],
    ],
  },
  revenueGrowth: {
    lowerIsBetter: false,
    breakpoints: [
      [-40, 85],
      [-25, 65],
      [-10, 40],
      [0, 20],
      [10, 5],
      [20, 0],
    ],
  },
};
