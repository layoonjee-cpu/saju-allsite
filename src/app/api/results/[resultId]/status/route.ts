import { NextResponse, type NextRequest } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

/**
 * GET /api/results/[resultId]/status
 * VipGeneratingBanner 폴링용 — 가벼운 generation_status 확인 엔드포인트
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ resultId: string }> }
) {
  const { resultId } = await params;
  const svc = createServiceClient();

  const { data } = await svc
    .from("saju_results")
    .select("generation_status")
    .eq("id", resultId)
    .maybeSingle();

  return NextResponse.json({
    status: (data?.generation_status as string | null) ?? "generating",
  });
}
