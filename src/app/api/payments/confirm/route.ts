import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { completePayment, findPayment, setUserPlan } from "@/lib/db";
import { PLAN_DURATION_DAYS } from "@/lib/plans";

/**
 * Toss Payments 결제 승인 — successUrl 리다이렉트 후 클라이언트가 호출.
 * 서버가 시크릿 키로 승인 API 를 호출해야 결제가 최종 확정된다.
 * https://docs.tosspayments.com/reference#결제-승인
 */
export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });

  const secretKey = process.env.TOSS_SECRET_KEY;
  if (!secretKey) {
    return NextResponse.json({ error: "결제 설정이 되어 있지 않습니다." }, { status: 500 });
  }

  const body = (await req.json().catch(() => null)) as {
    paymentKey?: string;
    orderId?: string;
    amount?: number;
  } | null;
  const { paymentKey, orderId, amount } = body ?? {};
  if (!paymentKey || !orderId || typeof amount !== "number") {
    return NextResponse.json({ error: "필수 파라미터가 누락되었습니다." }, { status: 400 });
  }

  const payment = findPayment(orderId);
  if (!payment || payment.user_id !== user.id) {
    return NextResponse.json({ error: "주문을 찾을 수 없습니다." }, { status: 404 });
  }
  if (payment.status === "DONE") {
    return NextResponse.json({ ok: true, plan: payment.plan }); // 이미 승인됨 (중복 호출)
  }
  if (payment.amount !== amount) {
    return NextResponse.json({ error: "결제 금액이 주문과 일치하지 않습니다." }, { status: 400 });
  }

  const res = await fetch("https://api.tosspayments.com/v1/payments/confirm", {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${secretKey}:`).toString("base64")}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ paymentKey, orderId, amount }),
  });

  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { message?: string };
    completePayment(orderId, paymentKey, "FAILED");
    return NextResponse.json({ error: err.message || "결제 승인에 실패했습니다." }, { status: 502 });
  }

  completePayment(orderId, paymentKey, "DONE");
  activatePlan(user.id, payment.plan, user.apiKey);
  return NextResponse.json({ ok: true, plan: payment.plan });
}

function activatePlan(userId: number, plan: string, existingApiKey: string | null) {
  const expiresAt = new Date(Date.now() + PLAN_DURATION_DAYS * 86_400_000).toISOString();
  const apiKey =
    plan === "BUSINESS" && !existingApiKey ? `dw_live_${randomBytes(18).toString("hex")}` : null;
  setUserPlan(userId, plan, expiresAt, apiKey);
}
