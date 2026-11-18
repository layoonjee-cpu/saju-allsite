import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ resultId: string }> },
) {
  const { resultId } = await params;

  // 로그인 확인
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY;
  if (!supabaseUrl || !supabaseSecretKey) {
    return NextResponse.json({ error: "서버 설정 오류" }, { status: 500 });
  }
  const service = createSupabaseClient(supabaseUrl, supabaseSecretKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // 결과 조회 + 소유권 확인
  const { data: result } = await service
    .from("saju_results")
    .select("id, order_id, generation_status, pdf_url, email_sent_at")
    .eq("id", resultId)
    .maybeSingle();

  if (!result) {
    return NextResponse.json({ error: "결과를 찾을 수 없습니다" }, { status: 404 });
  }

  // 소유권 확인 + 파일명 구성용 상품/입력 조회
  const [{ data: order }, { data: inputData }] = await Promise.all([
    service.from("orders").select("user_id, guest_email, product_id").eq("id", result.order_id).maybeSingle(),
    service.from("saju_inputs").select("name, birth_date").eq("order_id", result.order_id).maybeSingle(),
  ]);

  const isOwner = order && (order.user_id === user.id ||
    (!!order.guest_email && !!user.email && order.guest_email.toLowerCase() === user.email.toLowerCase()));
  if (!isOwner) {
    return NextResponse.json({ error: "권한이 없습니다" }, { status: 403 });
  }

  if (result.email_sent_at && Date.now() - new Date(result.email_sent_at).getTime() > 7 * 24 * 60 * 60 * 1000) {
    return NextResponse.json({ error: "분석지 열람 기간이 만료되었습니다" }, { status: 410 });
  }

  if (result.generation_status === "generating") {
    return NextResponse.json({ status: "generating" });
  }

  if (!result.pdf_url) {
    return NextResponse.json({ error: "PDF가 아직 준비되지 않았습니다" }, { status: 404 });
  }

  // 다운로드 파일명: 상품명_이름_출생년도.pdf
  const { data: product } = order.product_id
    ? await service.from("products").select("name").eq("id", order.product_id).single()
    : { data: null };
  const customerName = inputData?.name ?? "사주분석";
  const birthYear = inputData?.birth_date ? inputData.birth_date.slice(0, 4) : null;
  const prodName = product?.name ?? "사주분석";
  const namePart = birthYear ? `${customerName}_${birthYear}` : customerName;
  const downloadFileName = `${prodName}_${namePart}.pdf`.replace(/[/\\:*?"<>|]/g, "");

  // 짧은 서명 URL: 결과지의 7일 열람 기한 이후 재사용할 수 없도록 제한
  const { data: signedData, error: signErr } = await service.storage
    .from("vip-pdfs")
    .createSignedUrl(result.pdf_url, 5 * 60, { download: downloadFileName });

  if (signErr || !signedData) {
    console.error("[pdf-download] signed URL error:", signErr);
    return NextResponse.json({ error: "다운로드 URL 생성 실패" }, { status: 500 });
  }

  return NextResponse.json({ url: signedData.signedUrl, status: "ready" });
}
