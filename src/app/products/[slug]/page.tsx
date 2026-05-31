import { notFound } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { SajuForm } from "@/components/saju/SajuForm";
import { DreamForm } from "@/components/saju/DreamForm";
import { LoveForm } from "@/components/saju/LoveForm";
import { ZiweiForm } from "@/components/saju/ZiweiForm";
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
  "ziwei-saju": "/product-ziwei.png",
};

// 정가 표시 (할인 전 가격) — DB 실제 결제가와 별개
const productOriginalPrices: Record<string, number> = {
  "basic-saju": 9900,
  "love-saju": 50000,
  "premium-saju": 60000,
  "ziwei-saju": 60000,
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

          {/* ziwei-saju 전용 헤더 강화 */}
          {product.slug === "ziwei-saju" && (
            <>
              {/* 16챕터 강조 배지 */}
              <div className="mt-3 inline-flex items-center gap-1.5 text-white text-xs font-bold px-3 py-1.5 rounded-full" style={{ background: "linear-gradient(135deg, #1a1730, #3d2f6b)" }}>
                <span>⭐</span>
                <span>16챕터 자미두수 정밀 분석</span>
              </div>

              {/* 커버리지 키워드 배지들 */}
              <div className="mt-3 flex flex-wrap gap-1.5 justify-center">
                {["명궁·신궁", "사화분석★", "재백궁★★", "부처궁", "관록궁", "대운흐름", "유년분석", "12궁 전체"].map((kw) => (
                  <span key={kw}
                    className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                    style={{ color: "#7c3aed", background: "#f0ebff", border: "1px solid #c4b5fd" }}>
                    {kw}
                  </span>
                ))}
              </div>

              {/* 핵심 포인트 3개 */}
              <ul className="mt-4 space-y-1.5 text-left max-w-xs mx-auto">
                {[
                  { text: "사주와 다른 별도 명리 체계 — 12개 인생 영역 각각을 정밀하게 분석" },
                  { text: "재백궁 강화 챕터 5,000자 — 재물 그릇·흐름·시기 집중 분석" },
                  { text: "자미두수 정통 4×4 명반 시각화 — 별의 밝기·사화까지 한눈에" },
                ].map(({ text }) => (
                  <li key={text} className="flex items-start gap-2 text-[13px] text-[#3a3a4a]">
                    <span className="font-bold mt-0.5 shrink-0" style={{ color: "#7c3aed" }}>✔</span>
                    <span>{text}</span>
                  </li>
                ))}
              </ul>
            </>
          )}

          {/* basic-saju 전용 헤더 강화 */}
          {product.slug === "basic-saju" && (
            <>
              {/* 9챕터 강조 배지 */}
              <div className="mt-3 inline-flex items-center gap-1.5 bg-[#1a1730] text-white text-xs font-bold px-3 py-1.5 rounded-full">
                <span>📝</span>
                <span>9챕터 심층 사주 풀이</span>
              </div>

              {/* 커버리지 키워드 배지들 */}
              <div className="mt-3 flex flex-wrap gap-1.5 justify-center">
                {["일주 분석", "오행 분포", "성격·기질", "재물운", "연애운", "직업 적성", "올해 운세", "개운법"].map((kw) => (
                  <span key={kw}
                    className="text-[11px] font-semibold text-[#2D5C5C] bg-[#eaf4f4] border border-[#c0dede] px-2 py-0.5 rounded-full">
                    {kw}
                  </span>
                ))}
              </div>

              {/* 핵심 포인트 3개 */}
              <ul className="mt-4 space-y-1.5 text-left max-w-xs mx-auto">
                {[
                  { icon: "✔", text: "단순 나열이 아닌 — 명리학자가 당신의 인생을 통찰하는 방식으로 서술" },
                  { icon: "✔", text: "\"이게 나 얘기네\" 싶은 일상 장면 묘사로 공감 극대화" },
                  { icon: "✔", text: "추상적 조언 없음 — 사주 데이터로 솔직하게 짚어드립니다" },
                ].map(({ icon, text }) => (
                  <li key={text} className="flex items-start gap-2 text-[13px] text-[#3a3a4a]">
                    <span className="text-teal-600 font-bold mt-0.5 shrink-0">{icon}</span>
                    <span>{text}</span>
                  </li>
                ))}
              </ul>
            </>
          )}

          {/* premium-saju 전용 헤더 강화 */}
          {product.slug === "premium-saju" && (
            <>
              {/* 27개 섹션 강조 배지 */}
              <div className="mt-3 inline-flex items-center gap-1.5 bg-[#1a1730] text-white text-xs font-bold px-3 py-1.5 rounded-full">
                <span>📑</span>
                <span>27개 섹션으로 사주 총정리</span>
              </div>

              {/* 커버리지 키워드 배지들 */}
              <div className="mt-3 flex flex-wrap gap-1.5 justify-center">
                {["일주·명식", "대운", "세운", "월운", "직업운", "재물운", "연애·배우자운", "건강운", "귀인·신살", "개운법"].map((kw) => (
                  <span key={kw}
                    className="text-[11px] font-semibold text-[#2D5C5C] bg-[#eaf4f4] border border-[#c0dede] px-2 py-0.5 rounded-full">
                    {kw}
                  </span>
                ))}
              </div>

              {/* 핵심 포인트 3개 */}
              <ul className="mt-4 space-y-1.5 text-left max-w-xs mx-auto">
                {[
                  { icon: "✔", text: "사주의 모든 것 — 명식·격국·신강신약부터 월별 운세까지" },
                  { icon: "✔", text: "지금 이 시점에 꼭 필요한 실전 조언 포함" },
                  { icon: "✔", text: "타업체 대비 절반 가격, 두 배 이상의 심층 리포트 (강추)" },
                ].map(({ icon, text }) => (
                  <li key={text} className="flex items-start gap-2 text-[13px] text-[#3a3a4a]">
                    <span className="text-teal-600 font-bold mt-0.5 shrink-0">{icon}</span>
                    <span>{text}</span>
                  </li>
                ))}
              </ul>
            </>
          )}

          {productOriginalPrices[product.slug] ? (
            <div className="mt-4 flex items-baseline gap-3 justify-center flex-wrap">
              <span className="text-sm text-[#aaa] line-through font-mono">
                정가 {formatKRW(productOriginalPrices[product.slug])}
              </span>
              <span className="text-2xl font-mono font-black text-[#2D5C5C]">
                {formatKRW(product.price)}
              </span>
              <span className="text-xs font-bold text-white bg-rose-500 px-2 py-0.5 rounded-full">
                {Math.round((1 - product.price / productOriginalPrices[product.slug]) * 100)}% OFF
              </span>
            </div>
          ) : (
            <p className="mt-4 text-2xl font-mono font-semibold text-[#2D5C5C]">{formatKRW(product.price)}</p>
          )}
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
          {/* 헤더 */}
          <div className="px-5 py-3.5 border-b border-[#f0ede8] bg-[#faf8f5] flex items-center justify-between">
            <p className="text-sm font-semibold text-[#2d2d2d]">📑 분석 구성</p>
            <span className="text-[11px] font-bold text-[#2D5C5C] bg-[#eaf4f4] px-2 py-0.5 rounded-full">총 27개 섹션</span>
          </div>

          {/* 분석 섹션 14개 */}
          <div className="px-5 pt-4 pb-2">
            <p className="text-[11px] font-bold tracking-widest text-[#aaa] mb-3">— 사주 심층 분석 · 14개 섹션</p>
            <ul className="space-y-2.5">
              {[
                { n: "01", title: "프롤로그 · 사주팔자 원국 구조",      desc: "시주·일주·월주·년주 전체 구조와 에너지 흐름 개관" },
                { n: "02", title: "일간의 본질 · 신강신약 분석",        desc: "일간 오행의 성질, 뿌리 깊이, 강약 판정" },
                { n: "03", title: "음양오행 · 십성(十星) 분포",         desc: "8글자 전체 음양 비율, 오행 과다·부족, 십성 구성 비율" },
                { n: "04", title: "격국(格局) · 용신(用神) 분석",       desc: "격국 성립 여부·성격·파격, 용신·기신·희신 지정" },
                { n: "05", title: "어린 시절 · 성장 환경 · 타고난 성품", desc: "년주·월주가 드러내는 가정환경과 기질" },
                { n: "06", title: "직업 적성 · 재능과 추천 직업군",     desc: "식상·재성·관성 구조로 보는 천직 분야" },
                { n: "07", title: "직장운 · 사업운 · 성공 전략",        desc: "관성 구조·합충에 따른 커리어 패턴과 전략" },
                { n: "08", title: "재물 그릇 · 타고난 경제 에너지",     desc: "재성 강약·통근 여부로 읽는 재물 그릇 크기" },
                { n: "09", title: "재물운 흐름 · 시기별 전략",          desc: "대운·세운 기반 재물 상승·하강 시기와 투자 조언" },
                { n: "10", title: "연애 성향 · 감정 패턴",              desc: "정재·편재·관성으로 보는 이성 에너지와 표현 방식" },
                { n: "11", title: "이상형 · 배우자운 · 결혼 시기",      desc: "배우자궁 분석, 인연 시기 예측, 결혼 안정도" },
                { n: "12", title: "건강운 · 체질과 주의 부위",          desc: "오행 과부족이 드러내는 체질 약점과 관리법" },
                { n: "13", title: "귀인운 · 인간관계 패턴",             desc: "천을귀인·문창귀인 등 귀인 구조와 사람 운" },
                { n: "14", title: "대운(大運) 흐름 · 황금기와 저점",    desc: "현재 대운부터 향후 3개 대운의 에너지 등락 예측" },
              ].map(({ n, title, desc }) => (
                <li key={n} className="flex items-start gap-3">
                  <span className="shrink-0 text-[10px] font-bold font-mono text-[#2D5C5C] bg-[#eaf4f4] rounded px-1.5 py-0.5 mt-0.5 min-w-[30px] text-center">{n}</span>
                  <div>
                    <p className="text-sm font-semibold text-[#1a1730]">{title}</p>
                    <p className="text-xs text-[#888] mt-0.5 leading-snug">{desc}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* 월별 운세 12개 */}
          <div className="px-5 pt-4 pb-2 mt-1 border-t border-[#f0ede8]">
            <p className="text-[11px] font-bold tracking-widest text-[#aaa] mb-3">— 월별 상세 운세 · 12개월</p>
            <div className="rounded-xl bg-[#f8f5f0] border border-[#ede8e0] px-4 py-3 flex items-start gap-3">
              <span className="shrink-0 text-[10px] font-bold font-mono text-[#c4913a] bg-[#fdf5e6] border border-[#e8d8b0] rounded px-1.5 py-0.5 mt-0.5">15–26</span>
              <div>
                <p className="text-sm font-semibold text-[#1a1730]">현재월부터 12개월 각각 심층 분석</p>
                <p className="text-xs text-[#888] mt-0.5 leading-snug">간지·십성·12운성 표 + 직업·재물·인간관계·건강 문단 + 이달의 핵심 키워드</p>
              </div>
            </div>
          </div>

          {/* 마무리 */}
          <div className="px-5 pt-4 pb-4 mt-1 border-t border-[#f0ede8]">
            <p className="text-[11px] font-bold tracking-widest text-[#aaa] mb-3">— 마무리 · 1개 섹션</p>
            <div className="rounded-xl bg-[#1a1730] px-4 py-3 flex items-start gap-3">
              <span className="shrink-0 text-[10px] font-bold font-mono text-[#c4913a] bg-[#c4913a]/20 rounded px-1.5 py-0.5 mt-0.5">27</span>
              <div>
                <p className="text-sm font-semibold text-white">합충형해파 · 개운법 · 종합 결론</p>
                <p className="text-xs text-white/60 mt-0.5 leading-snug">신살·합충 종합 + 용신 기반 실천 개운법 + 당신에게 보내는 마지막 메시지</p>
              </div>
            </div>
          </div>
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

      {product.slug === "basic-saju" && (
        <section className="mb-10 rounded-2xl border border-[#e8e4dd] bg-white overflow-hidden shadow-sm">
          {/* 헤더 */}
          <div className="px-5 py-3.5 border-b border-[#f0ede8] bg-[#faf8f5] flex items-center justify-between">
            <p className="text-sm font-semibold text-[#2d2d2d]">📝 분석 구성</p>
            <span className="text-[11px] font-bold text-[#2D5C5C] bg-[#eaf4f4] px-2 py-0.5 rounded-full">총 9개 챕터</span>
          </div>

          {/* 9챕터 목록 */}
          <div className="px-5 pt-4 pb-4">
            <p className="text-[11px] font-bold tracking-widest text-[#aaa] mb-3">— 사주 핵심 분석 · 9개 챕터</p>
            <ul className="space-y-3">
              {[
                { n: "01", title: "사주팔자 총평 — 당신의 인생 설계도", desc: "일주(日柱) 한자명 명시, 4기둥 에너지 구조와 이 사주를 타고났다는 것의 의미" },
                { n: "02", title: "오행(五行) 분포 — 에너지의 지형도",   desc: "목·화·토·금·수 실제 개수와 비율, 과다·과소 오행이 삶에 어떻게 발현되는지" },
                { n: "03", title: "타고난 성격과 기질",                   desc: "일간 음양·오행·십성(十星) 기반, 성격의 빛과 그늘, 감정 패턴 분석" },
                { n: "04", title: "재물운 — 돈과 나의 관계",             desc: "재성(財星) 구조·강약·통근, 재물 그릇 크기와 돈이 새는 패턴 풀이" },
                { n: "05", title: "연애운 — 이성과의 인연 흐름",         desc: "관성·재성으로 본 연애 패턴, 반복되는 감정 구조와 이상형 분석" },
                { n: "06", title: "직업 적성 — 나에게 맞는 일의 방향",   desc: "용신·격국·식상(食傷) 기반, 어떤 환경에서 에너지가 살아나는지" },
                { n: "07", title: "올해의 운세 흐름",                     desc: "세운(歲運)이 원국에 작용하는 방식, 상반기·하반기 에너지 흐름과 주의 시기" },
                { n: "08", title: "개운법 — 운을 바꾸는 실천 방법",      desc: "용신(用神) 기반 방위·색상·생활 습관 개운법 5가지 이상, 부적 없이 일상 실천" },
                { n: "09", title: "마무리 — 당신에게 보내는 메시지",     desc: "전체 분석을 통합한 따뜻한 격려, 사주는 운명의 굴레가 아닌 나침반임을 상기" },
              ].map(({ n, title, desc }) => (
                <li key={n} className="flex items-start gap-3">
                  <span className="shrink-0 text-[10px] font-bold font-mono text-[#2D5C5C] bg-[#eaf4f4] rounded px-1.5 py-0.5 mt-0.5 min-w-[30px] text-center">{n}</span>
                  <div>
                    <p className="text-sm font-semibold text-[#1a1730]">{title}</p>
                    <p className="text-xs text-[#888] mt-0.5 leading-snug">{desc}</p>
                  </div>
                </li>
              ))}
            </ul>

            {/* 이 풀이만의 특징 */}
            <div className="mt-5 rounded-xl bg-[#1a1730] px-4 py-3">
              <p className="text-xs font-bold text-[#c4913a] mb-2">✦ 가벼운 시선만의 풀이 방식</p>
              <ul className="space-y-1">
                {[
                  "\"지금까지 이렇게 살아오셨을 겁니다\" — 과거를 짚는 공감 서술 포함",
                  "\"솔직히 말씀드리면~\" 직설적 통찰로 당신의 패턴을 단언",
                  "추상적 조언 없이, 챕터 끝에 딱 한 줄의 실천 제안만",
                ].map((t) => (
                  <li key={t} className="text-[11px] text-white/70 flex items-start gap-1.5">
                    <span className="text-[#c4913a] shrink-0 mt-0.5">·</span>
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      )}

      {/* ziwei-saju 전용 16챕터 상세 섹션 */}
      {product.slug === "ziwei-saju" && (
        <section className="mb-10 rounded-2xl overflow-hidden shadow-sm" style={{ border: "1px solid rgba(196,145,58,0.3)", background: "linear-gradient(135deg, #1a1730 0%, #2d2050 100%)" }}>
          {/* 헤더 */}
          <div className="px-5 py-3.5 border-b flex items-center justify-between" style={{ borderColor: "rgba(196,145,58,0.2)" }}>
            <p className="text-sm font-semibold text-[#c4913a]">⭐ 분석 구성</p>
            <span className="text-[11px] font-bold text-[#c4913a] bg-[#c4913a]/10 border border-[#c4913a]/20 px-2 py-0.5 rounded-full">총 16개 챕터</span>
          </div>

          {/* 사주 vs 자미두수 비교 */}
          <div className="px-5 pt-4 pb-2">
            <p className="text-[11px] font-bold tracking-widest text-white/30 mb-3">— 자미두수(紫微斗數)란?</p>
            <div className="rounded-xl bg-white/5 border border-white/10 overflow-hidden">
              {[
                { label: "분석 단위", saju: "8글자 (천간·지지)", ziwei: "12궁 × 14주성 × 사화" },
                { label: "시각화", saju: "4×2 사주 명식표", ziwei: "4×4 명반 도식" },
                { label: "강점", saju: "전체 기질 종합 분석", ziwei: "영역별 정밀 분석" },
                { label: "재물운", saju: "재성 구조 분석", ziwei: "재백궁 5,000자 집중 분석" },
              ].map(({ label, saju, ziwei }) => (
                <div key={label} className="grid grid-cols-3 text-[11px] border-b border-white/5 last:border-0">
                  <div className="px-3 py-2 text-white/40 font-semibold">{label}</div>
                  <div className="px-3 py-2 text-white/50">{saju}</div>
                  <div className="px-3 py-2 text-[#c4913a] font-semibold">{ziwei}</div>
                </div>
              ))}
            </div>
          </div>

          {/* 16챕터 목록 */}
          <div className="px-5 pt-4 pb-4">
            <p className="text-[11px] font-bold tracking-widest text-white/30 mb-3">— 16개 챕터 상세 구성</p>
            <ul className="space-y-2.5">
              {[
                { n: "도입", title: "명반 전체 도식 + 오행국·명궁·신궁 요약", desc: "자미두수 명반 한눈에 보기", special: false },
                { n: "01", title: "명궁(命宮) — 당신이라는 별의 본질", desc: "명궁 주성 분석, 타고난 본질 기질, 삶의 패턴", special: false },
                { n: "02", title: "신궁(身宮) — 당신이 평생 머무는 자리", desc: "후천적으로 에너지를 쏟는 영역", special: false },
                { n: "03", title: "주성(主星) 종합 분석", desc: "14주성 조합 패턴과 인생 핵심 영향", special: false },
                { n: "04", title: "사화(四化) — 화록·화권·화과·화기", desc: "인생을 좌우하는 네 가지 변화의 기운 ★핵심 챕터", special: false },
                { n: "05", title: "형제궁·노복궁 — 인간관계의 자리", desc: "형제·친구·직장 동료와의 관계 패턴", special: false },
                { n: "06", title: "부처궁(夫妻宮) — 배우자와 결혼 생활", desc: "이상형·결혼 시기·결혼 생활 흐름", special: false },
                { n: "07", title: "자녀궁(子女宮)", desc: "자녀운, 또는 후배·제자·창작물 영역", special: false },
                { n: "08", title: "재백궁(財帛宮) ★★ — 재물의 흐름과 그릇", desc: "재물 그릇·정재/편재·손재 패턴·대운별 흐름·분야별 분석", special: true },
                { n: "09", title: "전택궁(田宅宮) — 부동산·집·고향", desc: "부동산운, 이사·매매 적기, 방위", special: false },
                { n: "10", title: "관록궁(官祿宮) — 직업과 사회적 성취", desc: "적합 직업군, 직장 vs 사업, 명예운", special: false },
                { n: "11", title: "천이궁(遷移宮) — 이동·여행·해외운", desc: "이주 가능성, 해외 활동, 거주지 이동 영향", special: false },
                { n: "12", title: "질액궁(疾厄宮) — 건강과 신체", desc: "타고난 체질, 주의 부위 경향", special: false },
                { n: "13", title: "복덕궁(福德宮) — 정신적 만족과 내면", desc: "행복을 느끼는 영역, 취미·종교적 성향", special: false },
                { n: "14", title: "부모궁(父母宮) — 부모와의 관계", desc: "부모 인연, 성장 배경, 유산 가능성", special: false },
                { n: "15+", title: "대운·유년(大限·流年) — 10년 운명의 지도", desc: "대운 전체 흐름 + 향후 10년 유년 정밀 분석", special: false },
              ].map(({ n, title, desc, special }) => (
                <li key={n} className={`flex items-start gap-3 rounded-xl px-3 py-2.5 ${special ? "bg-[#c4913a]/10 border border-[#c4913a]/30" : ""}`}>
                  <span className={`shrink-0 text-[10px] font-bold font-mono rounded px-1.5 py-0.5 mt-0.5 min-w-[30px] text-center ${special ? "text-[#c4913a] bg-[#c4913a]/20" : "text-white/60 bg-white/10"}`}>{n}</span>
                  <div>
                    <p className={`text-sm font-semibold ${special ? "text-[#c4913a]" : "text-white/80"}`}>{title}</p>
                    <p className="text-xs text-white/40 mt-0.5 leading-snug">{desc}</p>
                  </div>
                </li>
              ))}
            </ul>

            {/* 차별성 다크박스 */}
            <div className="mt-5 rounded-xl bg-[#c4913a]/10 border border-[#c4913a]/30 px-4 py-3">
              <p className="text-xs font-bold text-[#c4913a] mb-2">✦ 별의시선(자미두수)만의 분석 방식</p>
              <ul className="space-y-1">
                {[
                  "4단 심층 풀이 강제: 명리 근거 → 의미 → 일상 사례 → 조언",
                  "\"솔직히 말씀드리면~\" 직설적 통찰 + \"~하셨을 거예요\" 과거 진단",
                  "코칭 문서 아님 — \"내 인생을 정확히 짚어줬다\"는 통찰·위로 중심",
                ].map((t) => (
                  <li key={t} className="text-[11px] text-white/60 flex items-start gap-1.5">
                    <span className="text-[#c4913a] shrink-0 mt-0.5">·</span>
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
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
        ) : product.slug === "ziwei-saju" ? (
          <ZiweiForm
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
