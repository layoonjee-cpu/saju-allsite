-- 타로의 시선 상품 + tarot_readings 테이블

-- 상품 추가
INSERT INTO products (slug, name, description, price, display_order, is_active)
VALUES ('tarot-siren', '타로의 시선', '78장 오리엔탈 타로 3카드 리딩 — 현재의 고민에 대한 타로의 시선', 5000, 10, true)
ON CONFLICT (slug) DO NOTHING;

-- tarot_readings 테이블
CREATE TABLE IF NOT EXISTS public.tarot_readings (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id        UUID        NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  category        TEXT        NOT NULL CHECK (category IN ('연애','금전','직업','기타')),
  question        TEXT        NOT NULL,
  card_1_id       SMALLINT    NOT NULL,
  card_1_reversed BOOLEAN     NOT NULL DEFAULT false,
  card_2_id       SMALLINT    NOT NULL,
  card_2_reversed BOOLEAN     NOT NULL DEFAULT false,
  card_3_id       SMALLINT    NOT NULL,
  card_3_reversed BOOLEAN     NOT NULL DEFAULT false,
  reading_text    TEXT,
  llm_model       TEXT,
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE public.tarot_readings ENABLE ROW LEVEL SECURITY;

-- GRANT (2026-10 정책 대응)
GRANT SELECT ON public.tarot_readings TO anon;
GRANT SELECT, INSERT, UPDATE ON public.tarot_readings TO authenticated;

-- 본인 주문을 통해서만 조회 가능
CREATE POLICY "tarot self select"
  ON public.tarot_readings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders o
      WHERE o.id = tarot_readings.order_id
        AND (
          o.user_id = auth.uid()
          OR o.guest_email = (SELECT email FROM auth.users WHERE id = auth.uid())
        )
    )
  );

-- service_role 키로만 insert/update (API route에서 createServiceClient() 사용)
CREATE POLICY "service insert"
  ON public.tarot_readings FOR INSERT
  WITH CHECK (true);

CREATE POLICY "service update"
  ON public.tarot_readings FOR UPDATE
  USING (true);
