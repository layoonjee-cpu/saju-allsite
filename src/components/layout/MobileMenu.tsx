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
          bg-[#faf7f2] shadow-2xl border-l border-amber-200/60
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

        {/* 상품 바로가기 */}
        <div className="shrink-0 px-3 pt-3 pb-2 border-t border-amber-200/50 bg-[#faf7f2]">
          <p className="text-[10px] font-bold tracking-widest text-[#999] mb-2 px-1">— 상품 바로가기</p>
          <div className="space-y-1.5">
            {[
              { href: "/products/ziwei-saju",   label: "별의시선(자미두수)", price: "30,000원", icon: "⭐", color: "#6d28d9", bg: "#f3f0ff" },
              { href: "/products/premium-saju",  label: "깊은 시선 VIP",      price: "30,000원", icon: "📜", color: "#1a4a3a", bg: "#eaf4f0" },
              { href: "/products/love-saju",     label: "연인의 시선",         price: "20,000원", icon: "💑", color: "#9d174d", bg: "#fdf2f8" },
              { href: "/products/basic-saju",    label: "가벼운 시선",         price: "4,900원",  icon: "✍️", color: "#1a4a3a", bg: "#f0f9f4" },
              { href: "/products/dream-reading", label: "꿈꾸는 시선",         price: "1,900원",  icon: "🌙", color: "#4c1d95", bg: "#f5f3ff" },
              { href: "/products/ilju-sticker",  label: "일주스티커",          price: "990원",    icon: "🔖", color: "#92400e", bg: "#fffbeb" },
              { href: "/products/today-fortune", label: "오늘의 운세",         price: "무료",     icon: "☀️", color: "#065f46", bg: "#ecfdf5" },
            ].map(({ href, label, price, icon, color, bg }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className="flex items-center justify-between px-3 py-2.5 rounded-xl transition-opacity active:opacity-70"
                style={{ backgroundColor: bg }}
              >
                <span className="flex items-center gap-2.5">
                  <span className="text-[16px] leading-none">{icon}</span>
                  <span className="text-[13px] font-bold" style={{ color }}>{label}</span>
                </span>
                <span className="text-[12px] font-semibold" style={{ color }}>{price}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* 하단 인증 영역 */}
        <div className="shrink-0 px-4 pb-8 pt-3 border-t border-amber-200/50 space-y-2">
          {isLoggedIn ? (
            <>
              <Link
                href="/mypage"
                onClick={() => setOpen(false)}
                className="flex items-center justify-center h-12 w-full rounded-2xl text-[14px] font-bold text-white bg-[#2D5C5C] hover:bg-[#245050] transition-colors"
              >
                마이페이지
              </Link>
              <Link
                href="/reset"
                onClick={() => setOpen(false)}
                className="flex items-center justify-center h-11 w-full rounded-xl text-[13px] font-semibold text-[#2D5C5C] border border-[#2D5C5C]/30 hover:bg-teal-50 transition-colors"
              >
                비밀번호 재설정
              </Link>
              <form action="/api/auth/signout" method="post">
                <button
                  type="submit"
                  className="flex items-center justify-center h-11 w-full rounded-xl text-[13px] font-semibold text-[#1a1730]/70 hover:text-[#1a1730] hover:bg-amber-50 transition-colors"
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
