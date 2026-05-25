-- VIP 사주 PDF 보고서 생성 시스템용 컬럼 추가
-- generation_status: 'complete' | 'generating' | 'failed'
-- pdf_url: Supabase Storage의 서명 URL 기준 경로 (파일명)

ALTER TABLE public.saju_results
  ADD COLUMN IF NOT EXISTS generation_status TEXT DEFAULT 'complete',
  ADD COLUMN IF NOT EXISTS pdf_url TEXT;

COMMENT ON COLUMN public.saju_results.generation_status IS 'complete | generating | failed';
COMMENT ON COLUMN public.saju_results.pdf_url IS 'Supabase Storage vip-pdfs 버킷 내 파일 경로 (결과ID.pdf)';

-- 기존 레코드는 모두 'complete' (DEFAULT 값 자동 적용)
