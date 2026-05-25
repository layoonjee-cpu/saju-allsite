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
    .select("id, order_id, generation_status, pdf_url")
    .eq("id", resultId)
    .maybeSingle();

  if (!result) {
    return NextResponse.json({ error: "결과를 찾을 수 없습니다" }, { status: 404 });
  }

  // 소유권 확인 (주문의 user_id가 현재 사용자와 일치해야 함)
  const { data: order } = await service
    .from("orders")
    .select("user_id")
    .eq("id", result.order_id)
    .maybeSingle();

  if (!order || order.user_id !== user.id) {
    return NextResponse.json({ error: "권한이 없습니다" }, { status: 403 });
  }

  if (result.generation_status === "generating") {
    return NextResponse.json({ status: "generating" });
  }

  if (!result.pdf_url) {
    return NextResponse.json({ error: "PDF가 아직 준비되지 않았습니다" }, { status: 404 });
  }

  // Supabase Storage 서명 URL 생성 (7일 만료)
  const { data: signedData, error: signErr } = await service.storage
    .from("vip-pdfs")
    .createSignedUrl(result.pdf_url, 60 * 60 * 24 * 7);

  if (signErr || !signedData) {
    console.error("[pdf-download] signed URL error:", signErr);
    return NextResponse.json({ error: "다운로드 URL 생성 실패" }, { status: 500 });
  }

  return NextResponse.json({ url: signedData.signedUrl, status: "ready" });
}
