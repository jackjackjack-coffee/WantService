// 재무건전성 평가 엔진 — dartlab credit 7축 모델을 요약 재무(연간 연결) 로 계산 가능한
// 4축으로 재구성한 것. 프리미티브(scoreMetric/axisScore/weightedScore/등급표)는 dartlab 이식본을 사용.
//
// 축 구성 (dartlab default 가중치를 4축으로 재배분):
//   수익성 0.25 · 재무구조(레버리지+유동성) 0.35 · 현금창출력 0.25 · 성장·추세 0.15
// 공시 리스크는 dartlab 의 disclosureRisk 축 + notching 을 단순화해 종합점수 가산점으로 반영.

import { fmtPct, pct } from "@/lib/format";
import {
  axisScore,
  creditOutlook,
  isInvestmentGrade,
  mapTo20Grade,
  scoreMetric,
  THRESHOLDS,
  weightedScore,
} from "@/lib/scorecard";
import type { HealthAxis, HealthReport, MetricScore, TaggedFiling, YearFinancials } from "@/lib/types";
import { countRecentRisks } from "@/lib/risk-tags";

interface YearMetrics {
  opMargin: number | null;
  netMargin: number | null;
  roe: number | null;
  debtRatio: number | null;
  currentRatio: number | null;
  ocfToSales: number | null;
  revenueGrowth: number | null;
  impaired: boolean; // 자본잠식
}

function deriveMetrics(y: YearFinancials, prev: YearFinancials | undefined): YearMetrics {
  const impaired = y.equity !== null && y.equity <= 0;
  return {
    opMargin: pct(y.operatingIncome, y.revenue),
    netMargin: pct(y.netIncome, y.revenue),
    roe: impaired ? null : pct(y.netIncome, y.equity),
    debtRatio: impaired ? null : pct(y.liabilities, y.equity),
    currentRatio: pct(y.currentAssets, y.currentLiabilities),
    ocfToSales: pct(y.ocf, y.revenue),
    revenueGrowth:
      prev && y.revenue !== null && prev.revenue !== null && prev.revenue !== 0
        ? Math.round(((y.revenue - prev.revenue) / Math.abs(prev.revenue)) * 10000) / 100
        : null,
    impaired,
  };
}

/** 단일 연도의 종합 위험 점수 (시계열 outlook 용) */
function yearRisk(m: YearMetrics): number {
  const profit = axisScore([
    scoreMetric(m.opMargin, THRESHOLDS.operatingMargin),
    scoreMetric(m.netMargin, THRESHOLDS.netMargin),
    scoreMetric(m.roe, THRESHOLDS.roe),
  ]);
  const leverage = m.impaired
    ? 100
    : axisScore([
        scoreMetric(m.debtRatio, THRESHOLDS.debtRatio),
        scoreMetric(m.currentRatio, THRESHOLDS.currentRatio),
      ]);
  const cash = axisScore([scoreMetric(m.ocfToSales, THRESHOLDS.ocfToSales)]);
  const growth = axisScore([scoreMetric(m.revenueGrowth, THRESHOLDS.revenueGrowth)]);
  return weightedScore([
    { score: profit, weight: 0.25 },
    { score: leverage, weight: 0.35 },
    { score: cash, weight: 0.25 },
    { score: growth, weight: 0.15 },
  ]);
}

export function evaluateHealth(years: YearFinancials[], filings: TaggedFiling[]): HealthReport {
  // years 는 최신 연도부터 내림차순
  const latest = years[0];
  const prev = years[1];
  const m = deriveMetrics(latest, prev);

  const mk = (name: string, value: number | null, key: keyof typeof THRESHOLDS, suffix = "%"): MetricScore | null => {
    const risk = scoreMetric(value, THRESHOLDS[key]);
    if (risk === null) return null;
    return { name, display: suffix === "%" ? fmtPct(value) : String(value), risk };
  };

  const profitMetrics = [
    mk("영업이익률", m.opMargin, "operatingMargin"),
    mk("순이익률", m.netMargin, "netMargin"),
    mk("ROE", m.roe, "roe"),
  ].filter((x): x is MetricScore => x !== null);

  const leverageMetrics = m.impaired
    ? [{ name: "자본잠식", display: "자본총계 ≤ 0", risk: 100 }]
    : [
        mk("부채비율", m.debtRatio, "debtRatio"),
        mk("유동비율", m.currentRatio, "currentRatio"),
      ].filter((x): x is MetricScore => x !== null);

  const cashMetrics = [mk("OCF/매출", m.ocfToSales, "ocfToSales")].filter(
    (x): x is MetricScore => x !== null,
  );
  // OCF 추세 (dartlab _scoreCashFlow: 3기 연속 양수 0 / 최근 음수 50 / 그 외 20)
  const ocfs = years.slice(0, 3).map((y) => y.ocf).filter((o): o is number => o !== null);
  if (ocfs.length >= 3) {
    const risk = ocfs.every((o) => o > 0) ? 0 : ocfs[0] < 0 ? 50 : 20;
    cashMetrics.push({
      name: "OCF 추세",
      display: ocfs.every((o) => o > 0) ? "3년 연속 양(+)" : ocfs[0] < 0 ? "최근 음(-)" : "혼조",
      risk,
    });
  }

  const growthMetrics = [mk("매출 성장률", m.revenueGrowth, "revenueGrowth")].filter(
    (x): x is MetricScore => x !== null,
  );
  // 영업이익 방향
  if (latest.operatingIncome !== null && prev?.operatingIncome != null) {
    const cur = latest.operatingIncome;
    const before = prev.operatingIncome;
    const improving = cur > before;
    const risk = cur > 0 ? (improving ? 0 : 20) : improving ? 45 : 75;
    growthMetrics.push({
      name: "영업이익 방향",
      display: `${cur > 0 ? "흑자" : "적자"}·${improving ? "개선" : "악화"}`,
      risk,
    });
  }

  const axes: HealthAxis[] = [
    { name: "수익성", weight: 0.25, risk: axisScore(profitMetrics.map((x) => x.risk)), metrics: profitMetrics },
    { name: "재무구조", weight: 0.35, risk: axisScore(leverageMetrics.map((x) => x.risk)), metrics: leverageMetrics },
    { name: "현금창출력", weight: 0.25, risk: axisScore(cashMetrics.map((x) => x.risk)), metrics: cashMetrics },
    { name: "성장·추세", weight: 0.15, risk: axisScore(growthMetrics.map((x) => x.risk)), metrics: growthMetrics },
  ];

  const baseRiskScore = weightedScore(axes.map((a) => ({ score: a.risk, weight: a.weight })));

  // 공시 리스크 가산 — 최근 180일 위험 공시 (dartlab disclosureRisk 축 + notching 단순화).
  // critical 1건 ≈ 1~2 notch, warning 은 완만하게. 과도한 포화를 막기 위해 상한을 둔다.
  const { critical, warning } = countRecentRisks(filings, 180);
  const disclosurePenalty = Math.min(16, critical * 8) + Math.min(6, warning * 2);
  const riskScore = Math.min(100, Math.round((baseRiskScore + disclosurePenalty) * 100) / 100);

  const { grade, desc, pd } = mapTo20Grade(riskScore);

  // outlook: 연도별 위험 점수 시계열 (최신→과거)
  const history = years
    .slice(0, 3)
    .map((y, i) => yearRisk(deriveMetrics(y, years[i + 1])));
  const outlook = creditOutlook(history);

  // 시그널 문장
  const signals: string[] = [];
  if (m.impaired) signals.push("자본총계가 0 이하 — 완전자본잠식 상태입니다.");
  if (m.debtRatio !== null && m.debtRatio > 300) signals.push(`부채비율 ${fmtPct(m.debtRatio, 0)} — 위험 수준입니다.`);
  else if (m.debtRatio !== null && m.debtRatio > 200) signals.push(`부채비율 ${fmtPct(m.debtRatio, 0)} — 주의가 필요합니다.`);
  if (m.currentRatio !== null && m.currentRatio < 100)
    signals.push(`유동비율 ${fmtPct(m.currentRatio, 0)} — 단기 지급능력이 부족합니다.`);
  const opYears = years.slice(0, 2).filter((y) => y.operatingIncome !== null && y.operatingIncome < 0).length;
  if (opYears >= 2) signals.push("2년 연속 영업손실을 기록했습니다.");
  else if (latest.operatingIncome !== null && latest.operatingIncome < 0) signals.push("최근 연도 영업손실을 기록했습니다.");
  if (latest.ocf !== null && latest.ocf < 0) signals.push("영업활동현금흐름이 음(-) — 본업에서 현금이 유출되고 있습니다.");
  if (m.revenueGrowth !== null && m.revenueGrowth < -10)
    signals.push(`매출이 전년 대비 ${fmtPct(Math.abs(m.revenueGrowth), 0)} 감소했습니다.`);
  if (critical > 0) signals.push(`최근 180일 내 위험 공시 ${critical}건이 발견되었습니다.`);
  else if (warning > 0) signals.push(`최근 180일 내 주의 공시 ${warning}건이 발견되었습니다.`);
  if (signals.length === 0) signals.push("주요 재무 지표에서 특이 위험 신호가 발견되지 않았습니다.");

  return {
    riskScore,
    baseRiskScore,
    disclosurePenalty,
    grade,
    gradeDesc: desc,
    pd,
    investmentGrade: isInvestmentGrade(grade),
    outlook,
    axes,
    signals,
  };
}
