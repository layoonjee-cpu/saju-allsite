"use client";

import { useState } from "react";

interface Props {
  orderId: string;
  hasResult: boolean; // true면 "재생성", false면 "분석 생성"
}

export function RegenerateButton({ orderId, hasResult }: Props) {
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");

  async function handleRegenerate() {
    if (state !== "idle") return;
    setState("loading");
    try {
      const res = await fetch(`/api/admin/regenerate/${orderId}`, { method: "POST" });
      const data = await res.json();
      if (data.ok) {
        setState("done");
        // 완료 후 3초 뒤 페이지 새로고침 (분석지 링크 표시)
        setTimeout(() => window.location.reload(), 3000);
      } else {
        setState("error");
        setTimeout(() => setState("idle"), 3000);
      }
    } catch {
      setState("error");
      setTimeout(() => setState("idle"), 3000);
    }
  }

  const styles: Record<string, string> = {
    idle: "text-amber-700 hover:underline cursor-pointer",
    loading: "text-mute cursor-not-allowed",
    done: "text-green-700 cursor-default",
    error: "text-red-600 cursor-pointer",
  };

  const labels: Record<string, string> = {
    idle: hasResult ? "⟳ 재생성" : "⟳ 분석 생성",
    loading: "생성중...",
    done: "✓ 완료",
    error: "✗ 실패",
  };

  return (
    <button
      onClick={handleRegenerate}
      disabled={state === "loading" || state === "done"}
      className={`text-[11px] font-medium ${styles[state]}`}
      title={hasResult ? "분석지 재생성 (2~3분 소요)" : "분석지 생성 (2~3분 소요)"}
    >
      {labels[state]}
    </button>
  );
}
