"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function FailInner() {
  const params = useSearchParams();
  const message = params.get("message") ?? "결제가 취소되었거나 실패했습니다.";
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-2xl border border-line bg-surface p-8 text-center">
        <p className="text-4xl">💳</p>
        <h1 className="mt-4 text-xl font-bold">결제 실패</h1>
        <p className="mt-2 text-sm text-mut">{message}</p>
        <Link
          href="/billing"
          className="mt-6 inline-block rounded-lg bg-brand px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand2"
        >
          다시 시도하기
        </Link>
      </div>
    </div>
  );
}

export default function BillingFailPage() {
  return (
    <Suspense>
      <FailInner />
    </Suspense>
  );
}
