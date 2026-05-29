/**
 * IljuStickerCard — 일주스티커 카드
 *
 * LLM이 JSON으로 반환한 일주 키워드 12개를
 * 7가지 배지 스타일로 콜라주처럼 렌더링.
 *
 * 서버 컴포넌트 — 외부 라이브러리 없음, 순수 Tailwind CSS + inline style.
 */

export type IljuStickerData = {
  일주: string;
  키워드: string[];
};

// ── 배지 스타일 정의 (index % 7 순환) ────────────────────
const BADGE_STYLES = [
  // 0: dark brown 사각
  { bg: "#3d3028", text: "#ffffff", border: "", radius: "14px", px: 18, py: 12 },
  // 1: dark green 원형
  { bg: "#1a4a30", text: "#ffffff", border: "", radius: "9999px", px: 18, py: 18 },
  // 2: white 직사각
  { bg: "#ffffff", text: "#333333", border: "#cfc8be", radius: "10px", px: 18, py: 10 },
  // 3: olive gold 육각형 (clip-path로 처리)
  { bg: "#6b5d3f", text: "#ffffff", border: "", radius: "0px", px: 16, py: 18, hexagon: true },
  // 4: gray pill
  { bg: "#5a5a5a", text: "#ffffff", border: "", radius: "9999px", px: 20, py: 10 },
  // 5: tan/beige 사각
  { bg: "#c4a882", text: "#2d1a0e", border: "", radius: "18px", px: 18, py: 12 },
  // 6: white 마름모 (inline style로 처리)
  { bg: "#ffffff", text: "#333333", border: "#c4b89a", radius: "8px", px: 16, py: 16, diamond: true },
] as const;

// ── 키워드 길이 → 폰트 클래스 ────────────────────────────
function fontClass(kw: string): string {
  const len = kw.length;
  if (len <= 5)  return "text-lg font-black";
  if (len <= 8)  return "text-base font-bold";
  if (len <= 11) return "text-sm font-bold";
  return "text-xs font-semibold";
}

// ── 개별 배지 ────────────────────────────────────────────
function Badge({ keyword, idx }: { keyword: string; idx: number }) {
  const s = BADGE_STYLES[idx % BADGE_STYLES.length];
  const fc = fontClass(keyword);

  // 육각형
  if ("hexagon" in s && s.hexagon) {
    return (
      <div
        className={`inline-flex items-center justify-center text-center ${fc}`}
        style={{
          background: s.bg,
          color: s.text,
          clipPath: "polygon(50% 0%,93% 25%,93% 75%,50% 100%,7% 75%,7% 25%)",
          width: 90,
          height: 90,
          flexShrink: 0,
        }}
      >
        {keyword}
      </div>
    );
  }

  // 마름모
  if ("diamond" in s && s.diamond) {
    return (
      <div
        className="relative inline-flex items-center justify-center"
        style={{ width: 88, height: 88, flexShrink: 0 }}
      >
        <div
          className="absolute inset-0"
          style={{
            background: s.bg,
            border: `1.5px solid ${s.border}`,
            borderRadius: s.radius,
            transform: "rotate(45deg)",
          }}
        />
        <span className={`relative z-10 text-center px-1 ${fc}`} style={{ color: s.text }}>
          {keyword}
        </span>
      </div>
    );
  }

  // 일반 배지
  return (
    <div
      className={`inline-flex items-center justify-center text-center ${fc}`}
      style={{
        background: s.bg,
        color: s.text,
        border: s.border ? `1.5px solid ${s.border}` : undefined,
        borderRadius: s.radius,
        paddingLeft: s.px,
        paddingRight: s.px,
        paddingTop: s.py,
        paddingBottom: s.py,
        flexShrink: 0,
      }}
    >
      {keyword}
    </div>
  );
}

// ── 컴포넌트 ─────────────────────────────────────────────
export function IljuStickerCard({ data }: { data: IljuStickerData }) {
  const keywords = Array.isArray(data.키워드) ? data.키워드.slice(0, 12) : [];

  return (
    <div
      className="rounded-3xl border border-[#e0d8cc] overflow-hidden shadow-sm"
      style={{ background: "#faf5e9" }}
    >
      {/* 헤더 */}
      <div className="px-5 py-4 border-b border-[#e8e2d8]">
        <p className="text-xs font-mono text-[#9e8c6a] tracking-widest mb-1">ILJU STICKER</p>
        <p className="text-xl font-bold text-[#2d1f0e]">{data.일주}</p>
        <p className="text-xs text-[#b09060] mt-0.5">일주가 말해주는 나의 기질</p>
      </div>

      {/* 배지 콜라주 — 촘촘한 flex wrap */}
      <div
        className="px-4 py-5 flex flex-wrap justify-center items-center"
        style={{ gap: "8px" }}
      >
        {keywords.map((kw, i) => (
          <Badge key={i} keyword={kw} idx={i} />
        ))}
      </div>

      {/* 푸터 */}
      <div className="px-5 py-3 border-t border-[#e8e2d8] text-center">
        <p className="text-[10px] text-[#c0a87a] tracking-wide">
          사주 명리학 기반 · 시선사주
        </p>
      </div>
    </div>
  );
}
