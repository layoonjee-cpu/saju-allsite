import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const bodySchema = z.object({
  code: z.string().min(1).toUpperCase(),
  orderId: z.string().min(1),
});

export async function POST(request: NextRequest) {
  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }
  const { code, orderId } = parsed.data;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SECRET_KEY;
  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ error: "서버 설정 오류" }, { status: 500 });
  }

  const { createClient: createServiceClient } = await import("@supabase/supabase-js");
  const svc = createServiceClient(supabaseUrl, supabaseKey);

  // 로그인 사용자 확인 (주문 소유권)
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  // 주문 조회 (소유권 + 상품 확인)
  const { data: order } = await svc
    .from("orders")
    .select("id, user_id, amount, status, product_id")
    .eq("order_id", orderId)
    .maybeSingle();

  if (!order || order.user_id !== user.id) {
    return NextResponse.json({ error: "주문을 찾을 수 없습니다." }, { status: 404 });
  }
  if (order.status === "paid") {
    return NextResponse.json({ error: "이미 처리된 주문입니다." }, { status: 400 });
  }

  // 쿠폰 조회
  const { data: coupon } = await svc
    .from("coupons")
    .select("id, uses_left, expires_at, product_id")
    .eq("code", code)
    .maybeSingle();

  if (!coupon) {
    return NextResponse.json({ error: "유효하지 않은 쿠폰 코드입니다." }, { status: 400 });
  }

  // 사용 횟수 확인
  if (coupon.uses_left !== -1 && coupon.uses_left <= 0) {
    return NextResponse.json({ error: "이미 사용된 쿠폰입니다." }, { status: 400 });
  }

  // 만료일 확인
  if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
    return NextResponse.json({ error: "만료된 쿠폰입니다." }, { status: 400 });
  }

  // 상품 제한 확인
  if (coupon.product_id && coupon.product_id !== order.product_id) {
    return NextResponse.json({ error: "이 상품에는 사용할 수 없는 쿠폰입니다." }, { status: 400 });
  }

  // 주문 금액 0으로 업데이트
  const { error: updateOrderError } = await svc
    .from("orders")
    .update({ amount: 0 })
    .eq("id", order.id);

  if (updateOrderError) {
    return NextResponse.json({ error: "쿠폰 적용에 실패했습니다." }, { status: 500 });
  }

  // 쿠폰 사용 횟수 차감
  if (coupon.uses_left !== -1) {
    await svc
      .from("coupons")
      .update({ uses_left: coupon.uses_left - 1 })
      .eq("id", coupon.id);
  }

  return NextResponse.json({ ok: true });
}
