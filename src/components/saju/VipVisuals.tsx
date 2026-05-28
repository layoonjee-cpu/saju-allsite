// VIP 전용 시각화 — 신강신약 게이지 + 격국 배지
// raw_saju_json (luckyloveme API 응답)을 파싱해 표시

type SinStrength = {
  isStrong?: boolean;
  strength?: string;
  level?: number;        // 1~7
  score?: number;
  description?: string;
  analysis?: string;
  qualitativeType?: string;
};

type Gyeokguk = {
  type?: string;
  name?: string;
  yongsin?: { 십신?: string; 오행?: string };
  희신오행?: string;
  기신오행?: string;
  종합설명?: string;
};

type RawJson = {
  sinStrength?: SinStrength;
  gyeokguk?: Gyeokguk;
};

// 7단계 레이블
const LEVELS = ["극약", "신약", "약", "중화", "중강", "신강", "극강"] as const;

// 오행 → 색상
const OHAENG_COLOR: Record<string, string> = {
  목: "bg-green-100 text-green-800 border-green-200",
  화: "bg-red-100 text-red-800 border-red-200",
  토: "bg-amber-100 text-amber-800 border-amber-200",
  금: "bg-slate-100 text-slate-700 border-slate-200",
  수: "bg-blue-100 text-blue-800 border-blue-200",
};

function parseRaw(rawJson: unknown): RawJson | null {
  if (!rawJson || typeof rawJson !== "object") return null;
  return rawJson as RawJson;
}

type Props = { rawJson: unknown };

export function VipVisuals({ rawJson }: Props) {
  const data = parseRaw(rawJson);
  if (!data) return null;

  const sin = data.sinStrength;
  const gk = data.gyeokguk;

  const hasData = sin?.level !== undefined || gk?.name;
  if (!hasData) return null;

  return (
    <div className="space-y-4 mb-8">
      {/* 신강신약 게이지 */}
      {sin?.level !== undefined && (
        <div className="rounded-2xl border border-[#e8e4dd] bg-white px-5 py-4">
          <p className="text-xs font-semibold text-[#2D5C5C] tracking-widest uppercase mb-4">
            신강신약 (일간 강도)
          </p>

          {/* 7단계 도트 바 */}
          <div className="flex items-center gap-1.5 mb-3">
            {LEVELS.map((label, idx) => {
              const step = idx + 1;
              const isActive = step === sin.level;
              return (
                <div key={label} className="flex flex-col items-center gap-1 flex-1">
                  <div
                    className={`w-full h-3 rounded-full transition-all ${
                      isActive
                        ? "bg-[#2D5C5C] scale-y-110"
                        : step < (sin.level ?? 4)
                        ? "bg-[#2D5C5C]/30"
                        : "bg-[#e8e4dd]"
                    }`}
                  />
                  <span
                    className={`text-[10px] font-medium ${
                      isActive ? "text-[#2D5C5C] font-bold" : "text-[#bbb]"
                    }`}
                  >
                    {label}
                  </span>
                </div>
              );
            })}
          </div>

          {/* 요약 */}
          <div className="flex items-center gap-3 mt-1">
            <span className="text-sm font-bold text-[#1a1730]">
              {sin.strength ?? LEVELS[(sin.level ?? 4) - 1]}
            </span>
            {sin.score !== undefined && (
              <span className="text-xs text-[#888]">점수 {sin.score}점</span>
            )}
            {sin.qualitativeType && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-[#f0ede8] text-[#4a4a6a] border border-[#e0dbd0]">
                {sin.qualitativeType}
              </span>
            )}
          </div>

          {sin.analysis && (
            <p className="text-xs text-[#666] leading-relaxed mt-2 border-t border-[#f0ede8] pt-2">
              {sin.analysis}
            </p>
          )}
        </div>
      )}

      {/* 격국 정보 */}
      {gk?.name && (
        <div className="rounded-2xl border border-[#e8e4dd] bg-white px-5 py-4">
          <p className="text-xs font-semibold text-[#2D5C5C] tracking-widest uppercase mb-3">
            격국 (格局)
          </p>

          <div className="flex flex-wrap gap-2 mb-2">
            {/* 격국명 */}
            <span className="px-3 py-1 rounded-full text-sm font-bold bg-[#2D5C5C] text-white">
              {gk.name}
            </span>
            {gk.type && gk.type !== gk.name && (
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-[#f0ede8] text-[#4a4a6a] border border-[#e0dbd0]">
                {gk.type}
              </span>
            )}
            {/* 용신 오행 */}
            {gk.yongsin?.오행 && (
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold border ${
                  OHAENG_COLOR[gk.yongsin.오행] ?? "bg-gray-100 text-gray-700 border-gray-200"
                }`}
              >
                용신 {gk.yongsin.오행}({gk.yongsin.십신 ?? ""})
              </span>
            )}
            {/* 희신 */}
            {gk.희신오행 && (
              <span
                className={`px-3 py-1 rounded-full text-xs font-medium border ${
                  OHAENG_COLOR[gk.희신오행] ?? "bg-gray-100 text-gray-700 border-gray-200"
                }`}
              >
                희신 {gk.희신오행}
              </span>
            )}
            {/* 기신 */}
            {gk.기신오행 && (
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200">
                기신 {gk.기신오행}
              </span>
            )}
          </div>

          {gk.종합설명 && (
            <p className="text-xs text-[#666] leading-relaxed border-t border-[#f0ede8] pt-2 mt-2">
              {gk.종합설명}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
