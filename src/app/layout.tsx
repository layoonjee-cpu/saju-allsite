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
  // 로그인 여부에 따라 헤더 메뉴 분기. Supabase 미설정(데모) 모드면 무조건 비로그인 취급.
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

function SiteHeader({ isLoggedIn }: { isLoggedIn: boolean }) {
  return (
    <header className="sticky top-0 z-50 border-b border-white/60 bg-white/70 backdrop-blur-xl">
      <div className="container flex h-14 items-center justify-between">
        <Link href="/" className="font-bold text-[16px] gradient-text">
          {siteConfig.name}
        </Link>
        <nav className="flex items-center gap-6 text-[13px] font-medium">
          <Link href="/products" className="text-foreground/70 hover:text-violet-600 transition-colors">상품</Link>
          {isLoggedIn ? (
            <>
              <Link href="/mypage" className="text-foreground/70 hover:text-violet-600 transition-colors">마이페이지</Link>
              <form action="/api/auth/signout" method="post">
                <button type="submit" className="text-foreground/70 hover:text-violet-600 transition-colors">로그아웃</button>
              </form>
            </>
          ) : (
            <Link href="/login" className="inline-flex items-center justify-center h-8 px-4 rounded-full text-xs font-semibold btn-gradient">로그인</Link>
          )}
        </nav>
      </div>
    </header>
  );
}

// Ollama: footer is a quiet caption-gray strip with hairline divider.
function SiteFooter() {
  // 사업자정보 한 줄 — 운세위키 푸터 포맷: "회사 | 사업자등록번호: ... | 통신판매업 신고번호: ... | 대표: ... | 주소: ..."
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
    <footer className="border-t border-white/60 mt-20 bg-white/40 backdrop-blur-sm">
      <div className="container py-10 space-y-4">
        {/* 슬로건 */}
        <p className="text-sm font-semibold text-center text-foreground/70 tracking-wide">
          당신의 운세를 쉽고 정확하게 알려드립니다
        </p>
        {/* 링크 */}
        <div className="flex flex-wrap justify-center gap-x-5 gap-y-1.5 text-xs">
          <Link href="/legal/terms" className="text-muted-foreground hover:text-violet-600 transition-colors">이용약관</Link>
          <Link href="/legal/privacy" className="text-muted-foreground hover:text-violet-600 transition-colors">개인정보처리방침</Link>
          <Link href="/legal/refund-policy" className="text-muted-foreground hover:text-violet-600 transition-colors">환불정책</Link>
        </div>
        {/* 사업자 정보 */}
        <p className="text-[11px] text-muted-foreground leading-relaxed text-center">{businessLine}</p>
        <p className="text-[11px] text-muted-foreground leading-relaxed text-center">{contactLine}</p>
        <p className="text-[11px] text-muted-foreground text-center">© {new Date().getFullYear()} {siteConfig.name}</p>
      </div>
    </footer>
  );
}
