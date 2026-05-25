import Link from "next/link";
import Image from "next/image";

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      {/* 배경 블러 오브 */}
      <div className="pointer-events-none absolute -top-20 -left-20 w-[500px] h-[500px] rounded-full bg-violet-200/40 blur-[100px]" />
      <div className="pointer-events-none absolute -top-10 -right-20 w-[400px] h-[400px] rounded-full bg-sky-200/40 blur-[100px]" />
      <div className="pointer-events-none absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full bg-rose-200/30 blur-[100px]" />

      <div className="container py-14 md:py-24 relative">
        <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12 lg:gap-20">

          {/* 고양이 캐릭터 — 모바일 맨 위, 데스크톱 오른쪽 */}
          <div className="order-1 md:order-2 shrink-0 flex justify-center">
            <div
              className="relative w-[220px] h-[242px] sm:w-[250px] sm:h-[275px] md:w-[300px] md:h-[330px] lg:w-[340px] lg:h-[374px]"
              style={{ mixBlendMode: "darken" }}
            >
              <Image
                src="/cat.png"
                alt="오드아이 고양이"
                fill
                className="object-contain"
                style={{ mixBlendMode: "darken" }}
                priority
              />
            </div>
          </div>

          {/* 텍스트 영역 — 모바일 아래, 데스크톱 왼쪽 */}
          <div className="order-2 md:order-1 flex-1 text-center md:text-left">

            {/* 로고 이미지 타이틀 */}
            <div
              className="relative w-full max-w-[280px] sm:max-w-[340px] md:max-w-[400px] h-[90px] sm:h-[110px] md:h-[130px] mx-auto md:mx-0"
              style={{ mixBlendMode: "darken" }}
            >
              <Image
                src="/logo.png"
                alt="오드아이 사주"
                fill
                className="object-contain object-center md:object-left"
                style={{ mixBlendMode: "darken" }}
                priority
              />
            </div>

            {/* 슬로건 */}
            <p className="mt-3 text-[15px] md:text-[17px] text-muted-foreground leading-relaxed">
              정통 만세력 × AI 해석
            </p>

            {/* CTA 버튼 */}
            <div className="mt-8">
              <Link
                href="/products"
                className="btn-gradient inline-flex items-center justify-center h-12 px-8 rounded-full text-[16px] font-bold w-full sm:w-auto"
              >
                나의 사주 풀기 →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
