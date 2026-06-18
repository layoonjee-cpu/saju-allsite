"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function CouponInput({ orderId }: { orderId: string }) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [applied, setApplied] = useState(false);
  const router = useRouter();

  async function handleApply() {
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) return;
    setLoading(true);
    setError(null);

    const res = await fetch("/api/coupons/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: trimmed, orderId }),
    });
    const json = await res.json();

    if (!res.ok) {
      setError(json.error ?? "쿠폰 적용 실패");
      setLoading(false);
      return;
    }

    setApplied(true);
    setLoading(false);
    router.refresh();
  }

  if (applied) {
    return (
      <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-4 py-3">
        <span>✓</span>
        <span className="font-medium">쿠폰이 적용되었습니다. 무료로 분석을 시작하세요!</span>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <input
          type="text"
          value={code}
          onChange={(e) => { setCode(e.target.value.toUpperCase()); setError(null); }}
          onKeyDown={(e) => { if (e.key === "Enter") handleApply(); }}
          placeholder="쿠폰 코드 입력"
          disabled={loading}
          className="flex-1 h-10 px-3 text-sm border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 font-mono tracking-widest"
        />
        <button
          onClick={handleApply}
          disabled={loading || !code.trim()}
          className="h-10 px-4 text-sm font-medium rounded-lg bg-foreground text-background hover:opacity-90 disabled:opacity-40 transition-opacity whitespace-nowrap"
        >
          {loading ? "확인 중..." : "적용"}
        </button>
      </div>
      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}
    </div>
  );
}
