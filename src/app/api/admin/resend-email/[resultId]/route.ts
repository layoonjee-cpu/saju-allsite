import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { createServiceClient } from "@/lib/supabase/server";

const RESEND_API_KEY = process.env.RESEND_API_KEY ?? "";
const RESEND_FROM = process.env.RESEND_FROM_EMAIL ?? "noreply@saju7.kr";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.saju7.kr";

async function sendResendEmail(to: string, subject: string, html: string): Promise<boolean> {
  if (!RESEND_API_KEY) return false;
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from: RESEND_FROM, to: [to], subject, html }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ resultId: string }> }
) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const { resultId } = await params;
  if (!resultId) {
    return NextResponse.json({ ok: false, error: "resultId required" }, { status: 400 });
  }

  const svc = createServiceClient();

  const { data: result, error: resultErr } = await svc
    .from("saju_results")
    .select("id, order_id, generation_status, pdf_url")
    .eq("id", resultId)
    .single();

  if (resultErr || !result) {
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

  // 이메일: 게스트 이메일 우선, 없으면 회원 이메일 조회
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
  const isVip = !!result.pdf_url;
  const subject = isVip
    ? `[시선] ${name}님의 깊은 시선 VIP 보고서를 확인하세요`
    : `[시선] ${name}님의 사주 분석 결과를 확인하세요`;

  const html = `<!DOCTYPE html>
<html lang="ko">
<head><meta charset="UTF-8"></head>
<body style="font-family:'Apple SD Gothic Neo','Noto Sans KR',sans-serif;background:#F5F0E6;margin:0;padding:0;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
    <tr>
      <td style="background:#2D5C5C;padding:32px 40px;text-align:center;">
        <h1 style="color:#F5F0E6;font-size:22px;margin:0;letter-spacing:2px;">시선 視線</h1>
        <p style="color:#a8c5c5;font-size:13px;margin:8px 0 0;">정통 명리학 × AI</p>
      </td>
    </tr>
    <tr>
      <td style="padding:40px;">
        <p style="font-size:16px;color:#1A1A1A;line-height:1.7;">
          <strong>${name}님</strong>, 안녕하세요.<br><br>
          ${isVip
            ? "정성을 담아 작성한 <strong>깊은 시선 VIP 사주 보고서</strong>를 확인하실 수 있습니다."
            : "요청하신 <strong>사주 분석 결과</strong>를 확인하실 수 있습니다."}
        </p>
        <div style="text-align:center;margin:36px 0;">
          <a href="${resultUrl}" style="display:inline-block;background:#2D5C5C;color:#F5F0E6;text-decoration:none;padding:16px 40px;border-radius:8px;font-size:16px;font-weight:bold;">
            결과 확인하기
          </a>
        </div>
        <p style="font-size:12px;color:#999;text-align:center;">문의: ${RESEND_FROM}</p>
      </td>
    </tr>
    <tr>
      <td style="background:#F5F0E6;padding:20px 40px;text-align:center;">
        <p style="font-size:11px;color:#aaa;margin:0;">© 시선(視線) | <a href="${SITE_URL}" style="color:#2D5C5C;">${SITE_URL}</a></p>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const sent = await sendResendEmail(email, subject, html);

  if (!sent) {
    return NextResponse.json({ ok: false, error: "email send failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, email });
}
