-- 인플루언서/이벤트용 쿠폰 테이블
CREATE TABLE public.coupons (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  code        TEXT        NOT NULL UNIQUE,
  product_id  UUID        REFERENCES public.products(id) ON DELETE SET NULL,
  uses_left   INTEGER     NOT NULL DEFAULT 1,  -- -1 = 무제한
  expires_at  TIMESTAMPTZ,                     -- NULL = 만료 없음
  note        TEXT,                            -- 메모 (예: "인플루언서 홍길동")
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- service_role만 접근 (어드민 전용)
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
