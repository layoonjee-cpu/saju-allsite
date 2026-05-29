// =====================================================
// 궁합 오행 분포 비교 차트 (2인 나란히)
// =====================================================
// 두 사람의 사주 4기둥(8글자)에서 오행 분포를 계산해 나란히 표로 비교.
// 서버 컴포넌트 — 외부 라이브러리 없음, 순수 Tailwind CSS.

import type { Myeongsik } from "@/lib/saju/manseryeok";

// ── 오행 분류 맵 ────────────────────────────────────────
const CHEONGAN_OHAENG: Record<string, string> = {
  // 한글
  갑: "목", 을: "목",
  병: "화", 정: "화",
  무: "토", 기: "토",
  경: "금",             // 천간 庚
  임: "수", 계: "수",
  // 한자
  甲: "목", 乙: "목",
  丙: "화", 丁: "화",
  戊: "토", 己: "토",
  庚: "금", 辛: "금",   // 辛(신) = 金
  壬: "수", 癸: "수",
};

const JIJI_OHAENG: Record<string, string> = {
  // 한글
  자: "수", 해: "수",
  인: "목", 묘: "목",
  사: "화", 오: "화",
  축: "토", 진: "토", 미: "토", 술: "토",
  신: "금", 유: "금",  // 지지 申(신) = 金
  // 한자
  子: "수", 亥: "수",
  寅: "목", 卯: "목",
  巳: "화", 午: "화",
  丑: "토", 辰: "토", 未: "토", 戌: "토",
  申: "금", 酉: "금",
};

// ── 표시 설정 ────────────────────────────────────────
const OHAENG_ROWS = [
  { key: "목", label: "목(木)", color: "#16a34a", bg: "bg-green-100", border: "border-green-200" },
  { key: "화", label: "화(火)", color: "#dc2626", bg: "bg-red-100",   border: "border-red-200" },
  { key: "토", label: "토(土)", color: "#d97706", bg: "bg-amber-100", border: "border-amber-200" },
  { key: "금", label: "금(金)", color: "#64748b", bg: "bg-slate-100", border: "border-slate-200" },
  { key: "수", label: "수(水)", color: "#1d4ed8", bg: "bg-blue-100",  border: "border-blue-200" },
] as const;

// ── 오행 카운트 ─────────────────────────────────────
function countOhaeng(m: Myeongsik): Record<string, number> {
  const counts: Record<string, number> = { 목: 0, 화: 0, 토: 0, 금: 0, 수: 0 };
  const pillars = [m.year, m.month, m.day, m.hour];

  for (const p of pillars) {
    if (!p) continue;
    // 天干
    const cg = CHEONGAN_OHAENG[p.cheongan];
    if (cg) counts[cg]++;
    // 地支 (먼저 지지 맵, 없으면 천간 맵 fallback)
    const jj = JIJI_OHAENG[p.jiji] ?? CHEONGAN_OHAENG[p.jiji];
    if (jj) counts[jj]++;
  }
  return counts;
}

// ── 미니 바 (최대 8칸) ──────────────────────────────
function MiniBar({ count, color }: { count: number; color: string }) {
  const total = 8; // 4기둥 × 2글자 최대
  return (
    <div className="flex items-center gap-1">
      <div className="flex gap-[2px]">
        {Array.from({ length: total }).map((_, i) => (
          <span
            key={i}
            className="inline-block h-3 w-2.5 rounded-[2px]"
            style={{ backgroundColor: i < count ? color : "#e5e7eb" }}
          />
        ))}
      </div>
      <span className="text-xs font-semibold tabular-nums" style={{ color }}>
        {count}
      </span>
    </div>
  );
}

// ── 컴포넌트 ─────────────────────────────────────────
export function LoveOhaengChart({
  mainMyeongsik,
  partnerMyeongsik,
  nameA,
  nameB,
}: {
  mainMyeongsik: Myeongsik;
  partnerMyeongsik: Myeongsik;
  nameA?: string;
  nameB?: string;
}) {
  const countsA = countOhaeng(mainMyeongsik);
  const countsB = countOhaeng(partnerMyeongsik);

  const labelA = nameA?.trim() || "나";
  const labelB = nameB?.trim() || "상대방";

  return (
    <div className="rounded-2xl border border-[#e8e4dd] bg-white overflow-hidden">
      {/* 헤더 */}
      <div className="grid grid-cols-3 border-b border-[#e8e4dd] bg-[#f8f5f0] text-[11px] font-semibold text-[#666] tracking-wide">
        <div className="px-4 py-2.5">오행</div>
        <div className="px-4 py-2.5 text-center border-x border-[#e8e4dd]">{labelA}</div>
        <div className="px-4 py-2.5 text-center">{labelB}</div>
      </div>

      {/* 오행 행 */}
      {OHAENG_ROWS.map((row) => (
        <div
          key={row.key}
          className="grid grid-cols-3 border-b border-[#f0ede8] last:border-b-0"
        >
          {/* 오행 라벨 */}
          <div className="flex items-center gap-2 px-4 py-3">
            <span
              className={`inline-flex items-center justify-center w-8 h-7 rounded-md text-xs font-bold text-white ${row.bg} ${row.border} border`}
              style={{ color: row.color }}
            >
              {row.label}
            </span>
          </div>

          {/* nameA 바 */}
          <div className="flex items-center justify-center px-3 py-3 border-x border-[#f0ede8]">
            <MiniBar count={countsA[row.key] ?? 0} color={row.color} />
          </div>

          {/* nameB 바 */}
          <div className="flex items-center justify-center px-3 py-3">
            <MiniBar count={countsB[row.key] ?? 0} color={row.color} />
          </div>
        </div>
      ))}

      {/* 총계 행 */}
      <div className="grid grid-cols-3 bg-[#faf8f5] text-[11px] text-[#888]">
        <div className="px-4 py-2 font-semibold">합계</div>
        <div className="px-4 py-2 text-center border-x border-[#e8e4dd] font-semibold text-[#444]">
          {Object.values(countsA).reduce((s, n) => s + n, 0)}글자
        </div>
        <div className="px-4 py-2 text-center font-semibold text-[#444]">
          {Object.values(countsB).reduce((s, n) => s + n, 0)}글자
        </div>
      </div>
    </div>
  );
}
