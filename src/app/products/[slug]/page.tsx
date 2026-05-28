import { notFound } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { SajuLabForm } from "@/components/saju/SajuLabForm";
import { DreamForm } from "@/components/saju/DreamForm";
import { LoveForm } from "@/components/saju/LoveForm";
import { formatKRW, formatDate } from "@/lib/utils";
import { isSupabaseConfigured } from "@/lib/env";
import { productsSeed } from "@/config/products.seed";

const productImages: Record<string, string> = {
  "today-fortune": "/product-today.png",
  "dream-reading": "/product-dream.png",
  "basic-saju": "/product-basic.png",
  "love-saju": "/product-love.png",
  "premium-saju": "/product-premium.png",
};

type Product = { id: string; slug: string; name: string; description: string; price: number };
type Review = { id: string; rating: number; content: string; created_at: string };

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  let product: Product | null;
  let reviews: Review[] | null = null;
  let user: Awaited<ReturnType<typeof getCurrentUser>> = null;

  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const { data } = await supabase
      .from("products")
      .select("id, slug, name, description, price")
      .eq("slug", slug)
      .eq("is_active", true)
      .maybeSingle();
    product = data;

    if (product) {
      const { data: r } = await supabase
        .from("reviews")
        .select("id, rating, content, created_at")
        .eq("product_id", product.id)
        .eq("status", "approved")
        .order("created_at", { ascending: false })
        .limit(5);
      reviews = r;
    }
    user = await getCurrentUser();
  } else {
    const seed = productsSeed.find((p) => p.slug === slug && p.is_active);
    product = seed ? { id: seed.slug, ...seed } : null;
  }

  if (!product) notFound();

  return (
    <div className="container py-12 max-w-2xl">
      {productImages[product.slug] && (
        <div className="relative w-full max-w-xs mx-auto aspect-[3/4] rounded-2xl overflow-hidden mb-6 bg-[#F5F0E6]">
          <Image
            src={productImages[product.slug]}
            alt={product.name}
            fill
            className="object-contain"
            priority
          />
        </div>
      )}
      <header className="mb-10 text-center">
        <>
          <p className="text-xs font-mono text-[#888] mb-2">PRODUCT / {product.slug}</p>
          <h1 className="text-3xl font-semibold tracking-tight text-[#1a1730]">{product.name}</h1>
          <p className="mt-3 text-sm text-[#4a4a6a] leading-relaxed">{product.description}</p>
          <p className="mt-4 text-2xl font-mono font-semibold text-[#2D5C5C]">{formatKRW(product.price)}</p>
        </>
      </header>

      <section>
        {product.slug === "dream-reading" ? (
          <DreamForm
            productId={product.id}
            productSlug={product.slug}
            productPrice={product.price}
            isLoggedIn={!!user}
          />
        ) : product.slug === "love-saju" ? (
          <>
            <h2 className="text-sm font-semibold mb-4 text-ink">두 사람의 사주 정보 입력</h2>
            <p className="text-xs text-body mb-4">정확한 생년월일일수록 더 정밀한 결과가 나옵니다.</p>
            <LoveForm
              productId={product.id}
              productSlug={product.slug}
              productPrice={product.price}
              isLoggedIn={!!user}
            />
          </>
        ) : (
          <SajuLabForm
            productId={product.id}
            productSlug={product.slug}
            productPrice={product.price}
            isLoggedIn={!!user}
          />
        )}
      </section>

      {reviews && reviews.length > 0 && (
        <section className="mt-16 pt-10 border-t border-hairline">
          <h2 className="text-sm font-semibold mb-5 text-ink">최근 후기</h2>
          <ul className="divide-y divide-hairline border-y border-hairline">
            {reviews.map((r) => (
              <li key={r.id} className="py-5">
                <div className="flex items-center justify-between text-sm">
                  <span aria-label={`${r.rating}점`}>
                    <span className="text-ink">{"★".repeat(r.rating)}</span>
                    <span className="text-hairline-strong">{"★".repeat(5 - r.rating)}</span>
                  </span>
                  <span className="text-xs text-mute font-mono">{formatDate(r.created_at)}</span>
                </div>
                <p className="mt-2 text-sm text-charcoal leading-relaxed">{r.content}</p>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
