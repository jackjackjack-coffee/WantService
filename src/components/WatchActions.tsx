"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function RemoveWatchButton({ code }: { code: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return (
    <button
      onClick={async (e) => {
        e.preventDefault();
        e.stopPropagation();
        setBusy(true);
        try {
          await fetch(`/api/watchlist?code=${encodeURIComponent(code)}`, { method: "DELETE" });
          router.refresh();
        } finally {
          setBusy(false);
        }
      }}
      disabled={busy}
      className="text-xs text-dim transition-colors hover:text-bad disabled:opacity-50"
      title="관심기업에서 제거"
    >
      제거
    </button>
  );
}

export function MarkAlertsReadButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return (
    <button
      onClick={async () => {
        setBusy(true);
        try {
          await fetch("/api/alerts/read", { method: "POST" });
          router.refresh();
        } finally {
          setBusy(false);
        }
      }}
      disabled={busy}
      className="rounded border border-line px-3 py-1.5 text-xs text-mut transition-colors hover:text-ink disabled:opacity-50"
    >
      모두 읽음 처리
    </button>
  );
}

export function ExportCsvButton({ code, topic, allowed }: { code: string; topic: string; allowed: boolean }) {
  if (!allowed) {
    return (
      <a href="/billing" className="text-xs text-dim hover:text-warn" title="Pro 플랜부터 제공">
        CSV ↓ <span className="text-warn">(Pro)</span>
      </a>
    );
  }
  return (
    <a
      href={`/api/company/${code}/export?topic=${topic}`}
      className="text-xs text-info hover:underline"
      download
    >
      CSV ↓
    </a>
  );
}
