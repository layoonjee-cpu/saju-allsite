"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

// ── 타입 ──────────────────────────────────────────────────
type PersonInfo = {
  name: string;
  birthYear: string;
  birthMonth: string;
  birthDay: string;
  birthTime: string;
  timeUnknown: boolean;
  gender: "male" | "female";
  calendar: "solar" | "lunar";
};

const defaultPerson = (gender: "male" | "female" = "male"): PersonInfo => ({
  name: "",
  birthYear: "",
  birthMonth: "",
  birthDay: "",
  birthTime: "",
  timeUnknown: false,
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
  if (m < 1 || m > 12) return `${label}의 올바른 월을 입력해 주세요 (1~12)`;
  if (d < 1 || d > 31) return `${label}의 올바른 일을 입력해 주세요 (1~31)`;
  return null;
}

// ── 1인 섹션 컴포넌트 ────────────────────────────────────
type PersonSectionProps = {
  title: string;
  accentClass: string;
  value: PersonInfo;
  onChange: (v: PersonInfo) => void;
};

function PersonSection({ title, accentClass, value: p, onChange }: PersonSectionProps) {
  const set = <K extends keyof PersonInfo>(key: K, val: PersonInfo[K]) =>
    onChange({ ...p, [key]: val });

  return (
    <div className={`rounded-2xl border-2 ${accentClass} p-5 space-y-4`}>
      <h3 className="text-[15px] font-bold text-ink">{title}</h3>

      {/* 이름 */}
      <div className="space-y-1.5">
        <Label>이름 (선택)</Label>
        <Input
          value={p.name}
          onChange={(e) => set("name", e.target.value)}
          placeholder="홍길동"
          className="h-11"
        />
      </div>

      {/* 생년월일 + 출생시각 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>생년월일</Label>
          <div className="flex gap-1.5 items-center">
            <Input
              type="number"
              placeholder="년도"
              min={1900}
              max={new Date().getFullYear()}
              value={p.birthYear}
              onChange={(e) => set("birthYear", e.target.value)}
              className="flex-1 text-center h-11 text-base"
            />
            <span className="text-sm text-muted-foreground shrink-0">/</span>
            <Input
              type="number"
              placeholder="월"
              min={1}
              max={12}
              value={p.birthMonth}
              onChange={(e) => set("birthMonth", e.target.value)}
              className="w-14 text-center h-11 text-base"
            />
            <span className="text-sm text-muted-foreground shrink-0">/</span>
            <Input
              type="number"
              placeholder="일"
              min={1}
              max={31}
              value={p.birthDay}
              onChange={(e) => set("birthDay", e.target.value)}
              className="w-14 text-center h-11 text-base"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>출생 시각</Label>
          <Input
            type="time"
            value={p.birthTime}
            onChange={(e) => set("birthTime", e.target.value)}
            disabled={p.timeUnknown}
            className="h-11"
          />
          <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
            <input
              type="checkbox"
              checked={p.timeUnknown}
              onChange={(e) => set("timeUnknown", e.target.checked)}
              className="w-4 h-4"
            />
            시간을 모릅니다
          </label>
        </div>
      </div>

      {/* 성별 + 달력 */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>성별</Label>
          <div className="flex gap-2">
            {(["male", "female"] as const).map((g) => (
              <button
                type="button"
                key={g}
                onClick={() => set("gender", g)}
                className={`flex-1 h-11 rounded-full border text-[14px] font-medium transition-colors ${
                  p.gender === g
                    ? "border-ink bg-ink text-canvas"
                    : "border-hairline text-ink hover:border-ink"
                }`}
              >
                {g === "male" ? "남성" : "여성"}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>달력</Label>
          <div className="flex gap-2">
            {(["solar", "lunar"] as const).map((c) => (
              <button
                type="button"
                key={c}
                onClick={() => set("calendar", c)}
                className={`flex-1 h-11 rounded-full border text-[14px] font-medium transition-colors ${
                  p.calendar === c
                    ? "border-ink bg-ink text-canvas"
                    : "border-hairline text-ink hover:border-ink"
                }`}
              >
                {c === "solar" ? "양력" : "음력"}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── 메인 폼 ───────────────────────────────────────────────
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
  const [concerns, setConcerns] = useState("");
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

    setSubmitting(true);
    try {
      const createRes = await fetch("/api/orders/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          // 나
          name: person.name || undefined,
          birthDate: makeBirthDate(person),
          birthTime: person.timeUnknown ? null : person.birthTime || null,
          timeUnknown: person.timeUnknown,
          gender: person.gender,
          calendar: person.calendar,
          concerns: concerns.trim() ? [concerns.trim()] : [],
          // 상대방
          partnerName: partner.name || undefined,
          partnerBirthDate: makeBirthDate(partner),
          partnerBirthTime: partner.timeUnknown ? null : partner.birthTime || null,
          partnerTimeUnknown: partner.timeUnknown,
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
    <form onSubmit={handleSubmit} className="space-y-5">

      {/* 안내 문구 */}
      <div className="rounded-xl bg-rose-50/70 border border-rose-200/60 px-4 py-3">
        <p className="text-[13px] text-rose-800/90 leading-snug">
          💕 두 사람의 사주 기본 정보를 입력하시면, 합충형해파 분석 · 궁합 · 갈등 해결 방안까지
          한 번에 풀어드립니다.
        </p>
      </div>

      {/* 나의 정보 */}
      <PersonSection
        title="💙 나의 정보"
        accentClass="border-blue-200/80"
        value={person}
        onChange={setPerson}
      />

      {/* 구분선 */}
      <div className="flex items-center gap-3 py-1">
        <div className="flex-1 h-px bg-hairline" />
        <span className="text-2xl leading-none select-none">♥</span>
        <div className="flex-1 h-px bg-hairline" />
      </div>

      {/* 상대방 정보 */}
      <PersonSection
        title="🩷 상대방 정보"
        accentClass="border-rose-200/80"
        value={partner}
        onChange={setPartner}
      />

      {/* 궁금한 점 / 고민 */}
      <div className="space-y-1.5">
        <Label>궁금한 점 · 고민 (선택)</Label>
        <textarea
          value={concerns}
          onChange={(e) => setConcerns(e.target.value.slice(0, 200))}
          placeholder="예: 이 사람과 결혼해도 될까요? 자꾸 같은 패턴으로 다투는 이유가 뭔가요?"
          rows={3}
          className="w-full resize-none rounded-xl border border-input bg-background px-4 py-3 text-[14px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-shadow leading-relaxed"
        />
        <p className="text-xs text-muted-foreground text-right">{concerns.length} / 200</p>
      </div>

      {/* 버튼 */}
      {isLoggedIn ? (
        <Button type="submit" size="lg" className="w-full" disabled={submitting}>
          {submitting
            ? "주문 생성 중..."
            : `결제하고 궁합 풀이 받기 ₩${productPrice.toLocaleString()}`}
        </Button>
      ) : (
        <div className="space-y-2">
          <Link
            href={`/login?redirect=${encodeURIComponent(`/products/${productSlug}`)}`}
            className={cn(buttonVariants({ size: "lg" }), "w-full")}
          >
            로그인하고 궁합 풀이 받기
          </Link>
          <p className="text-xs text-body text-center">
            결과는 로그인 후 <span className="text-ink">마이페이지</span>에서 확인할 수 있어요.
          </p>
        </div>
      )}
    </form>
  );
}
