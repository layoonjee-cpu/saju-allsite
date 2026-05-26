"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

interface Props {
  topBanner: ReactNode;
  siteHeader: ReactNode;
  siteFooter: ReactNode;
  children: ReactNode;
}

/**
 * 어드민 경로(/admin/*)에서는 SiteHeader·SiteFooter·TopBanner를 숨기고
 * 어드민 전용 레이아웃(admin/layout.tsx)만 표시합니다.
 */
export function ConditionalSiteLayout({ topBanner, siteHeader, siteFooter, children }: Props) {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith("/admin");

  return (
    <>
      {!isAdmin && topBanner}
      {!isAdmin && siteHeader}
      <main className={isAdmin ? "" : "min-h-[calc(100vh-7rem)]"}>
        {children}
      </main>
      {!isAdmin && siteFooter}
    </>
  );
}
