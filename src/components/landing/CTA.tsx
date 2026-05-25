import Link from "next/link";

export function CTA() {
  return (
    <section className="container py-16">
      <div className="relative rounded-3xl overflow-hidden px-8 py-14 text-center">
        {/* 배경 — 먹빛 → 단청 청록 */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#1a1730] via-[#1e3a3a] to-[#2b6e6e]" />
        {/* 장식 오브 */}
        <div className="absolute -top-10 -left-10 w-64 h-64 rounded-full bg-amber-400/8 blur-[60px]" />
        <div className="absolute -bottom-10 -right-10 w-64 h-64 rounded-full bg-teal-300/10 blur-[60px]" />
        {/* 한지 패턴 느낌의 미묘한 그라디언트 */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_0%,rgba(196,145,58,0.08)_0%,transparent_60%)]" />

        {/* 내용 */}
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-5 text-xs font-medium text-amber-200/90 bg-white/10 backdrop-blur border border-white/20">
            視線 — 지금 당신의 사주를 들여다보세요
          </div>
          <h2 className="text-2xl md:text-4xl font-bold tracking-tight text-white"
            style={{ fontFamily: 'Georgia, "Nanum Myeongjo", serif' }}>
            지금 나의 사주를 들여다보세요
          </h2>
          <p className="mt-3 text-sm text-white/70 max-w-sm mx-auto leading-relaxed">
            운명을 점치지 않습니다.<br />
            당신의 지금을 함께 읽어드립니다.
          </p>
          <div className="mt-8 flex items-center justify-center gap-3 flex-wrap">
            <Link
              href="/products"
              className="inline-flex items-center justify-center h-12 px-8 rounded-full text-[15px] font-semibold bg-white hover:bg-amber-50 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
              style={{ color: "#1a1730" }}
            >
              상품 보러 가기 →
            </Link>
            <Link
              href="/products/today-fortune"
              className="inline-flex items-center justify-center h-12 px-7 rounded-full text-[15px] font-semibold text-white bg-white/15 backdrop-blur border border-white/30 hover:bg-white/25 transition-all"
            >
              오늘의 운세 무료보기
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
