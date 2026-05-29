import { notFound } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { SajuForm } from "@/components/saju/SajuForm";
import { DreamForm } from "@/components/saju/DreamForm";
import { LoveForm } from "@/components/saju/LoveForm";
import { formatKRW, formatDate } from "@/lib/utils";
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

type Product = { id: string; slug: string; name: string; description: string; price: number };
type ProductOption = { id: string; slug: string; name: string; price: number };
type Review = { id: string; rating: number; content: string; created_at: string };

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  let product: Product | null;
  let allProducts: ProductOption[] = [];
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

    // 전체 활성 상품 목록 (폼 상품 선택 UI용)
    const { data: allData } = await supabase
      .from("products")
      .select("id, slug, name, price")
      .eq("is_active", true)
      .order("display_order", { ascending: true });
    allProducts = allData ?? [];

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
    allProducts = productsSeed
      .filter((p) => p.is_active)
      .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0))
      .map((p) => ({ id: p.slug, slug: p.slug, name: p.name, price: p.price }));
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

      {/* ── 상품별 상세 소개 ── */}
      {product.slug === "today-fortune" && (
        <section className="mb-10 rounded-2xl border border-[#e8e4dd] bg-white overflow-hidden shadow-sm">
          <div className="px-5 py-3.5 border-b border-[#f0ede8] bg-[#faf8f5]">
            <p className="text-sm font-semibold text-[#2d2d2d]">📋 오늘 확인할 수 있는 것</p>
          </div>
          <ul className="px-5 py-4 space-y-2.5">
            {[
              { icon: "📍", text: "오늘의 핵심 기운 — 하루를 관통하는 사주 포인트" },
              { icon: "🔔", text: "주의점과 조언 — 오늘 피해야 할 상황과 마음가짐" },
              { icon: "✨", text: "오늘의 추천 행동 — 기운을 살리는 실천 제안" },
              { icon: "🍀", text: "행운 아이템 · 색상 · 음식 · 방위" },
              { icon: "🎲", text: "행운의 로또번호 6개" },
            ].map(({ icon, text }) => (
              <li key={text} className="flex items-start gap-3 text-sm text-[#3a3a4a]">
                <span className="text-base leading-snug">{icon}</span>
                <span className="leading-snug">{text}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {product.slug === "premium-saju" && (
        <section className="mb-10 rounded-2xl border border-[#e8e4dd] bg-white overflow-hidden shadow-sm">
          <div className="px-5 py-3.5 border-b border-[#f0ede8] bg-[#faf8f5]">
            <p className="text-sm font-semibold text-[#2d2d2d]">📑 분석 구성 — 7 PARTS</p>
          </div>
          <ul className="px-5 py-4 space-y-3">
            {[
              { part: "PART 01", title: "사주팔자 상세분석", desc: "원국 구조·성품·삶의 패턴·오행 수치 분석" },
              { part: "PART 02", title: "내 인생의 황금기", desc: "대운별 황금기·저점·암흑기 연도와 전략" },
              { part: "PART 03", title: "연애운과 배우자운", desc: "연애 성향·이상형·결혼 시기 전망" },
              { part: "PART 04", title: "재물운 분석", desc: "재물 그릇·투자 성향·상승하강 시기" },
              { part: "PART 05", title: "직업과 성공의 운명", desc: "적성·추천 직업군·성공 전략" },
              { part: "PART 06", title: "건강운과 개운법", desc: "체질·주의 부위·용신 기반 실천 개운" },
              { part: "PART 07", title: "향후 3개월 핵심 운세", desc: "월운 데이터 기반 월별 흐름과 조언" },
            ].map(({ part, title, desc }) => (
              <li key={part} className="flex items-start gap-3">
                <span className="shrink-0 text-[10px] font-bold font-mono text-[#2D5C5C] bg-[#eaf4f4] rounded px-1.5 py-0.5 mt-0.5">{part}</span>
                <div>
                  <p className="text-sm font-semibold text-[#1a1730]">{title}</p>
                  <p className="text-xs text-[#888] mt-0.5">{desc}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {product.slug === "love-saju" && (
        <section className="mb-10 rounded-2xl border border-[#e8e4dd] bg-white overflow-hidden shadow-sm">
          <div className="px-5 py-3.5 border-b border-[#f0ede8] bg-[#faf8f5]">
            <p className="text-sm font-semibold text-[#2d2d2d]">💑 분석 구성 — 10가지 심층 궁합</p>
          </div>
          <ul className="px-5 py-4 space-y-3">
            {([
              { icon: "🔮", label: "두 사람의 사주 명식 개요", desc: "두 명식 나란히 비교 + 오행 분포 차트 시각화" },
              { icon: "⚡", label: "합충형해파(合沖刑害破) 심층 분석", desc: "두 사람 간 천간·지지 교차 관계 분석" },
              { icon: "🌊", label: "오행(五行) 상생·상극과 에너지 궁합", desc: "오행 균형·불균형이 관계에 미치는 영향" },
              { icon: "🔥", label: "속궁합 분석 — 두 사람의 성적 에너지 궁합", desc: "성향·역할·케미 전면 분석", highlight: true },
              { icon: "🌿", label: "성격·기질 궁합", desc: "두 사람이 만났을 때 드러나는 시너지와 마찰" },
              { icon: "💬", label: "연애 스타일 차이와 소통 방식", desc: "표현 방식·요구 온도·대화 패턴 비교" },
              { icon: "🌀", label: "갈등의 패턴과 근본 원인", desc: "반복되는 충돌 구조를 명리학으로 풀이" },
              { icon: "🌱", label: "갈등 해결 방안과 관계 개선 조언", desc: "사주 기반 실질적 솔루션 제안" },
              { icon: "✨", label: "관계의 강점과 함께 성장하는 방향", desc: "두 사람의 가능성과 시너지 포인트" },
              { icon: "📌", label: "두 사람을 위한 종합 실천 제안", desc: "사주 궁합을 활용한 관계 전략 정리" },
            ] as { icon: string; label: string; desc: string; highlight?: boolean }[]).map(
              ({ icon, label, desc, highlight }) => (
                <li
                  key={label}
                  className={`flex items-start gap-3 rounded-xl px-3 py-2.5 ${
                    highlight ? "bg-rose-50 border border-rose-200" : ""
                  }`}
                >
                  <span className="text-base leading-snug mt-0.5">{icon}</span>
                  <div>
                    <p className={`text-sm font-semibold ${highlight ? "text-rose-700" : "text-[#1a1730]"}`}>
                      {label}
                      {highlight && (
                        <span className="ml-2 text-[10px] font-bold text-rose-500 bg-rose-100 px-1.5 py-0.5 rounded-full align-middle">
                          성인 콘텐츠 포함
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-[#888] mt-0.5">{desc}</p>
                  </div>
                </li>
              )
            )}
          </ul>
        </section>
      )}

      <section>
        {product.slug === "dream-reading" ? (
          <DreamForm
            productId={product.id}
            productSlug={product.slug}
            productPrice={product.price}
            isLoggedIn={!!user}
          />
        ) : product.slug === "love-saju" ? (
          <LoveForm
            productId={product.id}
            productSlug={product.slug}
            productPrice={product.price}
            isLoggedIn={!!user}
          />
        ) : (
          <SajuForm
            productId={product.id}
            productSlug={product.slug}
            productPrice={product.price}
            isLoggedIn={!!user}
            products={allProducts}
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
