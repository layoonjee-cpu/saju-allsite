"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { loadPayment } from "@/lib/toss/client";
import { publicEnv } from "@/lib/env";

type Props = {
  orderId: string;
  amount: number;
  customerKey: string;
  productName: string;
  customerEmail: string | null;
  successUrl?: string;
};

const EASY_PAY_PROVIDERS = [
  { code: "KAKAOPAY",  label: "카카오페이", bg: "#FEE500", textColor: "#3C1E1E" },
  { code: "NAVERPAY",  label: "네이버페이", bg: "#03C75A", textColor: "#fff" },
  { code: "TOSSPAY",   label: "토스페이",   bg: "#0064FF", textColor: "#fff" },
] as const;

export function TossWidget({ orderId, amount, customerKey, productName, customerEmail, successUrl }: Props) {
  const [paying, setPaying] = useState<string | null>(null);

  const commonArgs = {
    amount: { currency: "KRW" as const, value: amount },
    orderId,
    orderName: productName,
    successUrl: successUrl ?? `${publicEnv.NEXT_PUBLIC_SITE_URL}/checkout/success`,
    failUrl: `${publicEnv.NEXT_PUBLIC_SITE_URL}/checkout/fail`,
    customerEmail: customerEmail ?? undefined,
  };

  async function handleCard() {
    setPaying("CARD");
    try {
      const payment = await loadPayment(customerKey);
      await payment.requestPayment({ method: "CARD", ...commonArgs });
    } catch (err) {
      setPaying(null);
      toast.error(err instanceof Error ? err.message : "결제 요청 실패");
    }
  }

  async function handleEasyPay(easyPayCode: string) {
    setPaying(easyPayCode);
    try {
      const payment = await loadPayment(customerKey);
      await payment.requestPayment({
        method: "CARD",
        ...commonArgs,
        card: { flowMode: "DIRECT", easyPay: easyPayCode },
      });
    } catch (err) {
      setPaying(null);
      toast.error(err instanceof Error ? err.message : "결제 요청 실패");
    }
  }

  const isDisabled = paying !== null;

  return (
    <div className="space-y-3">
      {/* 카드 결제 */}
      <Button
        onClick={handleCard}
        disabled={isDisabled}
        size="lg"
        className="w-full"
      >
        {paying === "CARD" ? "결제 진행 중..." : "카드로 결제하기"}
      </Button>

      {/* 구분선 */}
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <div className="flex-1 h-px bg-border" />
        <span>간편결제</span>
        <div className="flex-1 h-px bg-border" />
      </div>

      {/* 간편결제 버튼 */}
      <div className="grid grid-cols-3 gap-2">
        {EASY_PAY_PROVIDERS.map(({ code, label, bg, textColor }) => (
          <button
            key={code}
            onClick={() => handleEasyPay(code)}
            disabled={isDisabled}
            className="flex items-center justify-center h-11 rounded-xl text-[13px] font-semibold transition-opacity disabled:opacity-50"
            style={{ background: bg, color: textColor }}
          >
            {paying === code ? "..." : label}
          </button>
        ))}
      </div>
    </div>
  );
}
