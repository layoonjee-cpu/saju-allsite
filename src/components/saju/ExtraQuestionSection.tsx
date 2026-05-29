"use client";

import { useState } from "react";
import Link from "next/link";

const PRESET_QUESTIONS = [
  "지금 이직해도 괜찮을까요?",
  "어떤 업종이 저한테 맞을까요?",
  "사업 시작하기 좋은 시기는?",
  "직장에서 승진 가능성은?",
  "프리랜서가 저한테 맞을까요?",
  "올해 취업운은 어떤가요?",
];

type Props = {
  resultId: string;
  hasReview: boolean;
  reviewUrl: string;
  existingQuestion: string | null;
  existingAnswer: string | null;
};

export function ExtraQuestionSection({
  resultId,
  hasReview,
  reviewUrl,
  existingQuestion,
  existingAnswer,
}: Props) {
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [answer, setAnswer] = useState<string | null>(existingAnswer);
  const [askedQuestion, setAskedQuestion] = useState<string | null>(existingQuestion);
  const [error, setError] = useState("");

  const selectChip = (q: string) => {
    if (!hasReview || askedQuestion) return;
    setQuestion((prev) => (prev === q ? "" : q));
  };

  const handleSubmit = async () => {
    if (!question.trim() || loading) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/results/${resultId}/extra-question`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: question.trim() }),
      });
      const data = await res.json() as { answer?: string; error?: string };
      if (!res.ok) {
        setError(data.error ?? "오류가 발생했습니다. 다시 시도해주세요.");
      } else {
        setAnswer(data.answer ?? "");
        setAskedQuestion(question.trim());
      }
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section
      className="mt-10 rounded-2xl overflow-hidden"
      style={{ background: "#16161e" }}
    >
      {/* 헤더 */}
      <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-white/[0.08]">
        <p className="text-white font-bold text-[15px] flex items-center gap-2">
          💬 추가 질문
        </p>
        {askedQuestion ? (
          <span className="text-[11px] text-white/35 font-medium">사용 완료</span>
        ) : hasReview ? (
          <span className="text-[11px] text-teal-400 font-bold bg-teal-900/40 px-2 py-0.5 rounded-full">
            1회 무료 이용 가능
          </span>
        ) : (
          <span className="text-[11px] text-white/35 font-medium">후기 작성 후 이용 가능</span>
        )}
      </div>

      <div className="px-5 py-5">
        {/* ── 답변 완료 상태 ── */}
        {askedQuestion && answer ? (
          <div className="space-y-3">
            <div className="bg-white/[0.05] rounded-xl px-4 py-3">
              <p className="text-[10px] text-teal-400 font-bold tracking-wider mb-1.5">질문</p>
              <p className="text-white/75 text-[13px] leading-relaxed">{askedQuestion}</p>
            </div>
            <div
              className="rounded-xl px-4 py-4"
              style={{ background: "linear-gradient(135deg, #0d2e2c 0%, #0a2420 100%)", border: "1px solid rgba(45,92,92,0.4)" }}
            >
              <p className="text-[10px] text-teal-400 font-bold tracking-wider mb-2">사주 풀이 답변</p>
              <p className="text-teal-100 text-[13px] leading-[1.8] whitespace-pre-wrap">
                {answer}
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* ── 안내 텍스트 ── */}
            <p className="text-white/40 text-[12px] text-center mb-4">
              궁금한 점을 자유롭게 질문하거나, 아래에서 골라보세요
            </p>

            {/* ── 프리셋 칩 ── */}
            <div className="flex flex-wrap gap-2 justify-center mb-5">
              {PRESET_QUESTIONS.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => selectChip(q)}
                  disabled={!hasReview}
                  className={`text-[12px] px-3 py-1.5 rounded-full border transition-all
                    ${!hasReview
                      ? "border-white/[0.08] text-white/25 cursor-default"
                      : question === q
                        ? "bg-teal-700 border-teal-600 text-white shadow-[0_0_12px_rgba(45,92,92,0.5)]"
                        : "border-white/20 text-white/55 hover:border-teal-500/60 hover:text-teal-300 cursor-pointer"
                    }`}
                >
                  {q}
                </button>
              ))}
            </div>

            {/* ── 리뷰 있음: 입력 + 제출 ── */}
            {hasReview ? (
              <div className="space-y-3">
                <textarea
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="또는 직접 질문을 입력하세요 (최대 200자)"
                  maxLength={200}
                  rows={3}
                  className="w-full rounded-xl px-4 py-3 text-white text-[13px] placeholder:text-white/25 resize-none focus:outline-none transition-colors"
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.12)",
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(45,92,92,0.7)")}
                  onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)")}
                />
                <p className="text-white/25 text-[11px] text-right">{question.length}/200</p>
                {error && (
                  <p className="text-red-400 text-[12px] text-center">{error}</p>
                )}
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={!question.trim() || loading}
                  className="w-full py-3.5 rounded-2xl font-bold text-[14px] transition-all active:scale-[0.98]"
                  style={{
                    background: loading || !question.trim() ? "rgba(201,168,92,0.35)" : "#c9a85c",
                    color: loading || !question.trim() ? "rgba(26,26,46,0.5)" : "#1a1a2e",
                    cursor: loading || !question.trim() ? "not-allowed" : "pointer",
                  }}
                >
                  {loading ? "풀이 중…" : "질문하기"}
                </button>
              </div>
            ) : (
              /* ── 리뷰 없음: 후기 작성 버튼 ── */
              <div className="space-y-3 text-center">
                <Link
                  href={reviewUrl}
                  className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl font-bold text-[14px] transition-colors active:scale-[0.98]"
                  style={{ background: "#c9a85c", color: "#1a1a2e" }}
                >
                  <span className="w-2 h-2 rounded-full bg-[#1a1a2e] inline-block" />
                  후기 작성하고 추가질문하기
                </Link>
                <p className="text-white/30 text-[11px]">
                  후기 작성 시 추가 질문이 열립니다 (기본 1회 무료)
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
