// 공시레이더 도메인 타입 — dartlab 의 Company/panel/credit 개념을 서비스 형태로 옮긴 것.

export type Severity = "critical" | "warning" | "positive";

export interface RiskTag {
  label: string;
  severity: Severity;
  note: string;
}

export interface Filing {
  date: string; // YYYY-MM-DD
  title: string;
  submitter: string;
  url: string;
}

export interface TaggedFiling extends Filing {
  tags: RiskTag[];
}

/** 연도별 핵심 재무 요약 (연결 기준) */
export interface YearFinancials {
  year: number;
  revenue: number | null;
  operatingIncome: number | null;
  netIncome: number | null;
  assets: number | null;
  liabilities: number | null;
  equity: number | null;
  currentAssets: number | null;
  currentLiabilities: number | null;
  ocf: number | null; // 영업활동현금흐름
  icf: number | null; // 투자활동현금흐름
  fcf: number | null; // 재무활동현금흐름
}

export interface CompanyProfile {
  code: string; // 6자리 종목코드
  name: string;
  sector: string;
  market: string; // KOSPI / KOSDAQ
  demo: boolean; // 데모(가상) 데이터 여부
}

export interface CompanyData extends CompanyProfile {
  years: YearFinancials[]; // 최신 연도부터 내림차순
  filings: Filing[];
}

export type PanelTopic = "BS" | "IS" | "CF";

export interface PanelRow {
  name: string;
  values: (number | null)[];
}

export interface Panel {
  topic: PanelTopic;
  title: string;
  columns: string[]; // 연도 라벨
  rows: PanelRow[];
}

export interface MetricScore {
  name: string;
  display: string; // 표시용 값 (예: "12.3%")
  risk: number; // 0(안전) ~ 100(위험)
}

export interface HealthAxis {
  name: string;
  weight: number;
  risk: number | null; // 축 평균 리스크 (지표 부재 시 null)
  metrics: MetricScore[];
}

/** dartlab 20단계 신용등급 표기 (AAA ~ D) */
export type Grade = string;

export interface HealthReport {
  /** 종합 위험 점수 0~100 (0=AAA, 100=D — dartlab 규약) */
  riskScore: number;
  /** 공시 리스크 반영 전 점수 */
  baseRiskScore: number;
  /** 공시 리스크 가산점 (양수 = 위험 증가) */
  disclosurePenalty: number;
  grade: Grade;
  gradeDesc: string; // "투자적격 상위" 등
  pd: number; // 1년 부도확률 추정 (%)
  investmentGrade: boolean;
  outlook: "긍정적" | "안정적" | "부정적" | "N/A";
  axes: HealthAxis[];
  signals: string[]; // 요약 시그널 문장
}
