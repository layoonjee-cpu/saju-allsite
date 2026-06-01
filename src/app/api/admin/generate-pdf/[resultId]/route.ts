import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { createServiceClient } from "@/lib/supabase/server";
import { generateSajuPdf } from "@/lib/pdf/generate-saju-pdf";

export const maxDuration = 60;

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ resultId: string }> }
) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const { resultId } = await params;
  const svc = createServiceClient();

  // 1. 결과 조회
  const { data: result } = await svc
    .from("saju_results")
    .select("id, order_id, generation_status, interpretation_md")
    .eq("id", resultId)
    .maybeSingle();

  if (!result) {
    return NextResponse.json({ ok: false, error: "결과를 찾을 수 없습니다" }, { status: 404 });
  }
  if (result.generation_status !== "complete") {
    return NextResponse.json({ ok: false, error: "분석이 아직 완료되지 않았습니다" }, { status: 400 });
  }
  if (!result.interpretation_md) {
    return NextResponse.json({ ok: false, error: "분석 내용이 없습니다" }, { status: 400 });
  }

  // 2. 주문·입력·상품 조회
  const [{ data: order }, { data: input }] = await Promise.all([
    svc.from("orders").select("product_id, created_at").eq("id", result.order_id).single(),
    svc.from("saju_inputs").select("name, birth_date, birth_time, time_unknown, gender, calendar").eq("order_id", result.order_id).maybeSingle(),
  ]);

  const productName = order
    ? await svc.from("products").select("name").eq("id", order.product_id).single()
        .then(({ data }) => data?.name ?? "사주 분석")
    : "사주 분석";

  const generatedAt = new Date().toLocaleDateString("ko-KR", {
    year: "numeric", month: "long", day: "numeric",
  });

  // 3. PDF 생성
  let pdfBuffer: Buffer;
  try {
    pdfBuffer = await generateSajuPdf({
      interpretationMd: result.interpretation_md,
      productName: typeof productName === "string" ? productName : "사주 분석",
      customerName: input?.name ?? null,
      birthDate: input?.birth_date ?? null,
      birthTime: input?.birth_time ?? null,
      timeUnknown: input?.time_unknown ?? false,
      gender: (input?.gender as "male" | "female") ?? null,
      calendar: (input?.calendar as "solar" | "lunar") ?? null,
      generatedAt,
    });
  } catch (err) {
    console.error("[generate-pdf] PDF 생성 실패:", err);
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "PDF 생성 실패" },
      { status: 500 }
    );
  }

  // 4. Supabase Storage 업로드
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const safeName = (input?.name ?? "고객").replace(/[/\\:*?"<>|]/g, "").replace(/\s+/g, "_");
  const safeProd = (typeof productName === "string" ? productName : "사주분석")
    .replace(/[/\\:*?"<>|()\s]/g, "");
  const filePath = `${safeProd}_${safeName}_${dateStr}.pdf`;
  const { error: uploadErr } = await svc.storage
    .from("vip-pdfs")
    .upload(filePath, pdfBuffer, {
      contentType: "application/pdf",
      upsert: true,
    });

  if (uploadErr) {
    console.error("[generate-pdf] Storage 업로드 실패:", uploadErr);
    return NextResponse.json({ ok: false, error: "스토리지 업로드 실패" }, { status: 500 });
  }

  // 5. pdf_url 업데이트
  await svc.from("saju_results").update({ pdf_url: filePath }).eq("id", resultId);

  return NextResponse.json({ ok: true, filePath });
}
