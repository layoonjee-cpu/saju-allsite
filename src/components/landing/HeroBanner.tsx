"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { formatKRW } from "@/lib/utils";

type Slide = {
  slug: string;
  name: string;
  subtitle: string;
  image: string;
  price: number;
  originalPrice?: number;
  rank: number;
  badgeLabel: string;
  badgeColor: string;
};

const SLIDES: Slide[] = [
  {
    slug: "today-fortune",
    name: "오늘의 운세",
    subtitle: "당신이 마주할, 오늘 하루의 결",
    image: "/product-hero.png",
    price: 0,
    rank: 1,
    badgeLabel: "무료",
    badgeColor: "bg-emerald-500",
  },
  {
    slug: "love-saju",
    name: "연인의 시선",
    subtitle: "당신이 마주할, 인연의 비밀",
    image: "/product-love.png",
    price: 20000,
    originalPrice: 80000,
    rank: 2,
    badgeLabel: "75% OFF",
    badgeColor: "bg-rose-500",
  },
  {
    slug: "premium-saju",
    name: "깊은 시선 VIP",
    subtitle: "사주 원국 정밀 분석 A4 80장",
    image: "/product-premium.png",
    price: 39000,
    originalPrice: 100000,
    rank: 3,
    badgeLabel: "61% OFF",
    badgeColor: "bg-[#2b6e6e]",
  },
  {
    slug: "dream-reading",
    name: "꿈꾸는 시선",
    subtitle: "잊을 수 없는 꿈의 메시지를 풀다",
    image: "/product-dream.png",
    price: 1900,
    rank: 4,
    badgeLabel: "₩1,900",
    badgeColor: "bg-pink-500",
  },
  {
    slug: "basic-saju",
    name: "가벼운 시선",
    subtitle: "일주·성격·재물·연애·직업 9챕터 심층 풀이",
    image: "/product-basic.png",
    price: 4900,
    originalPrice: 9900,
    rank: 5,
    badgeLabel: "50% OFF",
    badgeColor: "bg-amber-600",
  },
  {
    slug: "ilju-sticker",
    name: "일주스티커",
    subtitle: "내 일주의 기질을 키워드로 만나다",
    image: "/sticker2.png",
    price: 990,
    rank: 6,
    badgeLabel: "₩990",
    badgeColor: "bg-orange-500",
  },
  {
    slug: "ziwei-saju",
    name: "별의시선(자미두수)",
    subtitle: "12개 별이 비추는 인생의 12개 영역",
    image: "/product-ziwei.png",
    price: 30000,
    originalPrice: 100000,
    rank: 7,
    badgeLabel: "70% OFF",
    badgeColor: "bg-violet-600",
  },
  {
    slug: "tarot-siren",
    name: "타로의 시선",
    subtitle: "78장 오리엔탈 타로 3카드 리딩",
    image: "/product-tarot.png",
    price: 5000,
    rank: 8,
    badgeLabel: "₩5,000",
    badgeColor: "bg-[#c9a84c]",
  },
];

const INTERVAL_MS = 3500;

export function HeroBanner() {
  const [current, setCurrent] = useState(0);
  const [prev, setPrev] = useState<number | null>(null);
  const [fading, setFading] = useState(false);
  const [paused, setPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // 모든 슬라이드 이미지를 미리 로드
  useEffect(() => {
    SLIDES.forEach((s) => {
      const img = new window.Image();
      img.src = s.image;
    });
  }, []);

  const goTo = useCallback((idx: number) => {
    setPrev(current);
    setFading(true);
    setCurrent(idx);
    setTimeout(() => {
      setPrev(null);
      setFading(false);
    }, 450);
  }, [current]);

  const goNext = useCallback(() => {
    goTo((current + 1) % SLIDES.length);
  }, [current, goTo]);

  const goPrev = useCallback(() => {
    goTo((current - 1 + SLIDES.length) % SLIDES.length);
  }, [current, goTo]);

  // 자동 전진
  useEffect(() => {
    if (paused) return;
    timerRef.current = setInterval(goNext, INTERVAL_MS);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [paused, goNext]);

  // 터치 스와이프
  function onTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
    setPaused(true);
  }
  function onTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null) return;
    const dx = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(dx) > 40) { dx > 0 ? goNext() : goPrev(); }
    touchStartX.current = null;
    setTimeout(() => setPaused(false), 3000);
  }

  const slide = SLIDES[current];

  return (
    <section className="w-full px-4 pt-4 pb-2 md:px-6">
      <div
        className="relative w-full max-w-lg mx-auto"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {/* ── 메인 카드 ── */}
        <Link
          href={slide.slug === "tarot-siren" ? "/tarot" : `/products/${slide.slug}`}
          className="block relative w-full overflow-hidden rounded-3xl shadow-2xl"
          style={{ aspectRatio: "3/4", background: "linear-gradient(160deg, #1a1730 0%, #2d2050 50%, #1a3030 100%)" }}
        >
          {/* 이전 슬라이드 (fade-out) */}
          {prev !== null && (
            <Image
              src={SLIDES[prev].image}
              alt=""
              fill
              className="object-contain"
              sizes="(max-width: 512px) 100vw, 512px"
              aria-hidden
            />
          )}

          {/* 현재 슬라이드 (fade-in) */}
          <Image
            key={slide.slug}
            src={slide.image}
            alt={slide.name}
            fill
            className="object-contain"
            style={{
              opacity: fading ? 0 : 1,
              transition: "opacity 0.45s ease",
            }}
            sizes="(max-width: 512px) 100vw, 512px"
            priority={current === 0}
          />

          {/* 하단 그라디언트 */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent pointer-events-none" />

          {/* TOP 랭크 뱃지 — 우상단 */}
          <div
            className="absolute top-4 right-4 text-white text-center rounded-xl px-2.5 py-1.5 leading-none"
            style={{ background: "rgba(26,23,48,0.88)", backdropFilter: "blur(4px)" }}
          >
            <span className="block text-[9px] font-bold tracking-widest opacity-80">TOP</span>
            <span className="block text-[22px] font-black leading-none">{slide.rank}</span>
          </div>

          {/* 가격 뱃지 — 좌상단 */}
          <div className={`absolute top-4 left-4 ${slide.badgeColor} text-white text-[12px] font-bold px-3 py-1.5 rounded-full shadow-lg`}>
            {slide.badgeLabel}
          </div>

          {/* 하단 텍스트 영역 */}
          <div className="absolute bottom-0 left-0 right-0 px-6 pb-7 pt-16">
            <h2
              className="text-white text-[32px] sm:text-[36px] font-bold leading-tight tracking-tight"
              style={{ fontFamily: "var(--font-display)", textShadow: "0 2px 12px rgba(0,0,0,0.6)" }}
            >
              {slide.name}
            </h2>
            <p
              className="text-white/70 text-[13px] mt-1"
              style={{ textShadow: "0 1px 6px rgba(0,0,0,0.5)" }}
            >
              {slide.subtitle}
            </p>

            {/* 가격 표시 */}
            {slide.originalPrice ? (
              <div className="mt-3 flex items-baseline gap-2.5 flex-wrap">
                <span className="text-white/45 text-[15px] line-through font-medium">
                  {formatKRW(slide.originalPrice)}
                </span>
                <span
                  className="text-white text-[34px] sm:text-[38px] font-black leading-none tracking-tight"
                  style={{ textShadow: "0 2px 12px rgba(0,0,0,0.7)" }}
                >
                  {formatKRW(slide.price)}
                </span>
              </div>
            ) : slide.price === 0 ? (
              <p className="mt-3 text-emerald-300 text-[26px] font-black leading-none"
                style={{ textShadow: "0 2px 8px rgba(0,0,0,0.6)" }}>
                무료
              </p>
            ) : (
              <p className="mt-3 text-white text-[26px] font-black leading-none"
                style={{ textShadow: "0 2px 8px rgba(0,0,0,0.6)" }}>
                {formatKRW(slide.price)}
              </p>
            )}
          </div>
        </Link>

        {/* ── 도트 인디케이터 ── */}
        <div className="flex justify-center items-center gap-2 mt-4">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`슬라이드 ${i + 1}`}
              onClick={() => { goTo(i); setPaused(true); setTimeout(() => setPaused(false), 4000); }}
              className={`rounded-full transition-all duration-300 ${
                i === current
                  ? "w-6 h-2 bg-[#1a1730]"
                  : "w-2 h-2 bg-gray-300 hover:bg-gray-400"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
