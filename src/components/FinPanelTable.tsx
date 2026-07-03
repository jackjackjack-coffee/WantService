// 재무제표 항목 × 연도 격자 테이블 (dartlab panel 렌더)

import { fmtKRW } from "@/lib/format";
import type { Panel } from "@/lib/types";

export default function FinPanelTable({ panel, maxRows = 40 }: { panel: Panel; maxRows?: number }) {
  const rows = panel.rows.slice(0, maxRows);
  return (
    <div className="overflow-x-auto panel-scroll">
      <table className="w-full min-w-[480px] text-sm">
        <thead>
          <tr className="border-b border-line text-left text-xs text-mut">
            <th className="py-2 pr-4 font-medium">항목</th>
            {panel.columns.map((c) => (
              <th key={c} className="num py-2 pl-4 text-right font-medium">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={`${r.name}-${i}`} className="border-b border-line/50 last:border-0 hover:bg-surface2/50">
              <td className="max-w-[220px] truncate py-1.5 pr-4 text-mut" title={r.name}>
                {r.name}
              </td>
              {r.values.map((v, j) => (
                <td
                  key={j}
                  className={`num py-1.5 pl-4 text-right ${v !== null && v < 0 ? "text-bad" : ""}`}
                >
                  {fmtKRW(v)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {panel.rows.length > maxRows && (
        <p className="mt-2 text-xs text-dim">상위 {maxRows}개 항목만 표시 — 전체는 CSV 다운로드를 이용하세요.</p>
      )}
    </div>
  );
}
