// 통합 데이터 서비스 — 라이브(OpenDART) / 데모 데이터를 같은 표면으로 제공.
// dartlab 의 Company 파사드 개념: 종목코드 하나로 재무 요약·패널·공시를 읽는다.
// 라이브 응답은 SQLite 에 캐시해 OpenDART 분당 레이트리밋을 보호한다.

import { cacheGet, cacheSet } from "@/lib/db";
import { DEMO_COMPANIES, findDemoCompany, searchDemoCompanies } from "@/lib/demo-data";
import { corpCodeOf, getJson, isLiveMode, searchCorp } from "@/lib/opendart";
import type { CompanyData, Filing, Panel, PanelTopic, YearFinancials } from "@/lib/types";

const FIN_TTL = 7 * 86_400_000; // 연간 재무는 7일 캐시
const FILINGS_TTL = 60 * 60_000; // 공시 목록은 1시간 캐시

// dartlab-lite _ACCT: account_id 우선, account_nm 보조 매핑
const ACCT: Record<string, { ids: string[]; names: string[] }> = {
  revenue: { ids: ["ifrs-full_Revenue", "ifrs_Revenue"], names: ["매출액", "수익(매출액)", "영업수익"] },
  operatingIncome: {
    ids: ["dart_OperatingIncomeLoss", "ifrs-full_ProfitLossFromOperatingActivities"],
    names: ["영업이익", "영업이익(손실)"],
  },
  netIncome: { ids: ["ifrs-full_ProfitLoss"], names: ["당기순이익", "당기순이익(손실)", "분기순이익"] },
  assets: { ids: ["ifrs-full_Assets"], names: ["자산총계"] },
  liabilities: { ids: ["ifrs-full_Liabilities"], names: ["부채총계"] },
  equity: { ids: ["ifrs-full_Equity", "ifrs-full_EquityAttributableToOwnersOfParent"], names: ["자본총계"] },
  currentAssets: { ids: ["ifrs-full_CurrentAssets"], names: ["유동자산"] },
  currentLiabilities: { ids: ["ifrs-full_CurrentLiabilities"], names: ["유동부채"] },
  ocf: {
    ids: ["ifrs-full_CashFlowsFromUsedInOperatingActivities"],
    names: ["영업활동현금흐름", "영업활동으로인한현금흐름", "영업활동 현금흐름"],
  },
  icf: {
    ids: ["ifrs-full_CashFlowsFromUsedInInvestingActivities"],
    names: ["투자활동현금흐름", "투자활동으로인한현금흐름", "투자활동 현금흐름"],
  },
  fcf: {
    ids: ["ifrs-full_CashFlowsFromUsedInFinancingActivities"],
    names: ["재무활동현금흐름", "재무활동으로인한현금흐름", "재무활동 현금흐름"],
  },
};

type FinRow = Record<string, string>;

function toNumber(raw: string | undefined): number | null {
  if (raw === undefined || raw === null) return null;
  const s = String(raw).trim().replaceAll(",", "");
  if (s === "" || s === "-") return null;
  const n = Number(s);
  return Number.isNaN(n) ? null : n;
}

function pickAccount(rows: FinRow[], key: keyof typeof ACCT): number | null {
  const { ids, names } = ACCT[key];
  for (const row of rows) {
    if (ids.includes(row.account_id)) {
      const v = toNumber(row.thstrm_amount);
      if (v !== null) return v;
    }
  }
  for (const row of rows) {
    if (names.includes((row.account_nm ?? "").trim())) {
      const v = toNumber(row.thstrm_amount);
      if (v !== null) return v;
    }
  }
  return null;
}

function recentYears(n: number): number[] {
  // 사업보고서는 보통 직전 연도까지 공시됨 (dartlab-lite 규약)
  const thisYear = new Date().getFullYear();
  return Array.from({ length: n }, (_, i) => thisYear - 1 - i);
}

async function fetchYearRows(corp: string, year: number): Promise<FinRow[]> {
  const key = `fin:${corp}:${year}`;
  const cached = cacheGet(key, FIN_TTL);
  if (cached) return JSON.parse(cached) as FinRow[];
  const rows = await getJson("fnlttSinglAcntAll.json", {
    corp_code: corp,
    bsns_year: String(year),
    reprt_code: "11011", // 사업보고서(연간)
    fs_div: "CFS", // 연결
  });
  cacheSet(key, JSON.stringify(rows));
  return rows;
}

async function fetchFilings(corp: string): Promise<Filing[]> {
  const key = `filings:${corp}`;
  const cached = cacheGet(key, FILINGS_TTL);
  if (cached) return JSON.parse(cached) as Filing[];
  const end = new Date();
  const start = new Date(end.getTime() - 365 * 86_400_000);
  const fmt = (d: Date) => d.toISOString().slice(0, 10).replaceAll("-", "");
  const rows = await getJson("list.json", {
    corp_code: corp,
    bgn_de: fmt(start),
    end_de: fmt(end),
    page_count: "100",
    page_no: "1",
  });
  const filings: Filing[] = rows.map((r) => ({
    date: (r.rcept_dt ?? "").replace(/(\d{4})(\d{2})(\d{2})/, "$1-$2-$3"),
    title: (r.report_nm ?? "").trim(),
    submitter: (r.flr_nm ?? "").trim(),
    url: `https://dart.fss.or.kr/dsaf001/main.do?rcpNo=${r.rcept_no ?? ""}`,
  }));
  cacheSet(key, JSON.stringify(filings));
  return filings;
}

// ── 공개 표면 ──

export async function searchCompanies(query: string): Promise<{ code: string; name: string; demo: boolean }[]> {
  if (!isLiveMode()) {
    return searchDemoCompanies(query).map((c) => ({ code: c.code, name: c.name, demo: true }));
  }
  const live = await searchCorp(query);
  const results = live.map((r) => ({ ...r, demo: false }));
  // 라이브 모드에서도 가상 데모 기업(9xxxxx)은 검색 가능하게 유지
  for (const d of searchDemoCompanies(query)) {
    if (d.code.startsWith("9") && !results.some((r) => r.code === d.code)) {
      results.push({ code: d.code, name: d.name, demo: true });
    }
  }
  return results;
}

export async function getCompanyData(code: string): Promise<CompanyData | null> {
  const demo = findDemoCompany(code);
  if (!isLiveMode()) return demo ?? null;
  if (demo && code.startsWith("9")) return demo; // 가상 기업은 라이브 모드에서도 데모 제공

  const resolved = await corpCodeOf(code);
  if (!resolved) return demo ?? null;

  const years: YearFinancials[] = [];
  for (const year of recentYears(3)) {
    const rows = await fetchYearRows(resolved.corp, year);
    if (rows.length === 0) continue;
    years.push({
      year,
      revenue: pickAccount(rows, "revenue"),
      operatingIncome: pickAccount(rows, "operatingIncome"),
      netIncome: pickAccount(rows, "netIncome"),
      assets: pickAccount(rows, "assets"),
      liabilities: pickAccount(rows, "liabilities"),
      equity: pickAccount(rows, "equity"),
      currentAssets: pickAccount(rows, "currentAssets"),
      currentLiabilities: pickAccount(rows, "currentLiabilities"),
      ocf: pickAccount(rows, "ocf"),
      icf: pickAccount(rows, "icf"),
      fcf: pickAccount(rows, "fcf"),
    });
  }
  if (years.length === 0) return null;

  const filings = await fetchFilings(resolved.corp);
  return {
    code,
    name: resolved.name,
    sector: "",
    market: "",
    demo: false,
    years,
    filings,
  };
}

const PANEL_LABEL: Record<PanelTopic, string> = {
  BS: "재무상태표",
  IS: "손익계산서",
  CF: "현금흐름표",
};

/** 재무제표 항목 × 연도 격자 (dartlab 의 c.panel(topic) 개념) */
export async function getPanel(code: string, topic: PanelTopic): Promise<Panel | null> {
  const demo = findDemoCompany(code);

  // 라이브 모드: 전체 계정 행을 sj_div 별로 수평화 (dartlab-lite panel() 이식)
  if (isLiveMode() && !(demo && code.startsWith("9"))) {
    const resolved = await corpCodeOf(code);
    if (resolved) {
      const yearList = recentYears(3);
      const grid = new Map<string, Map<number, number | null>>();
      for (const year of yearList) {
        const rows = await fetchYearRows(resolved.corp, year);
        for (const row of rows) {
          if (row.sj_div !== topic) continue;
          const name = (row.account_nm ?? "").trim();
          if (!name) continue;
          if (!grid.has(name)) grid.set(name, new Map());
          grid.get(name)!.set(year, toNumber(row.thstrm_amount));
        }
      }
      if (grid.size > 0) {
        return {
          topic,
          title: `${PANEL_LABEL[topic]} (연결, 단위: 원)`,
          columns: yearList.map(String),
          rows: [...grid.entries()].map(([name, values]) => ({
            name,
            values: yearList.map((y) => values.get(y) ?? null),
          })),
        };
      }
    }
  }

  // 데모 모드: 요약 재무에서 핵심 행만 구성 (수치 조작을 피하기 위해 세부 계정은 생략)
  const company = demo;
  if (!company) return null;
  const yearCols = company.years.map((y) => String(y.year));
  const line = (name: string, get: (y: YearFinancials) => number | null) => ({
    name,
    values: company.years.map(get),
  });
  const rowsByTopic: Record<PanelTopic, { name: string; values: (number | null)[] }[]> = {
    IS: [
      line("매출액", (y) => y.revenue),
      line("영업이익", (y) => y.operatingIncome),
      line("당기순이익", (y) => y.netIncome),
    ],
    BS: [
      line("유동자산", (y) => y.currentAssets),
      line("자산총계", (y) => y.assets),
      line("유동부채", (y) => y.currentLiabilities),
      line("부채총계", (y) => y.liabilities),
      line("자본총계", (y) => y.equity),
    ],
    CF: [
      line("영업활동현금흐름", (y) => y.ocf),
      line("투자활동현금흐름", (y) => y.icf),
      line("재무활동현금흐름", (y) => y.fcf),
    ],
  };
  return {
    topic,
    title: `${PANEL_LABEL[topic]} (연결, 단위: 원) — 샘플`,
    columns: yearCols,
    rows: rowsByTopic[topic],
  };
}

export { isLiveMode };
export const DEMO_CODES = DEMO_COMPANIES.map((c) => c.code);
