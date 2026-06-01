"use client";

import { useState } from "react";

type State = "idle" | "generating" | "done" | "error";

const LABELS: Record<State, string> = {
  idle: "📄 PDF 생성",
  generating: "PDF 생성중...",
  done: "✓ PDF 완료",
  error: "✗ 실패",
};

const STYLES: Record<State, string> = {
  idle: "text-[#4A6FA5] hover:underline cursor-pointer",
  generating: "text-mute cursor-not-allowed",
  done: "text-green-700 cursor-default",
  error: "text-red-600 cursor-pointer",
};

interface Props {
  resultId: string;
  name: string;
  hasPdf: boolean;
}

export function GeneratePdfButton({ resultId, name, hasPdf }: Props) {
  const [state, setState] = useState<State>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const handleClick = async () => {
    if (state === "generating" || state === "done") return;
    setState("generating");
    setErrorMsg("");

    try {
      // 1. PDF 생성
      const genRes = await fetch(`/api/admin/generate-pdf/${resultId}`, { method: "POST" });
      const genData = await genRes.json() as { ok: boolean; error?: string };
      if (!genData.ok) {
        setErrorMsg(genData.error ?? "PDF 생성 실패");
        setState("error");
        setTimeout(() => setState("idle"), 3000);
        return;
      }

      setState("done");

      // 2. 서명 URL 받아서 새 탭 열기
      const dlRes = await fetch(`/api/admin/download-pdf/${resultId}`);
      const dlData = await dlRes.json() as { ok: boolean; url?: string; error?: string };
      if (dlData.ok && dlData.url) {
        window.open(dlData.url, "_blank");
      }

      setTimeout(() => setState("idle"), 5000);
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "네트워크 오류");
      setState("error");
      setTimeout(() => setState("idle"), 3000);
    }
  };

  const idleLabel = hasPdf ? "📄 PDF 재생성" : "📄 PDF 생성";

  return (
    <button
      onClick={handleClick}
      disabled={state === "generating" || state === "done"}
      title={
        state === "idle"
          ? `${name}님 분석지 PDF 생성`
          : state === "error"
          ? errorMsg
          : undefined
      }
      className={`text-[11px] font-medium transition-colors ${STYLES[state]}`}
    >
      {state === "idle" ? idleLabel : LABELS[state]}
    </button>
  );
}
