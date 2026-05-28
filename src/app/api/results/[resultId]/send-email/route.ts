import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createServiceClient } from "@/lib/supabase/server";
import { sendResendEmail, emailWrapper, resultLinkButton, SITE_URL } from "@/lib/email";

const bodySchema = z.object({
  email: z.string().email().max(200),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ resultId: string }> }
) {
  const { resultId } = await params;
  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "올바른 이메일 주소를 입력해 주세요" }, { status: 400 });
  }
  const { email } = parsed.data;

  const service = createServiceClient();

  // 결과 + 상품명 조회
  const { data: result } = await service
    .from("saju_results")
    .select("id, order_id")
    .eq("id", resultId)
    .maybeSingle();

  if (!result) {
    return NextResponse.json({ error: "결과를 찾을 수 없습니다" }, { status: 404 });
  }

  const { data: order } = await service
    .from("orders")
    .select("product_id")
    .eq("id", result.order_id)
    .single();

  const { data: product } = order
    ? await service.from("products").select("name").eq("id", order.product_id).single()
    : { data: null };

  const productName = product?.name ?? "사주 분석";
  const resultUrl = `${SITE_URL}/results/${resultId}`;

  const html = emailWrapper(`
    <p style="font-size:16px;color:#1a1730;margin:0 0 8px;font-weight:bold;">${productName} 분석지를 이메일로 보내드립니다 ✨</p>
    <p style="font-size:14px;color:#4a4a6a;margin:0 0 24px;line-height:1.7;">
      아래 버튼을 클릭하시면 분석 결과를 열람하실 수 있습니다.<br>
      언제든지 다시 확인해보세요.
    </p>
    ${resultLinkButton(resultUrl)}
  `);

  const sent = await sendResendEmail(email, `[시선] ${productName} 분석 결과`, html);

  if (!sent) {
    return NextResponse.json({ error: "이메일 발송에 실패했습니다. 잠시 후 다시 시도해 주세요." }, { status: 500 });
  }

  // email_sent_at 업데이트
  await service
    .from("saju_results")
    .update({ email_sent_at: new Date().toISOString() })
    .eq("id", resultId);

  return NextResponse.json({ ok: true });
}
