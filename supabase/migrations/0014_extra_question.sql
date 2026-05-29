-- 추가 질문 기능: saju_results에 extra_question / extra_question_answer 컬럼 추가
-- 후기 작성 후 1회 무료 추가 질문 풀이 저장용

ALTER TABLE public.saju_results
  ADD COLUMN IF NOT EXISTS extra_question       TEXT,
  ADD COLUMN IF NOT EXISTS extra_question_answer TEXT;

COMMENT ON COLUMN public.saju_results.extra_question       IS '후기 작성 후 1회 무료 추가 질문 내용 (NULL = 미사용)';
COMMENT ON COLUMN public.saju_results.extra_question_answer IS '추가 질문 LLM 답변';
