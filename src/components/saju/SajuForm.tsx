"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { formatKRW } from "@/lib/utils";

// 12 시진 + 모름
const SIJU_OPTIONS = [
  { label: "모름 / 선택 안함", value: "unknown" },
  { label: "자시 (子時)  23:30 ~ 01:29", value: "00:00" },
  { label: "축시 (丑時)  01:30 ~ 03:29", value: "02:00" },
  { label: "인시 (寅時)  03:30 ~ 05:29", value: "04:00" },
  { label: "묘시 (卯時)  05:30 ~ 07:29", value: "06:00" },
  { label: "진시 (辰時)  07:30 ~ 09:29", value: "08:00" },
  { label: "사시 (巳時)  09:30 ~ 11:29", value: "10:00" },
  { label: "오시 (午時)  11:30 ~ 13:29", value: "12:00" },
  { label: "미시 (未時)  13:30 ~ 15:29", value: "14:00" },
  { label: "신시 (申時)  15:30 ~ 17:29", value: "16:00" },
  { label: "유시 (酉時)  17:30 ~ 19:29", value: "18:00" },
  { label: "술시 (戌時)  19:30 ~ 21:29", value: "20:00" },
  { label: "해시 (亥時)  21:30 ~ 23:29", value: "22:00" },
];

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
  const [selectedSiju, setSelectedSiju] = useState("unknown"); // "unknown" or "HH:MM"
  const [gender, setGender] = useState<"male" | "female">("female");
  const [calendar, setCalendar] = useState<"solar" | "lunar">("solar");
  const [deliveryMethod, setDeliveryMethod] = useState<"email" | "kakao">("email");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // 현재 상품 이름 (상품 선택 목록이 있으면 찾아서 표시)
  const currentProduct = products?.find((p) => p.slug === productSlug);
  const currentProductName = currentProduct?.name ?? productSlug;

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
    if (deliveryMethod === "email" && !email) {
      toast.error("이메일 수령을 선택하셨습니다. 이메일 주소를 입력해 주세요");
      return;
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("올바른 이메일 형식을 입력해 주세요");
      return;
    }

    const birthDate = `${String(y)}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    const timeUnknown = selectedSiju === "unknown";
    const birthTime = timeUnknown ? null : selectedSiju;

    setSubmitting(true);
    try {
      const createRes = await fetch("/api/orders/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          name,
          birthDate,
          birthTime,
          timeUnknown,
          gender,
          calendar,
          concerns: [],
          customerEmail: isFree ? null : (email || null),
          deliveryMethod: isFree ? "web" : deliveryMethod,
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

      {/* ── 신청 상품 (읽기 전용) ── */}
      <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-[#2D5C5C]/8 border border-[#2D5C5C]/25">
        <div>
          <p className="text-[11px] text-[#2D5C5C] font-semibold tracking-wider uppercase mb-0.5">신청 상품</p>
          <p className="text-sm font-semibold text-[#1a1730]">{currentProductName}</p>
        </div>
        <span className="text-sm font-mono font-bold text-[#2D5C5C]">
          {productPrice === 0 ? "무료" : formatKRW(productPrice)}
        </span>
      </div>

      {/* ── 성별 ── */}
      <div className="space-y-2">
        <p className="text-sm font-bold text-[#1a1730]">성별 <span className="text-red-500">*</span></p>
        <div className="flex gap-3">
          {(["male", "female"] as const).map((g) => (
            <label key={g} className="flex items-center gap-2 cursor-pointer select-none">
              <span
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                  gender === g ? "border-[#E91E8C]" : "border-[#ccc]"
                }`}
                onClick={() => setGender(g)}
              >
                {gender === g && (
                  <span className="w-2.5 h-2.5 rounded-full bg-[#E91E8C] block" />
                )}
              </span>
              <span
                className={`text-sm font-medium ${gender === g ? "text-[#1a1730]" : "text-[#888]"}`}
                onClick={() => setGender(g)}
              >
                {g === "male" ? "남성" : "여성"}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* ── 이름 ── */}
      <div className="space-y-2">
        <label htmlFor="saju-name" className="text-sm font-bold text-[#1a1730] block">
          이름 <span className="text-red-500">*</span>
        </label>
        <input
          id="saju-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="이름을 입력해 주세요"
          className="w-full h-12 px-4 rounded-xl border border-[#ddd] bg-white text-[#1a1730] text-sm placeholder:text-[#bbb] focus:outline-none focus:border-[#2D5C5C] focus:ring-2 focus:ring-[#2D5C5C]/15 transition-colors"
        />
      </div>

      {/* ── 생년월일 ── */}
      <div className="space-y-2">
        <p className="text-sm font-bold text-[#1a1730]">
          생년월일 <span className="text-red-500">*</span>
        </p>
        <div className="grid grid-cols-3 gap-2">
          <div className="relative">
            <select
              value={birthYear}
              onChange={(e) => setBirthYear(e.target.value)}
              className="w-full h-12 pl-3 pr-8 rounded-xl border border-[#ddd] bg-white text-[#1a1730] text-sm appearance-none focus:outline-none focus:border-[#2D5C5C] focus:ring-2 focus:ring-[#2D5C5C]/15 transition-colors"
            >
              <option value="">년도</option>
              {Array.from({ length: new Date().getFullYear() - 1900 + 1 }, (_, i) => {
                const y = new Date().getFullYear() - i;
                return (
                  <option key={y} value={String(y)}>
                    {y}년
                  </option>
                );
              })}
            </select>
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#999] text-xs">▼</span>
          </div>
          <div className="relative">
            <select
              value={birthMonth}
              onChange={(e) => setBirthMonth(e.target.value)}
              className="w-full h-12 pl-3 pr-8 rounded-xl border border-[#ddd] bg-white text-[#1a1730] text-sm appearance-none focus:outline-none focus:border-[#2D5C5C] focus:ring-2 focus:ring-[#2D5C5C]/15 transition-colors"
            >
              <option value="">월</option>
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <option key={m} value={String(m)}>
                  {m}월
                </option>
              ))}
            </select>
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#999] text-xs">▼</span>
          </div>
          <div className="relative">
            <select
              value={birthDay}
              onChange={(e) => setBirthDay(e.target.value)}
              className="w-full h-12 pl-3 pr-8 rounded-xl border border-[#ddd] bg-white text-[#1a1730] text-sm appearance-none focus:outline-none focus:border-[#2D5C5C] focus:ring-2 focus:ring-[#2D5C5C]/15 transition-colors"
            >
              <option value="">일</option>
              {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                <option key={d} value={String(d)}>
                  {d}일
                </option>
              ))}
            </select>
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#999] text-xs">▼</span>
          </div>
        </div>
      </div>

      {/* ── 달력 ── */}
      <div className="space-y-2">
        <p className="text-sm font-bold text-[#1a1730]">달력 <span className="text-red-500">*</span></p>
        <div className="flex gap-4">
          {(["solar", "lunar"] as const).map((c) => (
            <label key={c} className="flex items-center gap-2 cursor-pointer select-none">
              <span
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                  calendar === c ? "border-[#E91E8C]" : "border-[#ccc]"
                }`}
                onClick={() => setCalendar(c)}
              >
                {calendar === c && (
                  <span className="w-2.5 h-2.5 rounded-full bg-[#E91E8C] block" />
                )}
              </span>
              <span
                className={`text-sm font-medium ${calendar === c ? "text-[#1a1730]" : "text-[#888]"}`}
                onClick={() => setCalendar(c)}
              >
                {c === "solar" ? "양력" : "음력"}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* ── 태어난 시간 (시주) ── */}
      <div className="space-y-2">
        <label htmlFor="saju-siju" className="text-sm font-bold text-[#1a1730] block">
          태어난 시간 (시주) <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <select
            id="saju-siju"
            value={selectedSiju}
            onChange={(e) => setSelectedSiju(e.target.value)}
            className="w-full h-12 pl-4 pr-10 rounded-xl border border-[#ddd] bg-white text-[#1a1730] text-sm appearance-none focus:outline-none focus:border-[#2D5C5C] focus:ring-2 focus:ring-[#2D5C5C]/15 transition-colors"
          >
            {SIJU_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[#999] text-xs">▼</span>
        </div>
      </div>

      {/* ── 분석지 수령 방법 (유료 상품만) ── */}
      {!isFree && (
        <section className="space-y-3">
          <p className="text-sm font-bold text-[#1a1730]">
            분석지 받기 <span className="text-red-500">*</span>
          </p>
          <div className="grid grid-cols-2 gap-2">
            {/* 이메일로 받기 */}
            <button
              type="button"
              onClick={() => setDeliveryMethod("email")}
              className={`flex flex-col items-center gap-1.5 py-4 px-3 rounded-xl border-2 text-sm font-semibold transition-all ${
                deliveryMethod === "email"
                  ? "border-[#2D5C5C] bg-[#2D5C5C]/5 text-[#2D5C5C]"
                  : "border-[#e0dbd0] text-[#888] hover:border-[#2D5C5C]/40"
              }`}
            >
              <span className="text-xl">📧</span>
              <span>이메일로 받기</span>
            </button>
            {/* 카톡으로 받기 */}
            <button
              type="button"
              onClick={() => setDeliveryMethod("kakao")}
              className={`flex flex-col items-center gap-1.5 py-4 px-3 rounded-xl border-2 text-sm font-semibold transition-all ${
                deliveryMethod === "kakao"
                  ? "border-[#F9E000] bg-[#FEE500]/10 text-[#1a1730]"
                  : "border-[#e0dbd0] text-[#888] hover:border-[#F9E000]/60"
              }`}
            >
              <span className="text-xl">💬</span>
              <span>카톡으로 받기</span>
            </button>
          </div>

          {/* 이메일 선택 시 */}
          {deliveryMethod === "email" && (
            <div className="space-y-2 pt-1">
              <label htmlFor="saju-email" className="text-sm font-bold text-[#1a1730] block">
                이메일 주소 <span className="text-red-500">*</span>
              </label>
              <input
                id="saju-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@email.com"
                className="w-full h-12 px-4 rounded-xl border border-[#ddd] bg-white text-[#1a1730] text-sm placeholder:text-[#bbb] focus:outline-none focus:border-[#2D5C5C] focus:ring-2 focus:ring-[#2D5C5C]/15 transition-colors"
              />
              <p className="text-xs text-[#888]">결제 완료 후 입력하신 이메일로 분석지를 발송해 드립니다.</p>
            </div>
          )}

          {/* 카톡 선택 시 */}
          {deliveryMethod === "kakao" && (
            <div className="rounded-xl bg-[#FEE500]/20 border border-[#F9E000]/60 px-4 py-3">
              <p className="text-xs text-[#1a1730] leading-relaxed">
                💬 결제 완료 후 <strong>카카오채널을 추가</strong>하신 뒤, 이름과 신청 상품명을 보내주시면 분석지를 카카오톡으로 보내드립니다.
              </p>
            </div>
          )}
        </section>
      )}

      {/* ── 제출 버튼 ── */}
      {isLoggedIn ? (
        <button
          type="submit"
          disabled={submitting}
          className="w-full h-14 rounded-xl bg-[#2D5C5C] text-white text-base font-bold hover:bg-[#245050] active:scale-[0.99] transition-all disabled:opacity-60 mt-2 tracking-wide"
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
            className="w-full h-14 rounded-xl bg-[#2D5C5C] text-white text-base font-bold hover:bg-[#245050] transition-colors flex items-center justify-center tracking-wide"
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
