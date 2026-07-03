// OpenDART HTTP 클라이언트 — dartlab-lite 의 client.py 를 TypeScript 로 이식.
// corpCode.xml(종목코드↔고유번호) 은 zip 으로 내려오므로 fflate 로 해제 후 파싱해 파일 캐시한다.
// API 키 발급: https://opendart.fss.or.kr → 인증키 신청 (무료)

import { mkdirSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { unzipSync } from "fflate";

const BASE_URL = "https://opendart.fss.or.kr/api";

const ERROR_MESSAGES: Record<string, string> = {
  "010": "등록되지 않은 API 키",
  "011": "사용할 수 없는 API 키",
  "013": "조회된 데이터가 없음",
  "020": "요청 제한 초과 (분당 한도)",
  "100": "필드 오류",
  "800": "시스템 점검 중",
  "900": "정의되지 않은 오류",
};

export class DartApiError extends Error {
  constructor(
    public status: string,
    message: string,
  ) {
    super(`[${status}] ${message}`);
  }
}

export function dartApiKey(): string | undefined {
  return process.env.DART_API_KEY || undefined;
}

export function isLiveMode(): boolean {
  return Boolean(dartApiKey());
}

const DATA_DIR = path.join(process.cwd(), "data");
const CORP_MAP_PATH = path.join(DATA_DIR, "corp_map.json");
const CORP_MAP_TTL_MS = 7 * 86_400_000; // corpCode 는 주 1회 갱신이면 충분

interface CorpMap {
  fetchedAt: number;
  /** stock_code → { corp: corp_code, name: 회사명 } */
  stocks: Record<string, { corp: string; name: string }>;
}

function buildUrl(endpoint: string, params: Record<string, string>): string {
  const key = dartApiKey();
  if (!key) throw new DartApiError("010", "DART_API_KEY 가 설정되지 않았습니다.");
  const qs = new URLSearchParams({ ...params, crtfc_key: key });
  return `${BASE_URL}/${endpoint}?${qs}`;
}

/** JSON 엔드포인트 호출 → list 반환. 013(데이터 없음)은 빈 배열. */
export async function getJson(
  endpoint: string,
  params: Record<string, string>,
): Promise<Record<string, string>[]> {
  const res = await fetch(buildUrl(endpoint, params), { signal: AbortSignal.timeout(30_000) });
  const data = (await res.json()) as { status?: string; message?: string; list?: Record<string, string>[] };
  if (data.status === "013") return [];
  if (data.status && data.status !== "000") {
    throw new DartApiError(data.status, data.message || ERROR_MESSAGES[data.status] || "오류");
  }
  return data.list ?? [];
}

async function getBytes(endpoint: string): Promise<Uint8Array> {
  const res = await fetch(buildUrl(endpoint, {}), { signal: AbortSignal.timeout(60_000) });
  return new Uint8Array(await res.arrayBuffer());
}

let corpMapCache: CorpMap | null = null;

/** corpCode.xml 다운로드 → 상장사(stock_code 보유)만 추출해 파일 캐시 */
export async function loadCorpMap(): Promise<CorpMap> {
  if (corpMapCache && Date.now() - corpMapCache.fetchedAt < CORP_MAP_TTL_MS) return corpMapCache;

  if (existsSync(CORP_MAP_PATH)) {
    const cached = JSON.parse(readFileSync(CORP_MAP_PATH, "utf-8")) as CorpMap;
    if (Date.now() - cached.fetchedAt < CORP_MAP_TTL_MS) {
      corpMapCache = cached;
      return cached;
    }
  }

  const zipped = await getBytes("corpCode.xml");
  const files = unzipSync(zipped);
  const xmlBytes = Object.values(files)[0];
  const xml = new TextDecoder("utf-8").decode(xmlBytes);

  // 단순 구조의 평면 XML — <list> 블록 단위 정규식 파싱 (dartlab-lite 는 ElementTree 사용)
  const stocks: CorpMap["stocks"] = {};
  const blocks = xml.match(/<list>[\s\S]*?<\/list>/g) ?? [];
  for (const block of blocks) {
    const stock = block.match(/<stock_code>\s*([\dA-Z]{6})\s*<\/stock_code>/)?.[1];
    const corp = block.match(/<corp_code>\s*(\d{8})\s*<\/corp_code>/)?.[1];
    const name = block.match(/<corp_name>\s*([\s\S]*?)\s*<\/corp_name>/)?.[1];
    if (stock && corp) stocks[stock] = { corp, name: name ?? "" };
  }

  const map: CorpMap = { fetchedAt: Date.now(), stocks };
  mkdirSync(DATA_DIR, { recursive: true });
  writeFileSync(CORP_MAP_PATH, JSON.stringify(map), "utf-8");
  corpMapCache = map;
  return map;
}

/** 종목코드 → 고유번호(corp_code). 없으면 null. */
export async function corpCodeOf(stockCode: string): Promise<{ corp: string; name: string } | null> {
  const map = await loadCorpMap();
  return map.stocks[stockCode] ?? null;
}

/** 회사명/종목코드 검색 (부분 일치, 최대 limit 개) */
export async function searchCorp(
  query: string,
  limit = 20,
): Promise<{ code: string; name: string }[]> {
  const map = await loadCorpMap();
  const q = query.trim();
  if (!q) return [];
  const out: { code: string; name: string }[] = [];
  if (/^\d{6}$/.test(q) && map.stocks[q]) {
    out.push({ code: q, name: map.stocks[q].name });
  }
  const lower = q.toLowerCase();
  for (const [code, { name }] of Object.entries(map.stocks)) {
    if (out.length >= limit) break;
    if (name.toLowerCase().includes(lower) && !out.some((o) => o.code === code)) {
      out.push({ code, name });
    }
  }
  // 정확 일치 우선 정렬
  out.sort((a, b) => Number(b.name === q) - Number(a.name === q) || a.name.length - b.name.length);
  return out.slice(0, limit);
}
