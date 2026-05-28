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

const OHAENG_META = [
  { key: "목", hanja: "木", label: "목(木)", color: "#22c55e", bg: "bg-green-500" },
  { key: "화", hanja: "火", label: "화(火)", color: "#ef4444", bg: "bg-red-500" },
  { key: "토", hanja: "土", label: "토(土)", color: "#f59e0b", bg: "bg-amber-500" },
  { key: "금", hanja: "金", label: "금(金)", color: "#94a3b8", bg: "bg-slate-400" },
  { key: "수", hanja: "水", label: "수(水)", color: "#3b82f6", bg: "bg-blue-500" },
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

type Props = { myeongsik: Myeongsik };

export function OhaengChart({ myeongsik }: Props) {
  const counts = computeOhaeng(myeongsik);
  const total = Object.values(counts).reduce((a, b) => a + b, 0);

  if (total === 0) return null;

  const maxCount = Math.max(...Object.values(counts));

  return (
    <div className="rounded-2xl border border-[#e8e4dd] bg-white px-5 py-4">
      <p className="text-xs font-semibold text-[#2D5C5C] tracking-widest uppercase mb-4">오행 분포</p>

      <div className="space-y-2.5">
        {OHAENG_META.map(({ key, label, bg }) => {
          const count = counts[key] ?? 0;
          const pct = total > 0 ? Math.round((count / total) * 100) : 0;
          const barW = maxCount > 0 ? (count / maxCount) * 100 : 0;

          return (
            <div key={key} className="flex items-center gap-3">
              {/* 라벨 */}
              <span className="w-12 text-sm font-bold text-[#1a1730] shrink-0">{label}</span>

              {/* 바 */}
              <div className="flex-1 h-5 rounded-full bg-[#f0ede8] overflow-hidden">
                <div
                  className={`h-full rounded-full ${bg} transition-all`}
                  style={{ width: `${barW}%` }}
                />
              </div>

              {/* 수치 */}
              <div className="w-20 text-right shrink-0">
                <span className="text-sm font-bold text-[#1a1730]">{count}개</span>
                <span className="text-xs text-[#888] ml-1">({pct}%)</span>
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-[10px] text-[#bbb] mt-3 text-right">
        천간·지지 각 1개씩 산정 / 총 {total}개
      </p>
    </div>
  );
}
