-- 별의 시선 (자미두수) 상품 추가
-- Supabase SQL Editor에서 실행하세요:
-- https://supabase.com/dashboard/project/ihrqblpkcpkycjykdyqj/sql/new

INSERT INTO public.products (slug, name, description, price, display_order, is_active)
VALUES (
  'ziwei-saju',
  '별의시선(자미두수)',
  '12개 별이 비추는 당신 인생의 12개 영역 — 자미두수(紫微斗數) 정밀 분석 보고서',
  30000,
  50,
  true
)
ON CONFLICT (slug) DO UPDATE SET
  name          = EXCLUDED.name,
  description   = EXCLUDED.description,
  price         = EXCLUDED.price,
  display_order = EXCLUDED.display_order,
  is_active     = true;

-- 확인
SELECT id, slug, name, price, display_order, is_active
FROM public.products
ORDER BY display_order;
