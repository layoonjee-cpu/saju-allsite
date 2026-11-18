import { NextResponse, type NextRequest } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { generateSajuPdf } from "@/lib/pdf/generate-saju-pdf";
import { assertPdfCustomerIdentity } from "@/lib/pdf/identity-guard";
import { isAdminAuthenticated } from "@/lib/admin-auth";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

/** A same-origin PDF response so a phone can share the file, not an exposed result link. */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ resultId: string }> },
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const isAdmin = await isAdminAuthenticated();
  if (!user && !isAdmin) return NextResponse.json({ error: "PDF 저장은 로그인이 필요합니다." }, { status: 401 });

  const { resultId } = await params;
  const svc = createServiceClient();
  const { data: result } = await svc.from("saju_results")
    .select("order_id, generation_status, interpretation_md, pdf_url, email_sent_at")
    .eq("id", resultId).maybeSingle();
  if (!result) return NextResponse.json({ error: "결과를 찾을 수 없습니다." }, { status: 404 });

  const { data: order } = await svc.from("orders")
    .select("user_id, guest_email, product_id, amount, status")
    .eq("id", result.order_id).maybeSingle();
  if (!order) return NextResponse.json({ error: "주문을 찾을 수 없습니다." }, { status: 404 });
  const isOwner = user && (order.user_id === user.id ||
    (!!order.guest_email && !!user.email && order.guest_email.toLowerCase() === user.email.toLowerCase()));
  if (!isAdmin && !isOwner) {
    return NextResponse.json({ error: "본인 주문의 결과지만 저장할 수 있습니다." }, { status: 403 });
  }
  if (order.status !== "paid") {
    return NextResponse.json({ error: "결제가 완료된 결과지만 저장할 수 있습니다." }, { status: 403 });
  }
  if (result.email_sent_at && Date.now() - new Date(result.email_sent_at).getTime() > SEVEN_DAYS_MS) {
    return NextResponse.json({ error: "분석지 열람 기간(발송 후 7일)이 만료되었습니다." }, { status: 410 });
  }
  if (result.generation_status !== "complete" || (!result.interpretation_md && !result.pdf_url)) {
    return NextResponse.json({ error: "분석 결과가 아직 준비되지 않았습니다." }, { status: 409 });
  }
  if ((order.amount ?? 0) === 0) {
    return NextResponse.json({ error: "유료 상품 결과지만 PDF로 저장할 수 있습니다." }, { status: 403 });
  }

  const [{ data: product }, { data: input }] = await Promise.all([
    svc.from("products").select("name, slug").eq("id", order.product_id).maybeSingle(),
    svc.from("saju_inputs")
      .select("name, partner_name, birth_date, birth_time, time_unknown, gender, calendar")
      .eq("order_id", result.order_id).maybeSingle(),
  ]);

  try {
    await assertPdfCustomerIdentity(svc, result.interpretation_md ?? "", input?.name, input?.partner_name);
  } catch {
    return NextResponse.json({ error: "고객명 대조가 필요해 PDF 발급을 중단했습니다. 고객센터에 문의해 주세요." }, { status: 409 });
  }

  // Stored VIP PDFs can exceed Vercel's response-size limit (the existing 168-page file is 5.36 MB).
  // Return a short-lived owner-only URL; the client fetches it directly for download/file sharing.
  if (result.pdf_url) {
    const shortId = resultId.replace(/-/g, "").slice(0, 8);
    if (!result.pdf_url.includes(resultId) && !result.pdf_url.includes(shortId)) {
      console.error("[result-pdf] PDF path does not match result ID", { resultId });
      return NextResponse.json({ error: "PDF 연결을 확인 중입니다. 고객센터에 문의해 주세요." }, { status: 409 });
    }
    const { data: signed, error } = await svc.storage.from("vip-pdfs")
      .createSignedUrl(result.pdf_url, 5 * 60);
    if (error || !signed) {
      return NextResponse.json({ error: "기존 PDF를 불러오지 못했습니다." }, { status: 500 });
    }
    return NextResponse.json({ url: signed.signedUrl }, {
      headers: { "Cache-Control": "private, no-store, max-age=0" },
    });
  }

  let pdf: Buffer;
  try {
      let content = result.interpretation_md as string;
      // These two products are stored as JSON but shown as structured cards on screen.
      if (product?.slug === "ilju-sticker" || product?.slug === "today-fortune") {
        try {
          const parsed = JSON.parse(content.trim().replace(/^```json\s*/, "").replace(/\s*```$/, "")) as Record<string, unknown>;
          content = Object.entries(parsed).map(([key, value]) =>
            `## ${key}\n${Array.isArray(value) ? value.join(" · ") : String(value)}`,
          ).join("\n\n");
        } catch { /* Older results may already be markdown. */ }
      }
      pdf = await generateSajuPdf({
        interpretationMd: content,
        productName: product?.name ?? "사주 분석",
        customerName: input?.name ?? null,
        birthDate: input?.birth_date ?? null,
        birthTime: input?.birth_time ?? null,
        timeUnknown: input?.time_unknown ?? false,
        gender: (input?.gender as "male" | "female") ?? null,
        calendar: (input?.calendar as "solar" | "lunar") ?? null,
        generatedAt: new Date().toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" }),
      });
  } catch (error) {
    console.error("[result-pdf] PDF 준비 실패:", error);
    return NextResponse.json({ error: "PDF를 준비하지 못했습니다. 잠시 후 다시 시도해 주세요." }, { status: 500 });
  }

  const fileName = `${product?.name ?? "시선사주"}_${input?.name ?? "결과지"}.pdf`
    .replace(/[\\/:*?"<>|\r\n]/g, "");
  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="siseon-result.pdf"; filename*=UTF-8''${encodeURIComponent(fileName)}`,
      "Cache-Control": "private, no-store, max-age=0",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
