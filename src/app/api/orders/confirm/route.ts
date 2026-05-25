import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createServiceClient } from "@/lib/supabase/server";
import { confirmTossPayment } from "@/lib/toss/confirm";
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

const bodySchema = z.object({
  paymentKey: z.string().min(1),
  orderId: z.string().min(1),
  amount: z.number().int().nonnegative(),
});

// saju_inputs row → BirthInfo (luckyloveme 입력 형식)
type SajuInputRow = {
  name?: string | null;
  birth_date: string | null;     // "YYYY-MM-DD" — dream-reading은 null
  birth_time: string | null;     // "HH:mm"
  time_unknown: boolean;
  calendar: "solar" | "lunar";
  gender: "male" | "female";
  concerns: string[];
  dream_content?: string | null;
  // 연인/궁합 파트너
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

// 파트너 정보 → BirthInfo
function toPartnerBirthInfo(input: SajuInputRow): BirthInfo {
  const date = input.partner_birth_date ?? "1900-01-01";
  const [y, m, d] = date.split("-");
  const hasTime = !(input.partner_time_unknown ?? false) && !!input.partner_birth_time;
  const [hh, mm] = hasTime ? input.partner_birth_time!.split(":") : [undefined, undefined];
  return {
    birthYear: y,
    birthMonth: String(parseInt(m, 10)),
    birthDay: String(parseInt(d, 10)),
    ...(hasTime ? { birthHour: String(parseInt(hh!, 10)), birthMinute: String(parseInt(mm!, 10)) } : {}),
    calendarType: input.partner_calendar === "lunar" ? "음력" : "양력",
    gender: (input.partner_gender ?? "female") as "male" | "female",
  };
}

function toPartnerComputeInput(input: SajuInputRow) {
  return {
    birthDate: input.partner_birth_date ?? "1900-01-01",
    birthTime: input.partner_birth_time ?? null,
    timeUnknown: input.partner_time_unknown ?? false,
    calendar: (input.partner_calendar ?? "solar") as "solar" | "lunar",
    gender: (input.partner_gender ?? "female") as "male" | "female",
  };
}

export async function POST(request: NextRequest) {
  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "잘못된 요청입니다" }, { status: 400 });
  }
  const { paymentKey, orderId, amount } = parsed.data;

  const service = createServiceClient();

  // 1. DB의 주문과 amount 일치 검증 (위변조 차단)
  const { data: order, error: orderErr } = await service
    .from("orders")
    .select("id, amount, status, product_id, user_id, guest_email")
    .eq("order_id", orderId)
    .maybeSingle();

  if (orderErr || !order) {
    return NextResponse.json({ error: "주문을 찾을 수 없습니다" }, { status: 404 });
  }
  if (order.status === "paid") {
    // idempotent: 이미 결제된 주문 — 결과 페이지로 안내
    const { data: result } = await service
      .from("saju_results")
      .select("id")
      .eq("order_id", order.id)
      .maybeSingle();
    return NextResponse.json({ resultId: result?.id ?? null, alreadyPaid: true });
  }
  if (order.amount !== amount) {
    return NextResponse.json({ error: "금액이 일치하지 않습니다" }, { status: 400 });
  }

  // 2. 토스 confirm
  const toss = await confirmTossPayment({ paymentKey, orderId, amount });
  if (!toss.ok) {
    await service.from("orders").update({ status: "failed" }).eq("id", order.id);
    return NextResponse.json({ error: toss.error.message, code: toss.error.code }, { status: 402 });
  }
  if (toss.data.totalAmount !== amount) {
    await service.from("orders").update({ status: "failed" }).eq("id", order.id);
    return NextResponse.json({ error: "토스 응답 금액 불일치" }, { status: 400 });
  }

  await service
    .from("orders")
    .update({
      status: "paid",
      toss_payment_key: paymentKey,
      paid_at: toss.data.approvedAt,
    })
    .eq("id", order.id);

  // 3. 사주 생성
  const { data: input } = await service
    .from("saju_inputs")
    .select("*")
    .eq("order_id", order.id)
    .single();
  const { data: product } = await service
    .from("products")
    .select("slug, name")
    .eq("id", order.product_id)
    .single();

  if (!input || !product) {
    return NextResponse.json({ error: "사주 입력 또는 상품 조회 실패" }, { status: 500 });
  }

  try {
    let myeongsik: Myeongsik;
    let manseryeokText: string | undefined;

    // 꿈해몽은 사주 API 불필요 — 생년월일 없이 꿈 내용만으로 풀이
    const isDreamReading = product.slug === "dream-reading";
    const isLoveSaju = product.slug === "love-saju";
    const isPremiumVip = product.slug === "premium-saju";
    const hasPartner = isLoveSaju && !!input.partner_birth_date;

    // ── 본인 명식 계산 ────────────────────────────────────
    if (isDreamReading) {
      myeongsik = { year: null, month: null, day: null, hour: null } as unknown as Myeongsik;
    } else if (isSajuApiConfigured()) {
      try {
        const birthInfo = toBirthInfo(input);
        const analysis = await fetchSajuAnalysis(birthInfo, ALL_FIELDS, { source: "confirm" }); // 16종 전체 (gyeokgukYongsin 포함)
        const converted = ganjiToMyeongsik(analysis);
        if (converted) {
          myeongsik = converted;
          manseryeokText = formatSajuToManseryeok(analysis, birthInfo);
        } else {
          myeongsik = await computeMyeongsik(toComputeInput(input));
        }
      } catch (apiErr) {
        console.error("[saju-api] fallback to mock:", apiErr);
        myeongsik = await computeMyeongsik(toComputeInput(input));
      }
    } else {
      myeongsik = await computeMyeongsik(toComputeInput(input));
    }

    // ── 파트너 명식 계산 (love-saju 전용) ─────────────────
    let partnerMyeongsik: Myeongsik | undefined;
    let partnerManseryeokText: string | undefined;

    if (hasPartner) {
      if (isSajuApiConfigured()) {
        try {
          const partnerBirthInfo = toPartnerBirthInfo(input);
          const partnerAnalysis = await fetchSajuAnalysis(partnerBirthInfo, ALL_FIELDS, { source: "confirm" });
          const partnerConverted = ganjiToMyeongsik(partnerAnalysis);
          if (partnerConverted) {
            partnerMyeongsik = partnerConverted;
            partnerManseryeokText = formatSajuToManseryeok(partnerAnalysis, partnerBirthInfo);
          } else {
            partnerMyeongsik = await computeMyeongsik(toPartnerComputeInput(input));
          }
        } catch (partnerErr) {
          console.error("[saju-api] partner fallback to mock:", partnerErr);
          partnerMyeongsik = await computeMyeongsik(toPartnerComputeInput(input));
        }
      } else {
        partnerMyeongsik = await computeMyeongsik(toPartnerComputeInput(input));
      }
    }

    // ── 깊은 시선 VIP: 비동기 PDF 생성 (인라인 LLM 호출 건너뜀) ────
    if (isPremiumVip) {
      const { data: result, error: resultErr } = await service
        .from("saju_results")
        .insert({
          order_id: order.id,
          myeongsik: myeongsik as never,
          interpretation_md: "",          // Python 제너레이터가 PDF로 대체
          llm_provider: "claude",
          llm_model: "claude-opus-4-5",
          generation_status: "generating", // GitHub Actions cron이 처리
          pdf_url: null,
        })
        .select("id")
        .single();

      if (resultErr || !result) {
        return NextResponse.json({ error: "결과 저장 실패", detail: resultErr?.message }, { status: 500 });
      }
      return NextResponse.json({ resultId: result.id, generating: true });
    }

    // ── 일반 상품: 기존 인라인 LLM 호출 ────────────────────────
    const { system, user } = buildSajuPrompt({
      productSlug: product.slug,
      productName: product.name,
      myeongsik,
      manseryeokText,
      birthDate: input.birth_date ?? "",
      birthTime: input.birth_time,
      timeUnknown: input.time_unknown ?? false,
      gender: input.gender,
      concerns: input.concerns ?? [],
      dreamContent: input.dream_content ?? undefined,
      // 연인/궁합 파트너 정보
      name: input.name ?? undefined,
      partnerMyeongsik,
      partnerManseryeokText,
      partnerName: input.partner_name ?? undefined,
      partnerBirthDate: input.partner_birth_date ?? undefined,
      partnerBirthTime: input.partner_birth_time ?? null,
      partnerTimeUnknown: input.partner_time_unknown ?? false,
      partnerGender: (input.partner_gender ?? undefined) as "male" | "female" | undefined,
    });

    const llm = await generateInterpretation({ system, user });

    const { data: result, error: resultErr } = await service
      .from("saju_results")
      .insert({
        order_id: order.id,
        myeongsik: myeongsik as never,
        interpretation_md: llm.text,
        llm_provider: llm.provider,
        llm_model: llm.model,
      })
      .select("id")
      .single();

    if (resultErr || !result) {
      return NextResponse.json({ error: "결과 저장 실패", detail: resultErr?.message }, { status: 500 });
    }

    return NextResponse.json({ resultId: result.id });
  } catch (err) {
    return NextResponse.json(
      {
        error: "사주 해석 생성 실패",
        detail: err instanceof Error ? err.message : String(err),
        hint: "결제는 정상 승인되었습니다. /admin/orders 에서 수동 재생성하거나 환불을 진행하세요.",
      },
      { status: 500 },
    );
  }
}
