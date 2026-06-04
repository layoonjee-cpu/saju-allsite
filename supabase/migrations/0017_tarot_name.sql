-- 타로 리딩에 이름 컬럼 추가, category/question 선택적으로 변경

ALTER TABLE public.tarot_readings ADD COLUMN IF NOT EXISTS name TEXT;

ALTER TABLE public.tarot_readings ALTER COLUMN category SET DEFAULT '기타';
ALTER TABLE public.tarot_readings ALTER COLUMN category DROP NOT NULL;

ALTER TABLE public.tarot_readings ALTER COLUMN question SET DEFAULT '';
ALTER TABLE public.tarot_readings ALTER COLUMN question DROP NOT NULL;
