/** 원 단위 금액 → 조/억 한글 표기. 예: 300870903000000 → "300.9조", -64000000000 → "-640억" */
export function fmtKRW(n: number | null | undefined): string {
  if (n === null || n === undefined || Number.isNaN(n)) return "—";
  const sign = n < 0 ? "-" : "";
  const abs = Math.abs(n);
  if (abs >= 1e12) {
    const v = abs / 1e12;
    return `${sign}${v >= 100 ? v.toFixed(1) : v.toFixed(2)}조`;
  }
  if (abs >= 1e8) {
    return `${sign}${Math.round(abs / 1e8).toLocaleString("ko-KR")}억`;
  }
  if (abs >= 1e6) {
    return `${sign}${Math.round(abs / 1e6).toLocaleString("ko-KR")}백만`;
  }
  return `${sign}${abs.toLocaleString("ko-KR")}원`;
}

export function fmtPct(n: number | null | undefined, digits = 1): string {
  if (n === null || n === undefined || Number.isNaN(n)) return "—";
  return `${n.toFixed(digits)}%`;
}

export function fmtDate(iso: string): string {
  // YYYY-MM-DD → YYYY.MM.DD
  return iso.replaceAll("-", ".");
}

export function fmtWon(n: number): string {
  return `₩${n.toLocaleString("ko-KR")}`;
}

/** a/b 백분율 (dartlab-lite ratios 의 pct 헬퍼와 동일한 규약: 분모 0/None → null) */
export function pct(a: number | null, b: number | null): number | null {
  if (a === null || b === null || b === 0) return null;
  return Math.round((a / b) * 10000) / 100;
}
