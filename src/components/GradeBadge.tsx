// 신용등급 배지 — dartlab 20단계 등급을 대분류 색으로 표기.

const GRADE_STYLES: { test: (g: string) => boolean; cls: string }[] = [
  { test: (g) => /^A{2,3}[+-]?$/.test(g), cls: "bg-ok/15 text-ok border-ok/30" }, // AAA~AA-
  { test: (g) => /^A[+-]?$/.test(g), cls: "bg-ok/10 text-ok border-ok/25" },
  { test: (g) => /^BBB[+-]?$/.test(g), cls: "bg-info/15 text-info border-info/30" },
  { test: (g) => /^BB[+-]?$/.test(g), cls: "bg-warn/15 text-warn border-warn/30" },
  { test: (g) => /^B[+-]?$/.test(g), cls: "bg-warn/20 text-warn border-warn/40" },
  { test: () => true, cls: "bg-bad/15 text-bad border-bad/40" }, // CCC 이하
];

export function gradeClass(grade: string): string {
  return GRADE_STYLES.find((s) => s.test(grade))!.cls;
}

export default function GradeBadge({ grade, size = "md" }: { grade: string; size?: "md" | "lg" }) {
  const sizeCls = size === "lg" ? "text-2xl px-4 py-1.5 font-bold" : "text-sm px-2.5 py-0.5 font-semibold";
  return (
    <span className={`inline-flex items-center rounded-md border num ${sizeCls} ${gradeClass(grade)}`}>
      {grade}
    </span>
  );
}
