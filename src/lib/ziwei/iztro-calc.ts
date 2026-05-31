/**
 * iztro wrapper — 자미두수 명반 계산 + LLM 컨텍스트 포맷터
 * 02_IZTRO_INTEGRATION.md 기반
 */
import { astro } from "iztro";
import type { Myeongsik } from "@/lib/saju/manseryeok";

// ── 타입 정의 ──────────────────────────────────────────────────────────────

export type ZiweiPan = ReturnType<typeof astro.bySolar>;

export type ZiweiPalaceData = {
  name: string;           // 궁 이름 (한국어)
  nameZh: string;         // 궁 이름 (중국어 간체)
  heavenlyStem: string;   // 천간 (한자)
  earthlyBranch: string;  // 지지 (한자)
  isSoulPalace: boolean;  // 명궁 여부
  isBodyPalace: boolean;  // 신궁 여부
  majorStars: Array<{ name: string; brightness: string; mutagen: string }>;
  minorStars: Array<{ name: string; type: string }>;
  mutagen: string[];      // 이 궁의 사화 (ko: 화록, 화권, 화과, 화기)
  decadalRange: [number, number] | null;
};

// ── 상수 매핑 ──────────────────────────────────────────────────────────────

const PALACE_NAME_MAP: Record<string, string> = {
  "命宫": "명궁(命宮)",
  "兄弟": "형제궁(兄弟宮)",
  "夫妻": "부처궁(夫妻宮)",
  "子女": "자녀궁(子女宮)",
  "财帛": "재백궁(財帛宮)",
  "疾厄": "질액궁(疾厄宮)",
  "迁移": "천이궁(遷移宮)",
  "仆役": "노복궁(奴僕宮)",
  "官禄": "관록궁(官祿宮)",
  "田宅": "전택궁(田宅宮)",
  "福德": "복덕궁(福德宮)",
  "父母": "부모궁(父母宮)",
};

const PALACE_NAME_KO: Record<string, string> = {
  "命宫": "명궁",
  "兄弟": "형제궁",
  "夫妻": "부처궁",
  "子女": "자녀궁",
  "财帛": "재백궁",
  "疾厄": "질액궁",
  "迁移": "천이궁",
  "仆役": "노복궁",
  "官禄": "관록궁",
  "田宅": "전택궁",
  "福德": "복덕궁",
  "父母": "부모궁",
};

const BRIGHTNESS_MAP: Record<string, string> = {
  "庙": "묘(廟)",
  "旺": "왕(旺)",
  "得": "득지(得地)",
  "平": "평(平)",
  "闲": "한(閑)",
  "陷": "함(陷)",
};

const MUTAGEN_ZH_TO_KO: Record<string, string> = {
  "禄": "화록(化祿)",
  "权": "화권(化權)",
  "科": "화과(化科)",
  "忌": "화기(化忌)",
};

// ── 시진 변환 ──────────────────────────────────────────────────────────────

/** 시각(0~23) → 시진(0~12) 변환 (02_IZTRO_INTEGRATION.md 섹션 3) */
export function hourToShichen(hour: number): number {
  if (hour === 23 || hour === 0) return 0; // 자시
  return Math.floor((hour + 1) / 2);
}

// ── 명반 계산 ──────────────────────────────────────────────────────────────

/**
 * 출생 정보로 자미두수 명반 계산
 * zh-CN으로 계산하여 한자 데이터 확보 (별 이름, 천간지지 등)
 */
export function calcZiweiPan(
  birthDate: string,         // "YYYY-MM-DD"
  birthHour: number,         // 0~23
  gender: "male" | "female",
  isLunar: boolean
): ZiweiPan {
  const shichen = hourToShichen(birthHour);
  const genderStr = gender === "male" ? "男" : "女";

  try {
    if (isLunar) {
      return astro.byLunar(birthDate, shichen, genderStr, false, true, "zh-CN");
    }
    return astro.bySolar(birthDate, shichen, genderStr, true, "zh-CN");
  } catch (e) {
    // 시간 미상 fallback: 정오(6=오시)로 계산
    return astro.bySolar(birthDate, 6, genderStr, true, "zh-CN");
  }
}

// ── 명반 → myeongsik 변환 ──────────────────────────────────────────────────

/** iztro 명반의 chineseDate에서 사주 4기둥 추출 */
export function extractMyeongsikFromPan(pan: ZiweiPan): Myeongsik {
  // chineseDate 예: "庚午 己卯 己卯 辛未"
  const parts = (pan.chineseDate as string).split(" ");
  const [yearStr, monthStr, dayStr, hourStr] = parts;

  const parse = (s?: string) =>
    s ? { cheongan: s[0], jiji: s[1] } : { cheongan: "", jiji: "" };

  return {
    year: parse(yearStr),
    month: parse(monthStr),
    day: parse(dayStr),
    hour: hourStr ? parse(hourStr) : null,
  } as Myeongsik;
}

// ── 궁 데이터 정제 ──────────────────────────────────────────────────────────

/** 명반 12궁을 정제된 ZiweiPalaceData 배열로 변환 */
export function extractPalaces(pan: ZiweiPan): ZiweiPalaceData[] {
  const soulBranch = pan.earthlyBranchOfSoulPalace as string;
  const bodyBranch = pan.earthlyBranchOfBodyPalace as string;

  return (pan.palaces as unknown as Array<Record<string, unknown>>).map((p) => {
    const nameZh = p.name as string;
    const mutagens = (p.mutagen as string[] | undefined) ?? [];
    const koMutagens = mutagens
      .filter((m): m is string => !!m)
      .map((m) => MUTAGEN_ZH_TO_KO[m] ?? m);

    const majorStars = ((p.majorStars as Array<Record<string, unknown>>) ?? []).map((s) => ({
      name: (s.name as string) ?? "",
      brightness: BRIGHTNESS_MAP[(s.brightness as string) ?? ""] ?? (s.brightness as string) ?? "",
      mutagen: MUTAGEN_ZH_TO_KO[(s.mutagen as string) ?? ""] ?? "",
    }));

    const minorStars = ((p.minorStars as Array<Record<string, unknown>>) ?? []).map((s) => ({
      name: (s.name as string) ?? "",
      type: (s.type as string) ?? "",
    }));

    const decadal = p.decadal as { range?: [number, number] } | undefined;

    return {
      name: PALACE_NAME_KO[nameZh] ?? nameZh,
      nameZh,
      heavenlyStem: (p.heavenlyStem as string) ?? "",
      earthlyBranch: (p.earthlyBranch as string) ?? "",
      isSoulPalace: (p.earthlyBranch as string) === soulBranch || nameZh === "命宫",
      isBodyPalace: (p.earthlyBranch as string) === bodyBranch,
      majorStars,
      minorStars,
      mutagen: koMutagens,
      decadalRange: decadal?.range ?? null,
    };
  });
}

// ── LLM 컨텍스트 포맷터 ────────────────────────────────────────────────────

/** 명반을 LLM 프롬프트용 한국어 자연어 요약으로 변환 */
export function formatZiweiForLLM(pan: ZiweiPan, userName?: string | null): string {
  const palaces = extractPalaces(pan);
  const soulPalace = palaces.find((p) => p.isSoulPalace) ?? palaces[0];
  const bodyPalace = palaces.find((p) => p.isBodyPalace);

  const nameStr = userName ? `이름: ${userName}\n` : "";
  const header = `[자미두수 명반 요약]

${nameStr}양력 생년월일: ${pan.solarDate as string}
사주 (四柱): ${pan.chineseDate as string}
오행국(五行局): ${pan.fiveElementsClass as string}

명궁(命宮) 위치: ${soulPalace.earthlyBranch}궁 (${soulPalace.heavenlyStem}${soulPalace.earthlyBranch})
  주성: ${soulPalace.majorStars.map((s) => `${s.name}(${s.brightness})${s.mutagen ? " " + s.mutagen : ""}`).join(", ") || "없음"}
  사화: ${soulPalace.mutagen.join(", ") || "없음"}
  대운 범위: ${soulPalace.decadalRange ? `${soulPalace.decadalRange[0]}~${soulPalace.decadalRange[1]}세` : "미상"}

신궁(身宮) 위치: ${bodyPalace ? `${bodyPalace.earthlyBranch}궁 (${bodyPalace.name})` : "명궁과 동일"}

`;

  const sihwaSection = formatSihwa(palaces);
  const palaceSection = palaces
    .map((p) => formatPalace(p))
    .join("\n");

  return header + sihwaSection + "\n" + palaceSection;
}

function formatSihwa(palaces: ZiweiPalaceData[]): string {
  const allMutagened: string[] = [];
  palaces.forEach((p) => {
    p.mutagen.forEach((m) => {
      allMutagened.push(`  ${m}: ${p.name}(${p.earthlyBranch}궁)`);
    });
    p.majorStars.forEach((s) => {
      if (s.mutagen) {
        allMutagened.push(`  ${s.mutagen}: ${p.name}(${p.earthlyBranch}궁)의 ${s.name}`);
      }
    });
  });

  return `[사화(四化) 종합]
${allMutagened.length > 0 ? allMutagened.join("\n") : "  없음"}
`;
}

function formatPalace(p: ZiweiPalaceData): string {
  const flags = [
    p.isSoulPalace ? "★명궁" : "",
    p.isBodyPalace ? "★신궁" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const stars =
    p.majorStars.length > 0
      ? p.majorStars.map((s) => `${s.name}(${s.brightness})${s.mutagen ? " " + s.mutagen : ""}`).join(", ")
      : "주성 없음";

  const minor =
    p.minorStars.length > 0
      ? " | 보조: " + p.minorStars.slice(0, 3).map((s) => s.name).join(", ")
      : "";

  const decadal = p.decadalRange
    ? ` | 대운: ${p.decadalRange[0]}~${p.decadalRange[1]}세`
    : "";

  const mutagenStr = p.mutagen.length > 0 ? ` | 사화: ${p.mutagen.join(", ")}` : "";

  return `${p.name}(${p.heavenlyStem}${p.earthlyBranch}) ${flags}
  주성: ${stars}${minor}${mutagenStr}${decadal}`;
}

// ── 대운 배열 포맷 ─────────────────────────────────────────────────────────

/** 현재 대운부터 향후 대운 정보 추출 */
export function formatDecadals(pan: ZiweiPan, currentAge: number): string {
  const palaces = extractPalaces(pan);
  const decadalPalaces = palaces
    .filter((p) => p.decadalRange !== null)
    .sort((a, b) => (a.decadalRange![0] ?? 0) - (b.decadalRange![0] ?? 0));

  const lines = decadalPalaces.map((p) => {
    const [start, end] = p.decadalRange!;
    const isCurrent = currentAge >= start && currentAge <= end;
    const stars = p.majorStars.map((s) => `${s.name}(${s.brightness})`).join(", ") || "주성 없음";
    return `  ${isCurrent ? "▶ 현재 " : "  "}${start}~${end}세: ${p.name} (${p.heavenlyStem}${p.earthlyBranch}) — ${stars}`;
  });

  return `[대운(大限) 전체 흐름]\n${lines.join("\n")}`;
}
