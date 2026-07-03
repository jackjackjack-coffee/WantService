"use client";

// 플랜 결제 — Toss Payments v2 SDK (테스트/실결제) 또는 키 미설정 시 데모 결제.

import Script from "next/script";
import { useRouter } from "next/navigation";
import { useState } from "react";

declare global {
  interface Window {
    TossPayments?: (clientKey: string) => {
      payment: (opts: { customerKey: string }) => {
        requestPayment: (opts: Record<string, unknown>) => Promise<void>;
      };
    };
  }
}

export default function BillingCheckout({
  plan,
  price,
  currentPlan,
  customerKey,
}: {
  plan: "PRO" | "BUSINESS";
  price: number;
  currentPlan: string;
  customerKey: string;
}) {
  const router = useRouter();
  const clientKey = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY;
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isCurrent = currentPlan === plan;

  async function checkout() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/payments/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      if (!res.ok) throw new Error(((await res.json()) as { error?: string }).error);
      const order = (await res.json()) as {
        orderId: string;
        amount: number;
        orderName: string;
        customerName: string;
        customerEmail: string;
      };

      if (clientKey && window.TossPayments) {
        const payment = window.TossPayments(clientKey).payment({ customerKey });
        await payment.requestPayment({
          method: "CARD",
          amount: { currency: "KRW", value: order.amount },
          orderId: order.orderId,
          orderName: order.orderName,
          customerName: order.customerName,
          customerEmail: order.customerEmail,
          successUrl: `${window.location.origin}/billing/success`,
          failUrl: `${window.location.origin}/billing/fail`,
          card: { flowMode: "DEFAULT", useEscrow: false, useCardPoint: false, useAppCardOnly: false },
        });
        return; // 리다이렉트됨
      }

      // Toss 키 미설정 — 데모 결제로 흐름 시뮬레이션
      const demo = await fetch("/api/payments/demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      if (!demo.ok) throw new Error(((await demo.json()) as { error?: string }).error);
      router.refresh();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "결제 요청에 실패했습니다.";
      // 사용자가 결제창을 닫은 경우는 조용히 무시
      if (!/취소/.test(msg)) setError(msg || "결제 요청에 실패했습니다.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      {clientKey && <Script src="https://js.tosspayments.com/v2/standard" strategy="lazyOnload" />}
      <button
        onClick={checkout}
        disabled={busy || isCurrent}
        className={`w-full rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors ${
          isCurrent
            ? "cursor-default border border-line text-dim"
            : "bg-brand text-white hover:bg-brand2 disabled:opacity-60"
        }`}
      >
        {isCurrent ? "현재 플랜" : busy ? "처리 중…" : `₩${price.toLocaleString("ko-KR")}/월 시작하기`}
      </button>
      {!clientKey && !isCurrent && (
        <p className="mt-1.5 text-center text-[11px] text-dim">결제 키 미설정 — 데모 결제로 진행됩니다</p>
      )}
      {error && <p className="mt-1.5 text-center text-xs text-bad">{error}</p>}
    </div>
  );
}
