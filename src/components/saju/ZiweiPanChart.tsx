/**
 * 자미두수 명반(命盤) 4×4 그리드 SVG 시각화 컴포넌트
 */
import { extractPalaces, type ZiweiPalaceData, type ZiweiPan } from "@/lib/ziwei/iztro-calc";

type Props = {
  rawJson: unknown;
};

// 4×4 그리드에서 지지별 위치 (row, col)
// 반시계 방향: 寅(3,0)→卯(2,0)→辰(1,0)→巳(0,0)→午(0,1)→未(0,2)→申(0,3)→酉(1,3)→戌(2,3)→亥(3,3)→子(3,2)→丑(3,1)
const BRANCH_TO_POS: Record<string, [number, number]> = {
  "寅": [3, 0],
  "卯": [2, 0],
  "辰": [1, 0],
  "巳": [0, 0],
  "午": [0, 1],
  "未": [0, 2],
  "申": [0, 3],
  "酉": [1, 3],
  "戌": [2, 3],
  "亥": [3, 3],
  "子": [3, 2],
  "丑": [3, 1],
};

// 사화 색상
const MUTAGEN_COLOR: Record<string, string> = {
  "화록": "#16a34a",    // green
  "화권": "#2563eb",    // blue
  "화과": "#7c3aed",    // violet
  "화기": "#dc2626",    // red
};

function getMutagenColor(mutagen: string): string {
  for (const [key, color] of Object.entries(MUTAGEN_COLOR)) {
    if (mutagen.includes(key.replace("화", ""))) return color;
  }
  return "#888";
}

export function ZiweiPanChart({ rawJson }: Props) {
  if (!rawJson) return null;

  let palaces: ZiweiPalaceData[];
  let pan: ZiweiPan;
  try {
    pan = rawJson as ZiweiPan;
    palaces = extractPalaces(pan);
  } catch {
    return null;
  }

  const fiveElements = (pan.fiveElementsClass as string) ?? "";
  const solarDate = (pan.solarDate as string) ?? "";
  const chineseDate = (pan.chineseDate as string) ?? "";

  // 4×4 그리드 (null = 중앙 2×2)
  const grid: (ZiweiPalaceData | null)[][] = Array.from({ length: 4 }, () => Array(4).fill(null));
  palaces.forEach((p) => {
    const pos = BRANCH_TO_POS[p.earthlyBranch];
    if (pos) grid[pos[0]][pos[1]] = p;
  });

  const CELL_W = 120;
  const CELL_H = 110;
  const TOTAL_W = CELL_W * 4;
  const TOTAL_H = CELL_H * 4;

  return (
    <div className="w-full overflow-x-auto">
      <div className="inline-block rounded-2xl border border-[#d0cce8] overflow-hidden shadow-sm">
        <svg
          viewBox={`0 0 ${TOTAL_W} ${TOTAL_H}`}
          width={TOTAL_W}
          height={TOTAL_H}
          style={{ minWidth: 380, maxWidth: "100%", display: "block" }}
        >
          {/* 배경 */}
          <rect width={TOTAL_W} height={TOTAL_H} fill="#faf8f5" />

          {/* 그리드 셀 */}
          {grid.map((row, ri) =>
            row.map((palace, ci) => {
              const x = ci * CELL_W;
              const y = ri * CELL_H;

              // 중앙 2×2 셀
              const isCenter = ri >= 1 && ri <= 2 && ci >= 1 && ci <= 2;
              if (isCenter) {
                if (ri === 1 && ci === 1) {
                  // 중앙 정보 (2×2 전체 차지)
                  return (
                    <g key={`center`}>
                      <rect
                        x={CELL_W}
                        y={CELL_H}
                        width={CELL_W * 2}
                        height={CELL_H * 2}
                        fill="#1a1730"
                        stroke="#2d2050"
                        strokeWidth={1}
                      />
                      {/* 중앙 텍스트 */}
                      <text x={CELL_W * 2} y={CELL_H + 28} textAnchor="middle" fill="#c4913a" fontSize={11} fontWeight="bold">
                        별의 시선 · 星의 視線
                      </text>
                      <text x={CELL_W * 2} y={CELL_H + 48} textAnchor="middle" fill="#fff" fontSize={10}>
                        {solarDate}
                      </text>
                      <text x={CELL_W * 2} y={CELL_H + 64} textAnchor="middle" fill="#c4913a" fontSize={10}>
                        {chineseDate}
                      </text>
                      <text x={CELL_W * 2} y={CELL_H + 82} textAnchor="middle" fill="#a9a3cc" fontSize={10}>
                        {fiveElements}
                      </text>
                      {/* 명궁/신궁 표시 */}
                      {palaces.filter((p) => p.isSoulPalace || p.isBodyPalace).map((p, i) => (
                        <text
                          key={i}
                          x={CELL_W * 2}
                          y={CELL_H + 100 + i * 16}
                          textAnchor="middle"
                          fill={p.isSoulPalace ? "#c4913a" : "#7c6fbf"}
                          fontSize={9}
                        >
                          {p.isSoulPalace ? "★명궁" : "◈신궁"}: {p.earthlyBranch}({p.name})
                        </text>
                      ))}
                    </g>
                  );
                }
                return null;
              }

              if (!palace) return null;

              const isSoul = palace.isSoulPalace;
              const isBody = palace.isBodyPalace;

              const cellBg = isSoul ? "#f0ebff" : isBody ? "#ebf5ff" : "#faf8f5";
              const borderColor = isSoul ? "#7c3aed" : isBody ? "#2563eb" : "#e0ddf5";

              return (
                <g key={`${ri}-${ci}`}>
                  <rect
                    x={x}
                    y={y}
                    width={CELL_W}
                    height={CELL_H}
                    fill={cellBg}
                    stroke={borderColor}
                    strokeWidth={isSoul || isBody ? 1.5 : 0.8}
                  />

                  {/* 궁 이름 */}
                  <text
                    x={x + CELL_W / 2}
                    y={y + 14}
                    textAnchor="middle"
                    fill={isSoul ? "#5b21b6" : "#1a1730"}
                    fontSize={9}
                    fontWeight="600"
                  >
                    {palace.name}
                    {isSoul ? " ★" : isBody ? " ◈" : ""}
                  </text>

                  {/* 천간지지 */}
                  <text
                    x={x + CELL_W / 2}
                    y={y + 26}
                    textAnchor="middle"
                    fill="#888"
                    fontSize={8}
                  >
                    {palace.heavenlyStem}{palace.earthlyBranch}
                  </text>

                  {/* 주성 */}
                  {palace.majorStars.slice(0, 2).map((star, si) => (
                    <g key={si}>
                      <text
                        x={x + CELL_W / 2}
                        y={y + 42 + si * 18}
                        textAnchor="middle"
                        fill="#1a1730"
                        fontSize={11}
                        fontWeight="bold"
                      >
                        {star.name}
                      </text>
                      <text
                        x={x + CELL_W / 2}
                        y={y + 53 + si * 18}
                        textAnchor="middle"
                        fill="#888"
                        fontSize={7}
                      >
                        {star.brightness}
                        {star.mutagen ? ` ${star.mutagen.replace("화", "化").replace("록", "祿").replace("권", "權").replace("과", "科").replace("기", "忌")}` : ""}
                      </text>
                    </g>
                  ))}

                  {/* 사화 뱃지 */}
                  {palace.mutagen.slice(0, 2).map((m, mi) => {
                    const color = getMutagenColor(m);
                    const label = m.slice(0, 2); // "화록" → "化祿" (simplified)
                    return (
                      <g key={mi}>
                        <rect
                          x={x + 4 + mi * 26}
                          y={y + CELL_H - 18}
                          width={22}
                          height={12}
                          rx={3}
                          fill={color}
                          opacity={0.15}
                        />
                        <rect
                          x={x + 4 + mi * 26}
                          y={y + CELL_H - 18}
                          width={22}
                          height={12}
                          rx={3}
                          fill="none"
                          stroke={color}
                          strokeWidth={0.8}
                        />
                        <text
                          x={x + 15 + mi * 26}
                          y={y + CELL_H - 9}
                          textAnchor="middle"
                          fill={color}
                          fontSize={7}
                          fontWeight="bold"
                        >
                          {label}
                        </text>
                      </g>
                    );
                  })}

                  {/* 대운 범위 */}
                  {palace.decadalRange && (
                    <text
                      x={x + CELL_W - 4}
                      y={y + CELL_H - 5}
                      textAnchor="end"
                      fill="#bbb"
                      fontSize={7}
                    >
                      {palace.decadalRange[0]}~{palace.decadalRange[1]}세
                    </text>
                  )}
                </g>
              );
            })
          )}
        </svg>
      </div>
    </div>
  );
}
