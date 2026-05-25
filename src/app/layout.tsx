import type { Metadata } from "next";
import Link from "next/link";
import { Toaster } from "sonner";
import { siteConfig, businessInfo } from "@/config/site";
import { isSupabaseConfigured } from "@/lib/env";
import { getCurrentUser } from "@/lib/auth";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: siteConfig.name, template: `%s | ${siteConfig.name}` },
  description: siteConfig.description,
  metadataBase: new URL(siteConfig.url),
  openGraph: {
    title: siteConfig.name,
    description: siteConfig.description,
    type: "website",
    locale: "ko_KR",
  },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const isLoggedIn = isSupabaseConfigured() ? !!(await getCurrentUser()) : false;

  return (
    <html lang="ko">
      <body suppressHydrationWarning>
        <SiteHeader isLoggedIn={isLoggedIn} />
        <main className="min-h-[calc(100vh-7rem)]">{children}</main>
        <SiteFooter />
        <Toaster position="top-center" />
      </body>
    </html>
  );
}

const navItems = [
  { label: "오늘의 운세", href: "/products/today-fortune", badge: "무료", badgeColor: "from-emerald-500 to-teal-500" },
  { label: "꿈해몽", href: "/products/dream-reading" },
  { label: "가벼운 사주", href: "/products/basic-saju" },
  { label: "연인·궁합", href: "/products/love-saju", badge: "인기", badgeColor: "from-rose-500 to-pink-500" },
  { label: "깊은 시선 VIP", href: "/products/premium-saju", badge: "추천", badgeColor: "from-teal-600 to-cyan-600" },
];

function SiteHeader({ isLoggedIn }: { isLoggedIn: boolean }) {
  return (
    <header className="sticky top-0 z-50 border-b border-amber-200/50 bg-amber-50/80 backdrop-blur-xl shadow-[0_1px_12px_rgba(26,23,48,0.07)]">
      <div className="container flex h-16 items-center justify-between gap-4">

        {/* 로고 */}
        <Link href="/" className="flex items-center gap-2.5 shrink-0">
          <SiseonLogo />
          <span
            className="font-bold text-[20px] tracking-tight"
            style={{
              fontFamily: "var(--font-display)",
              background: "linear-gradient(135deg, #1a1730 0%, #2b6e6e 60%, #c4913a 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            {siteConfig.name}
          </span>
          <span
            className="hidden sm:block text-[11px] font-medium tracking-widest"
            style={{ color: "#c4913a", fontFamily: "var(--font-display)", opacity: 0.8 }}
          >
            視線
          </span>
        </Link>

        {/* 상품 메뉴 */}
        <nav className="flex items-center gap-0.5 overflow-x-auto scrollbar-hide">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="relative flex items-center gap-1.5 px-3 py-2 rounded-xl text-[13px] text-foreground/65 hover:text-teal-700 hover:bg-teal-50/70 transition-all duration-200 whitespace-nowrap"
              style={{ fontFamily: "var(--font-body)", fontWeight: 600 }}
            >
              {item.label}
              {"badge" in item && item.badge && (
                <span className={`inline-flex items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] font-bold bg-gradient-to-r ${item.badgeColor} text-white leading-none`}>
                  {item.badge}
                </span>
              )}
            </Link>
          ))}
        </nav>

        {/* 로그인 / 마이페이지 */}
        <div className="flex items-center gap-2 shrink-0">
          {isLoggedIn ? (
            <>
              <Link href="/mypage" className="text-[13px] font-medium text-foreground/65 hover:text-teal-700 transition-colors px-2">마이페이지</Link>
              <form action="/api/auth/signout" method="post">
                <button type="submit" className="text-[13px] font-medium text-foreground/65 hover:text-teal-700 transition-colors px-2">로그아웃</button>
              </form>
            </>
          ) : (
            <Link href="/login" className="inline-flex items-center justify-center h-9 px-5 rounded-full text-[13px] font-bold btn-gradient">
              로그인
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}

function SiseonLogo({ size = 36 }: { size?: number }) {
  return (
    <svg viewBox="0 0 48 48" width={size} height={size} aria-hidden="true">
      {/* 외부 원 — 먹빛 */}
      <circle cx="24" cy="24" r="21" fill="#1a1730" />
      {/* 눈 아몬드형 — 한지 크림 */}
      <path d="M8,24 Q24,11 40,24 Q24,37 8,24 Z" fill="#f7f3ec" opacity="0.95" />
      {/* 홍채 — 단청 청록 */}
      <circle cx="24" cy="24" r="7.5" fill="#2b6e6e" />
      {/* 동공 */}
      <circle cx="24" cy="24" r="4.2" fill="#1a1730" />
      {/* 하이라이트 */}
      <circle cx="26.5" cy="21.5" r="1.6" fill="white" />
      <circle cx="23" cy="26" r="0.8" fill="white" opacity="0.6" />
      {/* 시선 라인 — 금빛 */}
      <line x1="40" y1="24" x2="47" y2="24" stroke="#c4913a" strokeWidth="2.2" strokeLinecap="round" />
      {/* 속눈썹 곡선 */}
      <path d="M9,22 Q24,9 39,22" fill="none" stroke="#1a1730" strokeWidth="1.2" opacity="0.4" />
    </svg>
  );
}

function SiteFooter() {
  const businessLine = [
    businessInfo.companyName,
    `사업자등록번호: ${businessInfo.businessNumber}`,
    `통신판매업 신고번호: ${businessInfo.mailOrderNumber}`,
    `대표: ${businessInfo.representative}`,
    `주소: ${businessInfo.address}`,
  ].join(" | ");

  const contactLine = [
    `고객센터: ${businessInfo.email}`,
    businessInfo.phone
      ? `핸드폰${businessInfo.phoneNote ? `(${businessInfo.phoneNote})` : ""}: ${businessInfo.phone}`
      : null,
  ]
    .filter(Boolean)
    .join(" | ");

  return (
    <footer className="border-t border-amber-200/50 mt-20 bg-amber-50/40 backdrop-blur-sm">
      <div className="container py-10 space-y-4">
        <p className="text-sm font-semibold text-center text-foreground/70 tracking-wide">
          정통 명리학과 AI의 만남, 당신의 지금을 함께 읽어드립니다
        </p>
        <div className="flex flex-wrap justify-center gap-x-5 gap-y-1.5 text-xs">
          <Link href="/legal/terms" className="text-muted-foreground hover:text-teal-700 transition-colors">이용약관</Link>
          <Link href="/legal/privacy" className="text-muted-foreground hover:text-teal-700 transition-colors">개인정보처리방침</Link>
          <Link href="/legal/refund-policy" className="text-muted-foreground hover:text-teal-700 transition-colors">환불정책</Link>
        </div>
        <p className="text-[11px] text-muted-foreground leading-relaxed text-center">{businessLine}</p>
        <p className="text-[11px] text-muted-foreground leading-relaxed text-center">{contactLine}</p>
        <p className="text-[11px] text-muted-foreground text-center">© {new Date().getFullYear()} {siteConfig.name} 視線</p>
      </div>
    </footer>
  );
}
