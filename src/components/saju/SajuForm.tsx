"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { formatKRW } from "@/lib/utils";

type ProductOption = { id: string; slug: string; name: string; price: number };

type Props = {
  productId: string;
  productSlug: string;
  productPrice: number;
  isLoggedIn: boolean;
  products?: ProductOption[];
};

export function SajuForm({ productId, productSlug, productPrice, isLoggedIn, products }: Props) {
  const router = useRouter();
  const isFree = productPrice === 0;

  const [name, setName] = useState("");
  const [birthYear, setBirthYear] = useState("");
  const [birthMonth, setBirthMonth] = useState("");
  const [birthDay, setBirthDay] = useState("");
  const [birthTime, setBirthTime] = useState("");
  const [timeUnknown, setTimeUnknown] = useState(false);
  const [gender, setGender] = useState<"male" | "female">("male");
  const [calendar, setCalendar] = useState<"solar" | "lunar">("solar");
  const [submitting, setSubmitting] = useState(false);

  // dream-reading / love-saju 는 전용 폼 페이지에서 처리
  const sajuProducts = (products ?? []).filter(
    (p) => p.slug !== "dream-reading" && p.slug !== "love-saju"
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const y = parseInt(birthYear);
    const m = parseInt(birthMonth);
    const d = parseInt(birthDay);
    if (!birthYear || !birthMonth || !birthDay) {
      toast.error("생년월일을 모두 입력해 주세요");
      return;
    }
    if (y < 1900 || y > new Date().getFullYear()) {
      toast.error("올바른 년도를 입력해 주세요");
      return;
    }
    if (m < 1 || m > 12) {
      toast.error("올바른 월을 입력해 주세요 (1~12)");
      return;
    }
    if (d < 1 || d > 31) {
      toast.error("올바른 일을 입력해 주세요 (1~31)");
      return;
    }
    const birthDate = `${String(y)}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    setSubmitting(true);
    try {
      const createRes = await fetch("/api/orders/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          name,
          birthDate,
          birthTime: timeUnknown ? null : birthTime || null,
          timeUnknown,
          gender,
          calendar,
          concerns: [],
        }),
      });
      const createJson = await createRes.json();
      if (!createRes.ok) throw new Error(createJson.error ?? "주문 생성 실패");

      const { orderId, amount } = createJson;

      if (amount === 0) {
        toast.loading("사주를 분석하고 있어요...", { id: "saju-loading" });
        const freeRes = await fetch("/api/orders/free-confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId }),
        });
        const freeJson = await freeRes.json();
        toast.dismiss("saju-loading");
        if (!freeRes.ok)
          throw new Error(
            (freeJson.error ?? "분석 실패") +
              (freeJson.detail ? `: ${freeJson.detail}` : "")
          );
        router.push(`/results/${freeJson.resultId}`);
      } else {
        router.push(`/checkout/${orderId}`);
      }
    } catch (err) {
      toast.dismiss("saju-loading");
      toast.error(err instanceof Error ? err.message : "오류가 발생했습니다");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">

      {/* ── 상품 선택 ── */}
      {sajuProducts.length > 0 && (
        <section className="space-y-3">
          <p className="text-[11px] font-semibold tracking-widest text-[#888] uppercase">
            분석 상품 선택
          </p>
          <div className="flex flex-col gap-2">
            {sajuProducts.map((p) => {
              const selected = p.slug === productSlug;
              return (
                <button
                  key={p.slug}
                  type="button"
                  onClick={() => {
                    if (!selected) router.push(`/products/${p.slug}`);
                  }}
                  className={`flex items-center justify-between px-4 py-3.5 rounded-xl border text-sm font-medium transition-all text-left ${
                    selected
                      ? "border-[#2D5C5C] bg-[#2D5C5C]/5 text-[#2D5C5C] ring-1 ring-[#2D5C5C]/20"
                      : "border-[#e0dbd0] text-[#4a4a6a] hover:border-[#2D5C5C]/50 bg-white"
                  }`}
                >
                  <span>{p.name}</span>
                  <span
                    className={`text-xs font-mono tabular-nums ${
                      selected ? "text-[#2D5C5C] font-semibold" : "text-[#aaa]"
                    }`}
                  >
                    {p.price === 0 ? "무료" : formatKRW(p.price)}
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* ── 이름 ── */}
      <section className="space-y-2">
        <label
          htmlFor="saju-name"
          className="text-[11px] font-semibold tracking-widest text-[#888] uppercase"
        >
          이름 <span className="normal-case font-normal">(선택)</span>
        </label>
        <input
          id="saju-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="홍길동"
          className="w-full h-12 px-4 rounded-xl border border-[#e0dbd0] bg-white text-[#1a1730] text-sm placeholder:text-[#ccc] focus:outline-none focus:border-[#2D5C5C] focus:ring-1 focus:ring-[#2D5C5C]/20 transition-colors"
        />
      </section>

      {/* ── 생년월일 ── */}
      <section className="space-y-3">
        <p className="text-[11px] font-semibold tracking-widest text-[#888] uppercase">
          생년월일
        </p>
        <div className="flex gap-2 items-center">
          <div className="flex-1 flex flex-col gap-0.5">
            <input
              type="number"
              placeholder="년도"
              min={1900}
              max={new Date().getFullYear()}
              value={birthYear}
              onChange={(e) => setBirthYear(e.target.value)}
              className="w-full h-12 px-3 rounded-xl border border-[#e0dbd0] bg-white text-[#1a1730] text-sm text-center placeholder:text-[#ccc] focus:outline-none focus:border-[#2D5C5C] focus:ring-1 focus:ring-[#2D5C5C]/20 transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            <span className="text-[10px] text-center text-[#bbb]">년</span>
          </div>
          <div className="flex flex-col gap-0.5 w-16">
            <input
              type="number"
              placeholder="월"
              min={1}
              max={12}
              value={birthMonth}
              onChange={(e) => setBirthMonth(e.target.value)}
              className="w-full h-12 px-2 rounded-xl border border-[#e0dbd0] bg-white text-[#1a1730] text-sm text-center placeholder:text-[#ccc] focus:outline-none focus:border-[#2D5C5C] focus:ring-1 focus:ring-[#2D5C5C]/20 transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            <span className="text-[10px] text-center text-[#bbb]">월</span>
          </div>
          <div className="flex flex-col gap-0.5 w-16">
            <input
              type="number"
              placeholder="일"
              min={1}
              max={31}
              value={birthDay}
              onChange={(e) => setBirthDay(e.target.value)}
              className="w-full h-12 px-2 rounded-xl border border-[#e0dbd0] bg-white text-[#1a1730] text-sm text-center placeholder:text-[#ccc] focus:outline-none focus:border-[#2D5C5C] focus:ring-1 focus:ring-[#2D5C5C]/20 transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            <span className="text-[10px] text-center text-[#bbb]">일</span>
          </div>
        </div>
      </section>

      {/* ── 출생 시각 ── */}
      <section className="space-y-3">
        <p className="text-[11px] font-semibold tracking-widest text-[#888] uppercase">
          출생 시각
        </p>
        <input
          type="time"
          value={birthTime}
          onChange={(e) => setBirthTime(e.target.value)}
          disabled={timeUnknown}
          className="w-full h-12 px-4 rounded-xl border border-[#e0dbd0] bg-white text-[#1a1730] text-sm focus:outline-none focus:border-[#2D5C5C] focus:ring-1 focus:ring-[#2D5C5C]/20 transition-colors disabled:opacity-40 disabled:bg-[#f8f5ef]"
        />
        <label className="flex items-center gap-2.5 text-sm text-[#888] cursor-pointer select-none">
          <input
            type="checkbox"
            checked={timeUnknown}
            onChange={(e) => setTimeUnknown(e.target.checked)}
            className="w-4 h-4 rounded accent-[#2D5C5C] cursor-pointer"
          />
          출생 시각을 모릅니다
        </label>
      </section>

      {/* ── 성별 + 달력 ── */}
      <div className="grid grid-cols-2 gap-4">
        <section className="space-y-3">
          <p className="text-[11px] font-semibold tracking-widest text-[#888] uppercase">
            성별
          </p>
          <div className="flex gap-2">
            {(["male", "female"] as const).map((g) => (
              <button
                type="button"
                key={g}
                onClick={() => setGender(g)}
                className={`flex-1 h-12 rounded-xl border text-sm font-medium transition-all ${
                  gender === g
                    ? "border-[#2D5C5C] bg-[#2D5C5C] text-white shadow-sm"
                    : "border-[#e0dbd0] text-[#4a4a6a] bg-white hover:border-[#2D5C5C]/50"
                }`}
              >
                {g === "male" ? "남성" : "여성"}
              </button>
            ))}
          </div>
        </section>

        <section className="space-y-3">
          <p className="text-[11px] font-semibold tracking-widest text-[#888] uppercase">
            달력
          </p>
          <div className="flex gap-2">
            {(["solar", "lunar"] as const).map((c) => (
              <button
                type="button"
                key={c}
                onClick={() => setCalendar(c)}
                className={`flex-1 h-12 rounded-xl border text-sm font-medium transition-all ${
                  calendar === c
                    ? "border-[#2D5C5C] bg-[#2D5C5C] text-white shadow-sm"
                    : "border-[#e0dbd0] text-[#4a4a6a] bg-white hover:border-[#2D5C5C]/50"
                }`}
              >
                {c === "solar" ? "양력" : "음력"}
              </button>
            ))}
          </div>
        </section>
      </div>

      {/* ── 제출 ── */}
      {isLoggedIn ? (
        <button
          type="submit"
          disabled={submitting}
          className="w-full h-14 rounded-xl bg-[#2D5C5C] text-white text-base font-semibold hover:bg-[#245050] active:scale-[0.99] transition-all disabled:opacity-60 mt-2"
        >
          {submitting
            ? isFree
              ? "분석 중..."
              : "주문 생성 중..."
            : isFree
            ? "무료로 분석받기 →"
            : "결제하러 가기 →"}
        </button>
      ) : (
        <div className="space-y-2 mt-2">
          <Link
            href={`/login?redirect=${encodeURIComponent(`/products/${productSlug}`)}`}
            className="w-full h-14 rounded-xl bg-[#2D5C5C] text-white text-base font-semibold hover:bg-[#245050] transition-colors flex items-center justify-center"
          >
            {isFree ? "로그인하고 무료로 보기 →" : "로그인하고 결제하기 →"}
          </Link>
          <p className="text-xs text-[#888] text-center">
            결과는 로그인 후{" "}
            <Link href="/mypage" className="underline text-[#2D5C5C]">
              마이페이지
            </Link>
            에서 확인할 수 있어요.
          </p>
        </div>
      )}
    </form>
  );
}
