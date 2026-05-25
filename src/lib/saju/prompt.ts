// =====================================================
// 사주 해석 프롬프트 빌더
// =====================================================
// 상품 slug 별로 톤/분량을 다르게. 수강생은 여기서 본인 톤으로 갈아끼우면 됩니다.

import type { Myeongsik } from "./manseryeok";

export type PromptInput = {
  productSlug: string;
  productName: string;
  myeongsik: Myeongsik;
  // luckyloveme 풀 분석이 있으면 4기둥 자리 대신 이 텍스트(천간지지/십성/대운/세운/12운성/신살 등 16종)로 교체.
  // 없으면(데모 / 호출 실패 fallback) 단순 4기둥만 포함.
  manseryeokText?: string;
  birthDate: string;
  birthTime: string | null;
  timeUnknown: boolean;
  gender: "male" | "female";
  concerns: string[];
  // 꿈해몽 전용 — 있으면 사주 대신 꿈해몽 프롬프트를 빌드
  dreamContent?: string;
};

const SYSTEM_BASE = `당신은 따뜻하고 공감력이 높은 사주 풀이 전문가입니다.
원칙:
- 단정적인 운명론은 피하고, 가능성과 경향성으로 표현합니다.
- 부정적인 내용도 반드시 행동 가능한 조언으로 마무리합니다.
- 한국어로, 친근한 존댓말로 작성합니다.
- 마크다운 헤딩(##, ###)과 불릿을 적극 사용합니다.
- 점성/주술적 권유나 비과학적 단정은 피합니다.`;

const DREAM_SYSTEM = `당신은 동양 해몽 전문가입니다. 수천 년 전통의 동양 꿈 해석 지식을 바탕으로, 꿈 속 상징과 심리적 메시지를 따뜻하고 섬세하게 풀이합니다.
원칙:
- 꿈에 등장한 인물, 장소, 사물, 색깔, 감정을 모두 분석합니다.
- 동양 전통 해몽(길몽·흉몽 여부, 상징 의미)과 현대 심리적 해석을 함께 제공합니다.
- 부정적 징조도 반드시 행동 조언과 함께 마무리합니다.
- 한국어로, 따뜻하고 친근한 존댓말로 작성합니다.
- 마크다운 헤딩(##, ###)과 불릿을 적극 사용합니다.
- 과도한 단정("반드시 일어납니다" 등)은 피하고, 가능성과 경향으로 표현합니다.`;

const STYLE_BY_SLUG: Record<string, { length: string; focus: string }> = {
  "today-fortune": {
    length: "2-3문장",
    focus: "오늘 하루의 흐름과 작은 행동 팁 1개",
  },
  "dream-reading": {
    length: "600-900자",
    focus: "꿈의 상징과 동양 해몽 의미, 길흉 여부, 심리적 메시지, 앞으로의 행동 조언",
  },
  "basic-saju": {
    length: "600-900자",
    focus: "기본 성향, 강점, 보완점, 올해의 흐름",
  },
  "love-saju": {
    length: "900-1200자",
    focus: "연애 패턴, 잘 맞는 상대 유형, 갈등 패턴, 현재 관계 조언",
  },
  "premium-saju": {
    length: "1500-2000자",
    focus: "대운/세운 흐름, 직업운, 재물운, 건강운, 인간관계 종합",
  },
};

export function buildSajuPrompt(input: PromptInput): { system: string; user: string } {
  // 꿈해몽 전용 분기
  if (input.productSlug === "dream-reading" && input.dreamContent) {
    return buildDreamPrompt(input);
  }

  const style = STYLE_BY_SLUG[input.productSlug] ?? STYLE_BY_SLUG["basic-saju"];
  const m = input.myeongsik;
  const pillar = (p: { cheongan: string; jiji: string } | null) =>
    p ? `${p.cheongan}${p.jiji}` : "(시 미상)";

  // 풀 분석 텍스트가 있으면 그걸 우선 사용, 없으면 단순 4기둥
  const sajuSection = input.manseryeokText
    ? `[사주 풀 명식]\n${input.manseryeokText}`
    : [
        `[사주 4기둥]`,
        `- 년주: ${pillar(m.year)}`,
        `- 월주: ${pillar(m.month)}`,
        `- 일주: ${pillar(m.day)}`,
        `- 시주: ${pillar(m.hour)}`,
      ].join("\n");

  const user = `[상품] ${input.productName}
[분량] 약 ${style.length}
[핵심 포커스] ${style.focus}

${sajuSection}

[기본 정보]
- 생년월일: ${input.birthDate}${input.timeUnknown ? " (시 미상)" : input.birthTime ? ` ${input.birthTime}` : ""}
- 성별: ${input.gender === "male" ? "남성" : "여성"}
- 고민 키워드: ${input.concerns.length > 0 ? input.concerns.join(", ") : "(미입력)"}

위 정보를 바탕으로 마크다운 리포트를 작성해 주세요.${
    input.manseryeokText
      ? " 천간지지/십성/대운/세운/신살 등 풀 명식 정보를 적극 활용하되, 단정적 표현은 피하고 가능성/경향으로 풀어 주세요."
      : ""
  }`;

  return { system: SYSTEM_BASE, user };
}

// ── 꿈해몽 전용 프롬프트 빌더 ──────────────────────────────
function buildDreamPrompt(input: PromptInput): { system: string; user: string } {
  const style = STYLE_BY_SLUG["dream-reading"];
  const user = `[상품] ${input.productName}
[분량] 약 ${style.length}
[핵심 포커스] ${style.focus}

[꿈 내용]
${input.dreamContent}

위 꿈 내용을 동양 해몽으로 풀이해 주세요.
다음 구성으로 마크다운 리포트를 작성해 주세요:
1. **꿈의 전체 인상** — 길몽/흉몽/중립 여부와 전반적 의미
2. **주요 상징 분석** — 등장한 인물·장소·사물·색깔의 해몽 의미
3. **심리적 메시지** — 이 꿈이 현재 마음에 전하는 메시지
4. **앞으로의 조언** — 이 꿈 이후 취하면 좋을 행동이나 마음가짐`;

  return { system: DREAM_SYSTEM, user };
}
