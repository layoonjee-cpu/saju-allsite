import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { createServiceClient } from "@/lib/supabase/server";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ resultId: string }> }
) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const { resultId } = await params;
  const svc = createServiceClient();

  // pdf_url + 고객명/상품명 조회 (한국어 다운로드 파일명 구성용)
  const { data: result } = await svc
    .from("saju_results")
    .select("pdf_url, order_id")
    .eq("id", resultId)
    .maybeSingle();

  if (!result?.pdf_url) {
    return NextResponse.json({ ok: false, error: "PDF가 없습니다" }, { status: 404 });
  }

  // 다운로드 파일명 구성 (상품명_고객명_날짜.pdf)
  const [{ data: input }, { data: order }] = await Promise.all([
    svc.from("saju_inputs").select("name").eq("order_id", result.order_id).maybeSingle(),
    svc.from("orders").select("product_id, created_at").eq("id", result.order_id).maybeSingle(),
  ]);
  const { data: product } = order
    ? await svc.from("products").select("name").eq("id", order.product_id).single()
    : { data: null };

  const dateStr = (order?.created_at ?? new Date().toISOString()).slice(0, 10).replace(/-/g, "");
  const customerName = input?.name ?? "고객";
  const prodName = product?.name ?? "사주분석";
  // 파일시스템 안전 문자만 허용 (한글 OK, 슬래시·콜론 등 제거)
  const displayFileName = `${prodName}_${customerName}_${dateStr}.pdf`
    .replace(/[/\\:*?"<>|]/g, "");

  const { data: signed, error } = await svc.storage
    .from("vip-pdfs")
    .createSignedUrl(result.pdf_url, 300, { download: displayFileName }); // 5분 유효

  if (error || !signed) {
    return NextResponse.json({ ok: false, error: "다운로드 URL 생성 실패" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, url: signed.signedUrl });
}
