import Link from "next/link";
import { formatKRW } from "@/lib/utils";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import { productsSeed } from "@/config/products.seed";

const cardGradients = [
  "from-violet-400/20 to-purple-300/20",
  "from-sky-400/20 to-blue-300/20",
  "from-rose-400/20 to-pink-300/20",
  "from-amber-400/20 to-orange-300/20",
];

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
    <section className="container py-20">
      <div className="text-center mb-12">
        <p className="text-xs font-medium text-violet-500 uppercase tracking-widest mb-2">Products</p>
        <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
          상품 <span className="gradient-text">라인업</span>
        </h2>
        <p className="mt-3 text-muted-foreground text-sm">원하는 풀이를 골라보세요</p>
      </div>

      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
        {products.map((p, i) => (
          <Link
            key={p.slug}
            href={`/products/${p.slug}`}
            className="group block relative rounded-2xl p-6 glass-card transition-all duration-300 hover:-translate-y-1"
          >
            {/* 카드 상단 그라디언트 장식 */}
            <div className={`absolute top-0 left-0 right-0 h-1.5 rounded-t-2xl bg-gradient-to-r ${cardGradients[i % cardGradients.length].replace('/20', '')}`} />

            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${cardGradients[i % cardGradients.length]} flex items-center justify-center mb-4`}>
              <span className="text-lg">
                {["✨", "🌙", "💕", "🌟"][i % 4]}
              </span>
            </div>

            <p className="text-base font-semibold text-foreground">{p.name}</p>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed line-clamp-2">
              {p.description}
            </p>
            <p className="mt-5 text-xl font-bold gradient-text">
              {formatKRW(p.price)}
            </p>

            <div className="mt-4 text-xs font-medium text-violet-500 group-hover:text-violet-700 transition-colors">
              자세히 보기 →
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
