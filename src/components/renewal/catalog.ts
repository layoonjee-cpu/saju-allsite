import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import { productsSeed } from "@/config/products.seed";

export type CatalogProduct = { slug: string; name: string; description: string; price: number };
export async function getCatalog(): Promise<CatalogProduct[]> {
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const { data } = await supabase.from("products").select("slug, name, description, price").eq("is_active", true).order("display_order", { ascending: true });
    if (data?.length) return data;
  }
  return productsSeed.filter(p => p.is_active).sort((a,b) => a.display_order - b.display_order).map(({slug,name,description,price}) => ({slug,name,description,price}));
}

export const editorial: Record<string, { eyebrow: string; question: string; detail: string; image: string; group: string; includes: string[] }> = {
  "today-fortune": { eyebrow: "FREE · 매일", question: "오늘, 무엇을 먼저 살펴볼까요?", detail: "하루의 흐름을 짧고 가볍게 확인해요.", image: "/product-today.png", group: "start", includes: ["오늘의 기운", "실천 조언"] },
  "ilju-sticker": { eyebrow: "나를 알아가는 작은 시작", question: "내 일주를 한 장에 담는다면?", detail: "나의 기질을 간직하는 일주 스티커.", image: "/sticker2.png", group: "start", includes: ["일주 키워드", "나만의 스티커"] },
  "dream-reading": { eyebrow: "꿈 · 1,900원", question: "그 꿈이 계속 마음에 남나요?", detail: "기억에 남은 꿈의 상징을 읽어드려요.", image: "/product-dream.png", group: "start", includes: ["꿈의 상징", "지금의 메시지"] },
  "basic-saju": { eyebrow: "첫 사주 · 추천", question: "나는 어떤 사람일까요?", detail: "성격부터 재물·연애·직업까지, 9개 장으로 읽는 나의 기본 지도.", image: "/product-basic.png", group: "start", includes: ["일주와 오행", "성격·재물·연애", "직업과 올해 흐름"] },
  "tarot-siren": { eyebrow: "지금의 고민", question: "선택 앞에서 마음이 흔들릴 때", detail: "한 가지 질문을 세 장의 카드로 살펴봐요.", image: "/product-tarot.png", group: "focus", includes: ["질문 입력", "3카드 리딩"] },
  "love-saju": { eyebrow: "관계 · 궁합", question: "우리 사이를 더 잘 이해하려면?", detail: "두 사람의 기질과 관계의 흐름을 함께 읽어요.", image: "/product-love.png", group: "focus", includes: ["두 사람의 궁합", "관계의 흐름", "함께할 조언"] },
  "ziwei-saju": { eyebrow: "자미두수 · 심층", question: "인생의 영역별 지도가 필요할 때", detail: "별의 배치를 통해 재물·일·관계 등 삶의 영역을 살펴봐요.", image: "/product-ziwei.png", group: "deep", includes: ["12궁 분석", "재백궁·관록궁", "대운의 흐름"] },
  "premium-saju": { eyebrow: "VIP · 종합 보고서", question: "내 삶을 한 권의 보고서로", detail: "사주 원국부터 대운·재물·관계까지 깊게 읽는 종합 분석.", image: "/product-premium.png", group: "deep", includes: ["27개 분석 섹션", "대운·세운·월운", "재물·직업·관계"] },
};
export function productHref(slug: string) { return slug === "tarot-siren" ? "/tarot" : `/products/${slug}`; }
