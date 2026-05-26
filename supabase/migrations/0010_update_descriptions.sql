-- 상품 설명 문구 업데이트
UPDATE public.products SET
  description = '나의 사주로 읽는 타고난 성향과 운의 흐름 리포트'
WHERE slug = 'basic-saju';

UPDATE public.products SET
  description = '나와 연인·배우자의 궁합과 애정운 분석, 관계 조언'
WHERE slug = 'love-saju';
