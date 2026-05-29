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

// ── 배지 스타일 (index % 7 순환) ─────────────────────────
type BadgeStyle = {
  bg: string;
  text: string;
  border?: string;
  shape: "rounded-2xl" | "rounded-full" | "rounded-xl" | "hexagon" | "rounded-3xl" | "diamond";
  px: string;
  py: string;
  extraClass?: string;
};

const BADGE_STYLES: BadgeStyle[] = [
  // 0: dark brown 정사각 카드
  {
    bg: "#3d3028",
    text: "#ffffff",
    shape: "rounded-2xl",
    px: "px-5",
    py: "py-4",
    extraClass: "min-w-[80px]",
  },
  // 1: dark green 원형
  {
    bg: "#1a4a30",
    text: "#ffffff",
    shape: "rounded-full",
    px: "px-5",
    py: "py-5",
    extraClass: "aspect-square flex items-center justify-center min-w-[80px]",
  },
  // 2: white 가로 직사각형
  {
    bg: "#ffffff",
    text: "#333333",
    border: "#d0c9bf",
    shape: "rounded-xl",
    px: "px-5",
    py: "py-3",
  },
  // 3: olive gold 육각형
  {
    bg: "#6b5d3f",
    text: "#ffffff",
    shape: "hexagon",
    px: "px-4",
    py: "py-5",
    extraClass: "min-w-[90px]",
  },
  // 4: gray pill
  {
    bg: "#5a5a5a",
    text: "#ffffff",
    shape: "rounded-full",
    px: "px-6",
    py: "py-3",
  },
  // 5: tan/beige 큰 사각
  {
    bg: "#c4a882",
    text: "#2d1a0e",
    shape: "rounded-3xl",
    px: "px-5",
    py: "py-4",
    extraClass: "min-w-[90px]",
  },
  // 6: white 마름모
  {
    bg: "#ffffff",
    text: "#333333",
    border: "#c4b89a",
    shape: "diamond",
    px: "px-5",
    py: "py-5",
    extraClass: "min-w-[80px] aspect-square flex items-center justify-center",
  },
];

// ── 키워드 길이에 따른 폰트 클래스 ───────────────────────
function fontClass(kw: string): string {
  const len = kw.length;
  if (len <= 6) return "text-xl font-black";
  if (len <= 10) return "text-base font-bold";
  return "text-sm font-semibold";
}

// ── 개별 배지 ────────────────────────────────────────────
function Badge({ keyword, idx }: { keyword: string; idx: number }) {
  const s = BADGE_STYLES[idx % BADGE_STYLES.length];

  if (s.shape === "hexagon") {
    return (
      <div
        className={`relative inline-flex items-center justify-center text-center ${s.px} ${s.py} ${s.extraClass ?? ""} ${fontClass(keyword)}`}
        style={{
          background: s.bg,
          color: s.text,
          clipPath:
            "polygon(50% 0%, 93% 25%, 93% 75%, 50% 100%, 7% 75%, 7% 25%)",
        }}
      >
        {keyword}
      </div>
    );
  }

  if (s.shape === "diamond") {
    return (
      <div
        className={`relative inline-flex items-center justify-center text-center ${s.extraClass ?? ""}`}
        style={{ padding: "20px 18px" }}
      >
        {/* 마름모 배경 */}
        <div
          className="absolute inset-0"
          style={{
            background: s.bg,
            border: s.border ? `1.5px solid ${s.border}` : undefined,
            transform: "rotate(45deg)",
            borderRadius: "6px",
          }}
        />
        <span
          className={`relative z-10 ${fontClass(keyword)}`}
          style={{ color: s.text, transform: "rotate(0deg)" }}
        >
          {keyword}
        </span>
      </div>
    );
  }

  const radiusClass =
    s.shape === "rounded-2xl"
      ? "rounded-2xl"
      : s.shape === "rounded-full"
        ? "rounded-full"
        : s.shape === "rounded-xl"
          ? "rounded-xl"
          : "rounded-3xl";

  return (
    <div
      className={`inline-flex items-center justify-center text-center ${radiusClass} ${s.px} ${s.py} ${s.extraClass ?? ""} ${fontClass(keyword)}`}
      style={{
        background: s.bg,
        color: s.text,
        border: s.border ? `1.5px solid ${s.border}` : undefined,
      }}
    >
      {keyword}
    </div>
  );
}

// ── 컴포넌트 ─────────────────────────────────────────────
export function IljuStickerCard({ data }: { data: IljuStickerData }) {
  const keywords = Array.isArray(data.키워드)
    ? data.키워드.slice(0, 12)
    : [];

  return (
    <div
      className="rounded-3xl border border-[#e0d8cc] overflow-hidden shadow-sm"
      style={{ background: "#faf5e9" }}
    >
      {/* 헤더 */}
      <div className="px-5 py-4 border-b border-[#e8e2d8]">
        <p className="text-xs font-mono text-[#9e8c6a] tracking-widest mb-1">ILJU STICKER</p>
        <p className="text-xl font-bold text-[#2d1f0e]">{data.일주}</p>
        <p className="text-xs text-[#b09060] mt-1">일주가 말해주는 나의 기질</p>
      </div>

      {/* 배지 콜라주 */}
      <div className="px-5 py-6 flex flex-wrap gap-3 items-center justify-center">
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
