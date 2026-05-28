// =====================================================
// Resend 이메일 공통 유틸
// =====================================================

const RESEND_API_KEY = process.env.RESEND_API_KEY ?? "";
export const RESEND_FROM = process.env.RESEND_FROM_EMAIL ?? "noreply@saju7.kr";
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.saju7.kr";

export async function sendResendEmail(
  to: string,
  subject: string,
  html: string
): Promise<boolean> {
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

/** 이메일 HTML의 공통 헤더/푸터 래퍼 */
export function emailWrapper(bodyHtml: string): string {
  return `<!DOCTYPE html>
<html lang="ko">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
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
        ${bodyHtml}
      </td>
    </tr>
    <tr>
      <td style="background:#F5F0E6;padding:20px 40px;text-align:center;">
        <p style="font-size:11px;color:#aaa;margin:0;">© 시선(視線) | <a href="${SITE_URL}" style="color:#2D5C5C;text-decoration:none;">${SITE_URL}</a></p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/** [분석지 열람하기] 버튼 HTML */
export function resultLinkButton(resultUrl: string): string {
  return `<div style="text-align:center;margin:36px 0;">
    <a href="${resultUrl}" style="display:inline-block;background:#2D5C5C;color:#F5F0E6;text-decoration:none;padding:16px 40px;border-radius:8px;font-size:16px;font-weight:bold;">
      분석지 열람하기
    </a>
    <p style="font-size:12px;color:#999;margin-top:12px;">※ 발송일로부터 7일간 열람하실 수 있습니다.</p>
  </div>`;
}
