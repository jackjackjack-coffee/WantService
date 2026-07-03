// 매출·영업이익 연도별 추이 — 서버 렌더 SVG 바 차트 (클라이언트 JS 불필요)

import { fmtKRW } from "@/lib/format";
import type { YearFinancials } from "@/lib/types";

export default function TrendChart({ years }: { years: YearFinancials[] }) {
  const data = [...years].sort((a, b) => a.year - b.year); // 과거 → 최신
  const values = data.flatMap((d) => [d.revenue ?? 0, d.operatingIncome ?? 0]);
  const maxAbs = Math.max(1, ...values.map(Math.abs));

  const W = 560;
  const H = 200;
  const padX = 8;
  const baseline = H * (values.some((v) => v < 0) ? 0.62 : 0.88);
  const scale = (baseline - 14) / maxAbs;
  const groupW = (W - padX * 2) / data.length;
  const barW = Math.min(42, groupW / 3);

  const bar = (x: number, v: number | null, color: string, key: string) => {
    if (v === null) return null;
    const h = Math.abs(v) * scale;
    const y = v >= 0 ? baseline - h : baseline;
    return <rect key={key} x={x} y={y} width={barW} height={Math.max(h, 1)} rx={3} fill={color} opacity={0.9} />;
  };

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H + 22}`} className="w-full" role="img" aria-label="매출·영업이익 추이">
        <line x1={0} y1={baseline} x2={W} y2={baseline} stroke="#1d2a44" strokeWidth={1} />
        {data.map((d, i) => {
          const gx = padX + i * groupW + groupW / 2;
          return (
            <g key={d.year}>
              {bar(gx - barW - 3, d.revenue, "#38bdf8", `r${d.year}`)}
              {bar(gx + 3, d.operatingIncome, d.operatingIncome !== null && d.operatingIncome < 0 ? "#f87171" : "#34d399", `o${d.year}`)}
              <text x={gx} y={H + 16} textAnchor="middle" fontSize={12} fill="#8b95ab" className="num">
                {d.year}
              </text>
              <text x={gx - barW / 2 - 3} y={barY(d.revenue, baseline, scale) - 4} textAnchor="middle" fontSize={10} fill="#38bdf8" className="num">
                {fmtKRW(d.revenue)}
              </text>
              <text x={gx + barW / 2 + 3} y={barY(d.operatingIncome, baseline, scale) - 4} textAnchor="middle" fontSize={10} fill={d.operatingIncome !== null && d.operatingIncome < 0 ? "#f87171" : "#34d399"} className="num">
                {fmtKRW(d.operatingIncome)}
              </text>
            </g>
          );
        })}
      </svg>
      <div className="mt-1 flex gap-4 text-xs text-mut">
        <span className="flex items-center gap-1.5">
          <span className="size-2 rounded-sm bg-info" /> 매출액
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-2 rounded-sm bg-ok" /> 영업이익
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-2 rounded-sm bg-bad" /> 영업손실
        </span>
      </div>
    </div>
  );
}

function barY(v: number | null, baseline: number, scale: number): number {
  if (v === null) return baseline;
  return v >= 0 ? baseline - Math.abs(v) * scale : baseline + Math.abs(v) * scale + 12;
}
