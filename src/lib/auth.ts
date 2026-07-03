// 인증 — bcrypt 해시 + HTTP-only 쿠키에 담는 jose JWT 세션.

import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { findUserById, type UserRow } from "@/lib/db";
import { effectivePlan, type Plan } from "@/lib/plans";
import { SESSION_COOKIE, SESSION_DAYS, createSessionToken, verifySessionToken } from "@/lib/session-token";

export { SESSION_COOKIE, createSessionToken, verifySessionToken };

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export const sessionCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: SESSION_DAYS * 86_400,
};

export interface SessionUser {
  id: number;
  email: string;
  name: string;
  plan: Plan;
  planExpiresAt: string | null;
  apiKey: string | null;
}

function toSessionUser(row: UserRow): SessionUser {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    plan: effectivePlan(row.plan, row.plan_expires_at),
    planExpiresAt: row.plan_expires_at,
    apiKey: row.api_key,
  };
}

/** 서버 컴포넌트/라우트 핸들러에서 현재 로그인 사용자 조회 (없으면 null) */
export async function getSessionUser(): Promise<SessionUser | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const uid = await verifySessionToken(token);
  if (uid === null) return null;
  const row = findUserById(uid);
  return row ? toSessionUser(row) : null;
}
