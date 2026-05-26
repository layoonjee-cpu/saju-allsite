import { redirect } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { setAdminCookie, isAdminAuthenticated, isAdminConfigured } from "@/lib/admin-auth";
import { serverEnv } from "@/lib/env";

export const metadata = { title: "관리자 로그인 | 시선 어드민" };

type SearchParams = Promise<{ from?: string; error?: string; unconfigured?: string }>;

export default async function AdminLoginPage({ searchParams }: { searchParams: SearchParams }) {
  const { from, error, unconfigured } = await searchParams;
  const dest = from && from.startsWith("/admin") ? from : "/admin";

  // 이미 인증돼 있으면 바로 통과
  if (await isAdminAuthenticated()) redirect(dest);

  const hasAdminId = isAdminConfigured() ? serverEnv().ADMIN_ID.length > 0 : false;

  async function login(formData: FormData) {
    "use server";
    const id = String(formData.get("id") ?? "");
    const password = String(formData.get("password") ?? "");
    const fromField = String(formData.get("from") ?? "/admin");
    const target = fromField.startsWith("/admin") ? fromField : "/admin";
    const ok = await setAdminCookie(id, password);
    if (!ok) {
      redirect(`/admin/login?from=${encodeURIComponent(target)}&error=1`);
    }
    redirect(target);
  }

  const configured = isAdminConfigured();

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-3.5rem)] py-16 px-4">
      <div className="w-full max-w-sm">
        {/* 헤더 */}
        <header className="mb-8 text-center">
          <p className="text-[10px] font-mono tracking-[0.25em] text-[#2D5C5C]/60 uppercase mb-3">
            Admin Login
          </p>
          <h1 className="text-2xl font-semibold tracking-tight text-[#1A1A1A]">관리자 로그인</h1>
          <p className="mt-2 text-sm text-[#1A1A1A]/50">
            운영자 계정으로 로그인하세요
          </p>
        </header>

        {/* 미설정 안내 */}
        {(unconfigured === "1" || !configured) && (
          <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-xs text-amber-800 leading-relaxed">
            <p className="font-semibold mb-1">ADMIN_PASSWORD 가 설정되지 않았습니다</p>
            <p>
              <code className="font-mono bg-amber-100 px-1 rounded">.env.local</code> 에{" "}
              <code className="font-mono bg-amber-100 px-1 rounded">ADMIN_PASSWORD=비밀번호</code>를 추가하고
              서버를 재시작하세요.
            </p>
          </div>
        )}

        {/* 로그인 폼 */}
        <div className="bg-white rounded-2xl border border-[#2D5C5C]/10 shadow-sm p-6">
          <form action={login} className="space-y-3">
            <input type="hidden" name="from" value={dest} />

            {/* 아이디 */}
            <div>
              <label className="block text-xs font-medium text-[#1A1A1A]/60 mb-1.5">
                관리자 아이디{!hasAdminId && <span className="ml-1 text-[10px] text-amber-600">(ADMIN_ID 미설정 — 임의 입력)</span>}
              </label>
              <Input
                type="text"
                name="id"
                placeholder="아이디"
                autoComplete="username"
                autoFocus
                disabled={!configured}
                className="bg-[#F5F0E6]/60 border-[#2D5C5C]/15 focus:border-[#2D5C5C]/40 focus:ring-[#2D5C5C]/20"
              />
            </div>

            {/* 비밀번호 */}
            <div>
              <label className="block text-xs font-medium text-[#1A1A1A]/60 mb-1.5">
                비밀번호
              </label>
              <Input
                type="password"
                name="password"
                placeholder="비밀번호"
                autoComplete="current-password"
                required
                disabled={!configured}
                className="bg-[#F5F0E6]/60 border-[#2D5C5C]/15 focus:border-[#2D5C5C]/40 focus:ring-[#2D5C5C]/20"
              />
            </div>

            {/* 오류 메시지 */}
            {error === "1" && (
              <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                아이디 또는 비밀번호가 일치하지 않습니다.
              </p>
            )}

            <Button
              type="submit"
              className="w-full mt-1 bg-[#2D5C5C] hover:bg-[#2D5C5C]/90 text-white"
              disabled={!configured}
            >
              로그인
            </Button>
          </form>
        </div>

        <p className="text-center text-[11px] text-[#1A1A1A]/30 mt-6">
          시선 視線 관리자 전용 페이지입니다
        </p>
      </div>
    </div>
  );
}
