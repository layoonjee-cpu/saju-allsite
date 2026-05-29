/**
 * TodayFortuneCard — 오늘의 운세 구조화 카드
 *
 * LLM이 JSON으로 반환한 오늘의 운세 데이터를 2개 카드로 렌더링:
 *   카드 1: 운세 풀이 (포인트 / 주의점 / 추천)
 *   카드 2: 행운템 (아이템 배지 + 색상/음식/방위 + 로또번호)
 *
 * 서버 컴포넌트 — 외부 라이브러리 없음, 순수 Tailwind CSS.
 */

export type TodayFortuneData = {
  포인트: string;
  주의점: string;
  추천: string;
  행운아이템: string[];
  행운색: string;
  행운음식: string;
  행운방위: string;
  로또번호: number[];
};

// ── 로또 번호 범위별 색상 ───────────────────────────────────
function lottoColor(n: number): { bg: string; text: string } {
  if (n <= 10)  return { bg: "#fde68a", text: "#92400e" }; // 노랑
  if (n <= 20)  return { bg: "#bfdbfe", text: "#1e40af" }; // 파랑
  if (n <= 30)  return { bg: "#fecaca", text: "#991b1b" }; // 빨강
  if (n <= 40)  return { bg: "#e2e8f0", text: "#334155" }; // 회색
  return              { bg: "#bbf7d0", text: "#14532d" }; // 초록
}

// ── 컴포넌트 ──────────────────────────────────────────────
export function TodayFortuneCard({ data }: { data: TodayFortuneData }) {
  const items = Array.isArray(data.행운아이템) ? data.행운아이템.slice(0, 3) : [];
  const lottos = Array.isArray(data.로또번호)
    ? [...data.로또번호].sort((a, b) => a - b).slice(0, 6)
    : [];

  return (
    <div className="space-y-4">

      {/* ── 카드 1: 오늘의 운세 풀이 ─────────────────────── */}
      <div className="rounded-2xl border border-[#e8e4dd] bg-white shadow-sm overflow-hidden">
        {/* 헤더 */}
        <div className="px-5 py-3.5 border-b border-[#f0ede8] bg-[#faf8f5]">
          <p className="text-sm font-semibold text-[#2d2d2d]">🔮 오늘의 운세 풀이</p>
        </div>

        <div className="px-5 py-5 space-y-5">
          {/* 포인트 */}
          <div>
            <p className="text-[12px] font-bold text-amber-600 mb-1.5">📍 포인트</p>
            <p className="text-sm leading-relaxed text-[#333]">{data.포인트}</p>
          </div>

          {/* 구분선 */}
          <div className="border-t border-[#f0ede8]" />

          {/* 주의점 */}
          <div>
            <p className="text-[12px] font-bold text-rose-600 mb-1.5">🔔 주의점</p>
            <p className="text-sm leading-relaxed text-[#333]">{data.주의점}</p>
          </div>

          {/* 구분선 */}
          <div className="border-t border-[#f0ede8]" />

          {/* 추천 */}
          <div>
            <p className="text-[12px] font-bold text-teal-600 mb-1.5">✨ 오늘의 추천</p>
            <p className="text-sm leading-relaxed text-[#333]">{data.추천}</p>
          </div>
        </div>
      </div>

      {/* ── 카드 2: 오늘의 행운템 ─────────────────────────── */}
      <div className="rounded-2xl border border-[#e8e4dd] bg-[#faf8f5] overflow-hidden">
        {/* 헤더 */}
        <div className="px-5 py-3.5 border-b border-[#f0ede8]">
          <p className="text-sm font-semibold text-[#2d2d2d]">🍀 오늘의 행운템</p>
        </div>

        <div className="px-5 py-5 space-y-5">
          {/* 아이템 배지 */}
          {items.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {items.map((item, i) => (
                <span
                  key={i}
                  className="px-3 py-1.5 rounded-full text-xs font-medium bg-white border border-[#e0dbd4] text-[#444] shadow-sm"
                >
                  {item}
                </span>
              ))}
            </div>
          )}

          {/* 색상 / 음식 / 방위 3열 그리드 */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: "행운의 색상", value: data.행운색 },
              { label: "행운의 음식", value: data.행운음식 },
              { label: "행운의 방위", value: data.행운방위 },
            ].map(({ label, value }) => (
              <div
                key={label}
                className="rounded-xl bg-white border border-[#e8e4dd] px-3 py-3 text-center"
              >
                <p className="text-[10px] text-[#999] mb-1">{label}</p>
                <p className="text-[13px] font-semibold text-[#333] leading-snug">{value}</p>
              </div>
            ))}
          </div>

          {/* 로또 번호 */}
          {lottos.length > 0 && (
            <div>
              <p className="text-[11px] font-semibold text-[#888] mb-3 text-center">
                🎲 오늘의 로또 번호
              </p>
              <div className="flex justify-center gap-2 flex-wrap">
                {lottos.map((n) => {
                  const { bg, text } = lottoColor(n);
                  return (
                    <span
                      key={n}
                      className="inline-flex items-center justify-center w-10 h-10 rounded-full text-sm font-bold shadow-sm"
                      style={{ backgroundColor: bg, color: text }}
                    >
                      {n}
                    </span>
                  );
                })}
              </div>
              <p className="text-center text-[10px] text-[#bbb] mt-2">
                참고용입니다 · 즐거운 마음으로!
              </p>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
