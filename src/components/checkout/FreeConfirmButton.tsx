"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export function FreeConfirmButton({ orderId }: { orderId: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleFree() {
    setLoading(true);
    toast.loading("사주를 분석하고 있어요...", { id: "free-confirm" });

    const res = await fetch("/api/orders/free-confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId }),
    });
    const json = await res.json().catch(() => ({}));

    toast.dismiss("free-confirm");

    if (!res.ok || !json.resultId) {
      toast.error("분석 시작에 실패했습니다. 다시 시도해 주세요.");
      setLoading(false);
      return;
    }

    router.push(`/results/${json.resultId}`);
  }

  return (
    <button
      onClick={handleFree}
      disabled={loading}
      className="w-full h-12 rounded-xl text-[15px] font-bold text-white bg-[#2D5C5C] hover:bg-[#245050] disabled:opacity-50 transition-colors"
    >
      {loading ? "분석 중..." : "무료 분석 시작하기"}
    </button>
  );
}
