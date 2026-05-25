-- 연인/궁합(love-saju) 상품을 위한 파트너 사주 정보 컬럼 추가
-- 실행: https://supabase.com/dashboard/project/ihrqblpkcpkycjykdyqj/sql/new

ALTER TABLE public.saju_inputs
  ADD COLUMN IF NOT EXISTS partner_name          text,
  ADD COLUMN IF NOT EXISTS partner_birth_date    text,       -- "YYYY-MM-DD"
  ADD COLUMN IF NOT EXISTS partner_birth_time    text,       -- "HH:mm" | null
  ADD COLUMN IF NOT EXISTS partner_time_unknown  boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS partner_gender        text,       -- "male" | "female"
  ADD COLUMN IF NOT EXISTS partner_calendar      text;       -- "solar" | "lunar"

-- 확인
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'saju_inputs'
ORDER BY ordinal_position;
