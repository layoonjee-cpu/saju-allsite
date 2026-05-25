"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  resultId: string;
};

export function VipGeneratingBanner({ resultId }: Props) {
  const router = useRouter();
  const [elapsed, setElapsed] = useState(0);
  const [checking, setChecking] = useState(false);

  // 30초마다 상태 확인
  useEffect(() => {
    const interval = setInterval(async () => {
      if (checking) return;
      setChecking(true);
      setElapsed((e) => e + 30);
      try {
        const res = await fetch(`/api/pdf/download/${resultId}`);
        const data = await res.json();
        if (data.status === "ready") {
          router.refresh();
        }
      } catch {
        // 네트워크 오류 무시, 다음 주기에 재시도
      } finally {
        setChecking(false);
      }
    }, 30_000);

    return () => clearInterval(interval);
  }, [resultId, router, checking]);

  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;
  const elapsedText = elapsed === 0 ? "" : ` (${minutes > 0 ? `${minutes}분 ` : ""}${seconds}초 경과)`;

  return (
    <div className="my-10 rounded-2xl border border-amber-200 bg-amber-50/60 p-8 text-center backdrop-blur-sm">
      {/* 회전 애니메이션 */}
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
        깊은 시선 VIP 보고서는 45개 챕터, 11만 자 이상으로 구성됩니다.
        <br />
        약 <strong>5~10분</strong> 후 가입하신 이메일로 PDF 링크가 발송됩니다.{elapsedText}
      </p>

      <div className="mt-6 flex flex-col items-center gap-2 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-teal-500" />
          사주 명식 16종 데이터 분석 완료
        </div>
        <div className="flex items-center gap-1.5">
          <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-amber-500" style={{ animationDelay: "0.3s" }} />
          Claude AI가 PART 01~10 챕터별 집필 중
        </div>
        <div className="flex items-center gap-1.5">
          <span className="inline-block h-2 w-2 rounded-full bg-gray-300" />
          PDF 생성 및 이메일 발송 (대기 중)
        </div>
      </div>

      <p className="mt-6 text-xs text-muted-foreground/70">
        이 페이지를 닫아도 됩니다. 완료 시 이메일로 알려드립니다.
      </p>
    </div>
  );
}
