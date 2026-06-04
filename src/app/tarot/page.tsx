"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { tarotCards, getCardBackPath, getCardImagePath } from "@/data/tarot-cards";
import { cn } from "@/lib/utils";

const POSITIONS = ["현재 상황", "흐름과 조언", "앞으로의 방향"];

export default function TarotPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [selected, setSelected] = useState<number[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [guestEmail, setGuestEmail] = useState("");
  const [showEmailInput, setShowEmailInput] = useState(false);

  function selectCard(id: number) {
    if (selected.includes(id)) {
      setSelected(selected.filter((s) => s !== id));
    } else if (selected.length < 3) {
      setSelected([...selected, id]);
    }
  }

  async function handlePay() {
    if (selected.length !== 3 || !name.trim()) return;

    const reversals = [Math.random() < 0.5, Math.random() < 0.5, Math.random() < 0.5];

    setSubmitting(true);
    try {
      const res = await fetch("/api/tarot/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          card1Id: selected[0],
          card1Reversed: reversals[0],
          card2Id: selected[1],
          card2Reversed: reversals[1],
          card3Id: selected[2],
          card3Reversed: reversals[2],
          guestEmail: guestEmail || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        if (json.error?.includes("이메일")) {
          setShowEmailInput(true);
          setSubmitting(false);
          return;
        }
        throw new Error(json.error ?? "오류가 발생했습니다.");
      }
      router.push(`/checkout/${json.orderId}?from=tarot`);
    } catch (err) {
      alert(err instanceof Error ? err.message : "오류가 발생했습니다.");
      setSubmitting(false);
    }
  }

  const canPay = selected.length === 3 && name.trim().length > 0;

  return (
    <div className="min-h-screen bg-[#0a0a14] text-white">
      {/* 헤더 */}
      <header className="text-center pt-10 pb-6 px-4">
        <p className="text-xs tracking-[0.3em] text-[#a89060] font-mono mb-2">TAROT</p>
        <h1 className="text-2xl font-semibold tracking-tight">타로의 시선</h1>
      </header>

      <div className="container max-w-2xl px-4 pb-16 space-y-8">

        {/* 이름 입력 */}
        <div>
          <p className="text-xs text-gray-400 mb-2 text-center">이름 (또는 닉네임)</p>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value.slice(0, 20))}
            placeholder="예: 나윤지"
            className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-3 text-base text-center placeholder:text-gray-600 focus:outline-none focus:border-[#c9a84c]"
          />
        </div>

        {/* 안내 문구 */}
        <div className="text-center space-y-1">
          <p className="text-[#c9a84c] font-medium text-base leading-relaxed">
            3초간 고민을 떠올리면서<br />3장의 카드를 뽑아주세요
          </p>
          <p className="text-xs text-gray-500">78장 중 마음이 가는 카드 3장을 순서대로 선택하세요</p>
        </div>

        {/* 선택 슬롯 */}
        <div className="flex justify-center gap-4">
          {[0, 1, 2].map((i) => {
            const cardId = selected[i];
            return (
              <div key={i} className="flex flex-col items-center gap-1.5">
                <div
                  className={cn(
                    "w-[72px] h-[104px] rounded-xl border-2 transition-all flex items-center justify-center overflow-hidden",
                    cardId !== undefined
                      ? "border-[#c9a84c] shadow-[0_0_16px_rgba(201,168,76,0.4)]"
                      : "border-dashed border-white/25",
                  )}
                >
                  {cardId !== undefined ? (
                    <Image
                      src={getCardImagePath(cardId)}
                      alt={tarotCards.find((c) => c.id === cardId)?.nameKo ?? ""}
                      width={72}
                      height={104}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-white/20 text-2xl">?</span>
                  )}
                </div>
                <span className="text-[10px] text-gray-500">{POSITIONS[i]}</span>
              </div>
            );
          })}
        </div>

        {/* 선택 상태 */}
        <p className="text-center text-xs text-gray-400">
          {selected.length < 3
            ? `${3 - selected.length}장을 더 선택하세요`
            : "✓ 3장 선택 완료"}
        </p>

        {/* 카드 그리드 */}
        <div className="grid grid-cols-4 gap-2 max-h-[60vh] overflow-y-auto pr-1">
          {tarotCards.map((card) => {
            const isSelected = selected.includes(card.id);
            const slotIdx = selected.indexOf(card.id);
            return (
              <button
                key={card.id}
                onClick={() => selectCard(card.id)}
                disabled={selected.length >= 3 && !isSelected}
                className={cn(
                  "relative rounded-lg overflow-hidden aspect-[2/3] transition-all",
                  isSelected
                    ? "ring-2 ring-[#c9a84c] scale-95"
                    : selected.length >= 3
                      ? "opacity-25 cursor-not-allowed"
                      : "hover:scale-105 hover:ring-1 hover:ring-white/30",
                )}
              >
                <Image
                  src={getCardBackPath()}
                  alt="타로 카드"
                  fill
                  className="object-cover"
                />
                {isSelected && (
                  <div className="absolute inset-0 bg-[#c9a84c]/30 flex items-center justify-center">
                    <span className="w-7 h-7 rounded-full bg-[#c9a84c] text-[#0a0a14] text-sm font-bold flex items-center justify-center shadow-lg">
                      {slotIdx + 1}
                    </span>
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* 비회원 이메일 */}
        {showEmailInput && (
          <div>
            <p className="text-xs text-[#c9a84c] mb-2 text-center">비회원은 이메일을 입력해주세요 (결과 확인용)</p>
            <input
              type="email"
              value={guestEmail}
              onChange={(e) => setGuestEmail(e.target.value)}
              placeholder="example@email.com"
              className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#c9a84c] text-center"
            />
          </div>
        )}

        {/* 결제 버튼 */}
        <button
          onClick={handlePay}
          disabled={!canPay || submitting || (showEmailInput && !guestEmail)}
          className={cn(
            "w-full py-4 rounded-2xl text-base font-semibold transition-all",
            canPay && !submitting
              ? "bg-[#c9a84c] text-[#0a0a14] hover:bg-[#e0bc5a] shadow-[0_4px_20px_rgba(201,168,76,0.4)]"
              : "bg-white/10 text-white/30 cursor-not-allowed",
          )}
        >
          {submitting ? "처리 중..." : "결제하고 리딩결과 확인하세요 · 5,000원"}
        </button>

        {!canPay && (
          <p className="text-center text-xs text-gray-500 -mt-4">
            {!name.trim() ? "이름을 입력해주세요" : "카드 3장을 모두 선택해주세요"}
          </p>
        )}

      </div>
    </div>
  );
}
