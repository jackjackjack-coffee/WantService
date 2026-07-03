// 알림 스캐너 — 관심기업의 최근 공시를 리스크 분류기에 통과시켜 alerts 테이블에 적재.
// 대시보드/알림 페이지 로드 시 호출되며, /api/cron/scan 으로 주기 실행도 가능하다.

import { getWatchlist, upsertAlert } from "@/lib/db";
import { getCompanyData } from "@/lib/dart-service";
import { tagFilings } from "@/lib/risk-tags";

const SCAN_WINDOW_DAYS = 180;

export async function scanUserAlerts(userId: number): Promise<void> {
  const watches = getWatchlist(userId);
  const cutoff = Date.now() - SCAN_WINDOW_DAYS * 86_400_000;

  for (const w of watches) {
    try {
      const company = await getCompanyData(w.code);
      if (!company) continue;
      const tagged = tagFilings(company.filings);
      for (const f of tagged) {
        if (new Date(f.date).getTime() < cutoff) continue;
        for (const tag of f.tags) {
          if (tag.severity === "positive") continue;
          upsertAlert({
            user_id: userId,
            code: w.code,
            company_name: company.name,
            filing_date: f.date,
            title: f.title,
            severity: tag.severity,
            tag: tag.label,
            note: tag.note,
            url: f.url,
          });
        }
      }
    } catch {
      // 한 종목 실패(레이트리밋 등)가 전체 스캔을 막지 않게 한다
    }
  }
}
