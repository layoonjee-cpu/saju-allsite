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

    // 5. LLM 생성
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

    // 6. DB 저장 (기존 result 있으면 UPDATE, 없으면 INSERT)
    let resultId: string;

    if (existingResult) {
      await svc
        .from("saju_results")
        .update({
          interpretation_md: llm.text,
          llm_provider: llm.provider,
          llm_model: llm.model,
          generation_status: "complete",
          raw_saju_json: rawSajuJson as never,
        })
        .eq("id", existingResult.id);
      resultId = existingResult.id;
    } else {
      const { data: newResult, error: insertErr } = await svc
        .from("saju_results")
        .insert({
          order_id: orderId,
          myeongsik: myeongsik as never,
          interpretation_md: llm.text,
          llm_provider: llm.provider,
          llm_model: llm.model,
          raw_saju_json: rawSajuJson as never,
          generation_status: "complete",
        })
        .select("id")
        .single();

      if (insertErr || !newResult) {
        return NextResponse.json({ ok: false, error: "결과 저장 실패", detail: insertErr?.message }, { status: 500 });
      }
      resultId = newResult.id;
    }

    return NextResponse.json({ ok: true, resultId });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: "재생성 실패", detail: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
