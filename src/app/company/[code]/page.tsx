import { notFound, redirect } from "next/navigation";
import AppShell from "@/components/AppShell";
import AxisBars from "@/components/AxisBars";
import FinPanelTable from "@/components/FinPanelTable";
import GradeBadge from "@/components/GradeBadge";
import SeverityBadge from "@/components/SeverityBadge";
import TrendChart from "@/components/TrendChart";
import { ExportCsvButton } from "@/components/WatchActions";
import { getSessionUser } from "@/lib/auth";
import { getCompanyData, getPanel } from "@/lib/dart-service";
import { fmtDate, fmtKRW } from "@/lib/format";
import { evaluateHealth } from "@/lib/health";
import { tagFilings } from "@/lib/risk-tags";
import type { PanelTopic } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function generateMetadata(props: PageProps<"/company/[code]">) {
  const { code } = await props.params;
  const company = await getCompanyData(code).catch(() => null);
  return { title: company ? `${company.name} 리스크 분석` : "기업 분석" };
}

const TOPICS: { key: PanelTopic; label: string }[] = [
  { key: "IS", label: "손익계산서" },
  { key: "BS", label: "재무상태표" },
  { key: "CF", label: "현금흐름표" },
];

export default async function CompanyPage(props: PageProps<"/company/[code]">) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const { code } = await props.params;
  const company = await getCompanyData(code).catch(() => null);
  if (!company || company.years.length === 0) notFound();

  const filings = tagFilings(company.filings);
  const health = evaluateHealth(company.years, filings);
  const panels = await Promise.all(TOPICS.map((t) => getPanel(code, t.key)));
  const latest = company.years[0];

  return (
    <AppShell user={user} active="company">
      {/* 헤더 */}
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="num text-sm text-dim">
            {company.code}
            {company.sector && ` · ${company.sector}`}
            {company.market && ` · ${company.market}`}
            {company.demo && <span className="ml-2 rounded bg-warn/10 px-1.5 py-0.5 text-xs text-warn">샘플 데이터</span>}
          </p>
          <h1 className="mt-1 text-3xl font-bold">{company.name}</h1>
        </div>
        <div className="text-right">
          <GradeBadge grade={health.grade} size="lg" />
          <p className="mt-1.5 text-xs text-mut">
            {health.gradeDesc} · 1년 부도확률 ~<span className="num">{health.pd}%</span>
          </p>
          <p className="text-xs text-mut">
            전망 <span className={health.outlook === "부정적" ? "text-bad" : health.outlook === "긍정적" ? "text-ok" : ""}>{health.outlook}</span>
            {" · "}위험점수 <span className="num">{Math.round(health.riskScore)}</span>/100
          </p>
        </div>
      </div>

      {/* 요약 지표 */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          ["매출액", fmtKRW(latest.revenue)],
          ["영업이익", fmtKRW(latest.operatingIncome)],
          ["자본총계", fmtKRW(latest.equity)],
          ["영업현금흐름", fmtKRW(latest.ocf)],
        ].map(([label, value]) => (
          <div key={label} className="rounded-xl border border-line bg-surface px-4 py-3">
            <p className="text-xs text-dim">{label} ({latest.year})</p>
            <p className={`num mt-1 text-lg font-semibold ${value.startsWith("-") ? "text-bad" : ""}`}>{value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* 좌측: 추이 + 재무제표 — min-w-0 이 없으면 차트·표의 최소 폭이 모바일 그리드를 밀어낸다 */}
        <div className="min-w-0 space-y-6 lg:col-span-3">
          <section className="rounded-2xl border border-line bg-surface p-5">
            <h2 className="mb-4 font-semibold">매출·영업이익 추이</h2>
            <TrendChart years={company.years} />
          </section>

          {panels.map(
            (panel, i) =>
              panel && (
                <section key={TOPICS[i].key} className="rounded-2xl border border-line bg-surface p-5">
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="font-semibold">
                      {TOPICS[i].label}
                      <span className="ml-2 text-xs font-normal text-dim">{panel.title}</span>
                    </h2>
                    <ExportCsvButton code={code} topic={TOPICS[i].key} allowed={user.plan.csvExport} />
                  </div>
                  <FinPanelTable panel={panel} maxRows={TOPICS[i].key === "IS" ? 20 : 15} />
                </section>
              ),
          )}
        </div>

        {/* 우측: 건전성 분석 + 공시 */}
        <div className="min-w-0 space-y-6 lg:col-span-2">
          <section className="rounded-2xl border border-line bg-surface p-5">
            <h2 className="mb-1 font-semibold">건전성 4축 분석</h2>
            <p className="mb-4 text-xs text-dim">
              기본 위험 <span className="num">{Math.round(health.baseRiskScore)}</span>
              {health.disclosurePenalty > 0 && (
                <> + 공시 리스크 <span className="num text-bad">+{health.disclosurePenalty}</span></>
              )}
              {" → "}종합 <span className="num">{Math.round(health.riskScore)}</span>
            </p>
            <AxisBars axes={health.axes} />
            <ul className="mt-5 space-y-1.5 border-t border-line/60 pt-4 text-sm text-mut">
              {health.signals.map((s) => (
                <li key={s} className="flex gap-2">
                  <span className="text-brand">›</span>
                  {s}
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-2xl border border-line bg-surface p-5">
            <h2 className="mb-4 font-semibold">최근 공시 {company.demo && <span className="text-xs font-normal text-warn">(데모)</span>}</h2>
            <ul className="space-y-3">
              {filings.slice(0, 12).map((f) => (
                <li key={`${f.date}-${f.title}`} className="border-b border-line/50 pb-3 last:border-0 last:pb-0">
                  <a href={f.url} target="_blank" rel="noreferrer" className="group block">
                    <div className="flex items-center gap-2">
                      <span className="num text-xs text-dim">{fmtDate(f.date)}</span>
                      {f.tags.map((t) => (
                        <SeverityBadge key={t.label} severity={t.severity} label={t.label} />
                      ))}
                    </div>
                    <p className="mt-1 text-sm text-mut group-hover:text-ink">{f.title}</p>
                  </a>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </AppShell>
  );
}
