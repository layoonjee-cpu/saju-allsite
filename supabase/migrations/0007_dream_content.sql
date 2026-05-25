-- =====================================================
-- 꿈해몽(dream-reading) 지원을 위한 스키마 변경
-- =====================================================
-- 실행: https://supabase.com/dashboard/project/ihrqblpkcpkycjykdyqj/sql/new

-- 1. birth_date를 NULL 허용으로 변경 (꿈해몽은 생년월일 불필요)
ALTER TABLE public.saju_inputs ALTER COLUMN birth_date DROP NOT NULL;

-- 2. dream_content 컬럼 추가
ALTER TABLE public.saju_inputs ADD COLUMN IF NOT EXISTS dream_content text;

-- 확인
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'saju_inputs'
ORDER BY ordinal_position;
