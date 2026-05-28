"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  reviewId: string;
  currentStatus: string;
}

export function ReviewActionButtons({ reviewId, currentStatus }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleAction = async (status: "approved" | "rejected") => {
    setLoading(true);
    try {
      await fetch(`/api/admin/reviews/${reviewId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  if (currentStatus === "approved") {
    return (
      <button
        onClick={() => handleAction("rejected")}
        disabled={loading}
        className="text-[11px] text-red-600 hover:underline disabled:opacity-40"
      >
        게시 취소
      </button>
    );
  }

  if (currentStatus === "rejected") {
    return (
      <button
        onClick={() => handleAction("approved")}
        disabled={loading}
        className="text-[11px] text-[#2D5C5C] hover:underline disabled:opacity-40"
      >
        승인
      </button>
    );
  }

  // pending
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => handleAction("approved")}
        disabled={loading}
        className="inline-flex items-center px-2.5 py-1 rounded text-[11px] font-medium bg-[#2D5C5C] text-white hover:bg-[#245050] disabled:opacity-40 transition-colors"
      >
        ✓ 승인
      </button>
      <button
        onClick={() => handleAction("rejected")}
        disabled={loading}
        className="inline-flex items-center px-2.5 py-1 rounded text-[11px] font-medium border border-red-300 text-red-600 hover:bg-red-50 disabled:opacity-40 transition-colors"
      >
        ✕ 거절
      </button>
    </div>
  );
}
