"use client";

import { useState, useEffect } from "react";
import Script from "next/script";

type Props = {
  resultId: string;
  productName: string;
};

declare global {
  interface Window {
    Kakao: {
      isInitialized: () => boolean;
      init: (key: string) => void;
      Share: {
        sendDefault: (options: {
          objectType: string;
          content: {
            title: string;
            description: string;
            imageUrl: string;
            link: { mobileWebUrl: string; webUrl: string };
          };
          buttons?: Array<{
            title: string;
            link: { mobileWebUrl: string; webUrl: string };
          }>;
        }) => void;
      };
    };
  }
}

export function ResultShareButtons({ resultId, productName }: Props) {
  const [showEmailInput, setShowEmailInput] = useState(false);
  const [email, setEmail] = useState("");
  const [emailSending, setEmailSending] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [kakaoReady, setKakaoReady] = useState(false);

  const resultUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/results/${resultId}`
      : `https://www.saju7.kr/results/${resultId}`;

  // Kakao SDK 초기화
  function initKakao() {
    const jsKey = process.env.NEXT_PUBLIC_KAKAO_JS_KEY;
    if (!jsKey || typeof window === "undefined" || !window.Kakao) return;
    if (!window.Kakao.isInitialized()) {
      window.Kakao.init(jsKey);
    }
    setKakaoReady(true);
  }

  function handleKakaoShare() {
    if (!window?.Kakao?.Share) {
      // SDK 없으면 URL 복사로 대체
      navigator.clipboard
        .writeText(resultUrl)
        .then(() => alert("링크가 복사되었습니다. 카카오톡에 붙여넣기 해주세요."))
        .catch(() => alert("링크: " + resultUrl));
      return;
    }
    window.Kakao.Share.sendDefault({
      objectType: "feed",
      content: {
        title: `[시선] ${productName} 결과`,
        description: "나의 사주 분석 결과를 확인해 보세요.",
        imageUrl: "https://www.saju7.kr/og-image.png",
        link: {
          mobileWebUrl: resultUrl,
          webUrl: resultUrl,
        },
      },
      buttons: [
        {
          title: "결과 확인하기",
          link: {
            mobileWebUrl: resultUrl,
            webUrl: resultUrl,
          },
        },
      ],
    });
  }

  async function handleEmailSend(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      alert("올바른 이메일 주소를 입력해 주세요");
      return;
    }
    setEmailSending(true);
    try {
      const res = await fetch(`/api/results/${resultId}/send-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "발송 실패");
      }
      setEmailSent(true);
    } catch (err) {
      alert(err instanceof Error ? err.message : "이메일 발송 중 오류가 발생했습니다");
    } finally {
      setEmailSending(false);
    }
  }

  return (
    <>
      {/* Kakao SDK */}
      <Script
        src="https://developers.kakao.com/sdk/js/kakao.min.js"
        strategy="afterInteractive"
        onLoad={initKakao}
      />

      <div className="mt-10 border-t border-[#e8e4dd] pt-8">
        <p className="text-sm font-bold text-[#1a1730] mb-4">분석 결과 저장하기</p>
        <div className="flex flex-col gap-3 sm:flex-row">
          {/* 카카오톡 나에게 보내기 */}
          <button
            type="button"
            onClick={handleKakaoShare}
            className="flex items-center justify-center gap-2 h-12 px-5 rounded-xl bg-[#FEE500] text-[#1a1730] text-sm font-bold hover:bg-[#F9D800] active:scale-[0.98] transition-all"
          >
            <span className="text-base">💬</span>
            카카오톡으로 저장
          </button>

          {/* 이메일로 받기 */}
          {!showEmailInput && !emailSent && (
            <button
              type="button"
              onClick={() => setShowEmailInput(true)}
              className="flex items-center justify-center gap-2 h-12 px-5 rounded-xl border border-[#2D5C5C] text-[#2D5C5C] text-sm font-bold hover:bg-[#2D5C5C]/5 active:scale-[0.98] transition-all"
            >
              <span className="text-base">📧</span>
              이메일로 받기
            </button>
          )}

          {/* 이메일 발송 완료 */}
          {emailSent && (
            <div className="flex items-center gap-2 h-12 px-5 rounded-xl bg-[#f0f9f6] border border-[#2D5C5C]/25 text-[#2D5C5C] text-sm font-semibold">
              <span>✅</span> 이메일을 발송했습니다
            </div>
          )}
        </div>

        {/* 이메일 입력 폼 */}
        {showEmailInput && !emailSent && (
          <form onSubmit={handleEmailSend} className="mt-3 flex gap-2">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="이메일 주소 입력"
              autoFocus
              className="flex-1 h-12 px-4 rounded-xl border border-[#ddd] bg-white text-[#1a1730] text-sm placeholder:text-[#bbb] focus:outline-none focus:border-[#2D5C5C] focus:ring-2 focus:ring-[#2D5C5C]/15 transition-colors"
            />
            <button
              type="submit"
              disabled={emailSending}
              className="h-12 px-5 rounded-xl bg-[#2D5C5C] text-white text-sm font-bold hover:bg-[#245050] disabled:opacity-60 transition-colors"
            >
              {emailSending ? "발송 중..." : "발송"}
            </button>
            <button
              type="button"
              onClick={() => setShowEmailInput(false)}
              className="h-12 px-4 rounded-xl border border-[#ddd] text-[#888] text-sm hover:bg-gray-50 transition-colors"
            >
              취소
            </button>
          </form>
        )}
      </div>
    </>
  );
}
