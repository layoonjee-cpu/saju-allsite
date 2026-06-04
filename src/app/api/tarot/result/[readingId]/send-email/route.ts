import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createServiceClient } from "@/lib/supabase/server";
import { sendResendEmail, emailWrapper } from "@/lib/email";
import { tarotCards, getCardImagePath } from "@/data/tarot-cards";

const bodySchema = z.object({ email: z.string().email() });

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ readingId: string }> },
) {
  const { readingId } = await params;
  const body = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "올바른 이메일 주소를 입력해주세요." }, { status: 400 });
  }

  const svc = createServiceClient();
  const { data: reading } = await svc
    .from("tarot_readings")
    .select("*")
    .eq("id", readingId)
    .maybeSingle();

  if (!reading) return NextResponse.json({ error: "리딩을 찾을 수 없습니다." }, { status: 404 });

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "";
  const resultUrl = `${siteUrl}/tarot/result/${readingId}`;

  const cards = [
    { id: reading.card_1_id, reversed: reading.card_1_reversed },
    { id: reading.card_2_id, reversed: reading.card_2_reversed },
    { id: reading.card_3_id, reversed: reading.card_3_reversed },
  ];
  const positions = ["현재 상황", "흐름과 조언", "앞으로의 방향"];

  const cardRows = cards
    .map((c, i) => {
      const info = tarotCards.find((t) => t.id === c.id);
      return `<tr><td style="padding:4px 0;color:#a89060;font-size:13px;">${positions[i]}</td><td style="padding:4px 8px;font-size:13px;">${info?.nameKo ?? ""} ${c.reversed ? "(역방향)" : ""}</td></tr>`;
    })
    .join("");

  const html = emailWrapper(`
    <h2 style="margin:0 0 8px;font-size:20px;">타로의 시선 — 리딩 결과</h2>
    <p style="color:#666;margin:0 0 20px;font-size:14px;">&ldquo;${reading.question}&rdquo;</p>
    <table style="margin-bottom:20px;">${cardRows}</table>
    <a href="${resultUrl}" style="display:inline-block;background:#c9a84c;color:#0a0a14;padding:12px 28px;border-radius:10px;font-weight:600;text-decoration:none;font-size:14px;">리딩 결과 보기</a>
    <p style="margin-top:24px;font-size:12px;color:#999;">링크는 언제든지 다시 확인하실 수 있습니다.</p>
  `);

  await sendResendEmail(parsed.data.email, "타로의 시선 — 리딩 결과", html);
  return NextResponse.json({ ok: true });
}
