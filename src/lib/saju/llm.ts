// =====================================================
// LLM 프로바이더 스위치
// =====================================================
// LLM_PROVIDER 환경변수로 openai | anthropic | gemini 선택.
// 각 SDK는 lazy import 하여 미사용 패키지의 init 비용을 줄임.

export type LlmRequest = {
  system: string;
  user: string;
  /** 섹션별 토큰 오버라이드 (10-call VIP 등 다중 호출 시 사용) */
  maxTokensOverride?: number;
};

export type LlmResponse = {
  text: string;
  provider: string;
  model: string;
};

// serverEnv() 전체 검증 우회 — 이 모듈에 필요한 키만 직접 읽음
// TOSS_SECRET_KEY 등 무관한 변수가 Vercel에 없어도 LLM 호출에 영향 없음
export async function generateInterpretation(req: LlmRequest): Promise<LlmResponse> {
  const provider = (process.env.LLM_PROVIDER ?? "openai") as "openai" | "anthropic" | "gemini";
  const model = process.env.LLM_MODEL ?? "gpt-4o";

  switch (provider) {
    case "openai":
      return callOpenAI(req, model, process.env.OPENAI_API_KEY);
    case "anthropic":
      return callAnthropic(req, model, process.env.ANTHROPIC_API_KEY);
    case "gemini":
      return callGemini(req, model, process.env.GOOGLE_GENERATIVE_AI_API_KEY);
  }
}

/** 기본 max_tokens (싱글 호출용) */
const DEFAULT_MAX_TOKENS = parseInt(process.env.LLM_MAX_TOKENS ?? "4000");

async function callOpenAI(req: LlmRequest, model: string, key: string | undefined): Promise<LlmResponse> {
  if (!key) throw new Error("OPENAI_API_KEY is required when LLM_PROVIDER=openai");
  const { default: OpenAI } = await import("openai");
  const client = new OpenAI({ apiKey: key });
  const completion = await client.chat.completions.create({
    model,
    messages: [
      { role: "system", content: req.system },
      { role: "user", content: req.user },
    ],
    temperature: 0.7,
    max_tokens: req.maxTokensOverride ?? DEFAULT_MAX_TOKENS,
  });
  const text = completion.choices[0]?.message?.content ?? "";
  return { text, provider: "openai", model };
}

async function callAnthropic(req: LlmRequest, model: string, key: string | undefined): Promise<LlmResponse> {
  if (!key) throw new Error("ANTHROPIC_API_KEY is required when LLM_PROVIDER=anthropic");
  const Anthropic = (await import("@anthropic-ai/sdk")).default;
  const client = new Anthropic({ apiKey: key });
  const message = await client.messages.create({
    model,
    max_tokens: req.maxTokensOverride ?? 8096,
    system: req.system,
    messages: [{ role: "user", content: req.user }],
  });
  const text = message.content
    .map((b) => (b.type === "text" ? b.text : ""))
    .join("\n");
  return { text, provider: "anthropic", model };
}

async function callGemini(req: LlmRequest, model: string, key: string | undefined): Promise<LlmResponse> {
  if (!key) throw new Error("GOOGLE_GENERATIVE_AI_API_KEY is required when LLM_PROVIDER=gemini");
  const { GoogleGenerativeAI } = await import("@google/generative-ai");
  const client = new GoogleGenerativeAI(key);
  const m = client.getGenerativeModel({ model, systemInstruction: req.system });
  const result = await m.generateContent(req.user);
  const text = result.response.text();
  return { text, provider: "gemini", model };
}
