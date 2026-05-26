"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";

type BannerProduct = {
  slug: string;
  name: string;
  price: number;
};

// 광고 이미지 목록 — 이미지 추가 시 여기에만 추가하면 됩니다
const AD_SLIDES = [
  { src: "/seesun.png", alt: "시선 사주 — 정통 명리학 × AI", href: "/products" },
];

const cardImages: Record<string, string | null> = {
  "today-fortune": null,
  "dream-reading": "/product-dream.png",
  "basic-saju": "/product-basic.png",
  "love-saju": "/product-love.png",
  "premium-saju": "/product-premium.png",
};

const cardEmoji: Record<string, string> = {
  "today-fortune": "☀️",
};

// 상품 목록 (서버에서 주입, 없으면 시드 폴백)
const SEED_PRODUCTS: BannerProduct[] = [
  { slug: "today-fortune",  name: "오늘의 운세",    price: 0 },
  { slug: "dream-reading",  name: "꿈꾸는 시선",    price: 1900 },
  { slug: "basic-saju",     name: "가벼운 시선",    price: 4900 },
  { slug: "love-saju",      name: "연인의 시선",    price: 15000 },
  { slug: "premium-saju",   name: "깊은 시선",      price: 20000 },
];

// ── 롤링 광고 배너 (상단 이미지 슬라이드) ─────────────────────────────
function RollingAdBanner() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (AD_SLIDES.length <= 1) return;
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % AD_SLIDES.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div
      className="relative w-full overflow-hidden"
      style={{
        background: "linear-gradient(90deg, #1a1730 0%, #1e3a3a 50%, #1a1730 100%)",
        height: "72px",
        borderBottom: "1px solid rgba(196,145,58,0.15)",
      }}
    >
      {AD_SLIDES.map((slide, i) => (
        <Link
          key={i}
          href={slide.href}
          className="absolute inset-0 flex items-center justify-center transition-opacity duration-700"
          style={{ opacity: i === current ? 1 : 0, pointerEvents: i === current ? "auto" : "none" }}
        >
          <Image
            src={slide.src}
            alt={slide.alt}
            width={64}
            height={64}
            className="object-contain rounded-xl"
            style={{ filter: "drop-shadow(0 2px 8px rgba(196,145,58,0.35))" }}
            priority={i === 0}
          />
        </Link>
      ))}

      {/* 인디케이터 (이미지 2개 이상일 때만 표시) */}
      {AD_SLIDES.length > 1 && (
        <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 flex gap-1">
          {AD_SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className="w-1 h-1 rounded-full transition-colors duration-300"
              style={{ background: i === current ? "#c4913a" : "rgba(255,255,255,0.3)" }}
              aria-label={`슬라이드 ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ── 메인 TopBanner ─────────────────────────────────────────────────────
export function TopBanner({ products }: { products?: BannerProduct[] }) {
  const items = products && products.length > 0 ? products : SEED_PRODUCTS;
  // 무한 루프: 3세트 복제
  const tripled = [...items, ...items, ...items];

  return (
    <div className="w-full">
      {/* 광고 이미지 롤링 배너 */}
      <RollingAdBanner />

      {/* 상품 마퀴 */}
      <div
        className="w-full overflow-hidden"
        style={{
          background: "linear-gradient(90deg, #1a1730 0%, #1e3a3a 50%, #1a1730 100%)",
          height: "44px",
          borderBottom: "1px solid rgba(196,145,58,0.2)",
        }}
      >
        <div
          className="marquee-track flex items-center h-full"
          style={{ width: "max-content" }}
        >
          {tripled.map((item, i) => {
            const imgSrc = cardImages[item.slug] ?? null;
            const emoji = cardEmoji[item.slug] ?? null;
            const isFree = item.price === 0;

            return (
              <Link
                key={`${item.slug}-${i}`}
                href={`/products/${item.slug}`}
                className="group flex items-center gap-2 shrink-0 px-5 h-full hover:bg-white/5 transition-colors duration-200"
              >
                {/* 상품 이미지 or 이모지 */}
                <div className="relative w-7 h-7 rounded-full overflow-hidden shrink-0 ring-1 ring-amber-400/30">
                  {imgSrc ? (
                    <Image
                      src={imgSrc}
                      alt={item.name}
                      fill
                      className="object-cover object-top"
                      sizes="28px"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-amber-900/30 text-sm">
                      {emoji}
                    </div>
                  )}
                </div>

                {/* 상품명 */}
                <span
                  className="text-[12px] whitespace-nowrap text-white/80 group-hover:text-white transition-colors"
                  style={{ fontFamily: "var(--font-body)", fontWeight: 500 }}
                >
                  {item.name}
                </span>

                {/* 가격 뱃지 */}
                <span
                  className="text-[10px] whitespace-nowrap ml-0.5"
                  style={{ color: isFree ? "#6ee7b7" : "#c4913a", fontWeight: 600 }}
                >
                  {isFree ? "무료" : `₩${item.price.toLocaleString()}`}
                </span>

                {/* 구분자 */}
                <span className="ml-4 text-amber-400/30 text-[10px] select-none">✦</span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
