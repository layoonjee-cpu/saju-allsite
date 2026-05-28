"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";

type GenState = "triggering" | "failed";

export function VipGeneratingBanner({ resultId }: { resultId: string }) {
  const router = useRouter();
  const [state, setState] = useState<GenState>("triggering");
  const [elapsed, setElapsed] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");

  const trigger = useCallback(async () => {
    setState("triggering");
    setElapsed(0);
    setErrorMsg("");
    try {
      const res = await fetch(`/api/results/${resultId}/generate`, { method: "POST" });
      const data = await res.json() as { status: string; error?: string };
      if (data.status === "complete") {
        router.refresh();
      } else {
        setErrorMsg(data.error ?? "");
        setState("failed");
      }
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "네트워크 오류");
      setState("failed");
    }
  }, [resultId, router]);

  // 마운트 시 즉시 LLM 트리거
  useEffect(() => {
    trigger();
  }, [trigger]);

  // 경과 시간 (1초 단위, 생성 중일 때만)
  useEffect(() => {
    if (state !== "triggering") return;
    const t = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(t);
  }, [state]);

  const min = Math.floor(elapsed / 60);
  const sec = elapsed % 60;
  const elapsedText =
    elapsed === 0 ? "" : ` (${min > 0 ? `${min}분 ` : ""}${sec}초 경과)`;

  // 실패 / 타임아웃 상태
  if (state === "failed") {
    return (
      <div className="my-10 rounded-2xl border border-red-200 bg-red-50/60 p-8 text-center backdrop-blur-sm">
        <p className="text-3xl mb-3">⚠️</p>
        <h2 className="text-lg font-semibold text-red-800 mb-2">
          분석 생성에 시간이 걸리고 있습니다
        </h2>
        <p className="text-sm text-muted-foreground mb-6">
          서버 상황에 따라 분析지 생성이 지연될 수 있습니다.
          <br />
          아래 버튼을 눌러 다시 시도해 주세요.
        </p>
        <button
          onClick={trigger}
          className="px-6 py-2.5 rounded-full bg-[#2D5C5C] text-white text-sm font-medium hover:bg-[#24494A] transition-colors"
        >
          ⟳ 다시 시도
        </button>
        {errorMsg && (
          <p className="mt-3 text-xs font-mono text-red-700/60 break-all">
            {errorMsg}
          </p>
        )}
      </div>
    );
  }

  // 생성 중 상태
  return (
    <div className="my-10 rounded-2xl border border-amber-200 bg-amber-50/60 p-8 text-center backdrop-blur-sm">
      {/* 스피너 */}
      <div className="mb-6 flex justify-center">
        <div className="relative h-16 w-16">
          <div className="absolute inset-0 animate-spin rounded-full border-4 border-amber-200 border-t-teal-600" />
          <div className="absolute inset-3 flex items-center justify-center text-2xl">
            📜
          </div>
        </div>
      </div>

      <h2 className="mb-2 text-xl font-semibold text-[#1a1730]">
        보고서를 정성스럽게 작성 중입니다
      </h2>
      <p className="text-sm text-muted-foreground">
        깊은 시선 VIP 보고서는 17개 섹션으로 구성됩니다.
        <br />
        약 <strong>1~2분</strong> 후 이 페이지에 분析지가 자동으로 표시됩니다.
        {elapsedText}
      </p>

      <div className="mt-6 flex flex-col items-center gap-2 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-teal-500" />
          사주 명식 16종 데이터 분析 완료
        </div>
        <div className="flex items-center gap-1.5">
          <span
            className="inline-block h-2 w-2 animate-pulse rounded-full bg-amber-500"
            style={{ animationDelay: "0.3s" }}
          />
          AI가 17개 섹션 심층 분析 중
        </div>
      </div>

      <p className="mt-6 text-xs text-muted-foreground/70">
        이 페이지를 열어두시면 완료 시 자동으로 분析지가 표시됩니다.
      </p>
    </div>
  );
}
