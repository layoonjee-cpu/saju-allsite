import { notFound, redirect } from "next/navigation";
import { createServiceClient } from "@/lib/supabase/server";
import { TossWidget } from "@/components/checkout/TossWidget";
import { TestPayButton } from "@/components/checkout/TestPayButton";
import { CouponInput } from "@/components/checkout/CouponInput";
import { FreeConfirmButton } from "@/components/checkout/FreeConfirmButton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatKRW } from "@/lib/utils";

export const metadata = { title: "결제" };

export default async function CheckoutPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = await params;
  const service = createServiceClient();

  const { data: order } = await service
    .from("orders")
    .select("id, order_id, amount, status, user_id, guest_email, product_id")
    .eq("order_id", orderId)
    .maybeSingle();

  if (!order) notFound();

  const { data: product } = await service
    .from("products")
    .select("name, slug")
    .eq("id", order.product_id)
    .single();

  const isTarot = product?.slug === "tarot-siren";

  if (order.status === "paid") {
    if (isTarot) {
      const { data: reading } = await service
        .from("tarot_readings")
        .select("id")
        .eq("order_id", order.id)
        .maybeSingle();
      if (reading) redirect(`/tarot/result/${reading.id}`);
    } else {
      const { data: result } = await service
        .from("saju_results")
        .select("id")
        .eq("order_id", order.id)
        .maybeSingle();
      if (result) redirect(`/results/${result.id}`);
    }
  }

  const customerKey = order.user_id ?? `guest_${order.id}`;
  const email = order.guest_email;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "";
  const successUrl = isTarot
    ? `${siteUrl}/tarot/checkout/success`
    : `${siteUrl}/checkout/success`;

  return (
    <div className="container py-12 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>결제</CardTitle>
          <CardDescription>
            {product?.name ?? "상품"} · <span className="font-semibold text-foreground">{formatKRW(order.amount)}</span>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 쿠폰 입력 (타로 제외) */}
          {!isTarot && order.amount > 0 && (
            <div className="space-y-1.5">
              <p className="text-xs text-muted-foreground">쿠폰 코드가 있으신가요?</p>
              <CouponInput orderId={order.order_id} />
            </div>
          )}

          {/* 결제 버튼 영역 */}
          {order.amount === 0 ? (
            <FreeConfirmButton orderId={order.order_id} />
          ) : (
            <TossWidget
              orderId={order.order_id}
              amount={order.amount}
              customerKey={customerKey}
              productName={product?.name ?? "상품"}
              customerEmail={email}
              successUrl={successUrl}
            />
          )}

          {process.env.NODE_ENV !== "production" && (
            <TestPayButton orderId={order.order_id} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
