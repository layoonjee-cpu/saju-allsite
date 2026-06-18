"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ZIWEI_SECTION_LABELS, ZIWEI_TOTAL_SECTIONS } from "@/lib/ziwei/ziwei-prompt";

type GenState = "running" | "failed";

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 3000;
const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export function ZiweiGeneratingBanner({ resultId }: { resultId: string }) {
  const router = useRouter();
  const [state, setState] = useState<GenState>("running");
  const [currentSection, setCurrentSection] = useState(0);
  const [failedSection, setFailedSection] = useState(1);
  const [elapsed, setElapsed] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");

  const run = useCallback(async (startFrom = 1) => {
    setState("running");
    setCurrentSection(startFrom > 1 ? startFrom : 0);
    setElapsed(0);
    setErrorMsg("");

    for (let i = startFrom; i <= ZIWEI_TOTAL_SECTIONS; i++) {
      setCurrentSection(i);
      let sectionDone = false;
      let lastError = "";

      for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
        if (attempt > 0) await sleep(RETRY_DELAY_MS);
        try {
          const res = await fetch(
            `/api/results/${resultId}/generate?section=${i}&product=ziwei-saju`,
            { method: "POST" }
          );

          if (!res.ok) {
            const body = await res.json().catch(() => ({})) as { error?: string };
            lastError = body.error ?? `서버 오류 (섹션 ${i})`;
            continue; // 재시도
          }

          const data = await res.json() as {
            status: string;
            section?: number;
            total?: number;
            error?: string;
          };

          if (data.status === "complete") {
            router.refresh();
            return;
          }

          if (data.status === "section_complete" || data.status === "section_skipped") {
            sectionDone = true;
            break;
          }

          if (data.status === "failed") {
            lastError = data.error ?? "분석 생성 실패";
            continue; // 재시도
          }

          sectionDone = true;
          break;
        } catch (e) {
          lastError = e instanceof Error ? e.message : "네트워크 오류";
          // 재시도
        }
      }

      if (!sectionDone) {
        setErrorMsg(lastError);
        setFailedSection(i);
        setState("failed");
        return;
      }
    }

    router.refresh();
  }, [resultId, router]);

  useEffect(() => {
    run(1);
  }, [run]);

  useEffect(() => {
    if (state !== "running") return;
    const t = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(t);
  }, [state]);

  const min = Math.floor(elapsed / 60);
  const sec = elapsed % 60;
  const elapsedText =
    elapsed === 0
      ? ""
      : ` (${min > 0 ? `${min}분 ` : ""}${sec}초 경과)`;

  const progressPct =
    currentSection === 0 ? 0 : Math.round((currentSection / ZIWEI_TOTAL_SECTIONS) * 100);

  if (state === "failed") {
    return (
      <div className="my-10 rounded-2xl border border-red-200 bg-red-50/60 p-8 text-center backdrop-blur-sm">
        <p className="text-3xl mb-3">⚠️</p>
        <h2 className="text-lg font-semibold text-red-800 mb-2">분석 생성 중 문제가 생겼습니다</h2>
        <p className="text-sm text-muted-foreground mb-6">
          섹션 {currentSection}/{ZIWEI_TOTAL_SECTIONS} 처리 중 오류가 발생했습니다.
          <br />
          {failedSection > 1
            ? `섹션 ${failedSection}부터 이어서 다시 시도합니다.`
            : "아래 버튼을 눌러 다시 시도해 주세요."}
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => run(failedSection)}
            className="px-6 py-2.5 rounded-full bg-[#1a1730] text-white text-sm font-medium hover:bg-[#2d2050] transition-colors"
          >
            ⟳ {failedSection > 1 ? `섹션 ${failedSection}부터 이어서 시도` : "다시 시도"}
          </button>
          {failedSection > 1 && (
            <button
              onClick={() => run(1)}
              className="px-6 py-2.5 rounded-full border border-[#1a1730] text-[#1a1730] text-sm font-medium hover:bg-[#1a1730]/10 transition-colors"
            >
              ↺ 처음부터 다시 시도
            </button>
          )}
        </div>
        {errorMsg && (
          <p className="mt-3 text-xs font-mono text-red-700/60 break-all">{errorMsg}</p>
        )}
      </div>
    );
  }

  return (
    <div
      className="my-10 rounded-2xl p-8 text-center backdrop-blur-sm"
      style={{
        background: "linear-gradient(135deg, rgba(26,23,48,0.95) 0%, rgba(45,32,80,0.95) 100%)",
        border: "1px solid rgba(196,145,58,0.3)",
      }}
    >
      {/* 별빛 스피너 */}
      <div className="mb-6 flex justify-center">
        <div className="relative h-16 w-16">
          <div
            className="absolute inset-0 animate-spin rounded-full border-4"
            style={{ borderColor: "rgba(196,145,58,0.2)", borderTopColor: "#c4913a" }}
          />
          <div className="absolute inset-3 flex items-center justify-center text-2xl">⭐</div>
        </div>
      </div>

      <p className="mb-1 text-xs font-medium tracking-widest text-[#c4913a] uppercase">
        紫微斗數 · 별의시선(자미두수) 분석
      </p>
      <h2 className="mb-1 text-xl font-semibold text-white">
        별의시선(자미두수)이 당신의 명반을 깊이 들여다보고 있습니다
      </h2>
      <p className="text-sm text-white/60 mb-5">
        16개 챕터로 구성된 자미두수 분석서를 순서대로 작성합니다.
        <br />
        이 페이지를 열어두시면 완료 시 자동으로 표시됩니다.
        {elapsedText}
      </p>

      {/* 진행 바 */}
      <div className="mb-4 w-full max-w-sm mx-auto">
        <div className="flex justify-between text-xs text-white/50 mb-1">
          <span>
            {currentSection > 0
              ? `섹션 ${currentSection} / ${ZIWEI_TOTAL_SECTIONS} — ${ZIWEI_SECTION_LABELS[currentSection - 1]}`
              : "준비 중..."}
          </span>
          <span>{progressPct}%</span>
        </div>
        <div className="h-2 w-full rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.1)" }}>
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${progressPct}%`, background: "linear-gradient(90deg, #4a3f7a, #c4913a)" }}
          />
        </div>
      </div>

      {/* 섹션 목록 */}
      <div className="mx-auto max-w-xs text-left space-y-1">
        {ZIWEI_SECTION_LABELS.map((label, idx) => {
          const sIdx = idx + 1;
          const isDone = sIdx < currentSection;
          const isActive = sIdx === currentSection;
          return (
            <div
              key={sIdx}
              className={`flex items-center gap-2 text-xs transition-all ${
                isDone
                  ? "text-[#c4913a]"
                  : isActive
                  ? "text-white font-medium"
                  : "text-white/30"
              }`}
            >
              <span className="shrink-0">
                {isDone ? "✓" : isActive ? "⟳" : "○"}
              </span>
              <span>{label}</span>
            </div>
          );
        })}
      </div>

      <p className="mt-5 text-xs text-white/40">
        약 <strong className="text-white/60">5~10분</strong> 소요됩니다. 페이지를 닫으셔도 되지만,
        열어두시면 완료 즉시 자동 표시됩니다.
      </p>
    </div>
  );
}
