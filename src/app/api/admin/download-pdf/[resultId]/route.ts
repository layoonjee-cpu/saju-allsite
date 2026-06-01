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

  const { data: result } = await svc
    .from("saju_results")
    .select("pdf_url")
    .eq("id", resultId)
    .maybeSingle();

  if (!result?.pdf_url) {
    return NextResponse.json({ ok: false, error: "PDF가 없습니다" }, { status: 404 });
  }

  const { data: signed, error } = await svc.storage
    .from("vip-pdfs")
    .createSignedUrl(result.pdf_url, 300); // 5분 유효

  if (error || !signed) {
    return NextResponse.json({ ok: false, error: "다운로드 URL 생성 실패" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, url: signed.signedUrl });
}
