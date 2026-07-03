import Link from "next/link";
import { redirect } from "next/navigation";
import AppShell from "@/components/AppShell";
import CompanySearch from "@/components/CompanySearch";
import GradeBadge from "@/components/GradeBadge";
import { RemoveWatchButton } from "@/components/WatchActions";
import { scanUserAlerts } from "@/lib/alerts";
import { getSessionUser } from "@/lib/auth";
import { getCompanyData } from "@/lib/dart-service";
import { getAlerts, getWatchlist } from "@/lib/db";
import { evaluateHealth } from "@/lib/health";
import { tagFilings } from "@/lib/risk-tags";
import type { HealthReport } from "@/lib/types";

export const metadata = { title: "대시보드" };
export const dynamic = "force-dynamic";

interface CardData {
  code: string;
  name: string;
  demo: boolean;
  health: HealthReport | null;
  alertCount: number;
}

export default async function DashboardPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  await scanUserAlerts(user.id);

  const watches = getWatchlist(user.id);
  const alerts = getAlerts(user.id, 500).filter((a) => a.read === 0);

  const cards: CardData[] = await Promise.all(
    watches.map(async (w) => {
      const company = await getCompanyData(w.code).catch(() => null);
      if (!company || company.years.length === 0) {
        return { code: w.code, name: w.name, demo: false, health: null, alertCount: 0 };
      }
      const health = evaluateHealth(company.years, tagFilings(company.filings));
      return {
        code: w.code,
        name: company.name,
        demo: company.demo,
        health,
        alertCount: alerts.filter((a) => a.code === w.code).length,
      };
    }),
  );

  const limit = user.plan.watchLimit;
  const limitLabel = Number.isFinite(limit) ? `${watches.length}/${limit}` : `${watches.length}/무제한`;

  return (
    <AppShell user={user} active="dashboard">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">관심기업</h1>
          <p className="mt-1 text-sm text-mut">
            등록 {limitLabel}
            {!Number.isFinite(limit) ? "" : watches.length >= limit ? (
              <>
                {" · 한도 도달 — "}
                <Link href="/billing" className="text-info hover:underline">플랜 업그레이드</Link>
              </>
            ) : null}
          </p>
        </div>
        <CompanySearch watchedCodes={watches.map((w) => w.code)} />
      </div>

      {cards.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line2 bg-surface/50 p-12 text-center">
          <p className="text-lg font-semibold">첫 관심기업을 등록해보세요</p>
          <p className="mt-2 text-sm text-mut">
            위 검색창에서 기업명이나 종목코드를 검색하세요. 데모 모드에서는{" "}
            <span className="text-warn">한빛중공업(가상)</span> 을 추가해 위험 시나리오를 체험할 수 있습니다.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((c) => (
            <Link
              key={c.code}
              href={`/company/${c.code}`}
              className="group rounded-2xl border border-line bg-surface p-5 transition-colors hover:border-line2"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="num text-xs text-dim">
                    {c.code}
                    {c.demo && <span className="ml-1.5 rounded bg-warn/10 px-1 text-[10px] text-warn">데모</span>}
                  </p>
                  <p className="truncate text-lg font-semibold group-hover:text-brand2">{c.name}</p>
                </div>
                {c.health && <GradeBadge grade={c.health.grade} />}
              </div>

              {c.health ? (
                <>
                  <div className="mt-3 flex items-center gap-3 text-xs text-mut">
                    <span className="num">위험점수 {Math.round(c.health.riskScore)}</span>
                    <span>전망 {c.health.outlook}</span>
                    {c.alertCount > 0 && (
                      <span className="ml-auto rounded-full bg-bad/15 px-2 py-0.5 font-semibold text-bad">
                        알림 {c.alertCount}
                      </span>
                    )}
                  </div>
                  <p className="mt-3 line-clamp-2 text-sm text-mut">{c.health.signals[0]}</p>
                </>
              ) : (
                <p className="mt-3 text-sm text-dim">재무 데이터를 불러올 수 없습니다.</p>
              )}

              <div className="mt-4 flex items-center justify-between border-t border-line/60 pt-3">
                <span className="text-xs text-info">상세 분석 →</span>
                <RemoveWatchButton code={c.code} />
              </div>
            </Link>
          ))}
        </div>
      )}
    </AppShell>
  );
}
