import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { addWatch, getWatchlist, removeWatch, watchCount } from "@/lib/db";
import { getCompanyData } from "@/lib/dart-service";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  return NextResponse.json({ watchlist: getWatchlist(user.id) });
}

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });

  const body = (await req.json().catch(() => null)) as { code?: string } | null;
  const code = body?.code?.trim() ?? "";
  if (!/^[\dA-Z]{6}$/.test(code)) {
    return NextResponse.json({ error: "올바른 종목코드가 아닙니다." }, { status: 400 });
  }

  // 플랜별 관심기업 수 제한
  const limit = user.plan.watchLimit;
  if (watchCount(user.id) >= limit) {
    return NextResponse.json(
      {
        error: `${user.plan.name} 플랜은 관심기업을 최대 ${limit}개까지 등록할 수 있습니다. 플랜을 업그레이드해주세요.`,
        upgradeRequired: true,
      },
      { status: 403 },
    );
  }

  const company = await getCompanyData(code).catch(() => null);
  if (!company) {
    return NextResponse.json({ error: "해당 종목의 재무 데이터를 찾을 수 없습니다." }, { status: 404 });
  }

  addWatch(user.id, code, company.name);
  return NextResponse.json({ ok: true, name: company.name });
}

export async function DELETE(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });

  const code = new URL(req.url).searchParams.get("code") ?? "";
  removeWatch(user.id, code);
  return NextResponse.json({ ok: true });
}
