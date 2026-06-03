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
| `LLM_MAX_TOKENS` | ✅ | `6000` — 기본사주 5,000자 미잘림 (Vercel에도 별도 추가) |
| `OPENAI_API_KEY` | 조건부 | LLM_PROVIDER=openai 시 필수 |
| `ANTHROPIC_API_KEY` | 조건부 | LLM_PROVIDER=anthropic 시 필수 |
| `SAJU_API_URL` | 권장 | `https://luckyloveme.com/api/saju-full-analysis` |
| `SAJU_API_KEY` | 권장 | luckyloveme.com API 키 |
| `ADMIN_PASSWORD` | ✅ | 어드민 로그인 비밀번호 |
| `ADMIN_ID` | 선택 | 어드민 로그인 아이디 |
| `RESEND_API_KEY` | 선택 | 이메일 발송 |
| `NEXT_PUBLIC_SITE_URL` | ✅ | 배포 도메인 — PDF 폰트 fetch에도 사용됨 |

---

## PDF 생성 기능 (어드민 전용)

### 개요
어드민 주문 관리 페이지에서 분석 완료된 결과지를 PDF로 생성·다운로드하는 기능.
`@react-pdf/renderer` (순수 JS, Vercel 서버리스 호환) 사용.

### 관련 파일
```
src/lib/pdf/
  fonts.ts                    ← 폰트 등록 (NEXT_PUBLIC_SITE_URL 기반 HTTP fetch)
  markdown-to-elements.tsx    ← 마크다운 → react-pdf 엘리먼트
  generate-saju-pdf.tsx       ← PDF 문서 생성 → Buffer 반환
  fonts/
    NotoSansKR-Regular.ttf    ← public/fonts/에도 동일 파일 있음
    NotoSansKR-Bold.ttf

src/app/api/admin/
  generate-pdf/[resultId]/route.ts   ← POST: PDF 생성 → Supabase Storage 업로드
  download-pdf/[resultId]/route.ts   ← GET: 5분 서명 URL 반환

src/components/admin/GeneratePdfButton.tsx
public/fonts/
  NotoSansKR-Regular.ttf      ← CDN 서빙용 (fonts.ts가 HTTP로 fetch)
  NotoSansKR-Bold.ttf
```

### 폰트 로딩 방식 (중요)
Vercel 서버리스에서 `process.cwd()/public/` 접근 불가 → `NEXT_PUBLIC_SITE_URL` 기반 HTTP URL로 fetch.
```typescript
// fonts.ts 핵심 로직
const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
Font.register({ src: `${base}/fonts/NotoSansKR-Regular.ttf`, ... });
```

### Supabase Storage 파일명 규칙
- **Storage 키 (ASCII only)**: `{productSlug}_{YYYYMMDD}_{resultId_앞8자리}.pdf`
  - 예: `basic-saju_20260602_fb318095.pdf`
- **다운로드 파일명 (한국어)**: `createSignedUrl`의 `download` 옵션으로 설정
  - 예: `가벼운시선_나윤지_20260602.pdf`

> ⚠️ Supabase Storage는 한국어 파일명(키) 업로드 시 `Invalid key` 400 에러 발생.
> 반드시 Storage 키는 ASCII만 사용할 것.

---

## LLM 거부 응답 처리

Claude 사용 시 점술/사주 프롬프트가 안전 필터에 걸릴 수 있음.

### 방지 조치
- `src/lib/saju/prompt.ts`: "점쟁이", "과거를 맞히듯" 등 표현 제거
- `confirm/test-confirm/free-confirm` 라우트: `isRefusal()` 체크 후 거부 응답 DB 저장 차단
- 결과 페이지: `isBadContent` 감지 시 `SajuRegenerateBanner` 자동 표시 후 재생성

### isRefusal 패턴
```typescript
function isRefusal(text: string): boolean {
  const lower = text.toLowerCase();
  return (
    text.trim().length < 200 ||
    lower.includes("i'm sorry") ||
    lower.includes("i cannot") ||
    lower.includes("i can't assist") ||
    lower.includes("죄송합니다만")
  );
}
```
