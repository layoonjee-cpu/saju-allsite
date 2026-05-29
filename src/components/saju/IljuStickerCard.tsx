/**
 * IljuStickerCard — 일주스티커 카드
 *
 * - 7가지 배지 스타일 콜라주
 * - 헤더: 일주 한자+한글 + 한줄설명
 * - 배경: product-hero.png 은은하게
 * - 텍스트 오버플로우 방지
 */

import Image from "next/image";

export type IljuStickerData = {
  일주: string;
  한줄설명?: string;
  키워드: string[];
};

// ── 배지 스타일 (index % 7 순환) ─────────────────────────
const STYLES = [
  { bg: "#3d3028", text: "#fff",    border: "",        radius: "14px",    px: 16, py: 11 },
  { bg: "#1a4a30", text: "#fff",    border: "",        radius: "9999px",  px: 16, py: 16, circle: true },
  { bg: "#ffffff", text: "#333",    border: "#cfc8be", radius: "10px",    px: 16, py: 9  },
  { bg: "#6b5d3f", text: "#fff",    border: "",        radius: "0",       px: 14, py: 16, hexagon: true },
  { bg: "#5a5a5a", text: "#fff",    border: "",        radius: "9999px",  px: 18, py: 9  },
  { bg: "#c4a882", text: "#2d1a0e", border: "",        radius: "18px",    px: 16, py: 11 },
  { bg: "#ffffff", text: "#333",    border: "#c4b89a", radius: "8px",     px: 14, py: 14, diamond: true },
] as const;

// ── 폰트 클래스 ──────────────────────────────────────────
function fc(kw: string): string {
  const n = kw.length;
  if (n <= 5)  return "text-base font-black";
  if (n <= 8)  return "text-sm font-bold";
  if (n <= 11) return "text-xs font-bold";
  return "text-[11px] font-semibold";
}

// ── 배지 ─────────────────────────────────────────────────
function Badge({ keyword, idx }: { keyword: string; idx: number }) {
  const s = STYLES[idx % STYLES.length];
  const cls = fc(keyword);

  const textStyle: React.CSSProperties = {
    color: s.text,
    wordBreak: "keep-all",
    overflowWrap: "break-word",
    maxWidth: "100%",
    textAlign: "center",
    lineHeight: 1.3,
  };

  // 육각형
  if ("hexagon" in s && s.hexagon) {
    return (
      <div
        className={`inline-flex items-center justify-center ${cls}`}
        style={{
          background: s.bg,
          clipPath: "polygon(50% 0%,93% 25%,93% 75%,50% 100%,7% 75%,7% 25%)",
          width: 88, height: 88, flexShrink: 0,
          ...textStyle,
        }}
      >
        <span style={{ maxWidth: 58, ...textStyle }}>{keyword}</span>
      </div>
    );
  }

  // 마름모
  if ("diamond" in s && s.diamond) {
    return (
      <div
        className="relative inline-flex items-center justify-center"
        style={{ width: 86, height: 86, flexShrink: 0 }}
      >
        <div className="absolute inset-0" style={{
          background: s.bg,
          border: `1.5px solid ${s.border}`,
          borderRadius: s.radius,
          transform: "rotate(45deg)",
        }} />
        <span className={`relative z-10 ${cls}`} style={{ maxWidth: 60, ...textStyle }}>
          {keyword}
        </span>
      </div>
    );
  }

  // 원형 (aspect-square 강제)
  if ("circle" in s && s.circle) {
    return (
      <div
        className={`inline-flex items-center justify-center ${cls}`}
        style={{
          background: s.bg,
          borderRadius: s.radius,
          width: 86, height: 86, flexShrink: 0,
          padding: 8,
          ...textStyle,
        }}
      >
        <span style={{ maxWidth: 68, ...textStyle }}>{keyword}</span>
      </div>
    );
  }

  // 일반 (pill / 사각)
  return (
    <div
      className={`inline-flex items-center justify-center ${cls}`}
      style={{
        background: s.bg,
        border: s.border ? `1.5px solid ${s.border}` : undefined,
        borderRadius: s.radius,
        paddingLeft: s.px, paddingRight: s.px,
        paddingTop: s.py, paddingBottom: s.py,
        maxWidth: 160, flexShrink: 0,
        ...textStyle,
      }}
    >
      {keyword}
    </div>
  );
}

// ── 메인 컴포넌트 ─────────────────────────────────────────
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
        {data.한줄설명 && (
          <p className="text-sm text-[#7a6040] mt-1 font-medium">✦ {data.한줄설명}</p>
        )}
      </div>

      {/* 배지 영역 — 배경 이미지 + 콜라주 */}
      <div className="relative px-4 py-5">
        {/* 은은한 배경 이미지 */}
        <div className="absolute inset-0 overflow-hidden">
          <Image
            src="/product-hero.png"
            alt=""
            fill
            className="object-cover object-top"
            style={{ opacity: 0.07 }}
            aria-hidden
          />
        </div>

        {/* 배지 콜라주 */}
        <div
          className="relative z-10 flex flex-wrap justify-center items-center"
          style={{ gap: "8px" }}
        >
          {keywords.map((kw, i) => (
            <Badge key={i} keyword={kw} idx={i} />
          ))}
        </div>
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
