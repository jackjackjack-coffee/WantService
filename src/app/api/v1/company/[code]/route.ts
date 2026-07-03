import { NextResponse } from "next/server";
import { findUserByApiKey } from "@/lib/db";
import { getCompanyData } from "@/lib/dart-service";
import { evaluateHealth } from "@/lib/health";
import { effectivePlan } from "@/lib/plans";
import { tagFilings } from "@/lib/risk-tags";

/**
 * Business 플랜 REST API — `Authorization: Bearer <api_key>` 인증.
 * 종목코드 하나로 재무 요약 + 건전성 등급 + 리스크 태그 공시를 반환한다.
 */
export async function GET(req: Request, ctx: RouteContext<"/api/v1/company/[code]">) {
  const auth = req.headers.get("authorization") ?? "";
  const apiKey = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
  if (!apiKey) {
    return NextResponse.json({ error: "Authorization: Bearer <api_key> 헤더가 필요합니다." }, { status: 401 });
  }

  const user = findUserByApiKey(apiKey);
  if (!user) return NextResponse.json({ error: "유효하지 않은 API 키입니다." }, { status: 401 });

  const plan = effectivePlan(user.plan, user.plan_expires_at);
  if (!plan.apiAccess) {
    return NextResponse.json({ error: "API 액세스는 Business 플랜 전용입니다." }, { status: 403 });
  }

  const { code } = await ctx.params;
  const company = await getCompanyData(code).catch(() => null);
  if (!company) return NextResponse.json({ error: "데이터를 찾을 수 없습니다." }, { status: 404 });

  const filings = tagFilings(company.filings);
  const health = evaluateHealth(company.years, filings);

  return NextResponse.json({
    code: company.code,
    name: company.name,
    demo: company.demo,
    grade: health.grade,
    gradeDesc: health.gradeDesc,
    riskScore: health.riskScore,
    pd1y: health.pd,
    outlook: health.outlook,
    investmentGrade: health.investmentGrade,
    signals: health.signals,
    financials: company.years,
    riskFilings: filings
      .filter((f) => f.tags.some((t) => t.severity !== "positive"))
      .map((f) => ({ date: f.date, title: f.title, tags: f.tags, url: f.url })),
  });
}
