import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { formatKRW } from "@/lib/utils";
import { isSupabaseConfigured } from "@/lib/env";
import { productsSeed } from "@/config/products.seed";

const productImages: Record<string, string> = {
  "today-fortune": "/product-today.png",
  "dream-reading": "/product-dream.png",
  "ilju-sticker": "/sticker2.png",
  "basic-saju": "/product-basic.png",
  "love-saju": "/product-love.png",
  "premium-saju": "/product-premium.png",
};

const productOriginalPrices: Record<string, number> = {
  "basic-saju": 9900,
  "love-saju": 50000,
  "premium-saju": 60000,
};

export const metadata = { title: "상품" };

export default async function ProductsPage() {
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

  return (
    <div className="container py-12">
      <header className="mb-10">
        <p className="text-xs font-mono text-mute mb-2">PRODUCTS</p>
        <h1 className="text-3xl font-semibold tracking-tight">상품</h1>
        <p className="mt-2 text-sm text-body">가볍게 시작해서 깊이 있게 들어가세요.</p>
      </header>

      {!products || products.length === 0 ? (
        <p className="text-sm text-body">상품이 없습니다.</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {products.map((p) => (
            <Link
              key={p.slug}
              href={`/products/${p.slug}`}
              className="group block rounded-lg overflow-hidden border border-hairline bg-canvas transition-shadow hover:shadow-lg"
            >
              {productImages[p.slug] && (
                <div className="relative w-full aspect-[3/4] bg-[#F5F0E6]">
                  <Image
                    src={productImages[p.slug]}
                    alt={p.name}
                    fill
                    className="object-contain"
                  />
                </div>
              )}
              <div className="p-5">
                <p className="text-base font-semibold text-[#1a1730]">{p.name}</p>
                <p className="mt-1.5 text-sm text-[#4a4a6a] leading-relaxed line-clamp-2">
                  {p.description}
                </p>
                {productOriginalPrices[p.slug] ? (
                  <div className="mt-4 flex items-baseline gap-2 flex-wrap">
                    <span className="text-xs text-[#bbb] line-through font-mono">{formatKRW(productOriginalPrices[p.slug])}</span>
                    <span className="text-lg font-mono font-black text-[#2D5C5C]">{formatKRW(p.price)}</span>
                    <span className="text-[10px] font-bold text-white bg-rose-500 px-1.5 py-0.5 rounded-full">
                      {Math.round((1 - p.price / productOriginalPrices[p.slug]) * 100)}% OFF
                    </span>
                  </div>
                ) : (
                  <p className="mt-4 text-lg font-mono font-semibold text-[#2D5C5C]">{formatKRW(p.price)}</p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
