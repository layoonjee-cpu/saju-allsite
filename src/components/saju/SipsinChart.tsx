/**
 * SipsinChart — 십신(十神) 분포 바 차트
 * raw_saju_json의 sipseong 데이터에서 각 기둥 십성을 추출하여
 * 비겁/식상/재성/관성/인성 5그룹의 분포를 시각화합니다.
 * (순수 Tailwind CSS, 외부 차트 라이브러리 없음)
 */

import type { Myeongsik } from "@/lib/saju/manseryeok";

// ── 십신 그룹 정의 ────────────────────────────────────────────────
const SIPSIN_GROUPS = [
  {
    key: "비겁",
    hanja: "比",
    label: "비겁",
    sub: "비견·겁재",
    desc: "자아의 힘, 독립심, 경쟁",
    color: "bg-teal-600",
    hanjaBg: "#0d9488",
    textColor: "text-teal-700",
    bgLight: "bg-teal-50",
    members: ["비견", "겁재"],
  },
  {
    key: "식상",
    hanja: "食",
    label: "식상",
    sub: "식신·상관",
    desc: "창의력, 표현력, 재능",
    color: "bg-amber-500",
    hanjaBg: "#f59e0b",
    textColor: "text-amber-700",
    bgLight: "bg-amber-50",
    members: ["식신", "상관"],
  },
  {
    key: "재성",
    hanja: "財",
    label: "재성",
    sub: "편재·정재",
    desc: "현실 감각, 재물, 목표",
    color: "bg-yellow-500",
    hanjaBg: "#ca8a04",
    textColor: "text-yellow-700",
    bgLight: "bg-yellow-50",
    members: ["편재", "정재"],
  },
  {
    key: "관성",
    hanja: "官",
    label: "관성",
    sub: "편관·정관",
    desc: "책임감, 명예, 규율",
    color: "bg-rose-600",
    hanjaBg: "#e11d48",
    textColor: "text-rose-700",
    bgLight: "bg-rose-50",
    members: ["편관", "정관"],
  },
  {
    key: "인성",
    hanja: "印",
    label: "인성",
    sub: "편인·정인",
    desc: "지혜, 학문, 수용력",
    color: "bg-blue-600",
    hanjaBg: "#2563eb",
    textColor: "text-blue-700",
    bgLight: "bg-blue-50",
    members: ["편인", "정인"],
  },
] as const;

// ── 타입 정의 ─────────────────────────────────────────────────────
type SipseongEntry = {
  gan?: string;
  ji?: string;
  [key: string]: unknown;
};

type RawSajuJson = {
  sipseong?: {
    year?: SipseongEntry;
    month?: SipseongEntry;
    day?: SipseongEntry;
    hour?: SipseongEntry;
    [key: string]: SipseongEntry | undefined;
  };
  [key: string]: unknown;
};

// ── 십성 → 그룹 매핑 ─────────────────────────────────────────────
function toGroupKey(sipseong: string | undefined | null): string | null {
  if (!sipseong) return null;
  const normalized = sipseong.trim();
  for (const group of SIPSIN_GROUPS) {
    if ((group.members as readonly string[]).some((m) => normalized.includes(m))) {
      return group.key;
    }
  }
  return null;
}

// ── raw_saju_json에서 십성 카운트 추출 ───────────────────────────
function countSipsin(rawJson: unknown): Record<string, number> {
  const counts: Record<string, number> = {
    비겁: 0,
    식상: 0,
    재성: 0,
    관성: 0,
    인성: 0,
  };

  if (!rawJson || typeof rawJson !== "object") return counts;
  const raw = rawJson as RawSajuJson;

  const sipseong = raw.sipseong;
  if (!sipseong || typeof sipseong !== "object") return counts;

  // 기둥 순서: year, month, day, hour (일간 본인은 제외 → 일지부터)
  const pillars = ["year", "month", "day", "hour"] as const;

  for (const pillar of pillars) {
    const entry = sipseong[pillar];
    if (!entry) continue;

    // 천간 십성 (일간 본인 기둥의 천간은 "본원" 또는 없음 — 건너뜀)
    if (pillar !== "day" && entry.gan) {
      const gk = toGroupKey(entry.gan);
      if (gk && gk in counts) counts[gk]++;
    }

    // 지지 십성
    if (entry.ji) {
      const jk = toGroupKey(entry.ji);
      if (jk && jk in counts) counts[jk]++;
    }
  }

  return counts;
}

// ── Props ─────────────────────────────────────────────────────────
type SipsinChartProps = {
  rawJson: unknown;
  myeongsik?: Myeongsik;
};

// ── 컴포넌트 ──────────────────────────────────────────────────────
export function SipsinChart({ rawJson }: SipsinChartProps) {
  const counts = countSipsin(rawJson);
  const total = Object.values(counts).reduce((a, b) => a + b, 0);

  if (total === 0) return null;

  const maxCount = Math.max(...Object.values(counts));

  return (
    <div className="rounded-2xl border border-[#e8e4dd] bg-white px-5 py-5">
      <p className="text-xs font-semibold text-[#2D5C5C] tracking-widest uppercase mb-4">
        십신(十神) 분포
      </p>

      <div className="space-y-2.5">
        {SIPSIN_GROUPS.map((group) => {
          const count = counts[group.key] ?? 0;
          const pct = total > 0 ? Math.round((count / total) * 100) : 0;
          const barW = maxCount > 0 ? (count / maxCount) * 100 : 0;

          return (
            <div key={group.key} className="grid grid-cols-[7rem_1fr_3.5rem] items-center gap-3">
              {/* 한자 원형 뱃지 + 한글명 + 부제 */}
              <div className="flex items-center gap-2">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 shadow-sm"
                  style={{ background: group.hanjaBg }}
                >
                  <span className="text-white text-base font-bold leading-none">{group.hanja}</span>
                </div>
                <div className="min-w-0">
                  <span className="text-xs font-bold text-[#1a1730] block leading-tight">{group.label}</span>
                  <span className="text-[10px] text-[#888] block leading-tight">{group.sub}</span>
                </div>
              </div>

              {/* 바 */}
              <div className="h-5 rounded-full bg-[#f0ede8] overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${group.color}`}
                  style={{ width: `${barW}%` }}
                />
              </div>

              {/* 수치 */}
              <div className="text-right">
                <span className="text-sm font-bold text-[#1a1730] block">{count}개</span>
                <span className="text-[10px] text-[#888] block">{pct}%</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* 설명 범례 */}
      <div className="mt-4 pt-3 border-t border-[#e8e4dd] grid grid-cols-1 sm:grid-cols-2 gap-1.5">
        {SIPSIN_GROUPS.map((group) => {
          const count = counts[group.key] ?? 0;
          return (
            <div key={group.key} className={`flex items-start gap-2 rounded-lg px-2 py-1.5 ${group.bgLight}`}>
              <span className={`mt-0.5 inline-block w-2 h-2 rounded-full ${group.color} shrink-0`} />
              <div>
                <span className={`text-[11px] font-semibold ${group.textColor}`}>
                  {group.label} {count > 0 ? `(${count}개)` : "없음"}
                </span>
                <span className="block text-[10px] text-muted-foreground">{group.desc}</span>
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-[10px] text-[#bbb] mt-3 text-right">
        일간 본신 제외 / 총 {total}개
      </p>
    </div>
  );
}
