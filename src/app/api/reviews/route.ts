import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const bodySchema = z.object({
  orderId: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  content: z.string().min(5).max(2000),
});

export async function POST(request: NextRequest) {
  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "잘못된 요청" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });

  const { data: order } = await supabase
    .from("orders")
    .select("id, product_id, status, user_id")
    .eq("id", parsed.data.orderId)
    .maybeSingle();

  if (!order || order.user_id !== user.id) {
    return NextResponse.json({ error: "본인 주문만 후기 작성 가능합니다" }, { status: 403 });
  }
  if (order.status !== "paid") {
    return NextResponse.json({ error: "결제 완료된 주문에만 후기 작성 가능합니다" }, { status: 400 });
  }

  const { error } = await supabase.from("reviews").insert({
    user_id: user.id,
    order_id: order.id,
    product_id: order.product_id,
    rating: parsed.data.rating,
    content: parsed.data.content,
    is_public: false,   // 운영자 승인 후 공개
    status: "pending",  // 승인 대기
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
