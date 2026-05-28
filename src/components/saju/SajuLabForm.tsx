"use client";

import Script from "next/script";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Props {
  productId: string;
  productSlug: string;
  productPrice: number;
  isLoggedIn: boolean;
}

export function SajuLabForm({ productId, productSlug, productPrice, isLoggedIn }: Props) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handler = async (e: MessageEvent) => {
      // sajulab.kr 도메인에서 온 메시지만 처리
      if (!e.origin.includes("sajulab.kr")) return;

      const d = e.data;
      if (!d || typeof d !== "object") return;

      // sajulab 폼 제출 이벤트 (실제 필드명은 sajulab 공식 문서/테스트 후 조정 필요)
      // 예상 형식: { type: "submit", name, birthDate, birthTime, timeUnknown, gender, calendar }
      if (d.type !== "submit" && d.type !== "form_submit" && d.event !== "submit") return;

      if (!isLoggedIn) {
        router.push(`/login?redirect=/products/${productSlug}`);
        return;
      }

      setSubmitting(true);
      setError(null);
      try {
        const body = {
          productId,
          name: d.name ?? d.userName ?? null,
          birthDate: d.birthDate ?? d.birth_date ?? null,
          birthTime: d.birthTime ?? d.birth_time ?? null,
          timeUnknown: d.timeUnknown ?? d.time_unknown ?? false,
          gender: d.gender ?? "male",
          calendar: d.calendar ?? d.calendarType === "음력" ? "lunar" : "solar",
          concerns: [],
        };

        const res = await fetch("/api/orders/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });

        if (!res.ok) {
          const json = await res.json().catch(() => ({}));
          throw new Error(json.error ?? "주문 생성 실패");
        }

        const { orderId, amount } = await res.json();

        if (amount === 0) {
          const r = await fetch("/api/orders/free-confirm", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ orderId }),
          });
          const { resultId } = await r.json();
          router.push(`/results/${resultId}`);
        } else {
          router.push(`/checkout/${orderId}`);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "오류가 발생했습니다");
        setSubmitting(false);
      }
    };

    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [productId, productSlug, isLoggedIn, router]);

  return (
    <div className="w-full">
      {/* sajulab 임베드 폼 */}
      {/* @ts-expect-error custom HTML element */}
      <sajulab-form merchant="unmyung" page="2026" onlyform="1" />
      <Script
        src="https://www.sajulab.kr/js/embed.js"
        strategy="afterInteractive"
      />

      {submitting && (
        <div className="mt-6 text-center">
          <p className="text-sm text-mute animate-pulse">처리 중입니다...</p>
        </div>
      )}

      {error && (
        <div className="mt-4 p-3 rounded-lg bg-red-50 border border-red-200">
          <p className="text-xs text-red-600">⚠ {error}</p>
        </div>
      )}

      {!isLoggedIn && (
        <p className="text-xs text-center text-mute mt-4">
          결제를 위해{" "}
          <Link href={`/login?redirect=/products/${productSlug}`} className="underline text-[#2A8074]">
            로그인
          </Link>
          이 필요합니다
        </p>
      )}
    </div>
  );
}
