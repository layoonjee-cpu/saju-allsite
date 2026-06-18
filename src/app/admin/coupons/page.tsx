import Link from "next/link";
import { requireAdminPassword } from "@/lib/admin-auth";
import { createClient } from "@supabase/supabase-js";
import { createServiceClient } from "@/lib/supabase/server";
import { CouponManager } from "@/components/admin/CouponManager";

export const metadata = { title: "쿠폰 관리 | 시선 어드민" };
export const dynamic = "force-dynamic";

export default async function AdminCouponsPage() {
  await requireAdminPassword("/admin/coupons");

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.SUPABASE_SECRET_KEY!;
  const svcRaw = createClient(supabaseUrl, supabaseKey);
  const svc = createServiceClient();

  const [{ data: coupons }, { data: products }] = await Promise.all([
    svcRaw
      .from("coupons")
      .select("id, code, uses_left, expires_at, note, product_id, created_at")
      .order("created_at", { ascending: false }),
    svc
      .from("products")
      .select("id, name, slug")
      .eq("is_active", true)
      .order("display_order"),
  ]);

  return (
    <div className="container py-10 max-w-4xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin" className="text-xs text-mute hover:text-ink underline underline-offset-2">
          ← 대시보드
        </Link>
        <span className="text-mute text-xs">/</span>
        <p className="text-xs font-mono text-mute">ADMIN / 쿠폰 관리</p>
      </div>

      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-ink">쿠폰 관리</h1>
        <p className="text-xs text-mute mt-1">인플루언서·이벤트용 무료 쿠폰을 생성·관리합니다</p>
      </div>

      <CouponManager
        initialCoupons={coupons ?? []}
        products={products ?? []}
      />
    </div>
  );
}
