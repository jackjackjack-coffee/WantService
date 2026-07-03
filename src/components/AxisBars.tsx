// 건전성 4축 리스크 시각화 — 축별 위험도 바 + 지표 상세

import type { HealthAxis } from "@/lib/types";

function riskColor(risk: number): string {
  if (risk < 20) return "bg-ok";
  if (risk < 45) return "bg-info";
  if (risk < 65) return "bg-warn";
  return "bg-bad";
}

export default function AxisBars({ axes }: { axes: HealthAxis[] }) {
  return (
    <div className="space-y-4">
      {axes.map((axis) => (
        <div key={axis.name}>
          <div className="mb-1 flex items-baseline justify-between text-sm">
            <span className="font-medium">
              {axis.name}
              <span className="ml-1.5 text-xs text-dim">가중치 {Math.round(axis.weight * 100)}%</span>
            </span>
            <span className="num text-xs text-mut">
              위험도 {axis.risk === null ? "—" : Math.round(axis.risk)}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-surface2">
            {axis.risk !== null && (
              <div
                className={`h-full rounded-full ${riskColor(axis.risk)}`}
                style={{ width: `${Math.max(3, axis.risk)}%` }}
              />
            )}
          </div>
          <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-mut">
            {axis.metrics.map((m) => (
              <span key={m.name}>
                {m.name} <span className="num text-ink/80">{m.display}</span>
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
