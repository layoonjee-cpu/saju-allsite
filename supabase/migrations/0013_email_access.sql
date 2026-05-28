-- =====================================================
-- 분석지 이메일 발송 시간 + 7일 열람 만료 지원
-- =====================================================
ALTER TABLE public.saju_results
  ADD COLUMN IF NOT EXISTS email_sent_at TIMESTAMPTZ;

COMMENT ON COLUMN public.saju_results.email_sent_at IS
  '이메일 발송 시각. 고객은 발송 후 7일간 /results/{id} 열람 가능. 어드민은 항상 열람 가능.';
