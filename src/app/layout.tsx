import type { Metadata } from "next";
import Link from "next/link";
import { Toaster } from "sonner";
import { siteConfig, businessInfo } from "@/config/site";
import { isSupabaseConfigured } from "@/lib/env";
import { getCurrentUser } from "@/lib/auth";
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
          topBanner={null}
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
  { label: "전체 상품", href: "/products" },
  { label: "가벼운 시선", href: "/products/basic-saju" },
  { label: "연인·궁합", href: "/products/love-saju" },
  { label: "깊은 시선", href: "/products/premium-saju" },
  { label: "오늘의 운세", href: "/products/today-fortune" },
  { label: "브랜드 이야기", href: "/story" },
];

function SiteHeader({ isLoggedIn }: { isLoggedIn: boolean }) {
  return <header className="sticky top-0 z-50 border-b border-[#dedbd1] bg-[#f7f4ec]/95 backdrop-blur-sm">
    <div className="mx-auto max-w-[1200px] px-4 md:px-8 h-[64px] flex items-center justify-between gap-4">
      <Link href="/" className="flex items-baseline gap-2 shrink-0 text-[#202b32]" aria-label="시선사주 홈"><span className="font-display text-[27px] font-normal tracking-[-.08em]">시선</span><span className="text-[10px] tracking-[.13em] text-[#9c7a49]">視線 · SAJU</span></Link>
      <nav aria-label="주 메뉴" className="hidden lg:flex items-center gap-5">{navItems.map(item => <Link key={item.href} href={item.href} className="text-[13px] text-[#455359] hover:text-[#9c7a49] whitespace-nowrap">{item.label}</Link>)}</nav>
      <div className="flex items-center gap-2 shrink-0">{isLoggedIn ? <Link href="/mypage" className="hidden md:block text-[13px]">마이페이지</Link> : <Link href="/login" className="hidden md:block text-[13px]">로그인</Link>}<MobileMenu navItems={navItems} isLoggedIn={isLoggedIn}/></div>
    </div>
  </header>;
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
