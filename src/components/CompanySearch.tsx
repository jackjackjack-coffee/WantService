"use client";

// 기업 검색 + 관심기업 추가 (클라이언트 컴포넌트)

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

interface Result {
  code: string;
  name: string;
  demo: boolean;
}

export default function CompanySearch({ watchedCodes }: { watchedCodes: string[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const q = query.trim();
    // 이전 요청을 중단해 느린 응답이 최신 결과를 덮어쓰는 것을 막는다
    const controller = new AbortController();
    const t = setTimeout(
      async () => {
        if (!q) {
          setResults([]);
          return;
        }
        try {
          const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`, {
            signal: controller.signal,
          });
          if (res.ok) {
            const data = (await res.json()) as { results: Result[] };
            setResults(data.results);
            setOpen(true);
          } else {
            const data = (await res.json().catch(() => ({}))) as { error?: string };
            setError(data.error ?? "검색에 실패했습니다.");
          }
        } catch {
          // 중단(탐색 계속 입력) 은 정상 흐름 — 네트워크 오류만 조용히 무시
        }
      },
      q ? 250 : 0,
    );
    return () => {
      clearTimeout(t);
      controller.abort();
    };
  }, [query]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  async function add(code: string) {
    setBusy(code);
    setError(null);
    try {
      const res = await fetch("/api/watchlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      if (res.ok) {
        setOpen(false);
        setQuery("");
        router.refresh();
      } else {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setError(data.error ?? "추가에 실패했습니다.");
      }
    } catch {
      setError("네트워크 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div ref={boxRef} className="relative w-full max-w-md">
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => results.length > 0 && setOpen(true)}
        onKeyDown={(e) => e.key === "Escape" && setOpen(false)}
        placeholder="기업명 또는 종목코드 검색 (예: 삼성전자, 005930)"
        aria-label="기업명 또는 종목코드 검색"
        className="w-full rounded-lg border border-line bg-surface px-4 py-2.5 text-sm outline-none placeholder:text-dim focus:border-line2"
      />
      {error && <p className="mt-1.5 text-xs text-bad">{error}</p>}
      {open && results.length > 0 && (
        <ul className="absolute z-10 mt-1 max-h-72 w-full overflow-y-auto rounded-lg border border-line bg-surface shadow-xl shadow-black/40 panel-scroll">
          {results.map((r) => {
            const watched = watchedCodes.includes(r.code);
            return (
              <li key={r.code} className="flex items-center gap-2 border-b border-line/60 px-3 py-2 last:border-0">
                <span className="num text-xs text-dim">{r.code}</span>
                <span className="min-w-0 flex-1 truncate text-sm">{r.name}</span>
                {r.demo && <span className="rounded bg-warn/10 px-1 text-[10px] text-warn">데모</span>}
                {watched ? (
                  <span className="text-xs text-dim">추가됨</span>
                ) : (
                  <button
                    onClick={() => add(r.code)}
                    disabled={busy === r.code}
                    className="rounded bg-brand px-2 py-1 text-xs font-semibold text-white hover:bg-brand2 disabled:opacity-50"
                  >
                    {busy === r.code ? "추가 중…" : "+ 추가"}
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
