"use client";

import { useState } from "react";

interface Props {
  resultId: string;
  name: string;
  hasEmail: boolean;
}

export function SendEmailButton({ resultId, name, hasEmail }: Props) {
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");

  if (!hasEmail) {
    return <span className="text-[11px] text-mute">이메일 없음</span>;
  }

  async function handleSend() {
    if (state !== "idle") return;
    setState("loading");
    try {
      const res = await fetch(`/api/admin/resend-email/${resultId}`, { method: "POST" });
      const data = await res.json();
      setState(data.ok ? "done" : "error");
      if (!data.ok) setTimeout(() => setState("idle"), 3000);
    } catch {
      setState("error");
      setTimeout(() => setState("idle"), 3000);
    }
  }

  const styles: Record<string, string> = {
    idle: "text-[#2D5C5C] hover:underline cursor-pointer",
    loading: "text-mute cursor-not-allowed",
    done: "text-green-700 cursor-default",
    error: "text-red-600 cursor-pointer",
  };

  const labels: Record<string, string> = {
    idle: "📧 발송",
    loading: "발송중...",
    done: "✓ 발송완료",
    error: "✗ 재시도",
  };

  return (
    <button
      onClick={handleSend}
      disabled={state === "loading" || state === "done"}
      className={`text-[11px] font-medium ${styles[state]}`}
      title={`${name}님에게 결과 이메일 발송`}
    >
      {labels[state]}
    </button>
  );
}
