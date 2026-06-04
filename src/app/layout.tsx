import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Toaster } from "sonner";
import { siteConfig, businessInfo } from "@/config/site";
import { isSupabaseConfigured } from "@/lib/env";
import { getCurrentUser } from "@/lib/auth";
import { TopBanner } from "@/components/banner/TopBanner";
import { MobileMenu } from "@/components/layout/MobileMenu";
import { ConditionalSiteLayout } from "@/components/layout/ConditionalSiteLayout";
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
        <ConditionalSiteLayout
          topBanner={<TopBanner />}
          siteHeader={<SiteHeader isLoggedIn={isLoggedIn} />}
          siteFooter={<SiteFooter />}
        >
          {children}
        </ConditionalSiteLayout>
        <Toaster position="top-center" />
      </body>
    </html>
  );
}

const navItems = [
  { label: "시선사주 스토리", href: "/story" },
  { label: "오늘의 운세", href: "/products/today-fortune", badge: "무료", badgeColor: "from-emerald-500 to-teal-500" },
  { label: "꿈해몽", href: "/products/dream-reading" },
  { label: "일주스티커", href: "/products/ilju-sticker", badge: "NEW", badgeColor: "from-amber-500 to-orange-500" },
  { label: "타로의 시선", href: "/tarot", badge: "NEW", badgeColor: "from-[#c9a84c] to-[#e0bc5a]" },
  { label: "가벼운 사주", href: "/products/basic-saju" },
  { label: "연인·궁합", href: "/products/love-saju", badge: "인기", badgeColor: "from-rose-500 to-pink-500" },
  { label: "깊은 시선 VIP", href: "/products/premium-saju", badge: "추천", badgeColor: "from-teal-600 to-cyan-600" },
  { label: "자미두수", href: "/products/ziwei-saju", badge: "NEW", badgeColor: "from-violet-600 to-purple-600" },
];

function SiteHeader({ isLoggedIn }: { isLoggedIn: boolean }) {
  return (
    <header className="sticky top-0 z-50 border-b border-amber-200/50 bg-amber-50/80 backdrop-blur-xl shadow-[0_1px_12px_rgba(26,23,48,0.07)]">
      <div className="container flex h-16 items-center justify-between gap-4">

        {/* 로고 — 데스크톱 */}
        <Link href="/" className="hidden md:flex items-center shrink-0">
          <span
            className="font-bold text-[20px] tracking-tight"
            style={{
              fontFamily: "Georgia, serif",
              background: "linear-gradient(135deg, #1a1730 0%, #2b6e6e 60%, #c4913a 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            {siteConfig.name}
          </span>
          <span
            className="hidden sm:block text-[11px] font-medium tracking-widest ml-1.5"
            style={{ color: "#c4913a", opacity: 0.8 }}
          >
            視線
          </span>
        </Link>

        {/* 상품소개 — 모바일 좌측 */}
        <Link href="/products" className="md:hidden flex items-center shrink-0">
          <span
            className="font-bold text-[19px] tracking-tight"
            style={{
              fontFamily: "Georgia, serif",
              background: "linear-gradient(135deg, #1a1730 0%, #2b6e6e 60%, #c4913a 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            상품소개
          </span>
        </Link>

        {/* 모바일 중앙 — 시선스토리 + 타로의시선 */}
        <div className="md:hidden flex items-center gap-2 shrink-0">
          <Link
            href="/story"
            className="flex items-center justify-center px-3 py-1.5 rounded-xl"
            style={{ background: "linear-gradient(135deg, #1a1730 0%, #2b6e6e 100%)" }}
          >
            <span className="font-bold text-[14px] tracking-tight text-white" style={{ fontFamily: "Georgia, serif" }}>
              시선스토리
            </span>
          </Link>
          <Link
            href="/tarot"
            className="flex items-center justify-center px-3 py-1.5 rounded-xl"
            style={{ background: "linear-gradient(135deg, #c9a84c 0%, #e0bc5a 100%)" }}
          >
            <span className="font-bold text-[14px] tracking-tight text-[#1a1730]" style={{ fontFamily: "Georgia, serif" }}>
              타로의시선
            </span>
          </Link>
        </div>

        {/* 상품 메뉴 — 데스크톱만 표시 */}
        <nav className="hidden md:flex items-center gap-0.5">
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

        {/* 로그인 — 데스크톱 */}
        <div className="hidden md:flex items-center gap-2 shrink-0">
          {isLoggedIn ? (
            <>
              <Link href="/mypage" className="text-[13px] font-medium text-foreground/65 hover:text-teal-700 transition-colors px-2">마이페이지</Link>
              <form action="/api/auth/signout" method="post">
                <button type="submit" className="text-[13px] font-medium text-foreground/65 hover:text-teal-700 transition-colors px-2">로그아웃</button>
              </form>
            </>
          ) : (
            <Link href="/login" className="inline-flex items-center justify-center h-11 px-6 rounded-full text-[13px] font-bold btn-gradient">
              로그인
            </Link>
          )}
        </div>

        {/* 햄버거 메뉴 — 모바일만 표시 */}
        <MobileMenu navItems={navItems} isLoggedIn={isLoggedIn} />
      </div>
    </header>
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
      ? `대표번호${businessInfo.phoneNote ? `(${businessInfo.phoneNote})` : ""}: ${businessInfo.phone}`
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
