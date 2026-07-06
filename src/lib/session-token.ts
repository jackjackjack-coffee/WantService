// 세션 JWT 프리미티브 — proxy(구 middleware) 에서도 쓰이므로 DB/next-headers 의존이 없어야 한다.

import { jwtVerify, SignJWT } from "jose";

export const SESSION_COOKIE = "dw_session";
export const SESSION_DAYS = 7;

function secret(): Uint8Array {
  const s = process.env.AUTH_SECRET;
  if (!s) {
    // 프로덕션에서 알려진 기본 시크릿으로 조용히 동작하면 누구나 세션을 위조할 수 있다.
    if (process.env.NODE_ENV === "production") {
      throw new Error("AUTH_SECRET 환경변수가 설정되지 않았습니다. 세션 서명에 필요합니다.");
    }
    return new TextEncoder().encode("dev-only-secret-change-me-in-production");
  }
  return new TextEncoder().encode(s);
}

export async function createSessionToken(userId: number): Promise<string> {
  return new SignJWT({ uid: userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DAYS}d`)
    .sign(secret());
}

export async function verifySessionToken(token: string): Promise<number | null> {
  try {
    const { payload } = await jwtVerify(token, secret());
    const uid = payload.uid;
    return typeof uid === "number" ? uid : null;
  } catch {
    return null;
  }
}
