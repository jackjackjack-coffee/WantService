import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { completePayment, createPayment, setUserPlan } from "@/lib/db";
import { PLAN_DURATION_DAYS, PLANS } from "@/lib/plans";

/**
 * 데모 결제 — Toss 키가 설정되지 않은 환경에서 결제 흐름을 시뮬레이션한다.
 * 실제 결제 키가 설정된 배포에서는 우회 방지를 위해 비활성화된다.
 */
export async function POST(req: Request) {
  if (process.env.TOSS_SECRET_KEY) {
    return NextResponse.json({ error: "실결제가 활성화된 환경에서는 사용할 수 없습니다." }, { status: 403 });
  }

  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });

  const body = (await req.json().catch(() => null)) as { plan?: string } | null;
  const plan = body?.plan === "PRO" || body?.plan === "BUSINESS" ? PLANS[body.plan] : null;
  if (!plan) return NextResponse.json({ error: "올바른 플랜이 아닙니다." }, { status: 400 });

  const orderId = `demo_${user.id}_${Date.now()}`;
  createPayment(user.id, orderId, plan.id, plan.price);
  completePayment(orderId, "demo", "DEMO");

  const expiresAt = new Date(Date.now() + PLAN_DURATION_DAYS * 86_400_000).toISOString();
  const apiKey =
    plan.id === "BUSINESS" && !user.apiKey ? `dw_demo_${randomBytes(18).toString("hex")}` : null;
  setUserPlan(user.id, plan.id, expiresAt, apiKey);

  return NextResponse.json({ ok: true, plan: plan.id });
}
