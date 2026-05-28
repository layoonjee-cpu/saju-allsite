-- 분석지 수령 방법 컬럼 추가
-- 'web' = 결과 페이지 직접 열람 (기본)
-- 'email' = 이메일 자동 발송
-- 'kakao' = 카카오채널 안내
ALTER TABLE public.saju_inputs
  ADD COLUMN IF NOT EXISTS delivery_method TEXT NOT NULL DEFAULT 'web';
