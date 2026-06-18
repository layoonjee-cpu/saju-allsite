import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { createServiceClient } from "@/lib/supabase/server";
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

export const maxDuration = 300; // VIP 분석 최대 5분

// confirm/route.ts에서 복사 (공통 util로 분리하기 전까지 인라인 유지)
type SajuInputRow = {
  name?: string | null;
  birth_date: string | null;
  birth_time: string | null;
  time_unknown: boolean;
  calendar: "solar" | "lunar";
  gender: "male" | "female";
  concerns: string[];
  dream_content?: string | null;
  partner_name?: string | null;
  partner_birth_date?: string | null;
  partner_birth_time?: string | null;
  partner_time_unknown?: boolean;
  partner_gender?: string | null;
  partner_calendar?: string | null;
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

/**
 * POST /api/admin/regenerate/[orderId]
 * VIP 분석 수동 재생성 — 분석지 없음 또는 generating 상태 주문에 사용
 */
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const { orderId } = await params;
  const svc = createServiceClient();

  // 1. 주문 조회
  const { data: order } = await svc
    .from("orders")
    .select("id, status, product_id")
    .eq("id", orderId)
    .single();

  if (!order) {
    return NextResponse.json({ ok: false, error: "주문을 찾을 수 없습니다" }, { status: 404 });
  }
  if (order.status !== "paid") {
    return NextResponse.json({ ok: false, error: "결제 완료 상태의 주문만 재생성할 수 있습니다" }, { status: 400 });
  }

  // 2. 사주 입력 + 상품 조회
  const [{ data: input }, { data: product }] = await Promise.all([
    svc.from("saju_inputs").select("*").eq("order_id", orderId).single(),
    svc.from("products").select("slug, name").eq("id", order.product_id).single(),
  ]);

  if (!input || !product) {
    return NextResponse.json({ ok: false, error: "입력 정보 또는 상품 조회 실패" }, { status: 500 });
  }

  // 3. 기존 result 조회 (있으면 UPDATE, 없으면 INSERT)
  const { data: existingResult } = await svc
    .from("saju_results")
    .select("id, raw_saju_json")
    .eq("order_id", orderId)
    .maybeSingle();

  try {
    let myeongsik: Myeongsik;
    let manseryeokText: string | undefined;
    let rawSajuJson: unknown = existingResult?.raw_saju_json ?? null;

    const isDreamReading = product.slug === "dream-reading";

    // 4. 명식 계산 (raw_saju_json이 이미 있으면 재사용, 없으면 API 재호출)
    if (isDreamReading) {
      myeongsik = { year: null, month: null, day: null, hour: null } as unknown as Myeongsik;
    } else if (rawSajuJson) {
      // 기존 데이터 재사용
      const converted = ganjiToMyeongsik(rawSajuJson);
      if (converted) {
        myeongsik = converted;
        manseryeokText = formatSajuToManseryeok(rawSajuJson, toBirthInfo(input as SajuInputRow));
      } else {
        myeongsik = await computeMyeongsik(toComputeInput(input as SajuInputRow));
      }
    } else if (isSajuApiConfigured()) {
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

    // 5. DB row 확보
    let resultId: string;

    // VIP 상품(깊은시선·별의시선)은 섹션별 배너가 실제 생성 담당
    // → 여기서는 상태만 "generating"으로 초기화, LLM 직접 호출 금지
    const isVipProduct = product.slug === "premium-saju" || product.slug === "ziwei-saju";

    if (existingResult) {
      await svc
        .from("saju_results")
        .update({
          generation_status: "generating",
          interpretation_md: "",   // 기존 내용 초기화 → 배너가 처음부터 재생성
          myeongsik: myeongsik as never,
          raw_saju_json: rawSajuJson as never,
        })
        .eq("id", existingResult.id);
      resultId = existingResult.id;
    } else {
      const { data: newRow, error: insertErr } = await svc
        .from("saju_results")
        .insert({
          order_id: orderId,
          myeongsik: myeongsik as never,
          interpretation_md: "",
          llm_provider: process.env.LLM_PROVIDER ?? "openai",
          llm_model: process.env.LLM_MODEL ?? "gpt-4o",
          raw_saju_json: rawSajuJson as never,
          generation_status: "generating",
        })
        .select("id")
        .single();

      if (insertErr || !newRow) {
        return NextResponse.json({ ok: false, error: "결과 행 생성 실패", detail: insertErr?.message }, { status: 500 });
      }
      resultId = newRow.id;
    }

    // VIP 상품은 여기서 즉시 반환 — 결과 페이지 배너가 섹션별 생성 처리
    if (isVipProduct) {
      return NextResponse.json({ ok: true, resultId, vipReset: true });
    }

    // 6. 일반 상품 LLM 생성 (실패해도 generating 상태 유지 → 버튼 재클릭으로 재시도 가능)
    try {
      const { system, user } = buildSajuPrompt({
        productSlug: product.slug,
        productName: product.name,
        myeongsik,
        manseryeokText,
        birthDate: (input as SajuInputRow).birth_date ?? "",
        birthTime: (input as SajuInputRow).birth_time,
        timeUnknown: (input as SajuInputRow).time_unknown ?? false,
        gender: (input as SajuInputRow).gender,
        concerns: (input as SajuInputRow).concerns ?? [],
        dreamContent: (input as SajuInputRow).dream_content ?? undefined,
        name: (input as SajuInputRow).name ?? undefined,
      });
      const llm = await generateInterpretation({ system, user });
      await svc
        .from("saju_results")
        .update({
          interpretation_md: llm.text,
          llm_provider: llm.provider,
          llm_model: llm.model,
          generation_status: "complete",
        })
        .eq("id", resultId);
    } catch (llmErr) {
      console.error("[regenerate] LLM 실패:", llmErr instanceof Error ? llmErr.message : String(llmErr));
      // generating 상태 유지 — 어드민에서 버튼 다시 클릭 시 재시도
    }

    return NextResponse.json({ ok: true, resultId });
  } catch (err) {
    console.error("[regenerate] 오류:", err);
    return NextResponse.json(
      { ok: false, error: "재생성 실패", detail: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
