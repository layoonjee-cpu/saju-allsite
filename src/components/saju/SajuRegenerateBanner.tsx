"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";

export function SajuRegenerateBanner({ resultId }: { resultId: string }) {
  const router = useRouter();
  const [state, setState] = useState<"running" | "failed">("running");
  const [errorMsg, setErrorMsg] = useState("");

  const run = useCallback(async () => {
    setState("running");
    setErrorMsg("");
    try {
      const res = await fetch(`/api/results/${resultId}/generate`, { method: "POST" });
      const data = await res.json() as { status?: string; error?: string };
      if (data.status === "complete") {
        router.refresh();
      } else {
        setErrorMsg(data.error ?? "분석 생성 실패");
        setState("failed");
      }
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "네트워크 오류");
      setState("failed");
    }
  }, [resultId, router]);

  useEffect(() => { run(); }, [run]);

  if (state === "failed") {
    return (
      <div className="my-8 rounded-xl border border-amber-200 bg-amber-50/60 p-6 text-center">
        <p className="text-2xl mb-2">⚠️</p>
        <h2 className="text-base font-semibold text-amber-800 mb-2">분석 생성 중 문제가 발생했습니다</h2>
        <p className="text-sm text-muted-foreground mb-4">아래 버튼을 눌러 다시 시도해 주세요.</p>
        {errorMsg && (
          <p className="text-xs font-mono text-red-700/60 break-all mb-4">{errorMsg}</p>
        )}
        <button
          onClick={run}
          className="px-5 py-2 rounded-full bg-[#2D5C5C] text-white text-sm font-medium hover:bg-[#24494A] transition-colors"
        >
          ⟳ 다시 시도
        </button>
      </div>
    );
  }

  return (
    <div className="my-8 rounded-xl border border-amber-200 bg-amber-50/60 p-6 text-center">
      <div className="mb-4 flex justify-center">
        <div className="relative h-12 w-12">
          <div className="absolute inset-0 animate-spin rounded-full border-4 border-amber-200 border-t-teal-600" />
          <div className="absolute inset-3 flex items-center justify-center text-xl">📜</div>
        </div>
      </div>
      <h2 className="text-base font-semibold text-[#1a1730] mb-1">사주 분석을 생성하고 있습니다</h2>
      <p className="text-sm text-muted-foreground">잠시만 기다려 주세요...</p>
    </div>
  );
}
