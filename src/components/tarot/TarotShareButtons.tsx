"use client";

import { useState } from "react";
import { publicEnv } from "@/lib/env";

type Props = {
  readingId: string;
  question: string;
};

export function TarotShareButtons({ readingId, question }: Props) {
  const [emailInput, setEmailInput] = useState("");
  const [showEmail, setShowEmail] = useState(false);
  const [sending, setSending] = useState(false);
  const [copied, setCopied] = useState(false);

  const shareUrl = `${publicEnv.NEXT_PUBLIC_SITE_URL}/tarot/result/${readingId}`;

  async function copyLink() {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function shareKakao() {
    if (typeof window === "undefined") return;
    const kakao = (window as { Kakao?: { isInitialized?: () => boolean; Share?: { sendDefault: (opts: object) => void } } }).Kakao;
    if (!kakao?.isInitialized?.()) return;
    kakao.Share?.sendDefault({
      objectType: "feed",
      content: {
        title: "타로의 시선 — 리딩 결과",
        description: `"${question}"`,
        imageUrl: `${publicEnv.NEXT_PUBLIC_SITE_URL}/tarot/card_back.png`,
        link: { mobileWebUrl: shareUrl, webUrl: shareUrl },
      },
      buttons: [{ title: "결과 보기", link: { mobileWebUrl: shareUrl, webUrl: shareUrl } }],
    });
  }

  async function sendEmail() {
    if (!emailInput) return;
    setSending(true);
    try {
      await fetch(`/api/tarot/result/${readingId}/send-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailInput }),
      });
      setShowEmail(false);
      setEmailInput("");
      alert("이메일이 발송되었습니다.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-center text-gray-500">결과 공유 및 저장</p>
      <div className="flex gap-2">
        <button
          onClick={shareKakao}
          className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-[#FEE500] text-[#3C1E1E] hover:bg-[#f0d800] transition-colors"
        >
          카카오톡 공유
        </button>
        <button
          onClick={() => setShowEmail(!showEmail)}
          className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-white/10 hover:bg-white/15 transition-colors"
        >
          이메일로 받기
        </button>
        <button
          onClick={copyLink}
          className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-white/10 hover:bg-white/15 transition-colors"
        >
          {copied ? "복사됨 ✓" : "링크 복사"}
        </button>
      </div>

      {showEmail && (
        <div className="flex gap-2">
          <input
            type="email"
            value={emailInput}
            onChange={(e) => setEmailInput(e.target.value)}
            placeholder="이메일 주소 입력"
            className="flex-1 bg-white/5 border border-white/15 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#c9a84c]"
          />
          <button
            onClick={sendEmail}
            disabled={sending || !emailInput}
            className="px-4 py-2 rounded-xl text-sm bg-[#c9a84c] text-[#0a0a14] font-medium disabled:opacity-50"
          >
            {sending ? "..." : "발송"}
          </button>
        </div>
      )}
    </div>
  );
}
