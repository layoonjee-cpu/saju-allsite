"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

type NavItem = {
  label: string;
  href: string;
  badge?: string;
  badgeColor?: string;
};

type Props = {
  navItems: NavItem[];
  isLoggedIn: boolean;
};

export function MobileMenu({ navItems, isLoggedIn }: Props) {
  const [open, setOpen] = useState(false);

  // 드로어 열릴 때 body 스크롤 잠금
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <>
      {/* 햄버거 버튼 — md 이상에서 숨김 */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="메뉴 열기"
        className="md:hidden flex flex-col justify-center items-center w-11 h-11 gap-[5px] rounded-xl hover:bg-teal-50 transition-colors shrink-0"
      >
        <span className="block w-[22px] h-[2px] rounded-full bg-foreground/70" />
        <span className="block w-[22px] h-[2px] rounded-full bg-foreground/70" />
        <span className="block w-[16px] h-[2px] rounded-full bg-foreground/70 self-start ml-[3px]" />
      </button>

      {/* 오버레이 */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px] md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* 슬라이드 드로어 */}
      <div
        className={`fixed top-0 right-0 h-full w-[280px] z-50 flex flex-col
          bg-[#faf7f2]/98 backdrop-blur-2xl shadow-2xl border-l border-amber-200/60
          transform transition-transform duration-300 ease-out md:hidden
          ${open ? "translate-x-0" : "translate-x-full"}`}
      >
        {/* 드로어 헤더 */}
        <div className="flex items-center justify-between px-5 h-16 border-b border-amber-200/50 shrink-0">
          <span
            className="font-bold text-[17px] tracking-tight"
            style={{ fontFamily: "var(--font-display)", color: "#1a1730" }}
          >
            시선 메뉴
          </span>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="메뉴 닫기"
            className="w-9 h-9 flex items-center justify-center rounded-lg text-foreground/50 hover:bg-teal-50 hover:text-teal-700 transition-colors text-lg"
          >
            ✕
          </button>
        </div>

        {/* 네비게이션 */}
        <nav className="flex-1 overflow-y-auto py-3 px-3">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className="flex items-center justify-between px-4 py-3.5 rounded-xl
                text-[15px] font-semibold text-foreground/75
                hover:bg-teal-50/80 hover:text-teal-700 transition-colors
                active:bg-teal-100"
              style={{ fontFamily: "var(--font-body)" }}
            >
              <span>{item.label}</span>
              {item.badge && (
                <span
                  className={`text-[11px] font-bold bg-gradient-to-r ${item.badgeColor} text-white px-2.5 py-0.5 rounded-full`}
                >
                  {item.badge}
                </span>
              )}
            </Link>
          ))}
        </nav>

        {/* 하단 인증 영역 */}
        <div className="shrink-0 px-4 pb-8 pt-3 border-t border-amber-200/50 space-y-2">
          {isLoggedIn ? (
            <>
              <Link
                href="/mypage"
                onClick={() => setOpen(false)}
                className="flex items-center justify-center h-12 w-full rounded-2xl text-[14px] font-semibold text-foreground/70 border border-amber-200 hover:bg-amber-50 transition-colors"
              >
                마이페이지
              </Link>
              <form action="/api/auth/signout" method="post">
                <button
                  type="submit"
                  className="flex items-center justify-center h-12 w-full rounded-2xl text-[14px] font-semibold text-foreground/60 hover:bg-teal-50 transition-colors"
                >
                  로그아웃
                </button>
              </form>
            </>
          ) : (
            <Link
              href="/login"
              onClick={() => setOpen(false)}
              className="btn-gradient flex items-center justify-center h-12 w-full rounded-2xl text-[15px] font-bold"
            >
              로그인
            </Link>
          )}
        </div>
      </div>
    </>
  );
}
