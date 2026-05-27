import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { createServiceClient } from "@/lib/supabase/server";
import {
  isSajuApiConfigured,
  fetchSajuAnalysis,
  ALL_FIELDS,
  type BirthInfo,
} from "@/lib/saju/saju-api";

// saju_inputs row → BirthInfo (luckyloveme 입력 형식)
function toBirthInfo(input: {
  birth_date: string | null;
  birth_time: string | null;
  time_unknown: boolean;
  calendar: string;
  gender: string;
}): BirthInfo {
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
    gender: input.gender as "male" | "female",
  };
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  // 1. 어드민 인증
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const { orderId } = await params;
  if (!orderId) {
    return NextResponse.json({ ok: false, error: "orderId required" }, { status: 400 });
  }

  const svc = createServiceClient();

  // 2. saju_results에서 raw_saju_json 조회
  const { data: result } = await svc
    .from("saju_results")
    .select("id, raw_saju_json, order_id")
    .eq("order_id", orderId)
    .maybeSingle();

  // 3. DB에 이미 저장된 경우 즉시 반환
  if (result?.raw_saju_json) {
    return NextResponse.json(result.raw_saju_json);
  }

  // 4. fallback: saju_inputs에서 출생정보 읽어 API 재호출
  if (!isSajuApiConfigured()) {
    return NextResponse.json(
      { ok: false, error: "사주 API가 설정되지 않았습니다. SAJU_API_KEY를 확인하세요." },
      { status: 404 }
    );
  }

  const { data: input } = await svc
    .from("saju_inputs")
    .select("birth_date, birth_time, time_unknown, gender, calendar")
    .eq("order_id", orderId)
    .maybeSingle();

  if (!input) {
    return NextResponse.json(
      { ok: false, error: "사주 입력 정보를 찾을 수 없습니다." },
      { status: 404 }
    );
  }

  try {
    const birthInfo = toBirthInfo(input);
    const analysis = await fetchSajuAnalysis(birthInfo, ALL_FIELDS, { source: "manual" });

    // 5. DB에 저장 (다음 조회 시 빠르게)
    if (result?.id) {
      await svc
        .from("saju_results")
        .update({ raw_saju_json: analysis as never })
        .eq("id", result.id);
    }

    return NextResponse.json(analysis);
  } catch (err) {
    console.error("[admin/saju-raw] API 호출 실패:", err);
    return NextResponse.json(
      {
        ok: false,
        error: "사주 API 호출에 실패했습니다.",
        detail: err instanceof Error ? err.message : String(err),
      },
      { status: 502 }
    );
  }
}
