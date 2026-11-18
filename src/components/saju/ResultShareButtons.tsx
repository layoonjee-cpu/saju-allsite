"use client";

import Link from "next/link";
import { useState } from "react";

type Props = {
  resultId: string;
  productName: string;
};

export function ResultShareButtons({ resultId, productName }: Props) {
  const [showEmailInput, setShowEmailInput] = useState(false);
  const [email, setEmail] = useState("");
  const [emailSending, setEmailSending] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [busy, setBusy] = useState<"download" | "share" | null>(null);
  const [error, setError] = useState("");
  const [needsLogin, setNeedsLogin] = useState(false);

  const filename = `${productName.replace(/[\\/:*?"<>|\r\n]/g, "")}_시선사주.pdf`;

  async function getPdf(): Promise<Blob> {
    const res = await fetch(`/api/results/${resultId}/pdf`, { cache: "no-store" });
    if (!res.ok) {
      if (res.status === 401) setNeedsLogin(true);
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error ?? "PDF를 준비하지 못했습니다.");
    }
    // An already-produced VIP PDF is fetched from a five-minute signed Storage URL.
    // This avoids streaming multi-megabyte reports through a Vercel function.
    if (res.headers.get("content-type")?.includes("application/json")) {
      const data = await res.json();
      if (!data.url) throw new Error("PDF 주소를 불러오지 못했습니다.");
      const fileRes = await fetch(data.url, { cache: "no-store" });
      if (!fileRes.ok) throw new Error("기존 PDF를 다운로드하지 못했습니다.");
      return fileRes.blob();
    }
    return res.blob();
  }

  function savePdf(blob: Blob) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
  }

  async function handlePdf(action: "download" | "share") {
    setBusy(action);
    setError("");
    try {
      const blob = await getPdf();
      if (action === "download") {
        savePdf(blob);
        return;
      }
      // Native file sharing keeps the PDF private; users select KakaoTalk as recipient.
      const file = new File([blob], filename, { type: "application/pdf" });
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        try {
          await navigator.share({ files: [file], title: `${productName} 분석 결과` });
        } catch (err) {
          if (err instanceof Error && err.name === "AbortError") return;
          throw err;
        }
      } else {
        savePdf(blob);
        setError("이 기기는 PDF 파일 공유를 지원하지 않아 다운로드했습니다. 카카오톡에서 파일을 첨부해 주세요.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "PDF 처리 중 오류가 발생했습니다.");
    } finally {
      setBusy(null);
    }
  }

  async function handleEmailSend(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("올바른 이메일 주소를 입력해 주세요.");
      return;
    }
    setEmailSending(true);
    setError("");
    try {
      const res = await fetch(`/api/results/${resultId}/send-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "발송 실패");
      }
      setEmailSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "이메일 발송 중 오류가 발생했습니다.");
    } finally {
      setEmailSending(false);
    }
  }

  return (
    <section className="my-8 rounded-2xl border border-[#e6d6cb] bg-[#fffaf6] p-5 sm:p-6" aria-label="결과지 저장 및 공유">
      <h2 className="text-base font-bold text-[#4a1d2c]">분석 결과 저장하기</h2>
      <p className="mt-1 text-xs leading-relaxed text-[#745b61]">
        PDF로 보관하거나 파일 공유 메뉴에서 카카오톡을 선택하세요. 분석 내용은 본인이 공유할 때만 전달됩니다.
      </p>
      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <button type="button" onClick={() => handlePdf("download")} disabled={busy !== null}
          className="flex h-12 flex-1 items-center justify-center rounded-xl bg-[#4a1d2c] px-4 text-sm font-bold text-white hover:bg-[#60293b] disabled:opacity-60">
          {busy === "download" ? "PDF 준비 중..." : "PDF 다운로드"}
        </button>
        <button type="button" onClick={() => handlePdf("share")} disabled={busy !== null}
          className="flex h-12 flex-1 items-center justify-center rounded-xl bg-[#FEE500] px-4 text-sm font-bold text-[#2b2412] hover:bg-[#f9d800] disabled:opacity-60">
          {busy === "share" ? "공유 준비 중..." : "카카오톡으로 공유"}
        </button>
        {!showEmailInput && !emailSent && (
          <button type="button" onClick={() => setShowEmailInput(true)}
            className="flex h-12 flex-1 items-center justify-center rounded-xl border border-[#a88b79] px-4 text-sm font-bold text-[#4a1d2c] hover:bg-white">
            이메일로 받기
          </button>
        )}
        {emailSent && <p className="flex h-12 items-center text-sm text-[#4a1d2c]">이메일을 발송했습니다</p>}
      </div>
      {showEmailInput && !emailSent && (
        <form onSubmit={handleEmailSend} className="mt-3 flex flex-wrap gap-2">
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
            placeholder="이메일 주소" aria-label="이메일 주소" required
            className="h-12 min-w-0 flex-1 rounded-xl border border-[#cbbeb8] bg-white px-3 text-sm" />
          <button type="submit" disabled={emailSending}
            className="h-12 rounded-xl bg-[#4a1d2c] px-4 text-sm font-bold text-white disabled:opacity-60">
            {emailSending ? "발송 중..." : "발송"}
          </button>
          <button type="button" onClick={() => setShowEmailInput(false)}
            className="h-12 rounded-xl border border-[#cbbeb8] px-3 text-sm">취소</button>
        </form>
      )}
      {error && <p role="alert" className="mt-3 text-sm text-[#a43138]">{error}</p>}
      {needsLogin && <Link href={`/login?redirect=${encodeURIComponent(`/results/${resultId}`)}`}
        className="mt-2 inline-block text-sm font-bold text-[#4a1d2c] underline">로그인하고 다시 저장하기</Link>}
    </section>
  );
}
