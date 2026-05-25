-- =====================================================
-- 상품 가격 최종 수정 (배너 표시 가격과 동일하게)
-- =====================================================
-- 실행: https://supabase.com/dashboard/project/ihrqblpkcpkycjykdyqj/sql/new

UPDATE public.products SET name = '오늘의 운세',  price = 0     WHERE slug = 'today-fortune';
UPDATE public.products SET name = '꿈꾸는 시선',  price = 1900  WHERE slug = 'dream-reading';
UPDATE public.products SET name = '가벼운 시선',  price = 4900  WHERE slug = 'basic-saju';
UPDATE public.products SET name = '연인의 시선',  price = 15000 WHERE slug = 'love-saju';
UPDATE public.products SET name = '깊은 시선',    price = 20000 WHERE slug = 'premium-saju';

-- 꿈꾸는 시선 없으면 추가
INSERT INTO public.products (slug, name, description, price, display_order, is_active)
VALUES ('dream-reading', '꿈꾸는 시선', '잊을 수 없는 꿈의 상징과 메시지를 동양 해몽으로 풀어드립니다', 1900, 15, true)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name, price = EXCLUDED.price,
  display_order = EXCLUDED.display_order, is_active = EXCLUDED.is_active;

-- 확인
SELECT slug, name, price FROM public.products ORDER BY price;
