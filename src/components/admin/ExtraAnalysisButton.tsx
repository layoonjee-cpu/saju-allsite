"use client";

import { useState, useEffect } from "react";

interface Props {
  resultId: string;
  name: string;
  hasEmail: boolean;
}

export function ExtraAnalysisButton({ resultId, name, hasEmail }: Props) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ESC 닫기
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open]);

  const handleSend = async () => {
    if (!message.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/extra-analysis/${resultId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error ?? `HTTP ${res.status}`);
      }
      setSent(true);
      setTimeout(() => {
        setOpen(false);
        setSent(false);
        setMessage("");
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "발송 실패");
    } finally {
      setLoading(false);
    }
  };

  if (!hasEmail) return null;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-[11px] font-medium text-[#8A5C2E] hover:underline cursor-pointer"
        title="추가 분석 내용을 이메일로 발송"
      >
        📝 추가분석
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.55)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
        >
          <div
            className="relative flex flex-col bg-white rounded-xl shadow-2xl w-full"
            style={{ maxWidth: "600px", maxHeight: "90vh" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* 헤더 */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 shrink-0">
              <div>
                <h2 className="text-sm font-semibold text-gray-900">추가 분석 발송</h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  {name}님께 추가 분석 내용을 이메일로 발송합니다.
                  이메일 하단에 [분석지 열람하기] 버튼이 자동 포함됩니다.
                </p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="text-gray-400 hover:text-gray-700 text-xl leading-none w-7 h-7 flex items-center justify-center rounded hover:bg-gray-100 transition-colors"
              >
                ×
              </button>
            </div>

            {/* 본문 */}
            <div className="flex-1 overflow-auto p-5" style={{ minHeight: 0 }}>
              <label className="block text-xs font-medium text-gray-700 mb-2">
                추가 분석 내용 <span className="text-gray-400">(이메일 본문으로 발송됩니다)</span>
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={`${name}님의 사주를 더 깊이 살펴보니...\n\n이 부분에 대해 추가로 말씀드리고 싶습니다.`}
                rows={12}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm leading-relaxed resize-none focus:outline-none focus:ring-2 focus:ring-[#2D5C5C]/30 focus:border-[#2D5C5C]"
              />
              <p className="text-xs text-gray-400 mt-1 text-right">{message.length} / 10,000자</p>
              {error && (
                <p className="text-xs text-red-600 mt-2">⚠ {error}</p>
              )}
            </div>

            {/* 푸터 */}
            <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-gray-200 bg-gray-50 rounded-b-xl shrink-0">
              <button
                onClick={() => setOpen(false)}
                className="px-3 py-1.5 rounded text-xs font-medium border border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors"
              >
                닫기
              </button>
              <button
                onClick={handleSend}
                disabled={!message.trim() || loading || sent}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded text-xs font-medium bg-[#8A5C2E] text-white hover:bg-[#7A4E26] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                {sent ? "✓ 발송됨" : loading ? "발송 중..." : "📨 발송"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
