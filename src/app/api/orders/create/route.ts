import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { nanoid } from "nanoid";
import { createClient, createServiceClient } from "@/lib/supabase/server";

const bodySchema = z.object({
  productId: z.string().uuid(),
  name: z.string().max(50).optional(),
  // birthDate is optional for dream-reading
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  birthTime: z.string().regex(/^\d{2}:\d{2}$/).nullable().optional(),
  timeUnknown: z.boolean().optional(),
  gender: z.enum(["male", "female"]).optional(),
  calendar: z.enum(["solar", "lunar"]).optional(),
  concerns: z.array(z.string().max(200)).max(20).optional(),
  dreamContent: z.string().max(2000).optional(),
  // 연인/궁합(love-saju) 전용 파트너 필드
  partnerName: z.string().max(50).optional(),
  partnerBirthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  partnerBirthTime: z.string().regex(/^\d{2}:\d{2}$/).nullable().optional(),
  partnerTimeUnknown: z.boolean().optional(),
  partnerGender: z.enum(["male", "female"]).optional(),
  partnerCalendar: z.enum(["solar", "lunar"]).optional(),
});

export async function POST(request: NextRequest) {
  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "잘못된 요청입니다", details: parsed.error.flatten() }, { status: 400 });
  }
  const body = parsed.data;

  // 로그인 필수 — 결과는 마이페이지에서 수령
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });
  }

  // 가격은 서버에서만 (클라 변조 방지)
  const service = createServiceClient();
  const { data: product, error: productErr } = await service
    .from("products")
    .select("id, price, is_active")
    .eq("id", body.productId)
    .maybeSingle();

  if (productErr || !product || !product.is_active) {
    return NextResponse.json({ error: "상품을 찾을 수 없습니다" }, { status: 404 });
  }

  const orderId = `ord_${nanoid(20)}`;

  const { data: order, error: orderErr } = await service
    .from("orders")
    .insert({
      order_id: orderId,
      user_id: user.id,
      guest_email: null,
      product_id: product.id,
      amount: product.price,
      status: "pending",
    })
    .select("id")
    .single();

  if (orderErr || !order) {
    return NextResponse.json({ error: "주문 생성 실패", detail: orderErr?.message }, { status: 500 });
  }

  const { error: inputErr } = await service.from("saju_inputs").insert({
    order_id: order.id,
    name: body.name ?? null,
    birth_date: body.birthDate ?? null,
    birth_time: body.birthTime ?? null,
    time_unknown: body.timeUnknown ?? false,
    gender: body.gender ?? "male",
    calendar: body.calendar ?? "solar",
    concerns: body.concerns ?? [],
    dream_content: body.dreamContent ?? null,
    // 연인/궁합 파트너 정보
    partner_name: body.partnerName ?? null,
    partner_birth_date: body.partnerBirthDate ?? null,
    partner_birth_time: body.partnerBirthTime ?? null,
    partner_time_unknown: body.partnerTimeUnknown ?? false,
    partner_gender: body.partnerGender ?? null,
    partner_calendar: body.partnerCalendar ?? null,
  });

  if (inputErr) {
    await service.from("orders").delete().eq("id", order.id);
    return NextResponse.json({ error: "사주 정보 저장 실패", detail: inputErr.message }, { status: 500 });
  }

  return NextResponse.json({ orderId, amount: product.price });
}
