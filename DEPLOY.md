# Vercel 배포 가이드

## 1. GitHub 에 푸시

이 보일러플레이트를 본인 GitHub repo 로 옮기세요 (README "별도 repo 로 분리하기" 참고).

## 2. Vercel 프로젝트 생성

1. https://vercel.com/new
2. **Import** → 본인 repo 선택
3. **Framework Preset**: Next.js (자동 감지)
4. **Root Directory**: 보일러플레이트 폴더가 repo 루트가 아니면 지정 (예: `saju-boilerplate`)
5. **Build Command**: 기본값 (`next build`)
6. **Install Command**: `pnpm install`

## 3. 환경변수 입력

Vercel 의 **Environment Variables** 섹션에서 `.env.example` 의 모든 키를 채워주세요.

| 키 | 값 |
|---|---|
| `NEXT_PUBLIC_SITE_URL` | `https://your-domain.vercel.app` (배포 후 도메인) |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 프로젝트 URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase publishable key (`sb_publishable_...`) — 구 anon 대체 |
| `SUPABASE_SECRET_KEY` | Supabase secret key (`sb_secret_...`) — 구 service_role 대체 (⚠️ Secret) |
| `NEXT_PUBLIC_TOSS_CLIENT_KEY` | 토스 client key |
| `TOSS_SECRET_KEY` | 토스 secret key (⚠️ Secret) |
| `LLM_PROVIDER` | `openai` / `anthropic` / `gemini` 중 하나 |
| `LLM_MODEL` | 예: `claude-sonnet-4-6`, `gpt-4o-mini`, `gemini-1.5-flash` |
| `ANTHROPIC_API_KEY` 등 | 선택한 provider 키 |

> ⚠️ `SUPABASE_SECRET_KEY`, `TOSS_SECRET_KEY` 는 절대 `NEXT_PUBLIC_` 접두사를 붙이지 마세요.

## 4. 배포

**Deploy** 클릭 → 2분 정도 기다리면 끝.

## 5. 배포 후 점검

1. 도메인 접속 → `/products` 에서 상품이 보이는지 확인
2. 토스 콘솔에서 **콜백 URL** 등록:
   - 성공: `https://<your-domain>/checkout/success`
   - 실패: `https://<your-domain>/checkout/fail`
3. Supabase Auth → URL Configuration:
   - **Site URL**: `https://<your-domain>`
   - **Redirect URLs**: `https://<your-domain>/auth/callback`
4. 테스트 키로 1건 결제해 보고 결과지까지 떨어지는지 확인
5. 라이브 키로 교체 + 한 번 더 결제 테스트 (소액 상품 추천)

## 도메인 연결

Vercel → Project → **Settings → Domains** 에서 본인 도메인 추가.
연결 후 `NEXT_PUBLIC_SITE_URL` 을 새 도메인으로 업데이트 → Redeploy.

## 모니터링

- **Vercel Analytics**: 페이지 트래픽
- **Supabase Dashboard → Logs**: SQL 에러
- **토스 콘솔 → 결제 내역**: 결제 성공/실패 추이
