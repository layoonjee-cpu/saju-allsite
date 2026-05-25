import Link from "next/link";
import Image from "next/image";
import { formatKRW } from "@/lib/utils";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import { productsSeed } from "@/config/products.seed";

// 상품 slug → 이미지 경로 (null = 그라디언트 뱃지)
const cardImages: Record<string, string | null> = {
  "today-fortune": null,
  "dream-reading": "/product-dream.png",
  "basic-saju": "/product-basic.png",
  "love-saju": "/product-love.png",
  "premium-saju": "/product-premium.png",
};

// 이미지 없는 카드용 그라디언트
const cardGradients: Record<string, string> = {
  "today-fortune": "from-amber-100 to-teal-100",
};

// 이미지 없는 카드용 이모지
const cardEmojis: Record<string, string> = {
  "today-fortune": "☀️",
};

export async function ProductLineup() {
  let products: { slug: string; name: string; description: string; price: number }[] | null;
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const { data } = await supabase
      .from("products")
      .select("slug, name, description, price")
      .eq("is_active", true)
      .order("display_order", { ascending: true });
    products = data;
  } else {
    products = productsSeed
      .filter((p) => p.is_active)
      .sort((a, b) => a.display_order - b.display_order)
      .map(({ slug, name, description, price }) => ({ slug, name, description, price }));
  }

  if (!products || products.length === 0) {
    return (
      <section className="container py-12 text-center">
        <p className="text-sm text-muted-foreground">상품이 아직 없어요.</p>
      </section>
    );
  }

  return (
    <section className="container py-16 md:py-20">
      {/* 섹션 타이틀 */}
      <div className="text-center mb-10">
        <h2 className="text-xl font-bold gradient-text tracking-tight">풀이 상품</h2>
        <p className="mt-2 text-[13px] text-muted-foreground">당신이 가장 궁금한 자리에서 시작해요</p>
      </div>

      <div className="grid gap-5 grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
        {products.map((p) => {
          const imageSrc = cardImages[p.slug] ?? null;
          const gradient = cardGradients[p.slug] ?? "from-stone-100 to-amber-50";
          const emoji = cardEmojis[p.slug] ?? "✨";
          const isFree = p.price === 0;

          return (
            <Link
              key={p.slug}
              href={`/products/${p.slug}`}
              className="group block relative rounded-2xl glass-card transition-all duration-300 hover:-translate-y-1.5 overflow-hidden"
            >
              {/* 비주얼 배너 */}
              <div className={`relative h-40 sm:h-44 md:h-48 overflow-hidden`}>
                {imageSrc ? (
                  <Image
                    src={imageSrc}
                    alt={p.name}
                    fill
                    className="object-cover object-top group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className={`w-full h-full flex items-center justify-center bg-gradient-to-br ${gradient} text-5xl`}>
                    {emoji}
                  </div>
                )}
                {/* 무료 뱃지 */}
                {isFree && (
                  <div className="absolute top-2 right-2 bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                    무료
                  </div>
                )}
              </div>

              {/* 카드 정보 */}
              <div className="p-4 sm:p-5">
                <p className="text-sm sm:text-[15px] font-semibold text-foreground leading-snug">
                  {p.name}
                </p>
                <p className="mt-2 text-lg sm:text-xl font-bold gradient-text">
                  {isFree ? "무료" : formatKRW(p.price)}
                </p>
                <div className="mt-3 btn-gradient inline-flex items-center justify-center h-8 sm:h-9 px-4 rounded-full text-[11px] sm:text-xs font-semibold w-full">
                  {isFree ? "바로 보기" : "자세히 보기"}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
