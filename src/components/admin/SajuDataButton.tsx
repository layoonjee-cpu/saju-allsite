"use client";

import { useState, useEffect, useCallback } from "react";

interface Props {
  orderId: string;
  name: string | null;
  birthDate: string | null;
}

export function SajuDataButton({ orderId, name, birthDate }: Props) {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const lineCount = data ? data.split("\n").length : 0;

  const handleOpen = useCallback(async () => {
    setOpen(true);
    if (data) return; // 캐시된 데이터 재사용
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/saju-raw/${orderId}`);
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error ?? `HTTP ${res.status}`);
      }
      const json = await res.json();
      setData(JSON.stringify(json, null, 2));
    } catch (err) {
      setError(err instanceof Error ? err.message : "데이터 로드 실패");
    } finally {
      setLoading(false);
    }
  }, [orderId, data]);

  // ESC 키로 닫기
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open]);

  const handleCopy = async () => {
    if (!data) return;
    try {
      await navigator.clipboard.writeText(data);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback: textarea select
      const ta = document.createElement("textarea");
      ta.value = data;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    if (!data) return;
    const filename = `saju-${name ?? "unknown"}-${birthDate ?? "unknown"}.json`
      .replace(/[^a-zA-Z0-9가-힣\-_.]/g, "_");
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <>
      {/* 데이터 버튼 */}
      <button
        onClick={handleOpen}
        className="text-[11px] font-medium text-[#2D5C5C] hover:underline cursor-pointer"
        title="16종 원본 사주 데이터 보기"
      >
        📊 데이터
      </button>

      {/* 모달 오버레이 */}
      {open && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.6)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
        >
          <div
            className="relative flex flex-col bg-white rounded-xl shadow-2xl w-full"
            style={{ maxWidth: "760px", maxHeight: "90vh" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* 헤더 */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 shrink-0">
              <div className="flex items-center gap-3">
                <h2 className="text-sm font-semibold text-gray-900">
                  원본 사주 데이터
                </h2>
                {(name || birthDate) && (
                  <span className="text-xs text-gray-500">
                    — {name ?? ""} {birthDate ?? ""}
                  </span>
                )}
                {data && (
                  <span className="text-[11px] font-mono text-gray-400 bg-gray-100 px-2 py-0.5 rounded">
                    {lineCount.toLocaleString()}줄
                  </span>
                )}
              </div>
              <button
                onClick={() => setOpen(false)}
                className="text-gray-400 hover:text-gray-700 text-xl leading-none w-7 h-7 flex items-center justify-center rounded hover:bg-gray-100 transition-colors"
              >
                ×
              </button>
            </div>

            {/* 본문 — JSON 뷰어 */}
            <div className="flex-1 overflow-auto" style={{ minHeight: 0 }}>
              {loading && (
                <div className="flex items-center justify-center h-48 text-sm text-gray-500">
                  <span className="mr-2 animate-spin">⟳</span> API에서 데이터를 불러오는 중...
                </div>
              )}
              {error && (
                <div className="flex items-center justify-center h-48 text-sm text-red-600 px-8 text-center">
                  ⚠ {error}
                </div>
              )}
              {data && (
                <pre
                  className="text-[12px] leading-relaxed font-mono p-5 m-0 overflow-auto"
                  style={{
                    background: "#1e1e2e",
                    color: "#cdd6f4",
                    whiteSpace: "pre",
                    maxHeight: "60vh",
                  }}
                >
                  {data}
                </pre>
              )}
            </div>

            {/* 푸터 */}
            <div className="flex items-center justify-between px-5 py-3 border-t border-gray-200 bg-gray-50 rounded-b-xl shrink-0">
              <p className="text-[11px] text-gray-400">
                GPTs에 붙여넣기하여 추가 분석 질문 가능
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopy}
                  disabled={!data || loading}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium bg-[#2D5C5C] text-white hover:bg-[#245050] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  {copied ? "✓ 복사됨" : "📋 복사"}
                </button>
                <button
                  onClick={handleDownload}
                  disabled={!data || loading}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium border border-gray-300 text-gray-700 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  ⬇ 다운로드
                </button>
                <button
                  onClick={() => setOpen(false)}
                  className="inline-flex items-center px-3 py-1.5 rounded text-xs font-medium border border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  닫기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
