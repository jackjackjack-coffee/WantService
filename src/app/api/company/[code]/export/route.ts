import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getPanel } from "@/lib/dart-service";
import type { PanelTopic } from "@/lib/types";

/** 재무제표 CSV 다운로드 — Pro 이상 플랜 전용 (UTF-8 BOM, Excel 호환) */
export async function GET(req: Request, ctx: RouteContext<"/api/company/[code]/export">) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  if (!user.plan.csvExport) {
    return NextResponse.json(
      { error: "CSV 다운로드는 Pro 플랜부터 제공됩니다.", upgradeRequired: true },
      { status: 403 },
    );
  }

  const { code } = await ctx.params;
  const topicParam = new URL(req.url).searchParams.get("topic")?.toUpperCase() ?? "IS";
  const topic: PanelTopic = topicParam === "BS" || topicParam === "CF" ? topicParam : "IS";

  const panel = await getPanel(code, topic).catch(() => null);
  if (!panel) return NextResponse.json({ error: "데이터를 찾을 수 없습니다." }, { status: 404 });

  const esc = (s: string) => (/[",\n]/.test(s) ? `"${s.replaceAll('"', '""')}"` : s);
  const lines = [
    ["항목", ...panel.columns].map(esc).join(","),
    ...panel.rows.map((r) =>
      [esc(r.name), ...r.values.map((v) => (v === null ? "" : String(v)))].join(","),
    ),
  ];
  const csv = "﻿" + lines.join("\r\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${code}_${topic}.csv"`,
    },
  });
}
