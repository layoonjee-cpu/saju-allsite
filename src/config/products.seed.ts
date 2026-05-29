// =====================================================
// 상품 시드 (scripts/seed-products.ts 에서 사용)
// =====================================================

export type ProductSeed = {
  slug: string;
  name: string;
  description: string;
  price: number;
  display_order: number;
  is_active: boolean;
};

export const productsSeed: ProductSeed[] = [
  {
    slug: "today-fortune",
    name: "오늘의 운세",
    description: "매일 아침 새로 길어 올린 짧은 통찰. 오늘 하루의 결.",
    price: 0,
    display_order: 10,
    is_active: true,
  },
  {
    slug: "dream-reading",
    name: "꿈꾸는 시선",
    description: "잊을 수 없는 꿈의 상징과 메시지를 동양 해몽으로 풀어드립니다",
    price: 1900,
    display_order: 15,
    is_active: true,
  },
  {
    slug: "basic-saju",
    name: "가벼운 시선",
    description: "나의 사주로 읽는 타고난 성향과 운의 흐름 리포트",
    price: 4900,
    display_order: 20,
    is_active: true,
  },
  {
    slug: "love-saju",
    name: "연인의 시선",
    description: "나와 연인·배우자의 궁합과 애정운 분석, 관계 조언",
    price: 20000,
    display_order: 30,
    is_active: true,
  },
  {
    slug: "premium-saju",
    name: "깊은 시선",
    description: "사주 원국 정밀 분석부터 대운·재물·연애·개운법까지. A4 80장",
    price: 30000,
    display_order: 40,
    is_active: true,
  },
];
