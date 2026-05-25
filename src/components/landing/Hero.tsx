import Link from "next/link";
import Image from "next/image";

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      {/* 배경 블러 오브 — 먹빛/청록/금빛 */}
      <div className="pointer-events-none absolute -top-20 -left-20 w-[500px] h-[500px] rounded-full bg-teal-900/[0.06] blur-[120px]" />
      <div className="pointer-events-none absolute -top-10 -right-20 w-[400px] h-[400px] rounded-full bg-amber-700/[0.05] blur-[100px]" />
      <div className="pointer-events-none absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full bg-teal-600/[0.04] blur-[100px]" />

      <div className="container py-14 md:py-24 relative z-10">
        <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12 lg:gap-20">

          {/* 캐릭터 이미지 — 모바일 맨 위, 데스크톱 오른쪽 */}
          <div className="order-1 md:order-2 shrink-0 flex justify-center">
            <div className="relative w-[220px] h-[242px] sm:w-[260px] sm:h-[286px] md:w-[310px] md:h-[341px] lg:w-[360px] lg:h-[396px]">
              <Image
                src="/hero-character.png"
                alt="시선 캐릭터"
                fill
                className="object-contain drop-shadow-[0_8px_32px_rgba(26,23,48,0.18)]"
                priority
              />
            </div>
          </div>

          {/* 텍스트 영역 */}
          <div className="order-2 md:order-1 flex-1 text-center md:text-left">

            {/* 브랜드 타이틀 */}
            <div className="mb-4">
              <h1
                className="text-[52px] sm:text-[64px] md:text-[76px] font-black tracking-tight leading-none"
                style={{
                  fontFamily: 'Georgia, "Nanum Myeongjo", "Apple SD Gothic Neo", serif',
                  color: "#1a1730",
                }}
              >
                시선
              </h1>
              <p
                className="text-[18px] sm:text-[20px] font-medium tracking-[0.3em] mt-1"
                style={{
                  color: "#c4913a",
                  fontFamily: "Georgia, serif",
                }}
              >
                視線
              </p>
            </div>

            {/* 슬로건 */}
            <p className="mt-4 text-[14px] md:text-[16px] text-muted-foreground leading-relaxed max-w-sm mx-auto md:mx-0">
              운명을 점치지 않습니다.<br />
              <span className="font-medium text-foreground/80">당신의 지금을 함께 읽어드립니다.</span>
            </p>

            {/* 부제 */}
            <p className="mt-2 text-[12px] md:text-[13px] text-muted-foreground/70">
              정통 명리학 × AI
            </p>

            {/* CTA 버튼 */}
            <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center md:justify-start">
              <Link
                href="/products"
                className="btn-gradient inline-flex items-center justify-center h-12 px-8 rounded-full text-[15px] font-bold w-full sm:w-auto"
              >
                사주 풀기 시작 →
              </Link>
              <Link
                href="/products/today-fortune"
                className="inline-flex items-center justify-center h-12 px-6 rounded-full text-[14px] font-semibold w-full sm:w-auto border-2 transition-all duration-200 hover:bg-teal-50"
                style={{ borderColor: "#2b6e6e", color: "#2b6e6e" }}
              >
                오늘의 운세 무료보기
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
