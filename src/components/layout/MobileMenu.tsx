"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
type NavItem = { label: string; href: string };
export function MobileMenu({navItems,isLoggedIn}:{navItems:NavItem[];isLoggedIn:boolean}) {
  const [open,setOpen]=useState(false);
  useEffect(()=>{document.body.style.overflow=open?"hidden":"";return()=>{document.body.style.overflow=""}},[open]);
  return <><button type="button" aria-label="메뉴 열기" aria-expanded={open} onClick={()=>setOpen(true)} className="lg:hidden min-w-11 min-h-11 border border-[#dedbd1] text-[#202b32] text-xl">☰</button>
  {open && <div className="fixed inset-0 z-[100] bg-[#202b32]/40 lg:hidden" onClick={()=>setOpen(false)}><div role="dialog" aria-modal="true" aria-label="사이트 메뉴" onClick={e=>e.stopPropagation()} className="absolute top-0 right-0 h-[100dvh] w-[min(320px,90vw)] bg-[#f7f4ec] overflow-y-auto px-5 py-5 shadow-xl">
    <div className="flex items-center justify-between border-b border-[#dedbd1] pb-5"><span className="font-display text-2xl">시선 視線</span><button type="button" aria-label="메뉴 닫기" onClick={()=>setOpen(false)} className="min-w-11 min-h-11 text-xl">×</button></div>
    <nav className="flex flex-col py-5">{navItems.map(item=><Link key={item.href} href={item.href} onClick={()=>setOpen(false)} className="py-4 border-b border-[#dedbd1] text-[16px]">{item.label}</Link>)}<Link href="/products/ziwei-saju" onClick={()=>setOpen(false)} className="py-4 border-b border-[#dedbd1]">별의 시선</Link><Link href="/tarot" onClick={()=>setOpen(false)} className="py-4 border-b border-[#dedbd1]">타로의 시선</Link></nav>
    <Link href={isLoggedIn?"/mypage":"/login"} onClick={()=>setOpen(false)} className="block text-center bg-[#263b42] text-white py-4 mt-4">{isLoggedIn?"마이페이지":"로그인"}</Link>
  </div></div>}</>;
}
