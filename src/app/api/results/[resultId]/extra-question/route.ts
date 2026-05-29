import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { generateInterpretation } from "@/lib/saju/llm";

export const maxDuration = 60;

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ resultId: string }> }
) {
  const { resultId } = await params;

  try {
    const body = await req.json() as { question?: string };
    const question = (body.question ?? "").trim();

    if (!question || question.length < 5) {
      return NextResponse.json({ error: "질문을 5자 이상 입력해주세요." }, { status: 400 });
    }
    if (question.length > 200) {
      return NextResponse.json({ error: "질문은 200자 이내로 작성해주세요." }, { status: 400 });
    }

    const svc = createServiceClient();

    // ── 1. 결과 조회 ──────────────────────────────────────────
    const { data: result } = await svc
      .from("saju_results")
      .select("id, order_id, myeongsik, interpretation_md, extra_question, extra_question_answer")
      .eq("id", resultId)
      .maybeSingle();

    if (!result) {
      return NextResponse.json({ error: "결과를 찾을 수 없습니다." }, { status: 404 });
    }

    // ── 2. 이미 사용한 경우 (strict 1-time 제어) ─────────────
    if (result.extra_question !== null) {
      return NextResponse.json(
        { error: "이미 추가 질문을 사용하셨습니다. 1회에 한해 제공됩니다." },
        { status: 409 }
      );
    }

    // ── 3. 주문 확인 (결제 완료 + 금액 ≥ 1900) ──────────────
    const { data: order } = await svc
      .from("orders")
      .select("product_id, amount, paid_at")
      .eq("id", result.order_id)
      .single();

    if (!order || !order.paid_at) {
      return NextResponse.json({ error: "결제 완료된 주문에서만 이용 가능합니다." }, { status: 403 });
    }
    if ((order.amount ?? 0) < 1900) {
      return NextResponse.json({ error: "이 상품은 추가 질문 기능을 지원하지 않습니다." }, { status: 403 });
    }

    // ── 4. 후기 존재 여부 확인 ───────────────────────────────
    const { data: review } = await svc
      .from("reviews")
      .select("id")
      .eq("order_id", result.order_id)
      .maybeSingle();

    if (!review) {
      return NextResponse.json(
        { error: "후기를 먼저 작성해야 추가 질문을 이용할 수 있습니다." },
        { status: 403 }
      );
    }

    // ── 5. LLM 답변 생성 ─────────────────────────────────────
    // 기존 분석지를 컨텍스트로 활용 (최대 3,000자)
    const contextMd = (result.interpretation_md ?? "").slice(0, 3000);

    const system = `당신은 정통 명리학(四柱推命) 전문가입니다.
아래 제공된 사주 분석 내용을 바탕으로 추가 질문에 구체적이고 실질적으로 답변합니다.
답변 형식: 3~4개 문단, 각 문단 2~3문장. 명리학적 근거를 들되 단정 표현 금지.
마지막 문단은 반드시 실천 가능한 조언이나 개운법으로 마무리합니다.
한국어 정중한 존댓말(~입니다, ~드립니다)로 작성합니다.`;

    const user = `[기존 사주 분석 내용 (컨텍스트)]\n${contextMd || "사주 분석 내용 없음"}\n\n[추가 질문]\n${question}\n\n위 사주 분석을 바탕으로 이 질문에 명리학적으로 깊이 있게 답변해 주세요.`;

    const llm = await generateInterpretation({ system, user });

    if (!llm.text || llm.text.trim().length < 50) {
      return NextResponse.json(
        { error: "답변 생성에 실패했습니다. 잠시 후 다시 시도해주세요." },
        { status: 500 }
      );
    }

    // ── 6. DB 저장 (원자적: 저장 성공해야 응답 반환) ─────────
    const { error: updateErr } = await svc
      .from("saju_results")
      .update({
        extra_question: question,
        extra_question_answer: llm.text,
      })
      .eq("id", resultId)
      .is("extra_question", null); // 이중 안전장치: 동시 호출로 중복 저장 방지

    if (updateErr) {
      console.error("[extra-question] DB 저장 오류:", updateErr);
      // 이미 저장된 경우(동시 요청)도 여기로 빠질 수 있음
      return NextResponse.json(
        { error: "저장 중 오류가 발생했습니다. 이미 질문을 사용하셨거나 일시적인 오류입니다." },
        { status: 500 }
      );
    }

    return NextResponse.json({ answer: llm.text });
  } catch (err) {
    console.error("[extra-question] 예외:", err);
    return NextResponse.json(
      { error: "오류가 발생했습니다. 잠시 후 다시 시도해주세요." },
      { status: 500 }
    );
  }
}
