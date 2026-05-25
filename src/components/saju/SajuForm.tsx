"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type Props = {
  productId: string;
  productSlug: string;
  productPrice: number;
  isLoggedIn: boolean;
};


export function SajuForm({ productId, productSlug, productPrice, isLoggedIn }: Props) {
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
      // 1단계: 주문 생성
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
        // 무료 상품: 결제 스킵, 바로 생성
        toast.loading("사주를 분석하고 있어요...", { id: "saju-loading" });
        const freeRes = await fetch("/api/orders/free-confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId }),
        });
        const freeJson = await freeRes.json();
        toast.dismiss("saju-loading");
        if (!freeRes.ok) throw new Error((freeJson.error ?? "분석 실패") + (freeJson.detail ? `: ${freeJson.detail}` : ""));
        router.push(`/results/${freeJson.resultId}`);
      } else {
        // 유료 상품: 결제 페이지로 이동
        router.push(`/checkout/${orderId}`);
      }
    } catch (err) {
      toast.dismiss("saju-loading");
      toast.error(err instanceof Error ? err.message : "오류가 발생했습니다");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="name">이름 (선택)</Label>
        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="홍길동" />
      </div>

      {/* 생년월일 + 출생시각 — 모바일 1열 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>생년월일</Label>
          <div className="flex gap-1.5 items-center">
            <Input
              id="birthYear"
              type="number"
              placeholder="년도"
              min={1900}
              max={new Date().getFullYear()}
              value={birthYear}
              onChange={(e) => setBirthYear(e.target.value)}
              className="flex-1 text-center text-base h-12"
            />
            <span className="text-sm text-muted-foreground shrink-0">/</span>
            <Input
              id="birthMonth"
              type="number"
              placeholder="월"
              min={1}
              max={12}
              value={birthMonth}
              onChange={(e) => setBirthMonth(e.target.value)}
              className="w-16 text-center text-base h-12"
            />
            <span className="text-sm text-muted-foreground shrink-0">/</span>
            <Input
              id="birthDay"
              type="number"
              placeholder="일"
              min={1}
              max={31}
              value={birthDay}
              onChange={(e) => setBirthDay(e.target.value)}
              className="w-16 text-center text-base h-12"
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="birthTime">출생 시각</Label>
          <Input
            id="birthTime"
            type="time"
            value={birthTime}
            onChange={(e) => setBirthTime(e.target.value)}
            disabled={timeUnknown}
            className="h-12 text-base"
          />
          <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
            <input
              type="checkbox"
              checked={timeUnknown}
              onChange={(e) => setTimeUnknown(e.target.checked)}
              className="w-4 h-4"
            />
            시간을 모릅니다
          </label>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>성별</Label>
          <div className="flex gap-2">
            {(["male", "female"] as const).map((g) => (
              <button
                type="button"
                key={g}
                onClick={() => setGender(g)}
                className={`flex-1 h-12 rounded-full border text-[15px] font-medium transition-colors ${gender === g ? "border-ink bg-ink text-canvas" : "border-hairline text-ink hover:border-ink"}`}
              >
                {g === "male" ? "남성" : "여성"}
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-2">
          <Label>달력</Label>
          <div className="flex gap-2">
            {(["solar", "lunar"] as const).map((c) => (
              <button
                type="button"
                key={c}
                onClick={() => setCalendar(c)}
                className={`flex-1 h-12 rounded-full border text-[15px] font-medium transition-colors ${calendar === c ? "border-ink bg-ink text-canvas" : "border-hairline text-ink hover:border-ink"}`}
              >
                {c === "solar" ? "양력" : "음력"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {isLoggedIn ? (
        <Button type="submit" size="lg" className="w-full" disabled={submitting}>
          {submitting
            ? (isFree ? "분석 중..." : "주문 생성 중...")
            : (isFree ? "무료로 분석받기 →" : "결제하러 가기")}
        </Button>
      ) : (
        <div className="space-y-2">
          <Link
            href={`/login?redirect=${encodeURIComponent(`/products/${productSlug}`)}`}
            className={cn(buttonVariants({ size: "lg" }), "w-full")}
          >
            {isFree ? "로그인하고 무료로 보기" : "로그인하고 결제하기"}
          </Link>
          <p className="text-xs text-body text-center">
            결과는 로그인 후 <span className="text-ink">마이페이지</span> 에서 확인할 수 있어요.
          </p>
        </div>
      )}
    </form>
  );
}
