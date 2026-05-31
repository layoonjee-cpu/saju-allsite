"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  productId: string;
  productSlug: string;
  productPrice: number;
  isLoggedIn: boolean;
};

const HOURS = Array.from({ length: 24 }, (_, i) => {
  const h = String(i).padStart(2, "0");
  return { value: `${h}:00`, label: `${h}시` };
});

export function ZiweiForm({ productId, productPrice, isLoggedIn }: Props) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [birthTime, setBirthTime] = useState("12:00");
  const [timeUnknown, setTimeUnknown] = useState(false);
  const [gender, setGender] = useState<"male" | "female">("female");
  const [calendar, setCalendar] = useState<"solar" | "lunar">("solar");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!birthDate) {
      setError("생년월일을 입력해 주세요.");
      return;
    }
    if (!isLoggedIn && !email) {
      setError("결과 수신을 위해 이메일을 입력해 주세요.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/orders/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          name: name || null,
          birthDate,
          birthTime: timeUnknown ? null : birthTime,
          timeUnknown,
          gender,
          calendar,
          concerns: [],
          customerEmail: email || null,
        }),
      });

      const data = (await res.json()) as { orderId?: string; amount?: number; error?: string };
      if (!res.ok || !data.orderId) {
        setError(data.error ?? "주문 생성에 실패했습니다.");
        return;
      }

      if (data.amount === 0) {
        // 무료 상품 (현재 ziwei-saju는 유료지만 혹시를 위한 분기)
        const fc = await fetch("/api/orders/free-confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId: data.orderId }),
        });
        const fd = (await fc.json()) as { resultId?: string };
        if (fd.resultId) router.push(`/results/${fd.resultId}`);
      } else {
        router.push(`/checkout/${data.orderId}`);
      }
    } catch {
      setError("오류가 발생했습니다. 다시 시도해 주세요.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* 이름 */}
      <div>
        <label className="block text-sm font-semibold text-[#1a1730] mb-1.5">
          이름 <span className="text-[11px] text-[#aaa] font-normal">(선택 — 보고서에 사용됩니다)</span>
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="홍길동"
          className="w-full h-11 rounded-xl border border-[#d0cce8] bg-white px-4 text-sm text-[#1a1730] placeholder:text-[#bbb] focus:outline-none focus:border-[#4a3f7a] focus:ring-1 focus:ring-[#4a3f7a]/20 transition-colors"
        />
      </div>

      {/* 생년월일 + 양음력 */}
      <div>
        <label className="block text-sm font-semibold text-[#1a1730] mb-1.5">
          생년월일 <span className="text-rose-500">*</span>
        </label>
        <div className="flex gap-2">
          <input
            type="date"
            value={birthDate}
            onChange={(e) => setBirthDate(e.target.value)}
            required
            className="flex-1 h-11 rounded-xl border border-[#d0cce8] bg-white px-4 text-sm text-[#1a1730] focus:outline-none focus:border-[#4a3f7a] focus:ring-1 focus:ring-[#4a3f7a]/20 transition-colors"
          />
          <div className="flex rounded-xl overflow-hidden border border-[#d0cce8]">
            {(["solar", "lunar"] as const).map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCalendar(c)}
                className={`px-3 text-xs font-semibold transition-colors ${
                  calendar === c
                    ? "bg-[#1a1730] text-white"
                    : "bg-white text-[#888] hover:bg-[#f0eef8]"
                }`}
              >
                {c === "solar" ? "양력" : "음력"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 출생시간 */}
      <div>
        <label className="block text-sm font-semibold text-[#1a1730] mb-1.5">
          출생 시간
          <span className="text-[11px] text-[#aaa] font-normal ml-1">(정확할수록 명반 정밀도 상승)</span>
        </label>
        <div className="flex gap-2 items-center">
          <select
            value={birthTime}
            onChange={(e) => setBirthTime(e.target.value)}
            disabled={timeUnknown}
            className="flex-1 h-11 rounded-xl border border-[#d0cce8] bg-white px-3 text-sm text-[#1a1730] focus:outline-none focus:border-[#4a3f7a] transition-colors disabled:opacity-40"
          >
            {HOURS.map((h) => (
              <option key={h.value} value={h.value}>{h.label}</option>
            ))}
          </select>
          <label className="flex items-center gap-1.5 text-xs text-[#888] cursor-pointer whitespace-nowrap">
            <input
              type="checkbox"
              checked={timeUnknown}
              onChange={(e) => setTimeUnknown(e.target.checked)}
              className="rounded"
            />
            모름
          </label>
        </div>
      </div>

      {/* 성별 */}
      <div>
        <label className="block text-sm font-semibold text-[#1a1730] mb-1.5">성별</label>
        <div className="flex gap-2">
          {(["female", "male"] as const).map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => setGender(g)}
              className={`flex-1 h-11 rounded-xl text-sm font-semibold transition-all border ${
                gender === g
                  ? "bg-[#1a1730] text-white border-[#1a1730]"
                  : "bg-white text-[#888] border-[#d0cce8] hover:border-[#4a3f7a]"
              }`}
            >
              {g === "female" ? "여성 ♀" : "남성 ♂"}
            </button>
          ))}
        </div>
      </div>

      {/* 이메일 (미로그인 시) */}
      {!isLoggedIn && (
        <div>
          <label className="block text-sm font-semibold text-[#1a1730] mb-1.5">
            이메일 <span className="text-rose-500">*</span>
            <span className="text-[11px] text-[#aaa] font-normal ml-1">(결과 링크 발송)</span>
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="example@email.com"
            className="w-full h-11 rounded-xl border border-[#d0cce8] bg-white px-4 text-sm text-[#1a1730] placeholder:text-[#bbb] focus:outline-none focus:border-[#4a3f7a] focus:ring-1 focus:ring-[#4a3f7a]/20 transition-colors"
          />
        </div>
      )}

      {error && (
        <p className="text-sm text-rose-600 bg-rose-50 rounded-lg px-4 py-2.5">{error}</p>
      )}

      {/* 제출 버튼 */}
      <button
        type="submit"
        disabled={loading}
        className="w-full h-13 rounded-2xl text-[15px] font-bold text-white transition-all disabled:opacity-60"
        style={{
          background: loading
            ? "#6b6b8a"
            : "linear-gradient(135deg, #1a1730 0%, #3d2f6b 50%, #c4913a 100%)",
        }}
      >
        {loading
          ? "처리 중..."
          : productPrice === 0
          ? "명반 무료로 보기 →"
          : `결제하고 별의 시선 받기 ₩${productPrice.toLocaleString()} →`}
      </button>

      <p className="text-center text-[11px] text-[#aaa]">
        ⭐ 토스페이먼츠 안전 결제 · 결과는 이 화면에 바로 표시됩니다
      </p>
    </form>
  );
}
