"use client";

import Image from "next/image";
import Link from "next/link";

type BannerProduct = {
  slug: string;
  name: string;
  price: number;
};

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

export function TopBanner({ products }: { products?: BannerProduct[] }) {
  const items = (products && products.length > 0 ? products : SEED_PRODUCTS);
  // 무한 루프: 3세트 복제
  const tripled = [...items, ...items, ...items];

  return (
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
  );
}
