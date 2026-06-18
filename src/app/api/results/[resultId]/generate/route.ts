import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { computeMyeongsik, type Myeongsik } from "@/lib/saju/manseryeok";
import { buildSajuPrompt, buildVipMainPrompt, buildVipTimelinePrompt, buildVipSectionPrompts } from "@/lib/saju/prompt";
import { generateInterpretation } from "@/lib/saju/llm";
import {
  ganjiToMyeongsik,
  formatSajuToManseryeok,
  isSajuApiConfigured,
  fetchSajuAnalysis,
  ALL_FIELDS,
  type BirthInfo,
} from "@/lib/saju/saju-api";
import { buildZiweiChapterPrompt, ZIWEI_TOTAL_SECTIONS } from "@/lib/ziwei/ziwei-prompt";
import type { ZiweiPan } from "@/lib/ziwei/iztro-calc";

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

  // 섹션 번호 파싱 (클라이언트 순차 호출용: ?section=1~10)
  const sectionNum = parseInt(new URL(_req.url).searchParams.get("section") ?? "0", 10);
  const isSectionCall = sectionNum > 0;

  // 1. 결과 조회
  const { data: result } = await svc
    .from("saju_results")
    .select("id, generation_status, myeongsik, raw_saju_json, order_id, interpretation_md")
    .eq("id", resultId)
    .maybeSingle();

  if (!result) {
    return NextResponse.json({ status: "failed", error: "not found" }, { status: 404 });
  }

  // 이미 완료 → 섹션 호출이 아닌 경우에만 콘텐츠 품질 확인 후 즉시 반환
  // (섹션 호출은 항상 진행 — 섹션1이 interpretation_md를 초기화함)
  if (!isSectionCall && result.generation_status === "complete") {
    const md = (result as { interpretation_md?: string | null }).interpretation_md ?? "";
    const lower = md.toLowerCase();
    const curYear = new Date().getFullYear();
    const hasWrongYear =
      md.includes("2023년") || md.includes("2024년") ||
      (curYear >= 2026 && md.includes("2025년") && !md.includes(`${curYear}년`));
    const isGoodContent =
      md.length >= 200 &&
      !lower.includes("i'm sorry") &&
      !lower.includes("i cannot") &&
      !lower.includes("i can't assist") &&
      !lower.includes("죄송합니다") &&
      !hasWrongYear;
    if (isGoodContent) {
      return NextResponse.json({ status: "complete" });
    }
    // 콘텐츠 불량 → 재생성 진행 (fall through)
    console.log("[generate] 불량 콘텐츠 감지 — 재생성 진행", { hasWrongYear });
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
    const isZiweiProduct = product.slug === "ziwei-saju";

    if (isDreamReading) {
      myeongsik = { year: null, month: null, day: null, hour: null } as unknown as Myeongsik;
    } else if (isZiweiProduct) {
      // 자미두수: raw_saju_json이 iztro pan 데이터 → ganjiToMyeongsik 불필요
      // myeongsik은 section handler에서 직접 사용하지 않으므로 placeholder로 설정
      myeongsik = result.myeongsik as Myeongsik ?? { year: null, month: null, day: null, hour: null } as unknown as Myeongsik;
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
    const isPremiumProduct = product.slug === "premium-saju";
    const vipCalls = isPremiumProduct
      ? parseInt(process.env.VIP_GENERATION_CALLS ?? "1", 10)
      : 1;

    const promptArgs = {
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
    };

    /** LLM 출력 거부/빈 응답 검증 헬퍼 */
    function isRefusal(text: string): boolean {
      const lower = text.toLowerCase();
      return (
        text.trim().length < 200 ||
        lower.includes("i'm sorry") ||
        lower.includes("i cannot") ||
        lower.includes("i can't assist") ||
        lower.includes("죄송합니다만 이 요청은")
      );
    }


    // ── 자미두수 섹션별 호출 처리 (ZiweiGeneratingBanner 순차 호출) ───────────
    const isZiwei = product.slug === "ziwei-saju";
    if (isSectionCall && isZiwei) {
      if (result.generation_status === "complete") {
        const existingMd = (result as { interpretation_md?: string | null }).interpretation_md ?? "";
        // 자미두수 16섹션 완성 기준: 40,000자 이상 (섹션당 평균 3,000자 × 16 = 48,000자 기대치)
        if (existingMd.length >= 40000) {
          return NextResponse.json({ status: "complete" });
        }
      }

      const ziweiPan = (rawSajuJson as ZiweiPan | null);
      if (!ziweiPan) {
        return NextResponse.json({ status: "failed", error: "명반 데이터 없음" }, { status: 400 });
      }

      if (sectionNum < 1 || sectionNum > ZIWEI_TOTAL_SECTIONS) {
        return NextResponse.json({ status: "failed", error: `section out of range: ${sectionNum}` }, { status: 400 });
      }

      const { system: zSystem, user: zUser } = buildZiweiChapterPrompt(
        sectionNum,
        ziweiPan,
        input as SajuInputRow
      );

      const zLlm = await generateInterpretation({
        system: zSystem,
        user: zUser,
        maxTokensOverride: sectionNum === 9 ? 6000 : sectionNum === 16 ? 8000 : sectionNum === 2 || sectionNum === 5 || sectionNum === 7 || sectionNum === 11 ? 4000 : 3000,
      });

      // 거부 응답 검증
      const zLower = zLlm.text.toLowerCase();
      if (zLlm.text.trim().length < 100 || zLower.includes("i'm sorry") || zLower.includes("죄송합니다만")) {
        return NextResponse.json({ status: "section_skipped", section: sectionNum, total: ZIWEI_TOTAL_SECTIONS });
      }

      if (sectionNum === 1) {
        await svc.from("saju_results").update({
          interpretation_md: zLlm.text,
          llm_provider: zLlm.provider,
          llm_model: zLlm.model,
          generation_status: "generating",
        }).eq("id", resultId);
      } else {
        const { data: cur } = await svc
          .from("saju_results")
          .select("interpretation_md")
          .eq("id", resultId)
          .single();

        const appended = (cur?.interpretation_md ?? "") + "\n\n---\n\n" + zLlm.text;
        await svc.from("saju_results").update({
          interpretation_md: appended,
          generation_status: sectionNum === ZIWEI_TOTAL_SECTIONS ? "complete" : "generating",
        }).eq("id", resultId);
      }

      return NextResponse.json({
        status: sectionNum === ZIWEI_TOTAL_SECTIONS ? "complete" : "section_complete",
        section: sectionNum,
        total: ZIWEI_TOTAL_SECTIONS,
      });
    }

    // ── 섹션별 호출 처리 (VipGeneratingBanner 클라이언트 순차 호출) ──
    // ?section=1~10 : Hobby 플랜 60초 제한 내 단일 섹션만 생성
    // 섹션1: interpretation_md 초기화, 섹션2~9: 이어붙이기, 섹션10: complete 처리
    if (isSectionCall && isPremiumProduct) {
      // ── 이미 완성된 콘텐츠라면 섹션1 호출에서도 즉시 complete 반환 (무한루프 방지) ──
      // generation_status=complete 이고 충분한 내용(10,000자 이상)이 있으면 재생성 불필요
      if (result.generation_status === "complete") {
        const existingMd = (result as { interpretation_md?: string | null }).interpretation_md ?? "";
        if (existingMd.length >= 10000) {
          console.log("[generate] 이미 완성된 콘텐츠 감지 — 즉시 complete 반환");
          return NextResponse.json({ status: "complete" });
        }
      }

      const sections = buildVipSectionPrompts(promptArgs);
      const TOTAL = sections.length;

      if (sectionNum < 1 || sectionNum > TOTAL) {
        return NextResponse.json({ status: "failed", error: `section out of range: ${sectionNum}` }, { status: 400 });
      }

      const sec = sections[sectionNum - 1];
      console.log(`[generate] 섹션 ${sectionNum}/${TOTAL}: ${sec.id}`);

      // 월별 섹션(15-26)은 1,800-2,200자 목표이므로 3,000토큰 — 나머지는 2,000토큰
      const tokenLimit = sectionNum >= 15 && sectionNum <= 26 ? 3000 : 2000;
      const llm = await generateInterpretation({
        system: sec.system,
        user: sec.user,
        maxTokensOverride: tokenLimit,
      });

      if (isRefusal(llm.text)) {
        console.warn(`[generate] 섹션 ${sectionNum} 거부 응답 — 스킵`);
        // 거부돼도 다음 섹션은 계속 진행할 수 있도록 section_skipped 반환
        return NextResponse.json({ status: "section_skipped", section: sectionNum, total: TOTAL });
      }

      if (sectionNum === 1) {
        // 첫 섹션: interpretation_md 초기화 + provider/model 기록
        await svc.from("saju_results").update({
          interpretation_md: llm.text,
          llm_provider: llm.provider,
          llm_model: llm.model,
          generation_status: "generating",
        }).eq("id", resultId);
      } else {
        // 이후 섹션: 기존 내용에 이어붙이기
        const { data: cur } = await svc
          .from("saju_results")
          .select("interpretation_md")
          .eq("id", resultId)
          .single();

        const appended = (cur?.interpretation_md ?? "") + "\n\n---\n\n" + llm.text;

        await svc.from("saju_results").update({
          interpretation_md: appended,
          generation_status: sectionNum === TOTAL ? "complete" : "generating",
        }).eq("id", resultId);
      }

      return NextResponse.json({
        status: sectionNum === TOTAL ? "complete" : "section_complete",
        section: sectionNum,
        total: TOTAL,
      });
    }

    let llmText: string;
    let llmProvider: string;
    let llmModel: string;

    if (isPremiumProduct && vipCalls >= 3) {
      // ── 10-Section 아키텍처 (VIP_GENERATION_CALLS>=3) ───────────────
      // 각 섹션 max_tokens=2000 (~20초/섹션), 총 10섹션 ~200초
      // Vercel Pro 300초 한도 내 완료
      const sections = buildVipSectionPrompts(promptArgs);
      const results: string[] = [];
      let firstProvider = "openai";
      let firstModel = process.env.LLM_MODEL ?? "gpt-4o";

      for (let i = 0; i < sections.length; i++) {
        const sec = sections[i];
        console.log(`[generate] VIP section ${i + 1}/${sections.length}: ${sec.id}`);
        try {
          const llm = await generateInterpretation({
            system: sec.system,
            user: sec.user,
            maxTokensOverride: 2000,
          });
          if (i === 0) {
            firstProvider = llm.provider;
            firstModel = llm.model;
          }
          if (!isRefusal(llm.text)) {
            results.push(llm.text);
          } else {
            console.warn(`[generate] VIP section ${sec.id} 거부 응답 — 스킵`);
          }
        } catch (secErr) {
          console.error(`[generate] VIP section ${sec.id} 오류:`, secErr instanceof Error ? secErr.message : String(secErr));
          // 한 섹션 실패해도 나머지 계속 진행
        }
      }

      if (results.length === 0) {
        return NextResponse.json({ status: "failed", error: "모든 섹션 생성 실패" }, { status: 500 });
      }

      llmText = results.join("\n\n---\n\n");
      llmProvider = firstProvider;
      llmModel = firstModel;
    } else if (isPremiumProduct && vipCalls === 2) {
      // ── 2-Call 아키텍처 (VIP_GENERATION_CALLS=2) ────────────────────
      // Call 1: PART 01~08 (인물·황금기·연애·재물·직업·건강·귀인·개운)
      const { system: sys1, user: user1 } = buildVipMainPrompt(promptArgs);
      const llm1 = await generateInterpretation({ system: sys1, user: user1 });

      if (isRefusal(llm1.text)) {
        console.error("[generate] VIP Call1 거부 응답:", llm1.text.slice(0, 120));
        return NextResponse.json(
          { status: "failed", error: `LLM Call1 거부 또는 빈 응답: ${llm1.text.slice(0, 100)}` },
          { status: 500 }
        );
      }

      // Call 2: PART 09~10 (12개월 월별 + 10년 운명)
      const { system: sys2, user: user2 } = buildVipTimelinePrompt(promptArgs);
      const llm2 = await generateInterpretation({ system: sys2, user: user2 });

      // Call 2 거부는 Call 1 결과라도 저장 (부분 완료)
      if (isRefusal(llm2.text)) {
        console.error("[generate] VIP Call2 거부 응답 — Call1 결과만 저장:", llm2.text.slice(0, 120));
        llmText = llm1.text;
      } else {
        llmText = llm1.text + "\n\n---\n\n" + llm2.text;
      }
      llmProvider = llm1.provider;
      llmModel = llm1.model;
    } else {
      // ── 단일 호출 (기본) ────────────────────────────────────────────
      const { system, user } = buildSajuPrompt(promptArgs);
      const llm = await generateInterpretation({
        system,
        user,
        maxTokensOverride: product.slug === "love-saju" ? 8000 : undefined,
      });
      llmText = llm.text;
      llmProvider = llm.provider;
      llmModel = llm.model;
    }

    // 출력 검증 — 거부/빈 응답은 저장하지 않고 failed 반환
    if (isRefusal(llmText)) {
      console.error("[generate] LLM 거부 응답:", llmText.slice(0, 120));
      return NextResponse.json(
        { status: "failed", error: `LLM 거부 또는 빈 응답: ${llmText.slice(0, 100)}` },
        { status: 500 }
      );
    }

    await svc
      .from("saju_results")
      .update({
        interpretation_md: llmText,
        llm_provider: llmProvider,
        llm_model: llmModel,
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
