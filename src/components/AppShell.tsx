// 로그인 후 공통 셸 — 상단바(로고·내비·플랜·알림·로그아웃)

import Link from "next/link";
import Logo from "@/components/Logo";
import type { SessionUser } from "@/lib/auth";
import { unreadAlertCount } from "@/lib/db";
import { isLiveMode } from "@/lib/dart-service";

export default function AppShell({
  user,
  active,
  children,
}: {
  user: SessionUser;
  active: "dashboard" | "alerts" | "billing" | "company";
  children: React.ReactNode;
}) {
  const unread = unreadAlertCount(user.id);
  const nav = [
    { href: "/dashboard", label: "대시보드", key: "dashboard" },
    { href: "/alerts", label: unread > 0 ? `알림 (${unread})` : "알림", key: "alerts" },
    { href: "/billing", label: "플랜·결제", key: "billing" },
  ] as const;

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-20 border-b border-line bg-bg/85 backdrop-blur">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center gap-6 px-4">
          <Logo href="/dashboard" />
          <nav className="flex items-center gap-1 text-sm">
            {nav.map((n) => (
              <Link
                key={n.key}
                href={n.href}
                className={`rounded-md px-3 py-1.5 transition-colors ${
                  active === n.key ? "bg-surface2 text-ink" : "text-mut hover:text-ink"
                }`}
              >
                {n.label}
              </Link>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-3 text-sm">
            {!isLiveMode() && (
              <span className="rounded border border-warn/40 bg-warn/10 px-2 py-0.5 text-xs text-warn">
                데모 모드
              </span>
            )}
            <span className="rounded border border-line2 bg-surface2 px-2 py-0.5 text-xs font-semibold text-info">
              {user.plan.name}
            </span>
            <span className="hidden text-mut sm:inline">{user.name}님</span>
            <form action="/api/auth/logout" method="post">
              <button type="submit" className="text-mut transition-colors hover:text-ink">
                로그아웃
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">{children}</main>
      <footer className="border-t border-line py-6 text-center text-xs text-dim">
        공시레이더 — DART 전자공시 기반 재무 리스크 모니터링. 본 서비스의 등급·점수는 참고용 추정치이며 투자·신용 판단의 근거가 아닙니다.
      </footer>
    </div>
  );
}
