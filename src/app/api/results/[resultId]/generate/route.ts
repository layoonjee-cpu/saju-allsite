import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { computeMyeongsik, type Myeongsik } from "@/lib/saju/manseryeok";
import { buildSajuPrompt } from "@/lib/saju/prompt";
import { generateInterpretation } from "@/lib/saju/llm";
import {
  ganjiToMyeongsik,
  formatSajuToManseryeok,
  isSajuApiConfigured,
  fetchSajuAnalysis,
  ALL_FIELDS,
  type BirthInfo,
} from "@/lib/saju/saju-api";

export const maxDuration = 300;

type SajuInputRow = {
  name?: string | null;
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
    ...(hasTime
      ? { birthHour: String(parseInt(hh!, 10)), birthMinute: String(parseInt(mm!, 10)) }
      : {}),
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
 * POST /api/results/[resultId]/generate
 * VipGeneratingBanner에서 마운트 시 자동 호출 — LLM 분석 생성
 * 인증 없음 (resultId는 128비트 UUID, 추측 불가)
 */
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ resultId: string }> }
) {
  const { resultId } = await params;
  const svc = createServiceClient();

  // 1. 결과 조회
  const { data: result } = await svc
    .from("saju_results")
    .select("id, generation_status, myeongsik, raw_saju_json, order_id")
    .eq("id", resultId)
    .maybeSingle();

  if (!result) {
    return NextResponse.json({ status: "failed", error: "not found" }, { status: 404 });
  }

  // 이미 완료 → 즉시 반환
  if (result.generation_status === "complete") {
    return NextResponse.json({ status: "complete" });
  }

  // 2. 주문·입력·상품 조회
  const { data: order } = await svc
    .from("orders")
    .select("id, product_id, status")
    .eq("id", result.order_id)
    .single();

  if (!order || order.status !== "paid") {
    return NextResponse.json({ status: "failed", error: "invalid order" }, { status: 400 });
  }

  const [{ data: input }, { data: product }] = await Promise.all([
    svc.from("saju_inputs").select("*").eq("order_id", order.id).single(),
    svc.from("products").select("slug, name").eq("id", order.product_id).single(),
  ]);

  if (!input || !product) {
    return NextResponse.json({ status: "failed", error: "input/product not found" }, { status: 500 });
  }

  try {
    // 3. myeongsik 확보 (저장된 값 재사용 → 사주 API 재호출 → computeMyeongsik 폴백)
    let myeongsik: Myeongsik;
    let manseryeokText: string | undefined;
    const rawSajuJson: unknown = result.raw_saju_json ?? null;

    const isDreamReading = product.slug === "dream-reading";

    if (isDreamReading) {
      myeongsik = { year: null, month: null, day: null, hour: null } as unknown as Myeongsik;
    } else if (rawSajuJson) {
      // DB에 저장된 raw_saju_json 재사용 (사주 API 재호출 불필요)
      const converted = ganjiToMyeongsik(rawSajuJson);
      if (converted) {
        myeongsik = converted;
        manseryeokText = formatSajuToManseryeok(rawSajuJson, toBirthInfo(input as SajuInputRow));
      } else {
        myeongsik = await computeMyeongsik(toComputeInput(input as SajuInputRow));
      }
    } else if (
      result.myeongsik &&
      (result.myeongsik as { year?: unknown }).year !== null
    ) {
      // raw_saju_json은 없지만 myeongsik은 이미 계산되어 있음
      myeongsik = result.myeongsik as Myeongsik;
    } else {
      // myeongsik도 placeholder → 사주 API 재호출 (드문 케이스: confirm이 타임아웃으로 죽은 경우)
      if (isSajuApiConfigured()) {
        try {
          const birthInfo = toBirthInfo(input as SajuInputRow);
          const analysis = await fetchSajuAnalysis(birthInfo, ALL_FIELDS, { source: "confirm" });
          const converted = ganjiToMyeongsik(analysis);
          if (converted) {
            myeongsik = converted;
            manseryeokText = formatSajuToManseryeok(analysis, birthInfo);
            // DB 업데이트 (다음 호출에서 재사용 가능)
            await svc
              .from("saju_results")
              .update({ raw_saju_json: analysis as never, myeongsik: converted as never })
              .eq("id", resultId);
          } else {
            myeongsik = await computeMyeongsik(toComputeInput(input as SajuInputRow));
          }
        } catch {
          myeongsik = await computeMyeongsik(toComputeInput(input as SajuInputRow));
        }
      } else {
        myeongsik = await computeMyeongsik(toComputeInput(input as SajuInputRow));
      }
    }

    // 4. LLM 생성
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
        myeongsik: myeongsik as never,
        generation_status: "complete",
      })
      .eq("id", resultId);

    return NextResponse.json({ status: "complete" });
  } catch (err) {
    console.error("[generate] LLM 실패:", err instanceof Error ? err.message : String(err));
    return NextResponse.json(
      { status: "failed", error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
