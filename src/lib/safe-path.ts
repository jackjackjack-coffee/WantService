/**
 * 로그인 후 이동 경로(?next=) 검증 — 내부 경로만 허용해 오픈 리다이렉트를 막는다.
 * "/dashboard" 같은 앱 내 절대 경로만 통과하고, "//evil.com"·"https://…"·
 * "/\evil.com"(브라우저가 \ 를 / 로 정규화) 은 기본값으로 대체한다.
 */
export function safeNextPath(raw: string | null | undefined, fallback = "/dashboard"): string {
  if (!raw) return fallback;
  if (!raw.startsWith("/")) return fallback;
  if (raw.startsWith("//") || raw.startsWith("/\\")) return fallback;
  return raw;
}
