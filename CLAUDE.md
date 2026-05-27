# 시선사주 (saju-allsite) — Claude 작업 가이드

## 프로젝트 개요

- **프레임워크**: Next.js 15 App Router + TypeScript
- **DB**: Supabase (PostgreSQL + RLS)
- **결제**: Toss Payments
- **AI**: OpenAI / Claude (LLM_PROVIDER 환경변수로 전환)
- **사주 API**: luckyloveme.com (SAJU_API_URL + SAJU_API_KEY)
- **패키지 매니저**: pnpm
- **배포**: Vercel (main 브랜치 push → 자동 배포)

---

## 보안 원칙

- **API 키·시크릿은 절대 git 커밋 금지** (`.env.local` 또는 Vercel 환경변수에서만 관리)
- 특히 `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `SUPABASE_SECRET_KEY`, `TOSS_SECRET_KEY`

---

## Supabase 마이그레이션 필수 규칙 ⚠️

> **2026-05-30부터**: 신규 Supabase 프로젝트의 새 테이블은 명시적 GRANT 없이 PostgREST/GraphQL/supabase-js 접근 불가.
> **2026-10-30부터**: 기존 프로젝트(이 프로젝트 포함) 전면 적용.

### 새 테이블 생성 시 반드시 포함해야 할 3가지

```sql
-- ① RLS 활성화
ALTER TABLE public.새테이블 ENABLE ROW LEVEL SECURITY;

-- ② 명시적 GRANT (역할에 맞게 조정)
GRANT SELECT ON public.새테이블 TO anon;                          -- 비로그인 읽기 허용 시
GRANT SELECT, INSERT, UPDATE, DELETE ON public.새테이블 TO authenticated; -- 로그인 사용자

-- ③ RLS 정책 최소 1개
CREATE POLICY "새테이블 self select"
  ON public.새테이블 FOR SELECT
  USING (auth.uid() = user_id);
```

> **서버 전용 테이블** (service_role 키로만 접근): GRANT 생략 가능, RLS만 활성화.

### 마이그레이션 파일 전체 템플릿

```sql
-- 0012_example.sql
CREATE TABLE public.새테이블 (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        REFERENCES auth.users(id) ON DELETE CASCADE,
  content     TEXT,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE public.새테이블 ENABLE ROW LEVEL SECURITY;

-- GRANT (2026-10 정책 대응)
GRANT SELECT ON public.새테이블 TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.새테이블 TO authenticated;

-- 정책
CREATE POLICY "새테이블 self select"
  ON public.새테이블 FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "새테이블 self insert"
  ON public.새테이블 FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "새테이블 self delete"
  ON public.새테이블 FOR DELETE
  USING (auth.uid() = user_id);
```

### 기존 테이블 현황 (이미 처리 완료)

`supabase/migrations/0002_rls.sql`에서 RLS + 정책 적용됨:

| 테이블 | RLS | 정책 | GRANT |
|--------|-----|------|-------|
| `profiles` | ✅ | 본인만 select/update | 기존 프로젝트 기본값 (2026-10까지 유효) |
| `products` | ✅ | 공개 read (is_active=true) | 동일 |
| `orders` | ✅ | 본인만 select | 동일 |
| `saju_inputs` | ✅ | 본인 주문 경유 select | 동일 |
| `saju_results` | ✅ | 본인 주문 경유 select | 동일 |
| `reviews` | ✅ | 공개 read + 본인 CUD | 동일 |

---

## 코드 컨벤션

### Supabase 클라이언트 선택

```typescript
// 서버 컴포넌트 / Route Handler — service_role (RLS 우회)
import { createServiceClient } from "@/lib/supabase/server";
const svc = createServiceClient();

// 서버 컴포넌트 — 로그인 사용자 컨텍스트 (RLS 적용)
import { createClient } from "@/lib/supabase/server";
const supabase = await createClient();

// 클라이언트 컴포넌트
import { createClient } from "@/lib/supabase/client";
const supabase = createClient();
```

### serverEnv() 주의사항

`serverEnv()`는 zod로 모든 서버 환경변수를 한 번에 검증 → 변수 하나라도 없으면 500 유발.
**특정 라우트에서 일부 환경변수만 필요한 경우** `process.env.XXX` 직접 사용:

```typescript
// 권장 패턴 (카카오 콜백, free-confirm 등)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SECRET_KEY;
if (!supabaseUrl || !supabaseKey) {
  return NextResponse.json({ error: "서버 설정 오류" }, { status: 500 });
}
```

### Admin 인증 패턴

```typescript
// API Route Handler
import { isAdminAuthenticated } from "@/lib/admin-auth";
if (!(await isAdminAuthenticated())) {
  return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
}

// Page (서버 컴포넌트)
import { requireAdminPassword } from "@/lib/admin-auth";
await requireAdminPassword("/admin/orders"); // 미인증 시 /admin/login 리다이렉트
```

### 사주 API 호출 패턴

```typescript
import { isSajuApiConfigured, fetchSajuAnalysis, ALL_FIELDS } from "@/lib/saju/saju-api";

if (isSajuApiConfigured()) {
  const analysis = await fetchSajuAnalysis(birthInfo, ALL_FIELDS, { source: "confirm" });
} else {
  // fallback: computeMyeongsik() 사용
}
```

---

## 환경변수 목록

| 변수 | 필수 | 용도 |
|------|------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Supabase 프로젝트 URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Supabase anon 키 |
| `SUPABASE_SECRET_KEY` | ✅ | Supabase service_role 키 |
| `TOSS_SECRET_KEY` | ✅ | 토스페이먼츠 시크릿 |
| `NEXT_PUBLIC_TOSS_CLIENT_KEY` | ✅ | 토스페이먼츠 클라이언트 |
| `LLM_PROVIDER` | ✅ | `openai` 또는 `anthropic` |
| `LLM_MODEL` | ✅ | 예: `gpt-4o` |
| `OPENAI_API_KEY` | 조건부 | LLM_PROVIDER=openai 시 필수 |
| `ANTHROPIC_API_KEY` | 조건부 | LLM_PROVIDER=anthropic 시 필수 |
| `SAJU_API_URL` | 권장 | `https://luckyloveme.com/api/saju-full-analysis` |
| `SAJU_API_KEY` | 권장 | luckyloveme.com API 키 |
| `ADMIN_PASSWORD` | ✅ | 어드민 로그인 비밀번호 |
| `ADMIN_ID` | 선택 | 어드민 로그인 아이디 |
| `RESEND_API_KEY` | 선택 | 이메일 발송 |
| `NEXT_PUBLIC_SITE_URL` | ✅ | 배포 도메인 (예: https://www.saju7.kr) |
