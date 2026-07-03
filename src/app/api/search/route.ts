import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { searchCompanies } from "@/lib/dart-service";

export async function GET(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });

  const q = new URL(req.url).searchParams.get("q") ?? "";
  try {
    const results = await searchCompanies(q);
    return NextResponse.json({ results: results.slice(0, 20) });
  } catch {
    return NextResponse.json({ error: "검색 중 오류가 발생했습니다." }, { status: 502 });
  }
}
