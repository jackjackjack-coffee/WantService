"use client";

// Toss successUrl 리다이렉트 페이지 — 서버 승인 API 를 호출해 결제를 확정한다.

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";

function SuccessInner() {
  const params = useSearchParams();
  const [state, setState] = useState<"pending" | "done" | "error">("pending");
  const [message, setMessage] = useState("결제를 승인하는 중입니다…");
  const called = useRef(false);

  useEffect(() => {
    if (called.current) return;
    called.current = true;
    (async () => {
      const res = await fetch("/api/payments/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentKey: params.get("paymentKey"),
          orderId: params.get("orderId"),
          amount: Number(params.get("amount")),
        }),
      });
      if (res.ok) {
        const data = (await res.json()) as { plan: string };
        setState("done");
        setMessage(`${data.plan} 플랜이 활성화되었습니다.`);
      } else {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setState("error");
        setMessage(data.error ?? "결제 승인에 실패했습니다.");
      }
    })();
  }, [params]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-2xl border border-line bg-surface p-8 text-center">
        <p className="text-4xl">{state === "done" ? "🎉" : state === "error" ? "⚠️" : "⏳"}</p>
        <h1 className="mt-4 text-xl font-bold">
          {state === "done" ? "결제 완료" : state === "error" ? "승인 실패" : "승인 중"}
        </h1>
        <p className="mt-2 text-sm text-mut">{message}</p>
        <Link
          href="/billing"
          className="mt-6 inline-block rounded-lg bg-brand px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand2"
        >
          플랜 페이지로
        </Link>
      </div>
    </div>
  );
}

export default function BillingSuccessPage() {
  return (
    <Suspense>
      <SuccessInner />
    </Suspense>
  );
}
