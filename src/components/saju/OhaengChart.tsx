import type { Myeongsik } from "@/lib/saju/manseryeok";

// ── 오행 매핑 ──────────────────────────────────────────────
const CHEONGAN_MAP: Record<string, string> = {
  甲: "목", 乙: "목",
  丙: "화", 丁: "화",
  戊: "토", 己: "토",
  庚: "금", 辛: "금",
  壬: "수", 癸: "수",
};

const JIJI_MAP: Record<string, string> = {
  寅: "목", 卯: "목",
  巳: "화", 午: "화",
  丑: "토", 辰: "토", 未: "토", 戌: "토",
  申: "금", 酉: "금",
  子: "수", 亥: "수",
};

// ── 음양 매핑 ──────────────────────────────────────────────
const CHEONGAN_YANG = new Set(["甲", "丙", "戊", "庚", "壬"]);
const CHEONGAN_YIN  = new Set(["乙", "丁", "己", "辛", "癸"]);
const JIJI_YANG     = new Set(["子", "寅", "辰", "午", "申", "戌"]);
const JIJI_YIN      = new Set(["丑", "卯", "巳", "未", "酉", "亥"]);

const OHAENG_META = [
  { key: "목", hanja: "木", label: "나무", color: "#4ade80", bg: "bg-green-400", hanjaBg: "#16a34a" },
  { key: "화", hanja: "火", label: "불",   color: "#f87171", bg: "bg-red-400",   hanjaBg: "#dc2626" },
  { key: "토", hanja: "土", label: "흙",   color: "#d97706", bg: "bg-amber-600", hanjaBg: "#92400e" },
  { key: "금", hanja: "金", label: "금",   color: "#94a3b8", bg: "bg-slate-400", hanjaBg: "#475569" },
  { key: "수", hanja: "水", label: "물",   color: "#3b82f6", bg: "bg-blue-500",  hanjaBg: "#1d4ed8" },
] as const;

function computeOhaeng(myeongsik: Myeongsik): Record<string, number> {
  const counts: Record<string, number> = { 목: 0, 화: 0, 토: 0, 금: 0, 수: 0 };
  const pillars = [myeongsik.year, myeongsik.month, myeongsik.day, myeongsik.hour].filter(Boolean);
  for (const p of pillars) {
    if (!p) continue;
    const cg = CHEONGAN_MAP[p.cheongan];
    const jj = JIJI_MAP[p.jiji];
    if (cg) counts[cg]++;
    if (jj) counts[jj]++;
  }
  return counts;
}

function computeYinYang(myeongsik: Myeongsik): { yang: number; yin: number } {
  let yang = 0, yin = 0;
  const pillars = [myeongsik.year, myeongsik.month, myeongsik.day, myeongsik.hour].filter(Boolean);
  for (const p of pillars) {
    if (!p) continue;
    if (CHEONGAN_YANG.has(p.cheongan)) yang++;
    else if (CHEONGAN_YIN.has(p.cheongan)) yin++;
    if (JIJI_YANG.has(p.jiji)) yang++;
    else if (JIJI_YIN.has(p.jiji)) yin++;
  }
  return { yang, yin };
}

type Props = { myeongsik: Myeongsik };

export function OhaengChart({ myeongsik }: Props) {
  const counts = computeOhaeng(myeongsik);
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  if (total === 0) return null;

  const { yang, yin } = computeYinYang(myeongsik);
  const yyTotal = yang + yin;
  const yangPct = yyTotal > 0 ? Math.round((yang / yyTotal) * 100) : 50;
  const yinPct  = 100 - yangPct;
  const balance = yangPct > 55 ? "양 우세" : yangPct < 45 ? "음 우세" : "균형";

  const maxCount = Math.max(...Object.values(counts));

  return (
    <div className="rounded-2xl border border-[#e8e4dd] bg-white px-5 py-5 space-y-6">

      {/* ── 음양의 조화 ─────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-semibold text-[#2D5C5C] tracking-widest uppercase">음양의 조화</p>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#f0ede8] text-[#666] font-medium">{balance}</span>
        </div>

        {/* 음양 바 */}
        <div className="flex h-9 rounded-xl overflow-hidden shadow-sm">
          {yang > 0 && (
            <div
              className="flex items-center justify-center gap-1 transition-all"
              style={{ width: `${yangPct}%`, background: "linear-gradient(135deg, #f87171, #dc2626)" }}
            >
              <span className="text-white text-xs font-bold whitespace-nowrap px-1">
                陽 양 {yang}개 ({yangPct}%)
              </span>
            </div>
          )}
          {yin > 0 && (
            <div
              className="flex items-center justify-center gap-1 transition-all"
              style={{ width: `${yinPct}%`, background: "linear-gradient(135deg, #475569, #1e293b)" }}
            >
              <span className="text-white text-xs font-bold whitespace-nowrap px-1">
                陰 음 {yin}개 ({yinPct}%)
              </span>
            </div>
          )}
        </div>

        <div className="flex justify-between mt-1.5 text-[10px] text-[#888]">
          <span>陽(양): 활동·발산·빛의 기운</span>
          <span>陰(음): 수렴·차분·그늘의 기운</span>
        </div>
      </div>

      {/* ── 오행 분포도 ─────────────────────────────────── */}
      <div>
        <p className="text-xs font-semibold text-[#2D5C5C] tracking-widest uppercase mb-3">오행 분포도</p>

        <div className="space-y-2.5">
          {OHAENG_META.map(({ key, hanja, label, bg, hanjaBg }) => {
            const count = counts[key] ?? 0;
            const pct = total > 0 ? Math.round((count / total) * 100) : 0;
            const barW = maxCount > 0 ? (count / maxCount) * 100 : 0;

            return (
              <div key={key} className="flex items-center gap-3">
                {/* 한자 원형 뱃지 */}
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 shadow-sm"
                  style={{ background: hanjaBg }}
                >
                  <span className="text-white text-base font-bold leading-none">{hanja}</span>
                </div>

                {/* 한글 라벨 */}
                <span className="w-6 text-sm font-bold text-[#1a1730] shrink-0">{label}</span>

                {/* 바 */}
                <div className="flex-1 h-5 rounded-full bg-[#f0ede8] overflow-hidden">
                  <div
                    className={`h-full rounded-full ${bg} transition-all`}
                    style={{ width: `${barW}%` }}
                  />
                  {pct > 0 && (
                    <span
                      className="absolute text-[10px] text-white font-bold leading-5 px-2 pointer-events-none"
                      style={{ display: barW > 20 ? "inline" : "none" }}
                    >
                      {pct}%
                    </span>
                  )}
                </div>

                {/* 수치 */}
                <div className="w-16 text-right shrink-0">
                  <span className="text-sm font-bold text-[#1a1730]">{count}개</span>
                </div>
              </div>
            );
          })}
        </div>

        <p className="text-[10px] text-[#bbb] mt-3 text-right">
          천간·지지 각 1개씩 산정 / 총 {total}개
        </p>
      </div>
    </div>
  );
}
