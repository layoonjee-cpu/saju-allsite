"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";

type GenState = "running" | "failed";

const TOTAL_SECTIONS = 27;
const MAX_RETRIES = 3; // 섹션당 최대 자동 재시도 횟수
const RETRY_DELAY_MS = 3000; // 재시도 간격 3초

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

// 월별 레이블 동적 생성 (결제 시점 기준 12개월)
const _now = new Date();
const _cy = _now.getFullYear();
const _cm = _now.getMonth() + 1;
const MONTH_LABELS = Array.from({ length: 12 }, (_, i) => {
  const d = new Date(_cy, _cm - 1 + i, 1);
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 운세 심층 분석`;
});

const SECTION_LABELS = [
  "프롤로그 · 사주팔자 원국 구조",
  "일간의 본질 · 신강신약 분석",
  "음양오행 · 십성(十星) 분포",
  "격국(格局) · 용신(用神) 분석",
  "어린 시절 · 성장 환경 · 타고난 성품",
  "직업 적성 · 재능과 추천 직업군",
  "직장운 · 사업운 · 성공 전략",
  "재물 그릇 · 타고난 경제 에너지",
  "재물운 흐름 · 시기별 전략",
  "연애 성향 · 감정 패턴",
  "이상형 · 배우자운 · 결혼 시기",
  "건강운 · 체질과 주의 부위",
  "귀인운 · 인간관계 패턴",
  "대운(大運) 흐름 · 황금기와 저점",
  ...MONTH_LABELS,
  "합충형해파 · 개운법 · 종합 결론",
];

export function VipGeneratingBanner({ resultId }: { resultId: string }) {
  const router = useRouter();
  const [state, setState] = useState<GenState>("running");
  const [currentSection, setCurrentSection] = useState(0); // 0 = 시작 전
  const [failedSection, setFailedSection] = useState(1);   // 재시도 시작 섹션
  const [elapsed, setElapsed] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");

  // startFrom: 실패한 섹션부터 재개 (기본 1 = 처음부터)
  const run = useCallback(async (startFrom = 1) => {
    setState("running");
    // startFrom > 1 이면 이미 완료된 섹션 수를 표시 유지
    setCurrentSection(startFrom > 1 ? startFrom : 0);
    setElapsed(0);
    setErrorMsg("");

    for (let i = startFrom; i <= TOTAL_SECTIONS; i++) {
      setCurrentSection(i);
      let sectionDone = false;
      let lastError = "";

      for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
        if (attempt > 0) await sleep(RETRY_DELAY_MS);
        try {
          const res = await fetch(
            `/api/results/${resultId}/generate?section=${i}`,
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

          // 예상치 못한 응답도 성공으로 처리
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

    // 루프 완료 (마지막 섹션이 complete를 반환하지 않은 경우 대비)
    router.refresh();
  }, [resultId, router]);

  // 마운트 시 즉시 시작
  useEffect(() => {
    run(1);
  }, [run]);

  // 경과 시간 (1초 단위, 실행 중일 때만)
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
    currentSection === 0 ? 0 : Math.round((currentSection / TOTAL_SECTIONS) * 100);

  // ── 실패 상태 ─────────────────────────────────────────────────
  if (state === "failed") {
    return (
      <div className="my-10 rounded-2xl border border-red-200 bg-red-50/60 p-8 text-center backdrop-blur-sm">
        <p className="text-3xl mb-3">⚠️</p>
        <h2 className="text-lg font-semibold text-red-800 mb-2">
          분석 생성 중 문제가 생겼습니다
        </h2>
        <p className="text-sm text-muted-foreground mb-6">
          섹션 {currentSection}/{TOTAL_SECTIONS} 처리 중 오류가 발생했습니다.
          <br />
          {failedSection > 1
            ? `섹션 ${failedSection}부터 이어서 다시 시도합니다.`
            : "아래 버튼을 눌러 다시 시도해 주세요."}
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => run(failedSection)}
            className="px-6 py-2.5 rounded-full bg-[#2D5C5C] text-white text-sm font-medium hover:bg-[#24494A] transition-colors"
          >
            ⟳ {failedSection > 1 ? `섹션 ${failedSection}부터 이어서 시도` : "다시 시도"}
          </button>
          {failedSection > 1 && (
            <button
              onClick={() => run(1)}
              className="px-6 py-2.5 rounded-full border border-[#2D5C5C] text-[#2D5C5C] text-sm font-medium hover:bg-[#2D5C5C]/10 transition-colors"
            >
              ↺ 처음부터 다시 시도
            </button>
          )}
        </div>
        {errorMsg && (
          <p className="mt-3 text-xs font-mono text-red-700/60 break-all">
            {errorMsg}
          </p>
        )}
      </div>
    );
  }

  // ── 생성 중 상태 ──────────────────────────────────────────────
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

      <p className="mb-1 text-xs font-medium tracking-widest text-[#2b6e6e] uppercase">
        深視線 · 깊은시선 프리미엄 사주분석
      </p>
      <h2 className="mb-1 text-xl font-semibold text-[#1a1730]">
        시선이 당신의 사주를 깊이 들여다보고 있습니다
      </h2>
      <p className="text-sm text-muted-foreground mb-5">
        27개 섹션으로 구성된 심층 분석서를 순서대로 작성합니다.
        <br />
        이 페이지를 열어두시면 완료 시 자동으로 표시됩니다.
        {elapsedText}
      </p>

      {/* 진행 바 */}
      <div className="mb-4 w-full max-w-sm mx-auto">
        <div className="flex justify-between text-xs text-muted-foreground mb-1">
          <span>
            {currentSection > 0
              ? `섹션 ${currentSection} / ${TOTAL_SECTIONS} — ${SECTION_LABELS[currentSection - 1]}`
              : "준비 중..."}
          </span>
          <span>{progressPct}%</span>
        </div>
        <div className="h-2 w-full rounded-full bg-amber-100 overflow-hidden">
          <div
            className="h-full rounded-full bg-teal-600 transition-all duration-700"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* 완료된 섹션 목록 */}
      <div className="mx-auto max-w-xs text-left space-y-1">
        {SECTION_LABELS.map((label, idx) => {
          const sIdx = idx + 1;
          const isDone = sIdx < currentSection;
          const isActive = sIdx === currentSection;
          return (
            <div
              key={sIdx}
              className={`flex items-center gap-2 text-xs transition-all ${
                isDone
                  ? "text-teal-700"
                  : isActive
                  ? "text-amber-700 font-medium"
                  : "text-muted-foreground/50"
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

      <p className="mt-5 text-xs text-muted-foreground/60">
        약 <strong>10~15분</strong> 소요됩니다. 페이지를 닫으셔도 되지만,
        열어두시면 완료 즉시 자동 표시됩니다.
      </p>
    </div>
  );
}
