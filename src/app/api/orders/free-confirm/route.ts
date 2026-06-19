import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

export const maxDuration = 60; // 60초 — 무료 분석 생성용 (VIP는 LLM 없이 즉시 반환)
import { createClient } from "@/lib/supabase/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { computeMyeongsik, type Myeongsik } from "@/lib/saju/manseryeok";
import { buildSajuPrompt } from "@/lib/saju/prompt";
import { generateInterpretation } from "@/lib/saju/llm";
import {
  isSajuApiConfigured,
  fetchSajuAnalysis,
  formatSajuToManseryeok,
  ganjiToMyeongsik,
  ALL_FIELDS,
  type BirthInfo,
} from "@/lib/saju/saju-api";
import { calcZiweiPan, extractMyeongsikFromPan } from "@/lib/ziwei/iztro-calc";

const bodySchema = z.object({
  orderId: z.string().min(1),
});

type SajuInputRow = {
  birth_date: string | null;
  birth_time: string | null;
  time_unknown: boolean;
  calendar: "solar" | "lunar";
  gender: "male" | "female";
  concerns: string[];
  dream_content?: string | null;
};

function toBirthInfo(input: SajuInputRow): BirthInfo {
  const date = input.birth_date ?? "1900-01-01";
  const [y, m, d] = date.split("-");
  const hasTime = !input.time_unknown && !!input.birth_time;
  const [hh, mm] = hasTime ? input.birth_time!.split(":") : [undefined, undefined];
  return {
    birthYear: y,
    birthMonth: String(parseInt(m, 10)),
    birthDay: String(parseInt(d, 10)),
    ...(hasTime ? { birthHour: String(parseInt(hh!, 10)), birthMinute: String(parseInt(mm!, 10)) } : {}),
    calendarType: input.calendar === "lunar" ? "음력" : "양력",
    gender: input.gender,
  };
}

function toComputeInput(input: SajuInputRow) {
  return {
    birthDate: input.birth_date ?? "1900-01-01",
    birthTime: input.birth_time,
    timeUnknown: input.time_unknown,
    calendar: input.calendar,
    gender: input.gender,
  };
}

export async function POST(request: NextRequest) {
  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "잘못된 요청입니다" }, { status: 400 });
  }
  const { orderId } = parsed.data;

  // 로그인 필수
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });
  }

  // serverEnv() 전체 검증 우회 — 이 라우트에 필요한 키만 직접 사용
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY;
  if (!supabaseUrl || !supabaseSecretKey) {
    return NextResponse.json({ error: "서버 설정 오류" }, { status: 500 });
  }
  const service = createSupabaseClient(supabaseUrl, supabaseSecretKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // 주문 조회 + 소유권 확인
  const { data: order, error: orderErr } = await service
    .from("orders")
    .select("id, amount, status, product_id, user_id")
    .eq("order_id", orderId)
    .maybeSingle();

  if (orderErr || !order) {
    return NextResponse.json({ error: "주문을 찾을 수 없습니다" }, { status: 404 });
  }
  if (order.user_id !== user.id) {
    return NextResponse.json({ error: "권한이 없습니다" }, { status: 403 });
  }
  // 무료 상품 전용 라우트 — 금액이 0이 아니면 거부
  if (order.amount !== 0) {
    return NextResponse.json({ error: "유료 상품은 결제 후 이용하세요" }, { status: 400 });
  }
  // 이미 처리됨 (idempotent)
  if (order.status === "paid") {
    const { data: result } = await service
      .from("saju_results")
      .select("id")
      .eq("order_id", order.id)
      .maybeSingle();
    return NextResponse.json({ resultId: result?.id ?? null, alreadyPaid: true });
  }

  // 사주 입력 + 상품 조회
  const [{ data: input }, { data: product }] = await Promise.all([
    service.from("saju_inputs").select("*").eq("order_id", order.id).single(),
    service.from("products").select("slug, name").eq("id", order.product_id).single(),
  ]);

  if (!input || !product) {
    return NextResponse.json({ error: "사주 입력 또는 상품 조회 실패" }, { status: 500 });
  }

  // 주문 상태를 paid로 변경 (결제 없이) — 상품 확인 후 진행
  await service
    .from("orders")
    .update({ status: "paid", paid_at: new Date().toISOString() })
    .eq("id", order.id);

  // ── 자미두수: iztro 명반 계산 → generating 행 즉시 삽입 후 반환 ─────────
  // confirm/route.ts와 동일 패턴 (luckyloveme API 불필요)
  if (product.slug === "ziwei-saju") {
    try {
      const birthHour = input.birth_time && !input.time_unknown
        ? parseInt(input.birth_time.split(":")[0], 10)
        : 12;
      const pan = calcZiweiPan(
        input.birth_date ?? "1990-01-01",
        birthHour,
        input.gender as "male" | "female",
        input.calendar === "lunar"
      );
      const myeongsik = extractMyeongsikFromPan(pan);

      const { data: ziweiRow, error: ziweiErr } = await service
        .from("saju_results")
        .insert({
          order_id: order.id,
          myeongsik: myeongsik as never,
          raw_saju_json: pan as never,
          interpretation_md: "",
          llm_provider: process.env.LLM_PROVIDER ?? "openai",
          llm_model: process.env.LLM_MODEL ?? "gpt-4o",
          generation_status: "generating",
        })
        .select("id")
        .single();

      if (ziweiErr || !ziweiRow) {
        // 중복 방어: 이미 행이 있으면 반환
        const { data: existing } = await service
          .from("saju_results")
          .select("id")
          .eq("order_id", order.id)
          .maybeSingle();
        if (existing) return NextResponse.json({ resultId: existing.id });
        return NextResponse.json({ error: "결과 초기화 실패", detail: ziweiErr?.message }, { status: 500 });
      }

      return NextResponse.json({ resultId: ziweiRow.id });
    } catch (err) {
      console.error("[free-confirm/ziwei] iztro 계산 실패:", err);
      return NextResponse.json({ error: "명반 계산 실패", detail: String(err) }, { status: 500 });
    }
  }

  // ── 깊은시선(premium-saju): myeongsik 계산 후 generating 행 삽입 ─────────
  // LLM 호출 없이 즉시 반환 → VipGeneratingBanner가 27섹션 생성 담당
  if (product.slug === "premium-saju") {
    try {
      let myeongsik: Myeongsik;
      let rawSajuJson: unknown = null;

      if (isSajuApiConfigured()) {
        try {
          const birthInfo = toBirthInfo(input as SajuInputRow);
          const analysis = await fetchSajuAnalysis(birthInfo, ALL_FIELDS, { source: "confirm" });
          rawSajuJson = analysis;
          const converted = ganjiToMyeongsik(analysis);
          myeongsik = converted ?? await computeMyeongsik(toComputeInput(input as SajuInputRow));
        } catch {
          myeongsik = await computeMyeongsik(toComputeInput(input as SajuInputRow));
        }
      } else {
        myeongsik = await computeMyeongsik(toComputeInput(input as SajuInputRow));
      }

      const { data: vipRow, error: vipErr } = await service
        .from("saju_results")
        .insert({
          order_id: order.id,
          myeongsik: myeongsik as never,
          interpretation_md: "",
          llm_provider: process.env.LLM_PROVIDER ?? "openai",
          llm_model: process.env.LLM_MODEL ?? "gpt-4o",
          raw_saju_json: rawSajuJson as never,
          generation_status: "generating",
        })
        .select("id")
        .single();

      if (vipErr || !vipRow) {
        const { data: existing } = await service
          .from("saju_results")
          .select("id")
          .eq("order_id", order.id)
          .maybeSingle();
        if (existing) return NextResponse.json({ resultId: existing.id });
        return NextResponse.json({ error: "결과 초기화 실패", detail: vipErr?.message }, { status: 500 });
      }

      return NextResponse.json({ resultId: vipRow.id });
    } catch (err) {
      console.error("[free-confirm/premium] 실패:", err);
      return NextResponse.json({ error: "결과 초기화 실패", detail: String(err) }, { status: 500 });
    }
  }

  // ── 일반 상품: 인라인 LLM 생성 ──────────────────────────────────────────
  try {
    let myeongsik: Myeongsik;
    let manseryeokText: string | undefined;
    let rawSajuJson: unknown = null;

    if (isSajuApiConfigured()) {
      try {
        const birthInfo = toBirthInfo(input as SajuInputRow);
        const analysis = await fetchSajuAnalysis(birthInfo, ALL_FIELDS, { source: "confirm" });
        rawSajuJson = analysis;
        const converted = ganjiToMyeongsik(analysis);
        if (converted) {
          myeongsik = converted;
          manseryeokText = formatSajuToManseryeok(analysis, birthInfo);
        } else {
          myeongsik = await computeMyeongsik(toComputeInput(input as SajuInputRow));
        }
      } catch {
        myeongsik = await computeMyeongsik(toComputeInput(input as SajuInputRow));
      }
    } else {
      myeongsik = await computeMyeongsik(toComputeInput(input as SajuInputRow));
    }

    const { system, user: userPrompt } = buildSajuPrompt({
      productSlug: product.slug,
      productName: product.name,
      myeongsik,
      manseryeokText,
      birthDate: input.birth_date ?? "",
      birthTime: input.birth_time,
      timeUnknown: input.time_unknown ?? false,
      gender: input.gender,
      concerns: input.concerns ?? [],
    });

    const llm = await generateInterpretation({ system, user: userPrompt });

    const lowerFree = llm.text.toLowerCase();
    const isRefusalFree =
      llm.text.trim().length < 200 ||
      lowerFree.includes("i'm sorry") ||
      lowerFree.includes("i cannot") ||
      lowerFree.includes("i can't assist") ||
      lowerFree.includes("죄송합니다만");

    if (isRefusalFree) {
      return NextResponse.json(
        { error: "LLM 거부 응답", detail: llm.text.slice(0, 120) },
        { status: 500 }
      );
    }

    const { data: result, error: resultErr } = await service
      .from("saju_results")
      .insert({
        order_id: order.id,
        myeongsik: myeongsik as never,
        interpretation_md: llm.text,
        llm_provider: llm.provider,
        llm_model: llm.model,
        raw_saju_json: rawSajuJson as never,
        generation_status: "complete",
      })
      .select("id")
      .single();

    if (resultErr || !result) {
      return NextResponse.json({ error: "결과 저장 실패" }, { status: 500 });
    }

    return NextResponse.json({ resultId: result.id });
  } catch (err) {
    const detail = err instanceof Error
      ? (err.message || err.toString())
      : (typeof err === "string" ? err : JSON.stringify(err));
    console.error("[free-confirm] 생성 실패:", detail, err);
    return NextResponse.json(
      { error: "사주 해석 생성 실패", detail },
      { status: 500 },
    );
  }
}
