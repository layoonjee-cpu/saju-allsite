import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createServiceClient } from "@/lib/supabase/server";
import { confirmTossPayment } from "@/lib/toss/confirm";
import { generateInterpretation } from "@/lib/saju/llm";
import { buildTarotPrompt } from "@/lib/tarot/prompt";

export const maxDuration = 60;

const bodySchema = z.object({
  paymentKey: z.string().min(1),
  orderId: z.string().min(1),
  amount: z.number().int().nonnegative(),
});

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  const { paymentKey, orderId, amount } = parsed.data;
  const svc = createServiceClient();

  // 주문 조회
  const { data: order } = await svc
    .from("orders")
    .select("id, status, amount")
    .eq("order_id", orderId)
    .maybeSingle();

  if (!order) {
    return NextResponse.json({ error: "주문을 찾을 수 없습니다." }, { status: 404 });
  }
  if (order.status === "paid") {
    const { data: existing } = await svc
      .from("tarot_readings")
      .select("id")
      .eq("order_id", order.id)
      .maybeSingle();
    if (existing) return NextResponse.json({ readingId: existing.id });
  }
  if (order.amount !== amount) {
    return NextResponse.json({ error: "결제 금액이 일치하지 않습니다." }, { status: 400 });
  }

  // 토스 결제 승인 (개발 테스트 시 paymentKey가 test_로 시작하면 스킵)
  const isTestMode = process.env.NODE_ENV !== "production" && paymentKey.startsWith("test_");
  if (!isTestMode) {
    const tossResult = await confirmTossPayment({ paymentKey, orderId, amount });
    if (!tossResult.ok) {
      return NextResponse.json({ error: tossResult.error.message ?? "결제 승인 실패" }, { status: 400 });
    }
  }

  // 주문 상태 업데이트
  await svc
    .from("orders")
    .update({ status: "paid", toss_payment_key: paymentKey, paid_at: new Date().toISOString() })
    .eq("id", order.id);

  // tarot_readings 조회 (카드 정보 포함)
  const { data: reading } = await svc
    .from("tarot_readings")
    .select("id, name, card_1_id, card_1_reversed, card_2_id, card_2_reversed, card_3_id, card_3_reversed")
    .eq("order_id", order.id)
    .single();

  if (!reading) {
    return NextResponse.json({ error: "리딩 데이터를 찾을 수 없습니다." }, { status: 500 });
  }

  // LLM 리딩 생성 (TAROT_LLM_MODEL 환경변수 사용, 없으면 gpt-4o-mini)
  const tarotModel = process.env.TAROT_LLM_MODEL ?? "gpt-4o-mini";
  const prevModel = process.env.LLM_MODEL;
  process.env.LLM_MODEL = tarotModel;

  let readingText = "";
  try {
    const { system, user } = buildTarotPrompt(
      reading.name ?? "당신",
      { id: reading.card_1_id, reversed: reading.card_1_reversed },
      { id: reading.card_2_id, reversed: reading.card_2_reversed },
      { id: reading.card_3_id, reversed: reading.card_3_reversed },
    );
    const result = await generateInterpretation({ system, user, maxTokensOverride: 1500 });
    readingText = result.text;
  } catch {
    readingText = "";
  } finally {
    if (prevModel !== undefined) process.env.LLM_MODEL = prevModel;
    else delete process.env.LLM_MODEL;
  }

  // 리딩 텍스트 저장
  await svc
    .from("tarot_readings")
    .update({ reading_text: readingText, llm_model: tarotModel })
    .eq("id", reading.id);

  return NextResponse.json({ readingId: reading.id });
}
