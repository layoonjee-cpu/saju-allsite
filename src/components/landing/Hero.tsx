import Link from "next/link";
import { siteConfig } from "@/config/site";

export function Hero() {
  return (
    <section className="relative container py-28 md:py-36 text-center overflow-hidden">
      {/* 배경 블러 오브 */}
      <div className="pointer-events-none absolute -top-20 -left-20 w-[500px] h-[500px] rounded-full bg-violet-200/40 blur-[100px]" />
      <div className="pointer-events-none absolute -top-10 -right-20 w-[400px] h-[400px] rounded-full bg-sky-200/40 blur-[100px]" />
      <div className="pointer-events-none absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full bg-rose-200/30 blur-[100px]" />

      <div className="relative z-10">
        {/* 배지 */}
        <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-6 text-xs font-medium text-violet-700 bg-violet-100/80 backdrop-blur border border-violet-200/60">
          ✨ AI 사주 풀이 서비스
        </div>

        {/* 헤드라인 */}
        <h1 className="text-[40px] md:text-[58px] font-bold tracking-tight leading-[1.1]">
          <span className="gradient-text">{siteConfig.tagline}</span>
        </h1>

        <p className="mt-5 text-[16px] text-muted-foreground max-w-md mx-auto leading-relaxed">
          {siteConfig.description}
        </p>

        {/* CTA 버튼 */}
        <div className="mt-10 flex items-center justify-center gap-3">
          <Link
            href="/products"
            className="btn-gradient inline-flex items-center justify-center h-12 px-7 rounded-full text-[15px] font-semibold"
          >
            상품 보기 →
          </Link>
          <Link
            href="#how-it-works"
            className="inline-flex items-center justify-center h-12 px-7 rounded-full text-[15px] font-semibold glass-card text-violet-700 hover:text-violet-800 transition-all"
          >
            작동 방식
          </Link>
        </div>

        {/* 플로팅 통계 뱃지 */}
        <div className="mt-14 flex items-center justify-center gap-4 flex-wrap">
          {[
            { label: "AI 사주 분석", value: "GPT-4o" },
            { label: "간편 결제", value: "토스페이먼츠" },
            { label: "즉시 결과", value: "리포트 발송" },
          ].map((item) => (
            <div key={item.label} className="glass-card rounded-2xl px-5 py-3 text-center">
              <p className="text-xs text-muted-foreground">{item.label}</p>
              <p className="text-sm font-semibold text-violet-700 mt-0.5">{item.value}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
