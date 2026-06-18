import Link from "next/link";
import { redirect } from "next/navigation";
import { clearAdminCookie } from "@/lib/admin-auth";

const adminNavItems = [
  { label: "대시보드", href: "/admin" },
  { label: "주문 관리", href: "/admin/orders" },
  { label: "VIP 관리", href: "/admin/vip" },
  { label: "쿠폰 관리", href: "/admin/coupons" },
  { label: "후기 관리", href: "/admin/reviews" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  async function logout() {
    "use server";
    await clearAdminCookie();
    redirect("/admin/login");
  }

  return (
    <div className="min-h-screen bg-[#F5F0E6]">
      {/* 어드민 전용 상단 헤더 */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#2D5C5C] shadow-sm">
        <div className="container flex h-14 items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            {/* 브랜드 */}
            <Link href="/admin" className="flex items-center gap-2 shrink-0">
              <span className="text-[11px] font-mono tracking-[0.2em] text-white/50 uppercase">Admin</span>
              <span className="text-white/20 text-xs">|</span>
              <span
                className="font-bold text-[15px] tracking-tight text-white"
                style={{ fontFamily: "var(--font-display)" }}
              >
                시선 視線
              </span>
            </Link>

            {/* 네비게이션 */}
            <nav className="hidden sm:flex items-center gap-0.5">
              {adminNavItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="px-3 py-1.5 rounded text-[12px] font-medium text-white/65 hover:text-white hover:bg-white/10 transition-colors whitespace-nowrap"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* 로그아웃 */}
          <form action={logout}>
            <button
              type="submit"
              className="text-[12px] text-white/50 hover:text-white/80 transition-colors px-2 py-1 rounded hover:bg-white/10"
            >
              로그아웃
            </button>
          </form>
        </div>

        {/* 모바일 서브 네비 */}
        <div className="sm:hidden border-t border-white/10 px-4 py-1.5 flex gap-3 overflow-x-auto">
          {adminNavItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-[11px] text-white/60 hover:text-white whitespace-nowrap py-1"
            >
              {item.label}
            </Link>
          ))}
        </div>
      </header>

      {/* 페이지 콘텐츠 */}
      <div className="min-h-[calc(100vh-3.5rem)]">{children}</div>
    </div>
  );
}
