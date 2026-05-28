"use client";

import { useState } from "react";

type Props = {
  resultId: string;
};

export function VipDownloadButton({ resultId }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDownload = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/pdf/download/${resultId}`);
      const data = await res.json();
      if (data.url) {
        // 새 탭에서 다운로드
        window.open(data.url, "_blank");
      } else {
        setError(data.error ?? "다운로드 URL을 가져오지 못했습니다.");
      }
    } catch {
      setError("네트워크 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="my-8 rounded-2xl border border-teal-200 bg-teal-50/60 p-8 text-center backdrop-blur-sm">
      <div className="mb-4 text-4xl">📜</div>
      <h2 className="mb-1 text-xl font-semibold text-[#1a1730]">
        시선이 당신의 사주를 깊이 들여다보았습니다
      </h2>
      <p className="mb-1 text-xs font-medium tracking-widest text-[#2b6e6e] uppercase">
        深視線 · 깊은시선 프리미엄 사주분석
      </p>
      <p className="mb-6 text-sm text-muted-foreground">
        정통 명리학 기반의 심층 사주 분석서입니다.
        <br />
        PDF 파일은 발송 후 7일간 다운로드 가능합니다.
      </p>
      <button
        onClick={handleDownload}
        disabled={loading}
        className="inline-flex items-center gap-2 rounded-full bg-[#2b6e6e] px-8 py-3 text-sm font-bold text-white shadow-md transition hover:bg-[#1a5353] disabled:opacity-60"
      >
        {loading ? (
          <>
            <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            준비 중...
          </>
        ) : (
          <>
            📥 깊은시선 PDF 저장하기
          </>
        )}
      </button>
      {error && (
        <p className="mt-3 text-sm text-red-500">{error}</p>
      )}
    </div>
  );
}
