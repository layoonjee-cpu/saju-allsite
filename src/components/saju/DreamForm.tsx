"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = {
  productId: string;
  productSlug: string;
  productPrice: number;
  isLoggedIn: boolean;
};

const TIPS = [
  "꿈에 등장한 인물(가족, 친구, 낯선 사람 등)을 구체적으로 적어주세요.",
  "꿈의 장소와 전체적인 분위기를 묘사해 주세요.",
  "꿈 속에서 벌어진 일을 시간 순서대로 적어주세요.",
  "인상 깊었던 상징이나 사물, 색깔을 빠짐없이 적어주세요.",
  "꿈에서 깼을 때의 감정 상태도 함께 적어주세요.",
];

export function DreamForm({ productId, isLoggedIn }: Props) {
  const router = useRouter();
  const [dreamContent, setDreamContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const charCount = dreamContent.length;
  const MAX_CHARS = 2000;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = dreamContent.trim();
    if (!trimmed || trimmed.length < 10) {
      toast.error("꿈 내용을 10자 이상 입력해 주세요");
      return;
    }
    setSubmitting(true);
    try {
      const createRes = await fetch("/api/orders/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          dreamContent: trimmed,
        }),
      });
      const createJson = await createRes.json();
      if (!createRes.ok) throw new Error(createJson.error ?? "주문 생성 실패");

      const { orderId } = createJson;
      router.push(`/checkout/${orderId}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "오류가 발생했습니다");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* ── 꿈 내용 textarea ── */}
      <div className="space-y-2">
        <label
          htmlFor="dreamContent"
          className="block text-[14px] font-semibold text-ink"
        >
          꿈 내용을 들려주세요
          <span className="ml-1 text-rose-500">*</span>
        </label>
        <div className="relative">
          <textarea
            id="dreamContent"
            value={dreamContent}
            onChange={(e) => {
              if (e.target.value.length <= MAX_CHARS) setDreamContent(e.target.value);
            }}
            placeholder="아래 TIP을 참고해서 꿈의 내용을 최대한 자세히 적어주세요."
            rows={7}
            className="w-full resize-none rounded-2xl border border-input bg-background px-4 py-3 text-[14px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-shadow leading-relaxed"
          />
          <span
            className={`absolute bottom-3 right-4 text-[11px] font-mono ${
              charCount >= MAX_CHARS ? "text-rose-500" : "text-muted-foreground"
            }`}
          >
            {charCount.toLocaleString()} / {MAX_CHARS.toLocaleString()}
          </span>
        </div>
      </div>

      {/* ── TIP 박스 ── */}
      <div className="rounded-2xl bg-amber-50/80 border border-amber-200/60 px-5 py-4 space-y-2">
        <p className="text-[13px] font-semibold text-amber-800 flex items-center gap-1.5">
          <span>💡</span>
          이렇게 적어주시면 더 정확한 풀이가 나와요
        </p>
        <ol className="space-y-1.5 list-none">
          {TIPS.map((tip, i) => (
            <li key={i} className="flex gap-2 text-[12px] text-amber-900/80 leading-snug">
              <span className="shrink-0 w-4 h-4 rounded-full bg-amber-400/40 flex items-center justify-center text-[10px] font-bold text-amber-800">
                {i + 1}
              </span>
              {tip}
            </li>
          ))}
        </ol>
      </div>

      {/* ── 버튼 영역 ── */}
      {isLoggedIn ? (
        <Button
          type="submit"
          size="lg"
          className="w-full h-12 text-[15px] font-semibold"
          disabled={submitting}
        >
          {submitting ? "주문 생성 중..." : "결제하고 꿈해몽 풀이 받기 ₩1,900"}
        </Button>
      ) : (
        <div className="space-y-2 pt-1">
          <Link
            href={`/login?redirect=${encodeURIComponent(`/products/dream-reading`)}`}
            className={cn(
              buttonVariants({ size: "lg" }),
              "w-full h-12 text-[15px] font-semibold"
            )}
          >
            로그인하고 꿈해몽 풀이 받기
          </Link>
          <p className="text-xs text-body text-center">
            결과는 로그인 후 <span className="text-ink">마이페이지</span>에서 확인할 수 있어요.
          </p>
        </div>
      )}
    </form>
  );
}
