import { redirect } from "next/navigation";
import AppShell from "@/components/AppShell";
import BillingCheckout from "@/components/BillingCheckout";
import { getSessionUser } from "@/lib/auth";
import { getPayments } from "@/lib/db";
import { fmtWon } from "@/lib/format";
import { PLANS } from "@/lib/plans";

export const metadata = { title: "플랜·결제" };
export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = {
  DONE: "결제 완료",
  DEMO: "데모 결제",
  PENDING: "대기",
  FAILED: "실패",
};

export default async function BillingPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const payments = getPayments(user.id).filter((p) => p.status !== "PENDING");

  return (
    <AppShell user={user} active="billing">
      <h1 className="text-2xl font-bold">플랜·결제</h1>
      <p className="mt-1 text-sm text-mut">
        현재 플랜: <span className="font-semibold text-info">{user.plan.name}</span>
        {user.plan.id !== "FREE" && user.planExpiresAt && (
          <> · {new Date(user.planExpiresAt).toLocaleDateString("ko-KR")} 까지</>
        )}
      </p>

      <div className="mt-8 grid gap-5 md:grid-cols-3">
        {Object.values(PLANS).map((plan) => (
          <div
            key={plan.id}
            className={`flex flex-col rounded-2xl border p-6 ${
              plan.id === user.plan.id ? "border-info bg-surface" : plan.id === "PRO" ? "border-brand bg-surface" : "border-line bg-surface"
            }`}
          >
            <h3 className="text-lg font-semibold">{plan.name}</h3>
            <p className="mt-1 text-xs text-mut">{plan.tagline}</p>
            <p className="mt-4 text-3xl font-bold num">
              {plan.price === 0 ? "₩0" : fmtWon(plan.price)}
              <span className="text-sm font-normal text-mut">/월</span>
            </p>
            <ul className="mt-5 flex-1 space-y-2 text-sm text-mut">
              {plan.features.map((f) => (
                <li key={f} className="flex items-start gap-2">
                  <span className="mt-0.5 text-ok">✓</span>
                  {f}
                </li>
              ))}
            </ul>
            <div className="mt-6">
              {plan.id === "FREE" ? (
                <div className={`rounded-lg border border-line px-4 py-2.5 text-center text-sm ${user.plan.id === "FREE" ? "text-info" : "text-dim"}`}>
                  {user.plan.id === "FREE" ? "현재 플랜" : "기본 플랜"}
                </div>
              ) : (
                <BillingCheckout
                  plan={plan.id as "PRO" | "BUSINESS"}
                  price={plan.price}
                  currentPlan={user.plan.id}
                  customerKey={`user_${user.id}`}
                />
              )}
            </div>
          </div>
        ))}
      </div>

      {user.plan.apiAccess && user.apiKey && (
        <section className="mt-8 rounded-2xl border border-line bg-surface p-6">
          <h2 className="font-semibold">REST API</h2>
          <p className="mt-1 text-sm text-mut">아래 키를 Bearer 토큰으로 사용하세요. 외부에 노출되지 않게 주의해주세요.</p>
          <pre className="panel-scroll mt-3 overflow-x-auto rounded-lg border border-line bg-bg p-3 text-xs text-ink/90">
            {`curl -H "Authorization: Bearer ${user.apiKey}" \\\n  ${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/api/v1/company/005930`}
          </pre>
        </section>
      )}

      {payments.length > 0 && (
        <section className="mt-8 rounded-2xl border border-line bg-surface p-6">
          <h2 className="mb-4 font-semibold">결제 내역</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs text-mut">
                <th className="py-2 font-medium">일시</th>
                <th className="py-2 font-medium">플랜</th>
                <th className="py-2 text-right font-medium">금액</th>
                <th className="py-2 text-right font-medium">상태</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p.id} className="border-b border-line/50 last:border-0">
                  <td className="num py-2 text-mut">{new Date(p.created_at + "Z").toLocaleString("ko-KR")}</td>
                  <td className="py-2">{p.plan}</td>
                  <td className="num py-2 text-right">{fmtWon(p.amount)}</td>
                  <td className={`py-2 text-right text-xs ${p.status === "FAILED" ? "text-bad" : "text-ok"}`}>
                    {STATUS_LABEL[p.status] ?? p.status}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </AppShell>
  );
}
