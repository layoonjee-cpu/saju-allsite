import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { createServiceClient } from "@/lib/supabase/server";
import { sendResendEmail, emailWrapper, resultLinkButton, SITE_URL, RESEND_FROM } from "@/lib/email";

const bodySchema = z.object({
  message: z.string().min(1).max(10000),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ resultId: string }> }
) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const { resultId } = await params;
  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "message 필드가 필요합니다" }, { status: 400 });
  }
  const { message } = parsed.data;

  const svc = createServiceClient();

  const { data: result } = await svc
    .from("saju_results")
    .select("id, order_id")
    .eq("id", resultId)
    .single();

  if (!result) {
    return NextResponse.json({ ok: false, error: "result not found" }, { status: 404 });
  }

  const { data: order } = await svc
    .from("orders")
    .select("id, user_id, guest_email")
    .eq("id", result.order_id)
    .single();

  if (!order) {
    return NextResponse.json({ ok: false, error: "order not found" }, { status: 404 });
  }

  // 이메일 주소 조회
  let email: string | null = order.guest_email ?? null;
  if (!email && order.user_id) {
    try {
      const { data: { user } } = await svc.auth.admin.getUserById(order.user_id);
      email = user?.email ?? null;
    } catch { /* ignore */ }
  }

  if (!email) {
    return NextResponse.json({ ok: false, error: "no email found" }, { status: 400 });
  }

  const { data: input } = await svc
    .from("saju_inputs")
    .select("name")
    .eq("order_id", result.order_id)
    .single();
  const name = input?.name ?? "고객";

  const resultUrl = `${SITE_URL}/results/${resultId}`;
  const subject = `[시선] ${name}님의 추가 분석 결과를 보내드립니다`;

  // 운영자 메시지를 줄바꿈 보존 HTML로 변환
  const messageHtml = message
    .split("\n")
    .map((line) => `<p style="margin:0 0 10px;">${line || "&nbsp;"}</p>`)
    .join("");

  const bodyHtml = `
    <p style="font-size:16px;color:#1A1A1A;line-height:1.7;">
      <strong>${name}님</strong>, 안녕하세요.<br>
      추가 분석 결과를 보내드립니다.
    </p>
    <hr style="border:none;border-top:1px solid #E8E0D0;margin:24px 0;">
    <div style="font-size:15px;color:#2A2A2A;line-height:1.9;background:#FAF7F2;border-radius:8px;padding:24px;">
      ${messageHtml}
    </div>
    <hr style="border:none;border-top:1px solid #E8E0D0;margin:24px 0;">
    ${resultLinkButton(resultUrl)}
    <p style="font-size:12px;color:#999;text-align:center;">문의: ${RESEND_FROM}</p>
  `;

  const sent = await sendResendEmail(email, subject, emailWrapper(bodyHtml));

  if (!sent) {
    return NextResponse.json({ ok: false, error: "email send failed" }, { status: 500 });
  }

  // email_sent_at 갱신 (7일 만료 기준 초기화)
  await svc
    .from("saju_results")
    .update({ email_sent_at: new Date().toISOString() })
    .eq("id", resultId);

  return NextResponse.json({ ok: true, email });
}
