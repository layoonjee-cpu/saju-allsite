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

  // 로그인 여부 확인 (선택적 - 비회원도 쿠폰 사용 가능)
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // 주문 조회
  const { data: order } = await svc
    .from("orders")
    .select("id, user_id, amount, status, product_id")
    .eq("order_id", orderId)
    .maybeSingle();

  if (!order) {
    return NextResponse.json({ error: "주문을 찾을 수 없습니다." }, { status: 404 });
  }

  // 소유권 확인: 로그인한 경우 본인 주문이어야 함 (게스트 주문은 orderId 자체가 인증 토큰 역할)
  if (user && order.user_id && order.user_id !== user.id) {
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

  // ── 쿠폰 차감 (낙관적 잠금) ─────────────────────────────────────────
  // uses_left를 읽은 값 그대로 WHERE 조건에 포함 → 동시 요청 시 한 건만 성공
  // (다른 요청이 먼저 차감하면 WHERE 조건 불일치 → 0 rows updated → 거부)
  if (coupon.uses_left !== -1) {
    const { data: claimed } = await svc
      .from("coupons")
      .update({ uses_left: coupon.uses_left - 1 })
      .eq("id", coupon.id)
      .eq("uses_left", coupon.uses_left)   // 낙관적 잠금 핵심: 읽은 값과 일치할 때만 업데이트
      .select("id");

    if (!claimed || claimed.length === 0) {
      // 동시 요청에 의해 이미 차감된 상태
      return NextResponse.json({ error: "이미 사용된 쿠폰입니다." }, { status: 400 });
    }
  }

  // 주문 금액 0으로 업데이트
  const { error: updateOrderError } = await svc
    .from("orders")
    .update({ amount: 0 })
    .eq("id", order.id);

  if (updateOrderError) {
    // 주문 업데이트 실패 시 차감한 쿠폰 횟수 복구
    if (coupon.uses_left !== -1) {
      await svc
        .from("coupons")
        .update({ uses_left: coupon.uses_left })
        .eq("id", coupon.id);
    }
    return NextResponse.json({ error: "쿠폰 적용에 실패했습니다." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
