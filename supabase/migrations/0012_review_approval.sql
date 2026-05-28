-- =====================================================
-- 후기 승인제 — status 컬럼 추가 + RLS 교체
-- =====================================================
-- 기존 is_public 대신 status('pending'|'approved'|'rejected')로
-- 운영자 승인 후 게시되는 방식으로 변경.

ALTER TABLE public.reviews
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending';

-- 기존 공개 후기를 approved로 이관
UPDATE public.reviews
  SET status = 'approved'
  WHERE is_public = true;

-- 기존 RLS 정책 교체 (is_public → status = 'approved')
DROP POLICY IF EXISTS "reviews public read" ON public.reviews;

CREATE POLICY "reviews public read"
  ON public.reviews FOR SELECT
  USING (status = 'approved');

-- 2026-10 정책 대응 GRANT
GRANT SELECT ON public.reviews TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reviews TO authenticated;

COMMENT ON COLUMN public.reviews.status IS 'pending | approved | rejected — 운영자 승인 후 approved로 변경 시 공개';
