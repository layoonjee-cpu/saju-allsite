-- 고객 연락 이메일 컬럼 추가
ALTER TABLE public.saju_inputs
  ADD COLUMN IF NOT EXISTS customer_email TEXT;
