"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";

type BannerProduct = { slug?: string };

// 광고 이미지 목록 — 이미지 추가 시 여기에만 추가하면 됩니다
const AD_SLIDES: { src: string; alt: string; href: string; width: number; height: number }[] = [
  // 로고 이미지 준비 후 여기에 추가
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
            width={slide.width}
            height={slide.height}
            className="object-contain"
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
export function TopBanner({ products: _products }: { products?: BannerProduct[] }) {
  if (AD_SLIDES.length === 0) return null;
  return <RollingAdBanner />;
}
