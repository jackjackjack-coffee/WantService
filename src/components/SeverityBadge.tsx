import { SEVERITY_LABEL } from "@/lib/risk-tags";
import type { Severity } from "@/lib/types";

const STYLES: Record<Severity, string> = {
  critical: "bg-bad/15 text-bad border-bad/40",
  warning: "bg-warn/15 text-warn border-warn/35",
  positive: "bg-ok/12 text-ok border-ok/30",
};

export default function SeverityBadge({
  severity,
  label,
}: {
  severity: Severity;
  label?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-xs font-medium whitespace-nowrap ${STYLES[severity]}`}
    >
      {severity === "critical" && <span className="size-1.5 rounded-full bg-bad animate-pulse" />}
      {label ?? SEVERITY_LABEL[severity]}
    </span>
  );
}
