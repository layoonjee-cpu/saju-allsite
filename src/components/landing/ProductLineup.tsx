import Link from "next/link";
import { formatKRW } from "@/lib/utils";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import { productsSeed } from "@/config/products.seed";

const cardGradients = [
  "from-amber-100 to-orange-200",
  "from-indigo-100 to-violet-200",
  "from-rose-100 to-pink-200",
  "from-violet-100 to-purple-200",
];

const cardEmojis = ["☀️", "🌙", "💞", "⭐"];

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
      <div className="text-center mb-8">
        <h2 className="text-xl font-bold gradient-text tracking-tight">풀이 상품</h2>
      </div>

      <div className="grid gap-4 grid-cols-2 md:grid-cols-2 lg:grid-cols-4">
        {products.map((p, i) => (
          <Link
            key={p.slug}
            href={`/products/${p.slug}`}
            className="group block relative rounded-2xl glass-card transition-all duration-300 hover:-translate-y-1 overflow-hidden"
          >
            {/* 비주얼 배너 (이모지 + 그라디언트 배경) */}
            <div
              className={`flex items-center justify-center bg-gradient-to-br ${cardGradients[i % cardGradients.length]} h-24 sm:h-28 md:h-32 text-4xl sm:text-5xl`}
            >
              {cardEmojis[i % 4]}
            </div>

            {/* 카드 정보 */}
            <div className="p-4 sm:p-5">
              <p className="text-sm sm:text-base font-semibold text-foreground leading-snug">
                {p.name}
              </p>
              <p className="mt-2 text-lg sm:text-2xl font-bold gradient-text">
                {formatKRW(p.price)}
              </p>
              <div className="mt-3 btn-gradient inline-flex items-center justify-center h-8 sm:h-9 px-4 rounded-full text-[11px] sm:text-xs font-semibold w-full">
                자세히 보기
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
