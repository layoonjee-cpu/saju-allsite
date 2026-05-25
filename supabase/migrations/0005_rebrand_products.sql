-- =====================================================
-- 시선(視線) 리브랜딩 — 상품 업데이트
-- =====================================================
-- Supabase SQL Editor에서 실행:
-- https://supabase.com/dashboard/project/ihrqblpkcpkycjykdyqj/sql/new

-- 기존 상품 업데이트
UPDATE public.products SET
  name        = '오늘의 운세',
  description = '매일 아침 새로 길어 올린 짧은 통찰. 오늘 하루의 결.',
  price       = 0,
  display_order = 10
WHERE slug = 'today-fortune';

UPDATE public.products SET
  name        = '가벼운 시선',
  description = '사주 명식과 기본 구조를 통해 간단히 알아보는 첫걸음. A4 3장',
  price       = 4900,
  display_order = 20
WHERE slug = 'basic-saju';

UPDATE public.products SET
  name        = '연인의 시선',
  description = '두 사람의 궁합과 애정운 분석. 갈등 구조 해결 조언. A4 10장',
  price       = 15000,
  display_order = 30
WHERE slug = 'love-saju';

UPDATE public.products SET
  name        = '깊은 시선',
  description = '사주 원국 정밀 분석부터 대운·재물·연애·개운법까지. A4 80장',
  price       = 20000,
  display_order = 40
WHERE slug = 'premium-saju';

-- 신규 상품: 꿈꾸는 시선 (꿈해몽)
INSERT INTO public.products (slug, name, description, price, display_order, is_active)
VALUES (
  'dream-reading',
  '꿈꾸는 시선',
  '잊을 수 없는 꿈의 상징과 메시지를 동양 해몽으로 풀어드립니다',
  1900,
  15,
  true
)
ON CONFLICT (slug) DO UPDATE SET
  name          = EXCLUDED.name,
  description   = EXCLUDED.description,
  price         = EXCLUDED.price,
  display_order = EXCLUDED.display_order,
  is_active     = EXCLUDED.is_active;

-- 확인용
SELECT slug, name, price, display_order, is_active
FROM public.products
ORDER BY display_order;
