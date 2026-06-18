"use client";

import { useState } from "react";

interface Props {
  orderId: string;
  hasResult: boolean; // true면 "재생성", false면 "분석 생성"
}

export function RegenerateButton({ orderId, hasResult }: Props) {
  const [state, setState] = useState<"idle" | "loading" | "done" | "vip" | "error">("idle");
  const [vipResultId, setVipResultId] = useState<string | null>(null);

  async function handleRegenerate() {
    if (state !== "idle") return;
    setState("loading");
    try {
      const res = await fetch(`/api/admin/regenerate/${orderId}`, { method: "POST" });
      const data = await res.json();
      if (data.ok) {
        if (data.vipReset && data.resultId) {
          // VIP 상품: 상태만 초기화됨 → 결과 페이지에서 배너가 재생성 처리
          setVipResultId(data.resultId);
          setState("vip");
        } else {
          setState("done");
          // 일반 상품: 3초 뒤 페이지 새로고침 (분석지 링크 표시)
          setTimeout(() => window.location.reload(), 3000);
        }
      } else {
        setState("error");
        setTimeout(() => setState("idle"), 3000);
      }
    } catch {
      setState("error");
      setTimeout(() => setState("idle"), 3000);
    }
  }

  if (state === "vip" && vipResultId) {
    return (
      <a
        href={`/results/${vipResultId}`}
        target="_blank"
        rel="noopener noreferrer"
        className="text-[11px] font-medium text-blue-600 hover:underline"
        title="결과 페이지를 열면 배너가 자동으로 27섹션(깊은시선) 또는 16섹션(별의시선) 재생성을 시작합니다"
      >
        결과 페이지 열기 →
      </a>
    );
  }

  const styles: Record<string, string> = {
    idle: "text-amber-700 hover:underline cursor-pointer",
    loading: "text-muted-foreground cursor-not-allowed",
    done: "text-green-700 cursor-default",
    vip: "text-blue-600 cursor-default",
    error: "text-red-600 cursor-pointer",
  };

  const labels: Record<string, string> = {
    idle: hasResult ? "⟳ 재생성" : "⟳ 분석 생성",
    loading: "초기화중...",
    done: "✓ 완료",
    vip: "→ 결과 페이지",
    error: "✗ 실패",
  };

  return (
    <button
      onClick={handleRegenerate}
      disabled={state === "loading" || state === "done"}
      className={`text-[11px] font-medium ${styles[state]}`}
      title={hasResult ? "분석지 재생성 (VIP: 결과 페이지에서 자동 재생성)" : "분석지 생성"}
    >
      {labels[state]}
    </button>
  );
}
