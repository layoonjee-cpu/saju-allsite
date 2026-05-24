"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export function TestPayButton({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleTestPay() {
    setLoading(true);
    try {
      const res = await fetch("/api/orders/test-confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "테스트 결제 실패");
      router.replace(`/results/${json.resultId}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "오류가 발생했습니다");
      setLoading(false);
    }
  }

  return (
    <div className="mt-4 pt-4 border-t border-dashed border-yellow-400">
      <p className="text-xs text-yellow-600 mb-2 text-center font-medium">🛠 개발 테스트 전용</p>
      <button
        onClick={handleTestPay}
        disabled={loading}
        className="w-full h-10 rounded-lg border-2 border-dashed border-yellow-400 text-yellow-700 text-sm font-medium hover:bg-yellow-50 transition-colors disabled:opacity-50"
      >
        {loading ? "AI 사주 생성 중..." : "💳 테스트 결제 (무료)"}
      </button>
    </div>
  );
}
