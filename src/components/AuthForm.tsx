"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { safeNextPath } from "@/lib/safe-path";

export default function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter();
  const params = useSearchParams();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const form = new FormData(e.currentTarget);
    const body: Record<string, string> = {
      email: String(form.get("email") ?? ""),
      password: String(form.get("password") ?? ""),
    };
    if (mode === "signup") body.name = String(form.get("name") ?? "");

    try {
      const res = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        router.push(safeNextPath(params.get("next")));
        router.refresh();
        return; // 이동 중 — busy 유지
      }
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      setError(data.error ?? "요청에 실패했습니다.");
    } catch {
      setError("네트워크 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
    }
    setBusy(false);
  }

  const input =
    "w-full rounded-lg border border-line bg-surface px-4 py-2.5 text-sm outline-none placeholder:text-dim focus:border-line2";

  return (
    <form onSubmit={submit} className="space-y-3">
      {mode === "signup" && (
        <input name="name" placeholder="이름" required maxLength={50} className={input} />
      )}
      <input name="email" type="email" placeholder="이메일" required className={input} />
      <input
        name="password"
        type="password"
        placeholder={mode === "signup" ? "비밀번호 (8자 이상)" : "비밀번호"}
        required
        minLength={mode === "signup" ? 8 : undefined}
        className={input}
      />
      {error && <p className="text-xs text-bad">{error}</p>}
      <button
        type="submit"
        disabled={busy}
        className="w-full rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand2 disabled:opacity-60"
      >
        {busy ? "처리 중…" : mode === "signup" ? "무료로 시작하기" : "로그인"}
      </button>
      <p className="text-center text-xs text-mut">
        {mode === "signup" ? (
          <>
            이미 계정이 있으신가요?{" "}
            <Link href="/login" className="text-info hover:underline">
              로그인
            </Link>
          </>
        ) : (
          <>
            계정이 없으신가요?{" "}
            <Link href="/signup" className="text-info hover:underline">
              무료 가입
            </Link>
          </>
        )}
      </p>
    </form>
  );
}
