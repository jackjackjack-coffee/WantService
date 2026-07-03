import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { createPayment } from "@/lib/db";
import { PLANS } from "@/lib/plans";

/** 결제 주문 생성 — 클라이언트가 Toss 결제창을 띄우기 전에 서버에 주문을 기록한다. */
export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });

  const body = (await req.json().catch(() => null)) as { plan?: string } | null;
  const plan = body?.plan === "PRO" || body?.plan === "BUSINESS" ? PLANS[body.plan] : null;
  if (!plan) return NextResponse.json({ error: "올바른 플랜이 아닙니다." }, { status: 400 });

  const orderId = `dw_${user.id}_${Date.now()}_${randomBytes(4).toString("hex")}`;
  createPayment(user.id, orderId, plan.id, plan.price);

  return NextResponse.json({
    orderId,
    amount: plan.price,
    orderName: `다트워치 ${plan.name} 1개월`,
    customerName: user.name,
    customerEmail: user.email,
  });
}
