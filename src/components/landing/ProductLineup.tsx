import Link from "next/link";
import Image from "next/image";
import { formatKRW } from "@/lib/utils";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import { productsSeed } from "@/config/products.seed";

const cardImages: Record<string, string | null> = {
  "today-fortune": "/product-today.png",
  "dream-reading": "/product-dream.png",
  "basic-saju": "/product-basic.png",
  "love-saju": "/product-love.png",
  "premium-saju": "/product-premium.png",
};

const cardGradients: Record<string, string> = {
  "today-fortune": "from-amber-100 to-teal-100",
};

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

  if (!products || products.length === 0) return null;

  return (
    <section className="py-6 md:py-10">
      {/* 섹션 타이틀 */}
      <div className="px-4 md:px-6 mb-4 flex items-center justify-between">
        <h2 className="text-[16px] font-bold gradient-text tracking-tight">상품 둘러보기</h2>
        <Link href="/products" className="text-[12px] text-muted-foreground hover:text-teal-700 transition-colors">
          전체 보기 →
        </Link>
      </div>

      {/* 모바일: 가로 스크롤 / 데스크톱: 그리드 */}
      <div className="md:hidden">
        <div className="flex gap-3 overflow-x-auto px-4 pb-2 scrollbar-hide snap-x snap-mandatory">
          {products.map((p) => {
            const imageSrc = cardImages[p.slug] ?? null;
            const gradient = cardGradients[p.slug] ?? "from-stone-100 to-amber-50";
            const emoji = cardEmojis[p.slug] ?? "✨";
            const isFree = p.price === 0;

            return (
              <Link
                key={p.slug}
                href={`/products/${p.slug}`}
                className="group flex-none w-[160px] rounded-2xl glass-card overflow-hidden snap-start
                  active:scale-[0.97] transition-transform duration-150"
              >
                {/* 이미지 */}
                <div className="relative h-[180px] overflow-hidden">
                  {imageSrc ? (
                    <Image
                      src={imageSrc}
                      alt={p.name}
                      fill
                      className="object-cover object-top"
                      sizes="160px"
                    />
                  ) : (
                    <div className={`w-full h-full flex items-center justify-center bg-gradient-to-br ${gradient} text-4xl`}>
                      {emoji}
                    </div>
                  )}
                  {isFree && (
                    <div className="absolute top-2 left-2 bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                      무료
                    </div>
                  )}
                </div>
                {/* 정보 */}
                <div className="p-3">
                  <p className="text-[13px] font-semibold text-foreground leading-snug line-clamp-1">
                    {p.name}
                  </p>
                  <p className="mt-1 text-[14px] font-bold gradient-text">
                    {isFree ? "무료" : formatKRW(p.price)}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* 데스크톱: 2~5열 그리드 */}
      <div className="hidden md:grid gap-4 px-6 grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
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
              <div className="relative h-48 overflow-hidden">
                {imageSrc ? (
                  <Image
                    src={imageSrc}
                    alt={p.name}
                    fill
                    className="object-cover object-top group-hover:scale-105 transition-transform duration-500"
                    sizes="(max-width: 1024px) 33vw, 20vw"
                  />
                ) : (
                  <div className={`w-full h-full flex items-center justify-center bg-gradient-to-br ${gradient} text-5xl`}>
                    {emoji}
                  </div>
                )}
                {isFree && (
                  <div className="absolute top-2 right-2 bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                    무료
                  </div>
                )}
              </div>
              <div className="p-4">
                <p className="text-[15px] font-semibold text-foreground leading-snug">{p.name}</p>
                <p className="mt-2 text-xl font-bold gradient-text">
                  {isFree ? "무료" : formatKRW(p.price)}
                </p>
                <div className="mt-3 btn-gradient inline-flex items-center justify-center h-11 px-4 rounded-full text-[13px] font-semibold w-full">
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
