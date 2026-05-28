"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { formatKRW } from "@/lib/utils";

// 12 시진 + 모름 (SajuForm과 동일)
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

type PersonInfo = {
  name: string;
  birthYear: string;
  birthMonth: string;
  birthDay: string;
  selectedSiju: string;
  gender: "male" | "female";
  calendar: "solar" | "lunar";
};

const defaultPerson = (gender: "male" | "female" = "male"): PersonInfo => ({
  name: "",
  birthYear: "",
  birthMonth: "",
  birthDay: "",
  selectedSiju: "unknown",
  gender,
  calendar: "solar",
});

function validatePerson(p: PersonInfo, label: string): string | null {
  if (!p.birthYear || !p.birthMonth || !p.birthDay)
    return `${label}의 생년월일을 모두 입력해 주세요`;
  const y = parseInt(p.birthYear);
  const m = parseInt(p.birthMonth);
  const d = parseInt(p.birthDay);
  if (y < 1900 || y > new Date().getFullYear())
    return `${label}의 올바른 년도를 입력해 주세요`;
  if (m < 1 || m > 12) return `${label}의 올바른 월을 입력해 주세요`;
  if (d < 1 || d > 31) return `${label}의 올바른 일을 입력해 주세요`;
  return null;
}

// ── 1인 정보 섹션 ────────────────────────────────────────────
type PersonSectionProps = {
  title: string;
  borderColor: string;
  bgColor: string;
  value: PersonInfo;
  onChange: (v: PersonInfo) => void;
};

function PersonSection({ title, borderColor, bgColor, value: p, onChange }: PersonSectionProps) {
  const set = <K extends keyof PersonInfo>(key: K, val: PersonInfo[K]) =>
    onChange({ ...p, [key]: val });

  return (
    <div className={`rounded-2xl border-2 ${borderColor} ${bgColor} p-5 space-y-5`}>
      <h3 className="text-base font-bold text-[#1a1730]">{title}</h3>

      {/* 성별 */}
      <div className="space-y-2">
        <p className="text-sm font-bold text-[#1a1730]">성별 <span className="text-red-500">*</span></p>
        <div className="flex gap-4">
          {(["male", "female"] as const).map((g) => (
            <label key={g} className="flex items-center gap-2 cursor-pointer select-none">
              <span
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                  p.gender === g ? "border-[#E91E8C]" : "border-[#ccc]"
                }`}
                onClick={() => set("gender", g)}
              >
                {p.gender === g && (
                  <span className="w-2.5 h-2.5 rounded-full bg-[#E91E8C] block" />
                )}
              </span>
              <span
                className={`text-sm font-medium ${p.gender === g ? "text-[#1a1730]" : "text-[#888]"}`}
                onClick={() => set("gender", g)}
              >
                {g === "male" ? "남성" : "여성"}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* 이름 */}
      <div className="space-y-2">
        <label className="text-sm font-bold text-[#1a1730] block">
          이름 <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={p.name}
          onChange={(e) => set("name", e.target.value)}
          placeholder="이름을 입력해 주세요"
          className="w-full h-12 px-4 rounded-xl border border-[#ddd] bg-white text-[#1a1730] text-sm placeholder:text-[#bbb] focus:outline-none focus:border-[#2D5C5C] focus:ring-2 focus:ring-[#2D5C5C]/15 transition-colors"
        />
      </div>

      {/* 생년월일 */}
      <div className="space-y-2">
        <p className="text-sm font-bold text-[#1a1730]">
          생년월일 <span className="text-red-500">*</span>
        </p>
        <div className="grid grid-cols-3 gap-2">
          <div className="relative">
            <select
              value={p.birthYear}
              onChange={(e) => set("birthYear", e.target.value)}
              className="w-full h-12 pl-3 pr-8 rounded-xl border border-[#ddd] bg-white text-[#1a1730] text-sm appearance-none focus:outline-none focus:border-[#2D5C5C] focus:ring-2 focus:ring-[#2D5C5C]/15 transition-colors"
            >
              <option value="">년도</option>
              {Array.from({ length: new Date().getFullYear() - 1900 + 1 }, (_, i) => {
                const y = new Date().getFullYear() - i;
                return <option key={y} value={String(y)}>{y}년</option>;
              })}
            </select>
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#999] text-xs">▼</span>
          </div>
          <div className="relative">
            <select
              value={p.birthMonth}
              onChange={(e) => set("birthMonth", e.target.value)}
              className="w-full h-12 pl-3 pr-8 rounded-xl border border-[#ddd] bg-white text-[#1a1730] text-sm appearance-none focus:outline-none focus:border-[#2D5C5C] focus:ring-2 focus:ring-[#2D5C5C]/15 transition-colors"
            >
              <option value="">월</option>
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <option key={m} value={String(m)}>{m}월</option>
              ))}
            </select>
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#999] text-xs">▼</span>
          </div>
          <div className="relative">
            <select
              value={p.birthDay}
              onChange={(e) => set("birthDay", e.target.value)}
              className="w-full h-12 pl-3 pr-8 rounded-xl border border-[#ddd] bg-white text-[#1a1730] text-sm appearance-none focus:outline-none focus:border-[#2D5C5C] focus:ring-2 focus:ring-[#2D5C5C]/15 transition-colors"
            >
              <option value="">일</option>
              {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                <option key={d} value={String(d)}>{d}일</option>
              ))}
            </select>
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#999] text-xs">▼</span>
          </div>
        </div>
      </div>

      {/* 달력 */}
      <div className="space-y-2">
        <p className="text-sm font-bold text-[#1a1730]">달력 <span className="text-red-500">*</span></p>
        <div className="flex gap-4">
          {(["solar", "lunar"] as const).map((c) => (
            <label key={c} className="flex items-center gap-2 cursor-pointer select-none">
              <span
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                  p.calendar === c ? "border-[#E91E8C]" : "border-[#ccc]"
                }`}
                onClick={() => set("calendar", c)}
              >
                {p.calendar === c && (
                  <span className="w-2.5 h-2.5 rounded-full bg-[#E91E8C] block" />
                )}
              </span>
              <span
                className={`text-sm font-medium ${p.calendar === c ? "text-[#1a1730]" : "text-[#888]"}`}
                onClick={() => set("calendar", c)}
              >
                {c === "solar" ? "양력" : "음력"}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* 태어난 시간 (시주) */}
      <div className="space-y-2">
        <label className="text-sm font-bold text-[#1a1730] block">
          태어난 시간 (시주) <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <select
            value={p.selectedSiju}
            onChange={(e) => set("selectedSiju", e.target.value)}
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
    </div>
  );
}

// ── 메인 폼 ───────────────────────────────────────────────────
type Props = {
  productId: string;
  productSlug: string;
  productPrice: number;
  isLoggedIn: boolean;
};

export function LoveForm({ productId, productSlug, productPrice, isLoggedIn }: Props) {
  const router = useRouter();
  const [person, setPerson] = useState<PersonInfo>(defaultPerson("male"));
  const [partner, setPartner] = useState<PersonInfo>(defaultPerson("female"));
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function makeBirthDate(p: PersonInfo) {
    return `${String(parseInt(p.birthYear))}-${String(parseInt(p.birthMonth)).padStart(2, "0")}-${String(parseInt(p.birthDay)).padStart(2, "0")}`;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const errA = validatePerson(person, "내");
    if (errA) { toast.error(errA); return; }
    const errB = validatePerson(partner, "상대방");
    if (errB) { toast.error(errB); return; }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("올바른 이메일 형식을 입력해 주세요");
      return;
    }

    setSubmitting(true);
    try {
      const createRes = await fetch("/api/orders/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          name: person.name || undefined,
          birthDate: makeBirthDate(person),
          birthTime: person.selectedSiju === "unknown" ? null : person.selectedSiju,
          timeUnknown: person.selectedSiju === "unknown",
          gender: person.gender,
          calendar: person.calendar,
          concerns: [],
          customerEmail: email || null,
          // 상대방
          partnerName: partner.name || undefined,
          partnerBirthDate: makeBirthDate(partner),
          partnerBirthTime: partner.selectedSiju === "unknown" ? null : partner.selectedSiju,
          partnerTimeUnknown: partner.selectedSiju === "unknown",
          partnerGender: partner.gender,
          partnerCalendar: partner.calendar,
        }),
      });
      const createJson = await createRes.json();
      if (!createRes.ok) throw new Error(createJson.error ?? "주문 생성 실패");

      const { orderId } = createJson;
      router.push(`/checkout/${orderId}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "오류가 발생했습니다");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">

      {/* 신청 상품 */}
      <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-[#2D5C5C]/8 border border-[#2D5C5C]/25">
        <div>
          <p className="text-[11px] text-[#2D5C5C] font-semibold tracking-wider uppercase mb-0.5">신청 상품</p>
          <p className="text-sm font-semibold text-[#1a1730]">연인의 시선 (궁합)</p>
        </div>
        <span className="text-sm font-mono font-bold text-[#2D5C5C]">{formatKRW(productPrice)}</span>
      </div>

      {/* 안내 */}
      <div className="rounded-xl bg-rose-50 border border-rose-200/60 px-4 py-3">
        <p className="text-[13px] text-rose-800/90 leading-snug">
          💕 두 사람의 생년월일을 입력하시면 합충형해파 분석 · 궁합 · 갈등 해결 방안까지 한 번에 풀어드립니다.
        </p>
      </div>

      {/* 나의 정보 */}
      <PersonSection
        title="💙 나의 정보"
        borderColor="border-blue-200"
        bgColor="bg-blue-50/30"
        value={person}
        onChange={setPerson}
      />

      {/* 구분선 */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-[#e8e4dd]" />
        <span className="text-2xl leading-none select-none">♥</span>
        <div className="flex-1 h-px bg-[#e8e4dd]" />
      </div>

      {/* 상대방 정보 */}
      <PersonSection
        title="🩷 상대방 정보"
        borderColor="border-rose-200"
        bgColor="bg-rose-50/30"
        value={partner}
        onChange={setPartner}
      />

      {/* 이메일 (공통 1개) */}
      <div className="space-y-2">
        <label htmlFor="love-email" className="text-sm font-bold text-[#1a1730] block">
          이메일(선택){" "}
          <span className="text-xs font-normal text-[#888]">*입력안하셔도 사주분석 진행됩니다. 향후 분석지 미수령시 발송용</span>
        </label>
        <input
          id="love-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="example@email.com"
          className="w-full h-12 px-4 rounded-xl border border-[#ddd] bg-white text-[#1a1730] text-sm placeholder:text-[#bbb] focus:outline-none focus:border-[#2D5C5C] focus:ring-2 focus:ring-[#2D5C5C]/15 transition-colors"
        />
      </div>

      {/* 버튼 */}
      {isLoggedIn ? (
        <button
          type="submit"
          disabled={submitting}
          className="w-full h-14 rounded-xl bg-[#2D5C5C] text-white text-base font-bold hover:bg-[#245050] active:scale-[0.99] transition-all disabled:opacity-60 tracking-wide"
        >
          {submitting ? "주문 생성 중..." : `결제하러 가기 → ${formatKRW(productPrice)}`}
        </button>
      ) : (
        <div className="space-y-2">
          <Link
            href={`/login?redirect=${encodeURIComponent(`/products/${productSlug}`)}`}
            className="w-full h-14 rounded-xl bg-[#2D5C5C] text-white text-base font-bold hover:bg-[#245050] transition-colors flex items-center justify-center tracking-wide"
          >
            로그인하고 결제하기 →
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
