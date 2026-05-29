/**
 * MyeongsikTable — 사주 명식 6행 컬러 테이블
 *
 * rawJson(raw_saju_json)이 있으면:
 *   십성(천간) / 천간(대형·오행색) / 지지(대형·오행색) / 십성(지지) / 운성 / 신살
 * rawJson 없으면:
 *   천간 / 지지  (2행 fallback)
 */

import type { Myeongsik } from "@/lib/saju/manseryeok";

// ── 오행 컬러 매핑 (한글 + 한자 모두 지원) ─────────────────
const OHAENG_COLOR: Record<string, string> = {
  // 천간 한글
  갑: "#16a34a", 을: "#16a34a",   // 목 (녹색)
  병: "#dc2626", 정: "#dc2626",   // 화 (적색)
  무: "#d97706", 기: "#d97706",   // 토 (황색)
  경: "#64748b",                  // 금 (회색) — "신"은 지지와 공용
  임: "#1d4ed8", 계: "#1d4ed8",   // 수 (청색)
  // 천간 한자
  甲: "#16a34a", 乙: "#16a34a",
  丙: "#dc2626", 丁: "#dc2626",
  戊: "#d97706", 己: "#d97706",
  庚: "#64748b", 辛: "#64748b",
  壬: "#1d4ed8", 癸: "#1d4ed8",
  // 지지 한글
  자: "#1d4ed8",
  축: "#d97706",
  인: "#16a34a",
  묘: "#16a34a",
  진: "#d97706",
  사: "#dc2626",
  오: "#dc2626",
  미: "#d97706",
  신: "#64748b",  // 지지 "신(申)" — 천간 "신(辛)"과 같은 금 색상
  유: "#64748b",
  술: "#d97706",
  해: "#1d4ed8",
  // 지지 한자
  子: "#1d4ed8", 丑: "#d97706",
  寅: "#16a34a", 卯: "#16a34a",
  辰: "#d97706", 巳: "#dc2626",
  午: "#dc2626", 未: "#d97706",
  申: "#64748b", 酉: "#64748b",
  戌: "#d97706", 亥: "#1d4ed8",
};

// 오행 배경색 (연한 버전, 셀 배경에 사용)
const OHAENG_BG: Record<string, string> = {
  "#16a34a": "#f0fdf4",  // 목 → 연녹
  "#dc2626": "#fff5f5",  // 화 → 연적
  "#d97706": "#fffbeb",  // 토 → 연황
  "#64748b": "#f8fafc",  // 금 → 연회
  "#1d4ed8": "#eff6ff",  // 수 → 연청
};

function getColor(char: string): string {
  return OHAENG_COLOR[char] ?? "#1a1730";
}

function getBg(char: string): string {
  const c = getColor(char);
  return OHAENG_BG[c] ?? "#ffffff";
}

// ── raw_saju_json 파싱 타입 ───────────────────────────────────
type SipseongPillar = { gan?: string; ji?: string };

type RawJson = {
  sipseong?: {
    year?: SipseongPillar;
    month?: SipseongPillar;
    day?: SipseongPillar;
    hour?: SipseongPillar;
  };
  twelveFortune?: {
    year?: string;
    month?: string;
    day?: string;
    hour?: string;
    [key: string]: unknown;
  };
  sibisinsals?: {
    year?: string | string[];
    month?: string | string[];
    day?: string | string[];
    hour?: string | string[];
    [key: string]: unknown;
  };
  [key: string]: unknown;
};

function parseSinsal(v: string | string[] | undefined | null): string {
  if (!v) return "—";
  if (typeof v === "string") return v || "—";
  if (Array.isArray(v)) return v.slice(0, 2).join(" ") || "—";
  return "—";
}

// ── Props ─────────────────────────────────────────────────────
type Props = {
  myeongsik: Myeongsik;
  rawJson?: unknown;
};

// ── 컴포넌트 ──────────────────────────────────────────────────
export function MyeongsikTable({ myeongsik, rawJson }: Props) {
  const pillars = [
    { key: "hour",  label: "시주", pillar: myeongsik.hour  },
    { key: "day",   label: "일주", pillar: myeongsik.day   },
    { key: "month", label: "월주", pillar: myeongsik.month },
    { key: "year",  label: "년주", pillar: myeongsik.year  },
  ] as const;

  // rawJson 파싱 시도
  const raw = rawJson && typeof rawJson === "object" ? (rawJson as RawJson) : null;
  const hasRaw = !!(raw?.sipseong || raw?.twelveFortune);

  // 각 메타데이터 행 실제 데이터 존재 여부 (모두 "—"이면 행 숨김)
  const hasSipseongGan = !!(
    raw?.sipseong?.year?.gan || raw?.sipseong?.month?.gan ||
    raw?.sipseong?.day?.gan  || raw?.sipseong?.hour?.gan
  );
  const hasSipseongJi = !!(
    raw?.sipseong?.year?.ji || raw?.sipseong?.month?.ji ||
    raw?.sipseong?.day?.ji  || raw?.sipseong?.hour?.ji
  );
  const hasTwelveFortuneData = !!(
    raw?.twelveFortune?.year || raw?.twelveFortune?.month ||
    raw?.twelveFortune?.day  || raw?.twelveFortune?.hour
  );
  const hasSibisinsalsData = !!(
    raw?.sibisinsals?.year || raw?.sibisinsals?.month ||
    raw?.sibisinsals?.day  || raw?.sibisinsals?.hour
  );

  // ── 리치 테이블 (rawJson 있을 때) ─────────────────────────
  if (hasRaw) {
    return (
      <div className="rounded-2xl border border-[#e8e4dd] bg-white overflow-hidden shadow-sm">
        {/* 헤더 행 */}
        <div className="grid grid-cols-4 border-b border-[#e0dbd4] bg-[#f5f0e8]">
          {pillars.map(({ label }) => (
            <div key={label} className="py-2 text-center text-[11px] font-semibold tracking-widest text-[#6b6050] uppercase">
              {label}
            </div>
          ))}
        </div>

        {/* ① 십성(천간) 행 — 실제 데이터 있을 때만 */}
        {hasSipseongGan && (
          <div className="grid grid-cols-4 border-b border-[#f0ede8]">
            {pillars.map(({ key, label }) => {
              const sg = raw?.sipseong?.[key]?.gan;
              return (
                <div key={`sg-${label}`} className="py-1.5 text-center text-[11px] text-[#999]">
                  {sg || (key === "day" ? "일간" : "—")}
                </div>
              );
            })}
          </div>
        )}

        {/* ② 천간 대형 행 */}
        <div className="grid grid-cols-4 border-b border-[#e8e4dd]">
          {pillars.map(({ label, pillar }) => {
            const cg = pillar?.cheongan ?? "—";
            const color = getColor(cg);
            const bg = getBg(cg);
            return (
              <div
                key={`cg-${label}`}
                className="py-5 text-center text-4xl font-bold leading-none"
                style={{ color, background: bg }}
              >
                {cg}
              </div>
            );
          })}
        </div>

        {/* ③ 지지 대형 행 — 아래 메타행이 있을 때만 border-b */}
        <div className={`grid grid-cols-4${hasSipseongJi || hasTwelveFortuneData || hasSibisinsalsData ? " border-b border-[#e8e4dd]" : ""}`}>
          {pillars.map(({ label, pillar }) => {
            const jj = pillar?.jiji ?? "—";
            const color = getColor(jj);
            const bg = getBg(jj);
            return (
              <div
                key={`jj-${label}`}
                className="py-5 text-center text-4xl font-bold leading-none"
                style={{ color, background: bg }}
              >
                {jj}
              </div>
            );
          })}
        </div>

        {/* ④ 십성(지지) 행 — 실제 데이터 있을 때만 */}
        {hasSipseongJi && (
          <div className={`grid grid-cols-4 ${hasTwelveFortuneData || hasSibisinsalsData ? "border-b border-[#f0ede8]" : ""}`}>
            {pillars.map(({ key, label }) => {
              const sj = raw?.sipseong?.[key]?.ji;
              return (
                <div key={`sj-${label}`} className="py-1.5 text-center text-[11px] text-[#999]">
                  {sj || "—"}
                </div>
              );
            })}
          </div>
        )}

        {/* ⑤ 12운성 행 — 실제 데이터 있을 때만 */}
        {hasTwelveFortuneData && (
          <div className={`grid grid-cols-4 bg-[#faf8f5] ${hasSibisinsalsData ? "border-b border-[#f0ede8]" : ""}`}>
            {pillars.map(({ key, label }) => {
              const tf = raw?.twelveFortune?.[key];
              return (
                <div key={`tf-${label}`} className="py-1.5 text-center text-[11px] text-[#888]">
                  {typeof tf === "string" ? tf : "—"}
                </div>
              );
            })}
          </div>
        )}

        {/* ⑥ 12신살 행 — 실제 데이터 있을 때만 */}
        {hasSibisinsalsData && (
          <div className="grid grid-cols-4">
            {pillars.map(({ key, label }) => {
              const ss = raw?.sibisinsals?.[key];
              return (
                <div key={`ss-${label}`} className="py-1.5 text-center text-[11px] text-[#888]">
                  {parseSinsal(ss as string | string[] | undefined)}
                </div>
              );
            })}
          </div>
        )}

        {/* 범례 */}
        <div className="border-t border-[#f0ede8] px-4 py-2 flex flex-wrap gap-x-4 gap-y-1 justify-center bg-[#faf8f5]">
          {[
            { color: "#16a34a", label: "목(木)" },
            { color: "#dc2626", label: "화(火)" },
            { color: "#d97706", label: "토(土)" },
            { color: "#64748b", label: "금(金)" },
            { color: "#1d4ed8", label: "수(水)" },
          ].map(({ color, label }) => (
            <span key={label} className="flex items-center gap-1">
              <span className="inline-block w-2 h-2 rounded-full" style={{ background: color }} />
              <span className="text-[10px] text-[#aaa]">{label}</span>
            </span>
          ))}
        </div>
      </div>
    );
  }

  // ── 2행 fallback (rawJson 없을 때) ────────────────────────
  return (
    <div className="rounded-2xl border border-[#e8e4dd] bg-white overflow-hidden">
      <div className="grid grid-cols-4 border-b border-[#e8e4dd] bg-[#f5f0e8]">
        {pillars.map(({ label }) => (
          <div key={label} className="py-2 text-center text-[11px] font-semibold tracking-widest text-[#6b6050] uppercase">
            {label}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-4 border-b border-[#f0ede8]">
        {pillars.map(({ label, pillar }) => {
          const cg = pillar?.cheongan ?? "—";
          return (
            <div key={`cg-${label}`} className="py-5 text-center text-3xl font-bold" style={{ color: getColor(cg) }}>
              {cg}
            </div>
          );
        })}
      </div>
      <div className="grid grid-cols-4">
        {pillars.map(({ label, pillar }) => {
          const jj = pillar?.jiji ?? "—";
          return (
            <div key={`jj-${label}`} className="py-5 text-center text-3xl font-bold" style={{ color: getColor(jj) }}>
              {jj}
            </div>
          );
        })}
      </div>
    </div>
  );
}
