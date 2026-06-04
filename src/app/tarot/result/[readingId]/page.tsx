import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { createServiceClient } from "@/lib/supabase/server";
import { tarotCards, getCardImagePath } from "@/data/tarot-cards";
import { TarotShareButtons } from "@/components/tarot/TarotShareButtons";

export const metadata = { title: "타로의 시선 — 리딩 결과" };

const POSITIONS = ["현재 상황", "흐름과 조언", "앞으로의 방향"];

function parseReadingText(text: string) {
  const sections = {
    card1: "",
    card2: "",
    card3: "",
    summary: "",
  };
  if (!text) return sections;

  const m1 = text.match(/\[1번 카드 해석\]\s*([\s\S]*?)(?=\[2번 카드 해석\]|$)/);
  const m2 = text.match(/\[2번 카드 해석\]\s*([\s\S]*?)(?=\[3번 카드 해석\]|$)/);
  const m3 = text.match(/\[3번 카드 해석\]\s*([\s\S]*?)(?=\[종합 메시지\]|$)/);
  const ms = text.match(/\[종합 메시지\]\s*([\s\S]*?)$/);

  sections.card1 = m1?.[1]?.trim() ?? "";
  sections.card2 = m2?.[1]?.trim() ?? "";
  sections.card3 = m3?.[1]?.trim() ?? "";
  sections.summary = ms?.[1]?.trim() ?? "";

  return sections;
}

export default async function TarotResultPage({
  params,
}: {
  params: Promise<{ readingId: string }>;
}) {
  const { readingId } = await params;
  const svc = createServiceClient();

  const { data: reading } = await svc
    .from("tarot_readings")
    .select("id, category, question, card_1_id, card_1_reversed, card_2_id, card_2_reversed, card_3_id, card_3_reversed, reading_text, created_at, order_id")
    .eq("id", readingId)
    .maybeSingle();

  if (!reading) notFound();

  // 주문이 실제 paid 상태인지 확인
  const { data: order } = await svc
    .from("orders")
    .select("status")
    .eq("id", reading.order_id)
    .maybeSingle();

  if (order?.status !== "paid") notFound();

  const cards = [
    { id: reading.card_1_id, reversed: reading.card_1_reversed },
    { id: reading.card_2_id, reversed: reading.card_2_reversed },
    { id: reading.card_3_id, reversed: reading.card_3_reversed },
  ];

  const sections = parseReadingText(reading.reading_text ?? "");
  const cardTexts = [sections.card1, sections.card2, sections.card3];

  return (
    <div className="min-h-screen bg-[#0a0a14] text-white pb-16">
      {/* 헤더 */}
      <header className="text-center pt-10 pb-8 px-4">
        <p className="text-xs tracking-[0.3em] text-[#a89060] font-mono mb-2">TAROT READING</p>
        <h1 className="text-2xl font-semibold tracking-tight">타로의 시선</h1>
        <p className="text-sm text-gray-400 mt-2">
          <span className="text-[#c9a84c]">{reading.category}</span>의 질문
        </p>
        <p className="text-sm text-gray-300 mt-1 max-w-xs mx-auto">&ldquo;{reading.question}&rdquo;</p>
      </header>

      <div className="container max-w-2xl px-4">
        {/* 카드 3장 */}
        <div className="flex justify-center gap-4 mb-10">
          {cards.map((card, i) => {
            const info = tarotCards.find((c) => c.id === card.id);
            return (
              <div key={i} className="flex flex-col items-center gap-2 w-24">
                <div
                  className={`relative w-24 h-36 rounded-xl overflow-hidden shadow-[0_0_20px_rgba(201,168,76,0.2)] border border-[#c9a84c]/30 transition-transform ${card.reversed ? "rotate-180" : ""}`}
                >
                  <Image
                    src={getCardImagePath(card.id)}
                    alt={info?.nameKo ?? ""}
                    fill
                    className="object-cover"
                  />
                </div>
                <p className="text-[10px] text-[#a89060] text-center">{POSITIONS[i]}</p>
                <p className="text-xs text-white text-center font-medium leading-tight">{info?.nameKo}</p>
                {card.reversed && (
                  <p className="text-[10px] text-gray-500">역방향</p>
                )}
              </div>
            );
          })}
        </div>

        {/* 리딩 텍스트 — 카드별 */}
        {!reading.reading_text ? (
          <div className="text-center text-gray-400 py-12">
            <p>리딩을 생성하는 중입니다...</p>
            <p className="text-xs mt-2">잠시 후 새로고침해 주세요.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {cards.map((card, i) => {
              const info = tarotCards.find((c) => c.id === card.id);
              return (
                <div key={i} className="rounded-2xl bg-white/5 border border-white/10 p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs font-mono text-[#a89060]">{POSITIONS[i]}</span>
                    <span className="text-sm font-medium">{info?.nameKo}</span>
                    {card.reversed && (
                      <span className="text-[10px] text-gray-500 ml-auto">역방향</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-line">
                    {cardTexts[i] || "해석을 불러오는 중입니다."}
                  </p>
                </div>
              );
            })}

            {/* 종합 메시지 */}
            {sections.summary && (
              <div className="rounded-2xl bg-[#c9a84c]/5 border border-[#c9a84c]/20 p-5">
                <p className="text-xs font-mono text-[#a89060] mb-3">종합 메시지</p>
                <p className="text-sm text-gray-200 leading-relaxed whitespace-pre-line">
                  {sections.summary}
                </p>
              </div>
            )}
          </div>
        )}

        {/* 공유 버튼 */}
        <div className="mt-10">
          <TarotShareButtons readingId={readingId} question={reading.question} />
        </div>

        {/* 다시 질문하기 */}
        <div className="mt-6 text-center">
          <Link
            href="/tarot"
            className="inline-block text-sm text-gray-400 hover:text-[#c9a84c] transition-colors underline underline-offset-4"
          >
            다시 질문하기
          </Link>
        </div>
      </div>
    </div>
  );
}
