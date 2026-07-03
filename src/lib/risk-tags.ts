// 공시 제목 기반 리스크 분류기 — dartlab credit 의 "리스크 키워드" 축을 서비스화.
// DART 보고서명(report_nm)은 표준화되어 있어 제목 매칭만으로도 신뢰도 높은 1차 분류가 가능하다.

import type { Filing, RiskTag, Severity, TaggedFiling } from "@/lib/types";

interface RiskRule {
  pattern: RegExp;
  label: string;
  severity: Severity;
  note: string;
}

const RULES: RiskRule[] = [
  // ── critical: 즉시 확인이 필요한 신호 ──
  { pattern: /부도|파산|해산사유/, label: "부도·파산", severity: "critical", note: "지급불능 또는 법인 소멸 관련 공시입니다." },
  { pattern: /회생절차|워크아웃|채권은행.*관리/, label: "회생·워크아웃", severity: "critical", note: "법정관리·채권단 관리 절차 관련 공시입니다." },
  { pattern: /의견거절|부적정|감사범위.*한정|한정.*의견/, label: "감사의견 비적정", severity: "critical", note: "감사인이 재무제표 신뢰성에 문제를 제기했습니다." },
  { pattern: /상장폐지|관리종목/, label: "상장폐지·관리종목", severity: "critical", note: "거래소 시장조치 관련 공시입니다." },
  { pattern: /횡령|배임/, label: "횡령·배임", severity: "critical", note: "경영진의 자금 유용 혐의 관련 공시입니다." },
  { pattern: /자본잠식/, label: "자본잠식", severity: "critical", note: "누적 손실로 자본이 잠식된 상태입니다." },
  { pattern: /불성실공시/, label: "불성실공시", severity: "critical", note: "공시 의무 위반으로 지정·예고된 상태입니다." },
  { pattern: /거래정지/, label: "거래정지", severity: "critical", note: "주권 매매거래가 정지되었습니다." },

  // ── warning: 맥락 확인이 필요한 신호 ──
  { pattern: /유상증자/, label: "유상증자", severity: "warning", note: "외부 자금조달 — 기존 주주 지분 희석 및 자금 사정 점검 필요." },
  { pattern: /전환사채|신주인수권부사채|교환사채/, label: "메자닌 발행", severity: "warning", note: "CB·BW 등 잠재 희석성 채권 발행입니다." },
  { pattern: /감자결정|무상감자/, label: "감자", severity: "warning", note: "결손 보전 목적 감자일 가능성을 확인하세요." },
  { pattern: /소송/, label: "소송", severity: "warning", note: "소송 제기·판결 관련 공시입니다. 우발부채 규모를 확인하세요." },
  { pattern: /최대주주.*변경/, label: "최대주주 변경", severity: "warning", note: "지배구조 변동 — 경영 연속성 점검 필요." },
  { pattern: /조회공시|풍문|보도/, label: "조회공시", severity: "warning", note: "거래소가 풍문·보도에 대한 답변을 요구했습니다." },
  { pattern: /영업정지|생산중단/, label: "영업·생산 중단", severity: "warning", note: "주요 사업 중단 관련 공시입니다." },
  { pattern: /공급계약.*해지|계약.*해지/, label: "계약 해지", severity: "warning", note: "매출 계약 해지 — 실적 영향 확인 필요." },
  { pattern: /회계처리.*위반|감리/, label: "회계 감리", severity: "warning", note: "금융당국 회계 감리 관련 공시입니다." },

  // ── positive: 주주 친화 신호 ──
  { pattern: /무상증자/, label: "무상증자", severity: "positive", note: "잉여금의 자본 전입 — 통상 주주 친화 신호로 해석됩니다." },
  { pattern: /자기주식\s*취득|자사주\s*매입/, label: "자사주 취득", severity: "positive", note: "자기주식 취득 — 주주환원 신호입니다." },
  { pattern: /현금.*배당|배당.*결정/, label: "배당", severity: "positive", note: "배당 결정 공시입니다." },
];

export function classifyFiling(title: string): RiskTag[] {
  const tags: RiskTag[] = [];
  for (const rule of RULES) {
    if (rule.pattern.test(title)) {
      tags.push({ label: rule.label, severity: rule.severity, note: rule.note });
    }
  }
  return tags;
}

export function tagFilings(filings: Filing[]): TaggedFiling[] {
  return filings.map((f) => ({ ...f, tags: classifyFiling(f.title) }));
}

/** 최근 N일 내 공시 중 심각도별 건수 */
export function countRecentRisks(
  filings: TaggedFiling[],
  days: number,
): { critical: number; warning: number } {
  const cutoff = Date.now() - days * 86_400_000;
  let critical = 0;
  let warning = 0;
  for (const f of filings) {
    if (new Date(f.date).getTime() < cutoff) continue;
    for (const t of f.tags) {
      if (t.severity === "critical") critical += 1;
      else if (t.severity === "warning") warning += 1;
    }
  }
  return { critical, warning };
}

export const SEVERITY_LABEL: Record<Severity, string> = {
  critical: "위험",
  warning: "주의",
  positive: "긍정",
};
