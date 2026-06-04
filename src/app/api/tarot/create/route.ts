import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createClient, createServiceClient } from "@/lib/supabase/server";

const bodySchema = z.object({
  name: z.string().min(1).max(20),
  question: z.string().max(80).optional(),
  card1Id: z.number().int().min(0).max(77),
  card1Reversed: z.boolean(),
  card2Id: z.number().int().min(0).max(77),
  card2Reversed: z.boolean(),
  card3Id: z.number().int().min(0).max(77),
  card3Reversed: z.boolean(),
  guestEmail: z.string().email().optional(),
});

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  const { name, question, card1Id, card1Reversed, card2Id, card2Reversed, card3Id, card3Reversed, guestEmail } = parsed.data;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user && !guestEmail) {
    return NextResponse.json({ error: "비회원은 이메일 입력이 필요합니다." }, { status: 400 });
  }

  const svc = createServiceClient();

  const { data: product } = await svc
    .from("products")
    .select("id, price")
    .eq("slug", "tarot-siren")
    .single();

  if (!product) {
    return NextResponse.json({ error: "상품을 찾을 수 없습니다." }, { status: 404 });
  }

  const orderId = `tarot-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  const { data: order, error: orderErr } = await svc
    .from("orders")
    .insert({
      order_id: orderId,
      user_id: user?.id ?? null,
      guest_email: guestEmail ?? null,
      product_id: product.id,
      amount: product.price,
      status: "pending",
    })
    .select("id")
    .single();

  if (orderErr || !order) {
    return NextResponse.json({ error: "주문 생성에 실패했습니다." }, { status: 500 });
  }

  const { error: readingErr } = await svc.from("tarot_readings").insert({
    order_id: order.id,
    name,
    question: question ?? "",
    card_1_id: card1Id,
    card_1_reversed: card1Reversed,
    card_2_id: card2Id,
    card_2_reversed: card2Reversed,
    card_3_id: card3Id,
    card_3_reversed: card3Reversed,
  });

  if (readingErr) {
    return NextResponse.json({ error: "리딩 데이터 저장에 실패했습니다." }, { status: 500 });
  }

  return NextResponse.json({ orderId });
}
