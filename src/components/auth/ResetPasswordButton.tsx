"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function ResetPasswordButton({ email }: { email: string }) {
  const [status, setStatus] = useState<"idle" | "loading" | "sent" | "error">("idle");

  async function handleReset() {
    setStatus("loading");
    const supabase = createClient();
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? window.location.origin;
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${siteUrl}/auth/callback?next=/mypage`,
    });
    if (error) {
      console.error("[reset-password]", error.message);
      setStatus("error");
      setTimeout(() => setStatus("idle"), 3000);
    } else {
      setStatus("sent");
    }
  }

  if (status === "sent") {
    return (
      <div className="w-full flex items-start gap-2 py-4 text-[14px] font-medium text-teal-600">
        <span className="text-base leading-none mt-0.5">✓</span>
        <span>
          재설정 링크를 <strong>{email}</strong>로 발송했습니다.
          <br />
          <span className="text-xs text-teal-500 font-normal">
            이메일의 링크를 클릭해 새 비밀번호를 설정하세요.
          </span>
        </span>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={handleReset}
      disabled={status === "loading"}
      className="w-full flex items-center justify-between py-4 text-[15px] font-medium text-body hover:text-ink disabled:opacity-50 transition-colors"
    >
      <span>
        {status === "loading" ? "발송 중…" : "비밀번호 재설정"}
      </span>
      {status === "idle" && <span className="text-mute">→</span>}
      {status === "error" && (
        <span className="text-xs text-red-500 font-normal">발송 실패. 다시 시도해주세요.</span>
      )}
    </button>
  );
}
