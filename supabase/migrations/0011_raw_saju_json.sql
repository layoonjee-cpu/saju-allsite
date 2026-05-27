-- 16종 원본 사주 API 응답 저장 컬럼 추가
-- 어드민 "데이터" 버튼에서 조회 + GPTs 붙여넣기용
ALTER TABLE public.saju_results
  ADD COLUMN IF NOT EXISTS raw_saju_json JSONB;

COMMENT ON COLUMN public.saju_results.raw_saju_json
  IS '운세위키 API 16종 원본 응답 JSON (ganji/sipseong/격국/대운/월운 등)';
