// 데모 데이터셋 — DART_API_KEY 없이도 서비스 전체 흐름을 체험할 수 있게 하는 번들 데이터.
//
// 실존 상장사(삼성전자·SK하이닉스·NAVER·현대차)는 공시 기반 근사치이며 "샘플" 배지가 붙는다.
// 정확한 수치가 필요하면 라이브 모드(DART_API_KEY 설정)를 사용해야 한다.
// 종목코드 9로 시작하는 2개사는 리스크 시나리오 시연용 가상 기업이다.

import type { CompanyData, Filing } from "@/lib/types";

const 조 = 1e12;
const 억 = 1e8;

function daysAgo(n: number): string {
  const d = new Date(Date.now() - n * 86_400_000);
  return d.toISOString().slice(0, 10);
}

function filing(nDaysAgo: number, title: string, submitter: string): Filing {
  return {
    date: daysAgo(nDaysAgo),
    title,
    submitter,
    url: "https://dart.fss.or.kr/dsab007/main.do", // 데모 — DART 공시 검색으로 연결
  };
}

export const DEMO_COMPANIES: CompanyData[] = [
  {
    code: "005930",
    name: "삼성전자",
    sector: "전기·전자",
    market: "KOSPI",
    demo: true,
    years: [
      { year: 2024, revenue: 300.87 * 조, operatingIncome: 32.73 * 조, netIncome: 34.45 * 조, assets: 514.5 * 조, liabilities: 112.3 * 조, equity: 402.2 * 조, currentAssets: 219.0 * 조, currentLiabilities: 88.1 * 조, ocf: 65.8 * 조, icf: -56.5 * 조, fcf: -8.9 * 조 },
      { year: 2023, revenue: 258.94 * 조, operatingIncome: 6.57 * 조, netIncome: 15.49 * 조, assets: 455.9 * 조, liabilities: 92.2 * 조, equity: 363.7 * 조, currentAssets: 195.9 * 조, currentLiabilities: 75.7 * 조, ocf: 44.1 * 조, icf: -31.0 * 조, fcf: -8.6 * 조 },
      { year: 2022, revenue: 302.23 * 조, operatingIncome: 43.38 * 조, netIncome: 55.65 * 조, assets: 448.4 * 조, liabilities: 93.7 * 조, equity: 354.7 * 조, currentAssets: 218.5 * 조, currentLiabilities: 78.3 * 조, ocf: 62.2 * 조, icf: -31.6 * 조, fcf: -19.4 * 조 },
    ],
    filings: [
      filing(6, "분기보고서 (2026.03)", "삼성전자"),
      filing(21, "주요사항보고서(자기주식취득결정)", "삼성전자"),
      filing(48, "사업보고서 (2025.12)", "삼성전자"),
      filing(75, "현금ㆍ현물배당결정", "삼성전자"),
      filing(110, "수시공시의무관련사항(공정공시)", "삼성전자"),
    ],
  },
  {
    code: "000660",
    name: "SK하이닉스",
    sector: "반도체",
    market: "KOSPI",
    demo: true,
    years: [
      { year: 2024, revenue: 66.19 * 조, operatingIncome: 23.47 * 조, netIncome: 19.8 * 조, assets: 118.8 * 조, liabilities: 46.0 * 조, equity: 72.8 * 조, currentAssets: 39.5 * 조, currentLiabilities: 22.9 * 조, ocf: 22.3 * 조, icf: -18.0 * 조, fcf: -3.5 * 조 },
      { year: 2023, revenue: 32.77 * 조, operatingIncome: -7.73 * 조, netIncome: -9.14 * 조, assets: 100.3 * 조, liabilities: 45.4 * 조, equity: 54.9 * 조, currentAssets: 25.8 * 조, currentLiabilities: 15.9 * 조, ocf: 4.0 * 조, icf: -6.3 * 조, fcf: 3.0 * 조 },
      { year: 2022, revenue: 44.62 * 조, operatingIncome: 6.81 * 조, netIncome: 2.24 * 조, assets: 103.9 * 조, liabilities: 40.1 * 조, equity: 63.8 * 조, currentAssets: 31.1 * 조, currentLiabilities: 19.6 * 조, ocf: 14.7 * 조, icf: -21.2 * 조, fcf: 6.0 * 조 },
    ],
    filings: [
      filing(9, "분기보고서 (2026.03)", "SK하이닉스"),
      filing(35, "주요사항보고서(신규시설투자)", "SK하이닉스"),
      filing(52, "사업보고서 (2025.12)", "SK하이닉스"),
      filing(80, "현금ㆍ현물배당결정", "SK하이닉스"),
    ],
  },
  {
    code: "035420",
    name: "NAVER",
    sector: "인터넷 서비스",
    market: "KOSPI",
    demo: true,
    years: [
      { year: 2024, revenue: 10.74 * 조, operatingIncome: 1.98 * 조, netIncome: 1.9 * 조, assets: 36.9 * 조, liabilities: 10.3 * 조, equity: 26.6 * 조, currentAssets: 9.7 * 조, currentLiabilities: 5.6 * 조, ocf: 2.5 * 조, icf: -1.7 * 조, fcf: -0.6 * 조 },
      { year: 2023, revenue: 9.67 * 조, operatingIncome: 1.49 * 조, netIncome: 0.99 * 조, assets: 35.2 * 조, liabilities: 10.6 * 조, equity: 24.6 * 조, currentAssets: 8.9 * 조, currentLiabilities: 5.2 * 조, ocf: 2.1 * 조, icf: -1.4 * 조, fcf: -0.4 * 조 },
      { year: 2022, revenue: 8.22 * 조, operatingIncome: 1.3 * 조, netIncome: 0.67 * 조, assets: 33.7 * 조, liabilities: 10.7 * 조, equity: 23.0 * 조, currentAssets: 8.2 * 조, currentLiabilities: 4.9 * 조, ocf: 1.5 * 조, icf: -2.5 * 조, fcf: 1.2 * 조 },
    ],
    filings: [
      filing(12, "분기보고서 (2026.03)", "NAVER"),
      filing(40, "주요사항보고서(자기주식취득결정)", "NAVER"),
      filing(58, "사업보고서 (2025.12)", "NAVER"),
    ],
  },
  {
    code: "005380",
    name: "현대자동차",
    sector: "자동차",
    market: "KOSPI",
    demo: true,
    years: [
      { year: 2024, revenue: 175.23 * 조, operatingIncome: 14.24 * 조, netIncome: 13.23 * 조, assets: 339.8 * 조, liabilities: 235.8 * 조, equity: 104.0 * 조, currentAssets: 92.0 * 조, currentLiabilities: 71.0 * 조, ocf: 10.9 * 조, icf: -22.0 * 조, fcf: 12.4 * 조 },
      { year: 2023, revenue: 162.66 * 조, operatingIncome: 15.13 * 조, netIncome: 12.27 * 조, assets: 281.4 * 조, liabilities: 191.6 * 조, equity: 89.9 * 조, currentAssets: 83.0 * 조, currentLiabilities: 64.0 * 조, ocf: 9.5 * 조, icf: -17.5 * 조, fcf: 8.9 * 조 },
      { year: 2022, revenue: 142.53 * 조, operatingIncome: 9.82 * 조, netIncome: 7.98 * 조, assets: 255.7 * 조, liabilities: 175.9 * 조, equity: 79.8 * 조, currentAssets: 76.0 * 조, currentLiabilities: 60.0 * 조, ocf: 3.9 * 조, icf: -13.4 * 조, fcf: 9.6 * 조 },
    ],
    filings: [
      filing(8, "분기보고서 (2026.03)", "현대자동차"),
      filing(30, "현금ㆍ현물배당결정", "현대자동차"),
      filing(55, "사업보고서 (2025.12)", "현대자동차"),
    ],
  },
  {
    code: "900001",
    name: "한빛중공업(가상)",
    sector: "기계·조선",
    market: "KOSDAQ",
    demo: true,
    years: [
      { year: 2024, revenue: 8200 * 억, operatingIncome: -640 * 억, netIncome: -1120 * 억, assets: 1.95 * 조, liabilities: 1.62 * 조, equity: 0.33 * 조, currentAssets: 6100 * 억, currentLiabilities: 8800 * 억, ocf: -420 * 억, icf: -150 * 억, fcf: 480 * 억 },
      { year: 2023, revenue: 1.02 * 조, operatingIncome: -210 * 억, netIncome: -480 * 억, assets: 2.1 * 조, liabilities: 1.58 * 조, equity: 0.52 * 조, currentAssets: 7000 * 억, currentLiabilities: 8000 * 억, ocf: -150 * 억, icf: -300 * 억, fcf: 350 * 억 },
      { year: 2022, revenue: 1.31 * 조, operatingIncome: 350 * 억, netIncome: 120 * 억, assets: 2.2 * 조, liabilities: 1.5 * 조, equity: 0.7 * 조, currentAssets: 9000 * 억, currentLiabilities: 7500 * 억, ocf: 610 * 억, icf: -700 * 억, fcf: 100 * 억 },
    ],
    filings: [
      filing(4, "주요사항보고서(유상증자결정)", "한빛중공업"),
      filing(18, "주요사항보고서(소송등의제기ㆍ판결)", "한빛중공업"),
      filing(33, "기타시장안내(관리종목 지정우려 안내)", "한국거래소"),
      filing(61, "감사보고서제출(감사범위제한 한정)", "한빛중공업"),
      filing(95, "주요사항보고서(전환사채권발행결정)", "한빛중공업"),
      filing(130, "분기보고서 (2025.09)", "한빛중공업"),
    ],
  },
  {
    code: "900002",
    name: "미래바이오(가상)",
    sector: "제약·바이오",
    market: "KOSDAQ",
    demo: true,
    years: [
      { year: 2024, revenue: 95 * 억, operatingIncome: -410 * 억, netIncome: -450 * 억, assets: 1850 * 억, liabilities: 720 * 억, equity: 1130 * 억, currentAssets: 830 * 억, currentLiabilities: 460 * 억, ocf: -380 * 억, icf: -120 * 억, fcf: 420 * 억 },
      { year: 2023, revenue: 120 * 억, operatingIncome: -350 * 억, netIncome: -380 * 억, assets: 2050 * 억, liabilities: 590 * 억, equity: 1460 * 억, currentAssets: 980 * 억, currentLiabilities: 410 * 억, ocf: -320 * 억, icf: -180 * 억, fcf: 300 * 억 },
      { year: 2022, revenue: 180 * 억, operatingIncome: -280 * 억, netIncome: -300 * 억, assets: 2300 * 억, liabilities: 480 * 억, equity: 1820 * 억, currentAssets: 1200 * 억, currentLiabilities: 380 * 억, ocf: -260 * 억, icf: -250 * 억, fcf: 500 * 억 },
    ],
    filings: [
      filing(7, "주요사항보고서(전환사채권발행결정)", "미래바이오"),
      filing(26, "최대주주변경", "미래바이오"),
      filing(70, "주요사항보고서(유상증자결정)", "미래바이오"),
      filing(105, "분기보고서 (2025.09)", "미래바이오"),
    ],
  },
];

export function findDemoCompany(code: string): CompanyData | undefined {
  return DEMO_COMPANIES.find((c) => c.code === code);
}

export function searchDemoCompanies(query: string): CompanyData[] {
  const q = query.trim().toLowerCase();
  if (!q) return DEMO_COMPANIES;
  return DEMO_COMPANIES.filter(
    (c) => c.code.includes(q) || c.name.toLowerCase().includes(q),
  );
}
