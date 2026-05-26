// =====================================================
// 어드민 인증 — .env 의 ADMIN_ID + ADMIN_PASSWORD 기반 게이트
// =====================================================
// ADMIN_ID가 설정된 경우 아이디+비밀번호 모두 검증.
// ADMIN_ID가 비어있는 경우 비밀번호만 검증 (하위 호환).
// 로그인 시 토큰을 httpOnly 쿠키에 저장하고, 매 요청 동등 비교.
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { serverEnv } from "@/lib/env";

const COOKIE_NAME = "admin_session";
const MAX_AGE_SEC = 60 * 60 * 24 * 7; // 7일

function buildExpectedToken(): string {
  const { ADMIN_ID, ADMIN_PASSWORD } = serverEnv();
  return ADMIN_ID ? `${ADMIN_ID}|${ADMIN_PASSWORD}` : ADMIN_PASSWORD;
}

export function isAdminConfigured(): boolean {
  return serverEnv().ADMIN_PASSWORD.length > 0;
}

export async function isAdminAuthenticated(): Promise<boolean> {
  if (!isAdminConfigured()) return false;
  const expectedToken = buildExpectedToken();
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  return !!token && token === expectedToken;
}

// 어드민 페이지의 상단에서 호출 — 미인증이면 /admin/login 으로 리다이렉트
export async function requireAdminPassword(redirectFrom: string) {
  if (!isAdminConfigured()) {
    redirect(`/admin/login?from=${encodeURIComponent(redirectFrom)}&unconfigured=1`);
  }
  if (!(await isAdminAuthenticated())) {
    redirect(`/admin/login?from=${encodeURIComponent(redirectFrom)}`);
  }
}

export async function setAdminCookie(id: string, password: string): Promise<boolean> {
  const { ADMIN_ID, ADMIN_PASSWORD } = serverEnv();
  if (!ADMIN_PASSWORD) return false;
  if (password !== ADMIN_PASSWORD) return false;
  // ADMIN_ID가 설정된 경우에만 ID 검증
  if (ADMIN_ID && id !== ADMIN_ID) return false;
  const token = ADMIN_ID ? `${ADMIN_ID}|${ADMIN_PASSWORD}` : ADMIN_PASSWORD;
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE_SEC,
  });
  return true;
}

export async function clearAdminCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}
