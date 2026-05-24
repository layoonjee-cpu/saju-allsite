import Link from "next/link";

export function CTA() {
  return (
    <section className="container py-16">
      {/* 파스텔 그라디언트 배경 컨테이너 */}
      <div className="relative rounded-3xl overflow-hidden px-8 py-14 text-center">
        {/* 배경 그라디언트 */}
        <div className="absolute inset-0 bg-gradient-to-br from-violet-500 via-purple-500 to-pink-500" />
        {/* 글래스 오브 장식 */}
        <div className="absolute -top-10 -left-10 w-64 h-64 rounded-full bg-white/10 blur-[60px]" />
        <div className="absolute -bottom-10 -right-10 w-64 h-64 rounded-full bg-pink-300/20 blur-[60px]" />

        {/* 글래스 카드 내용 */}
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-5 text-xs font-medium text-white bg-white/20 backdrop-blur border border-white/30">
            🌟 지금 바로 시작하세요
          </div>
          <h2 className="text-2xl md:text-4xl font-bold tracking-tight text-white">
            나의 운명을 확인해 보세요
          </h2>
          <p className="mt-3 text-sm text-white/80 max-w-sm mx-auto leading-relaxed">
            로그인 없이 게스트로도 결제할 수 있어요.<br />
            AI가 분석한 나만의 사주 리포트를 즉시 받아보세요.
          </p>
          <div className="mt-8 flex items-center justify-center gap-3 flex-wrap">
            <Link
              href="/products"
              className="inline-flex items-center justify-center h-12 px-8 rounded-full text-[15px] font-semibold bg-white text-violet-700 hover:bg-white/90 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
            >
              상품 보러 가기 →
            </Link>
            <Link
              href="#how-it-works"
              className="inline-flex items-center justify-center h-12 px-7 rounded-full text-[15px] font-semibold text-white bg-white/20 backdrop-blur border border-white/40 hover:bg-white/30 transition-all"
            >
              작동 방식 알아보기
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
