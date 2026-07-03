import Link from "next/link";
import { redirect } from "next/navigation";
import AppShell from "@/components/AppShell";
import SeverityBadge from "@/components/SeverityBadge";
import { MarkAlertsReadButton } from "@/components/WatchActions";
import { scanUserAlerts } from "@/lib/alerts";
import { getSessionUser } from "@/lib/auth";
import { getAlerts } from "@/lib/db";
import { fmtDate } from "@/lib/format";
import type { Severity } from "@/lib/types";

export const metadata = { title: "알림" };
export const dynamic = "force-dynamic";

export default async function AlertsPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  await scanUserAlerts(user.id);
  const alerts = getAlerts(user.id, 200);
  const unread = alerts.filter((a) => a.read === 0).length;

  return (
    <AppShell user={user} active="alerts">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">위험 공시 알림</h1>
          <p className="mt-1 text-sm text-mut">
            관심기업의 최근 180일 공시 중 리스크 패턴에 해당하는 항목입니다.
            {unread > 0 && <span className="ml-1 font-semibold text-bad">읽지 않음 {unread}건</span>}
          </p>
        </div>
        {alerts.length > 0 && <MarkAlertsReadButton />}
      </div>

      {alerts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line2 bg-surface/50 p-12 text-center">
          <p className="text-lg font-semibold">아직 알림이 없습니다</p>
          <p className="mt-2 text-sm text-mut">
            <Link href="/dashboard" className="text-info hover:underline">대시보드</Link>
            에서 관심기업을 등록하면 위험 공시가 자동으로 수집됩니다.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {alerts.map((a) => (
            <li
              key={a.id}
              className={`rounded-xl border bg-surface p-4 ${
                a.read === 0 ? "border-line2" : "border-line opacity-70"
              }`}
            >
              <div className="flex flex-wrap items-center gap-2">
                <SeverityBadge severity={a.severity as Severity} label={a.tag} />
                <Link href={`/company/${a.code}`} className="font-semibold hover:text-brand2">
                  {a.company_name}
                </Link>
                <span className="num text-xs text-dim">{a.code}</span>
                <span className="num ml-auto text-xs text-dim">{fmtDate(a.filing_date)}</span>
                {a.read === 0 && <span className="size-2 rounded-full bg-brand" title="읽지 않음" />}
              </div>
              <a href={a.url} target="_blank" rel="noreferrer" className="mt-2 block text-sm text-mut hover:text-ink">
                {a.title}
              </a>
              {a.note && <p className="mt-1 text-xs text-dim">{a.note}</p>}
            </li>
          ))}
        </ul>
      )}
    </AppShell>
  );
}
