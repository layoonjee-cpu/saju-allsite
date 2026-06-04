"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { tarotCards, getCardBackPath, getCardImagePath } from "@/data/tarot-cards";
import { cn } from "@/lib/utils";

type Step = 1 | 2;

const POSITIONS = ["현재 상황", "흐름과 조언", "앞으로의 방향"];

export default function TarotPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
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

  return (
    <div className="min-h-screen bg-[#0a0a14] text-white">
      {/* 헤더 */}
      <header className="text-center pt-10 pb-6 px-4">
        <p className="text-xs tracking-[0.3em] text-[#a89060] font-mono mb-2">TAROT</p>
        <h1 className="text-2xl font-semibold tracking-tight">타로의 시선</h1>
        <p className="text-sm text-gray-400 mt-1">78장의 오리엔탈 타로로 당신의 고민을 읽어드립니다</p>
      </header>

      {/* 스텝 인디케이터 */}
      <div className="flex justify-center gap-2 mb-8">
        {[1, 2].map((s) => (
          <div
            key={s}
            className={cn(
              "w-2 h-2 rounded-full transition-all",
              step === s ? "bg-[#c9a84c] w-6" : step > s ? "bg-[#c9a84c]/50" : "bg-white/20",
            )}
          />
        ))}
      </div>

      <div className="container max-w-2xl px-4 pb-16">

        {/* ── STEP 1: 이름 입력 ── */}
        {step === 1 && (
          <div>
            <p className="text-center text-sm text-gray-300 mb-1">타로에게 알려주세요</p>
            <p className="text-center text-xs text-gray-500 mb-6">이름(또는 닉네임)을 입력해주세요</p>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value.slice(0, 20))}
              placeholder="예: 나윤지"
              className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-4 text-base text-center placeholder:text-gray-600 focus:outline-none focus:border-[#c9a84c]"
              onKeyDown={(e) => { if (e.key === "Enter" && name.trim()) setStep(2); }}
            />
            <button
              onClick={() => setStep(2)}
              disabled={!name.trim()}
              className={cn(
                "mt-6 w-full py-3 rounded-xl text-sm font-medium transition-all",
                name.trim()
                  ? "bg-[#c9a84c] text-[#0a0a14] hover:bg-[#e0bc5a]"
                  : "bg-white/10 text-white/30 cursor-not-allowed",
              )}
            >
              카드 고르기
            </button>
          </div>
        )}

        {/* ── STEP 2: 카드 선택 ── */}
        {step === 2 && (
          <div>
            {/* 선택 슬롯 */}
            <p className="text-center text-sm text-[#c9a84c] mb-3">
              <span className="font-medium">{name}</span>님의 타로
            </p>
            <div className="flex justify-center gap-3 mb-4">
              {[0, 1, 2].map((i) => {
                const cardId = selected[i];
                return (
                  <div key={i} className="flex flex-col items-center gap-1">
                    <div
                      className={cn(
                        "w-16 h-24 rounded-lg border-2 transition-all flex items-center justify-center overflow-hidden",
                        cardId !== undefined
                          ? "border-[#c9a84c]"
                          : "border-dashed border-white/30",
                      )}
                    >
                      {cardId !== undefined ? (
                        <Image
                          src={getCardImagePath(cardId)}
                          alt={tarotCards.find((c) => c.id === cardId)?.nameKo ?? ""}
                          width={64}
                          height={96}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-white/20 text-xl">?</span>
                      )}
                    </div>
                    <span className="text-[10px] text-gray-500">{POSITIONS[i]}</span>
                  </div>
                );
              })}
            </div>

            <p className="text-center text-xs text-gray-400 mb-4">
              {selected.length < 3
                ? `카드를 ${3 - selected.length}장 더 선택하세요`
                : "3장이 선택되었습니다"}
            </p>

            {/* 카드 그리드 */}
            <div className="grid grid-cols-4 gap-2 max-h-[55vh] overflow-y-auto pr-1">
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
                          ? "opacity-30 cursor-not-allowed"
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
                        <span className="w-6 h-6 rounded-full bg-[#c9a84c] text-[#0a0a14] text-xs font-bold flex items-center justify-center">
                          {slotIdx + 1}
                        </span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* 비회원 이메일 입력 */}
            {showEmailInput && (
              <div className="mt-4">
                <p className="text-xs text-[#c9a84c] mb-2">비회원은 이메일을 입력해주세요 (결과 확인용)</p>
                <input
                  type="email"
                  value={guestEmail}
                  onChange={(e) => setGuestEmail(e.target.value)}
                  placeholder="example@email.com"
                  className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-[#c9a84c]"
                />
              </div>
            )}

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setStep(1)}
                className="px-5 py-3 rounded-xl text-sm border border-white/15 hover:border-white/30 transition-all shrink-0"
              >
                이전
              </button>
              <button
                onClick={handlePay}
                disabled={selected.length !== 3 || submitting || (showEmailInput && !guestEmail)}
                className={cn(
                  "flex-1 py-3 rounded-xl text-sm font-medium transition-all",
                  selected.length === 3 && !submitting
                    ? "bg-[#c9a84c] text-[#0a0a14] hover:bg-[#e0bc5a]"
                    : "bg-white/10 text-white/30 cursor-not-allowed",
                )}
              >
                {submitting ? "처리 중..." : "결제하고 리딩결과 보기 · 5,000원"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
