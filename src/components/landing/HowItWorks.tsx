const stepGradients = [
  "from-violet-500 to-purple-500",
  "from-sky-500 to-blue-500",
  "from-rose-500 to-pink-500",
  "from-amber-500 to-orange-500",
];

const stepEmojis = ["🛍️", "✍️", "💳", "✨"];

export function HowItWorks() {
  const steps = [
    { n: "01", t: "상품 선택", d: "오늘의 운세부터 프리미엄 종합 풀이까지" },
    { n: "02", t: "사주 입력", d: "생년월일 · 출생 시각 · 성별 · 고민" },
    { n: "03", t: "결제", d: "토스페이먼츠로 안전하게 결제" },
    { n: "04", t: "결과 확인", d: "AI가 작성한 맞춤 리포트 즉시 확인" },
  ];
  return (
    <section id="how-it-works" className="py-20">
      {/* 연한 그라디언트 배경 */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-50/80 via-sky-50/60 to-rose-50/60 pointer-events-none" />
        <div className="container relative z-10 py-16">
          <div className="text-center mb-12">
            <p className="text-xs font-medium text-violet-500 uppercase tracking-widest mb-2">How it works</p>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
              <span className="gradient-text">4단계</span>로 완성되는 사주 풀이
            </h2>
            <p className="mt-3 text-muted-foreground text-sm">간단하고 빠르게, 나만의 운세를 만나보세요</p>
          </div>

          <ol className="grid gap-6 md:grid-cols-4">
            {steps.map((s, i) => (
              <li key={s.n} className="glass-card rounded-2xl p-6 text-center group hover:-translate-y-1 transition-all duration-300">
                {/* 그라디언트 원형 번호 배지 */}
                <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${stepGradients[i]} flex items-center justify-center mx-auto mb-4 shadow-lg`}>
                  <span className="text-xl">{stepEmojis[i]}</span>
                </div>
                <p className={`text-xs font-bold mb-1 bg-gradient-to-r ${stepGradients[i]} bg-clip-text text-transparent`}>
                  STEP {s.n}
                </p>
                <p className="text-base font-semibold text-foreground mb-2">{s.t}</p>
                <p className="text-sm text-muted-foreground leading-relaxed">{s.d}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
