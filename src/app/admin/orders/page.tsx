import Link from "next/link";
import { requireAdminPassword } from "@/lib/admin-auth";
import { createServiceClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import { formatKRW } from "@/lib/utils";

export const metadata = { title: "주문 관리 | 시선 어드민" };
export const dynamic = "force-dynamic";

type SearchParams = Promise<{ status?: string; product?: string }>;

const ORDER_STATUS: Record<string, { label: string; cls: string }> = {
  paid: { label: "결제완료", cls: "bg-green-100 text-green-800 border-green-300" },
  pending: { label: "결제대기", cls: "bg-amber-100 text-amber-800 border-amber-300" },
  failed: { label: "실패", cls: "bg-red-100 text-red-800 border-red-300" },
};

const GEN_STATUS: Record<string, { label: string; cls: string }> = {
  generating: { label: "생성중", cls: "bg-amber-100 text-amber-800 border-amber-300" },
  complete: { label: "완료", cls: "bg-green-100 text-green-800 border-green-300" },
  failed: { label: "실패", cls: "bg-red-100 text-red-800 border-red-300" },
};

function SBadge({ map, val }: { map: Record<string, { label: string; cls: string }>; val: string }) {
  const s = map[val] ?? { label: val, cls: "bg-muted border-hairline text-mute" };
  return (
    <span className={`inline-block px-2 py-0.5 rounded border text-[10px] font-medium ${s.cls}`}>
      {s.label}
    </span>
  );
}

export default async function AdminOrdersPage({ searchParams }: { searchParams: SearchParams }) {
  await requireAdminPassword("/admin/orders");
  const { status, product: productFilter } = await searchParams;

  if (!isSupabaseConfigured()) {
    return (
      <div className="container py-12 max-w-xl">
        <h1 className="text-2xl font-semibold mb-4">주문 관리</h1>
        <p className="text-sm text-body">Supabase 미연결 상태입니다.</p>
      </div>
    );
  }

  const svc = createServiceClient();

  // ── 상품 목록 ─────────────────────────────────────────────────
  const { data: products } = await svc.from("products").select("id, slug, name").eq("is_active", true).order("display_order");
  const prodMap = new Map((products ?? []).map((p) => [p.id, p]));

  // ── 주문 조회 ─────────────────────────────────────────────────
  let query = svc
    .from("orders")
    .select("id, order_id, amount, status, created_at, guest_email, user_id, product_id, toss_payment_key")
    .order("created_at", { ascending: false })
    .limit(300);

  if (status && ["paid", "pending", "failed"].includes(status)) {
    query = query.eq("status", status as "paid" | "pending" | "failed");
  }
  if (productFilter) {
    const prod = (products ?? []).find((p) => p.slug === productFilter);
    if (prod) query = query.eq("product_id", prod.id);
  }

  const { data: orders } = await query;

  // ── 조인 데이터 ───────────────────────────────────────────────
  const orderIds = (orders ?? []).map((o) => o.id);

  const [{ data: inputs }, { data: results }] = await Promise.all([
    orderIds.length
      ? svc.from("saju_inputs").select("order_id, name").in("order_id", orderIds)
      : { data: [] },
    orderIds.length
      ? svc.from("saju_results").select("id, order_id, generation_status, pdf_url").in("order_id", orderIds)
      : { data: [] },
  ]);

  const nameMap = new Map((inputs ?? []).map((i) => [i.order_id, i.name ?? "고객"]));
  const resultMap = new Map((results ?? []).map((r) => [r.order_id, r]));

  // ── 유저 이메일 ───────────────────────────────────────────────
  const userIds = [...new Set((orders ?? []).filter((o) => o.user_id).map((o) => o.user_id as string))];
  const emailMap = new Map<string, string>();
  if (userIds.length > 0) {
    try {
      const { data: { users } } = await svc.auth.admin.listUsers({ perPage: 1000 });
      users.forEach((u) => { if (u.email) emailMap.set(u.id, u.email); });
    } catch { /* ignore */ }
  }

  // ── 매출 통계 ─────────────────────────────────────────────────
  const paidList = (orders ?? []).filter((o) => o.status === "paid");
  const totalRevenue = paidList.reduce((s, o) => s + (o.amount ?? 0), 0);

  return (
    <div className="container py-10 max-w-6xl">
      {/* 헤더 */}
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin" className="text-xs text-mute hover:text-ink underline underline-offset-2">← 대시보드</Link>
        <span className="text-mute text-xs">/</span>
        <p className="text-xs font-mono text-mute">ADMIN / 주문 관리</p>
      </div>
      <div className="flex items-start justify-between mb-6">
        <h1 className="text-2xl font-semibold text-ink">주문 관리</h1>
        <div className="text-right">
          <p className="text-xs text-mute">조회된 결제 합계</p>
          <p className="text-xl font-mono font-semibold text-ink">{formatKRW(totalRevenue)}</p>
          <p className="text-xs text-mute">{paidList.length}건 결제완료</p>
        </div>
      </div>

      {/* 상태 필터 */}
      <div className="flex flex-wrap gap-2 mb-4">
        <p className="text-xs text-mute self-center mr-1">결제상태:</p>
        {[
          { key: "", label: "전체" },
          { key: "paid", label: "결제완료" },
          { key: "pending", label: "결제대기" },
          { key: "failed", label: "실패" },
        ].map((f) => {
          const href = [
            f.key ? `status=${f.key}` : "",
            productFilter ? `product=${productFilter}` : "",
          ].filter(Boolean).join("&");
          const active = (status ?? "") === f.key;
          return (
            <Link
              key={f.key || "all"}
              href={href ? `/admin/orders?${href}` : "/admin/orders"}
              className={`px-3 h-7 inline-flex items-center rounded-full text-xs border transition-colors ${active ? "bg-ink text-canvas border-ink" : "border-hairline text-body hover:border-ink"}`}
            >
              {f.label}
            </Link>
          );
        })}
        <span className="text-mute text-xs self-center mx-2">|</span>
        <p className="text-xs text-mute self-center mr-1">상품:</p>
        {[{ slug: "", name: "전체" }, ...(products ?? [])].map((p) => {
          const href = [
            status ? `status=${status}` : "",
            p.slug ? `product=${p.slug}` : "",
          ].filter(Boolean).join("&");
          const active = (productFilter ?? "") === p.slug;
          return (
            <Link
              key={p.slug || "all"}
              href={href ? `/admin/orders?${href}` : "/admin/orders"}
              className={`px-3 h-7 inline-flex items-center rounded-full text-xs border transition-colors ${active ? "bg-ink text-canvas border-ink" : "border-hairline text-body hover:border-ink"}`}
            >
              {p.name}
            </Link>
          );
        })}
      </div>

      <p className="text-[11px] font-mono text-mute mb-3">{(orders ?? []).length} ROWS</p>

      {/* 테이블 */}
      <div className="border border-hairline rounded-lg overflow-x-auto">
        <table className="w-full text-sm whitespace-nowrap">
          <thead>
            <tr className="border-b border-hairline bg-surface-soft/30">
              {["신청일시", "주문자명", "이메일", "상품", "금액", "결제상태", "분석상태", "결과"].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-[10px] font-mono uppercase tracking-wider text-mute">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(orders ?? []).length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-16 text-center text-sm text-mute">
                  조건에 맞는 주문이 없습니다.
                </td>
              </tr>
            ) : (orders ?? []).map((o) => {
              const email = o.guest_email ?? (o.user_id ? emailMap.get(o.user_id) ?? "" : "");
              const name = nameMap.get(o.id) ?? "-";
              const result = resultMap.get(o.id);
              const prod = prodMap.get(o.product_id);

              return (
                <tr key={o.id} className="border-b border-hairline last:border-0 hover:bg-surface-soft/20">
                  <td className="px-4 py-3 text-xs text-mute">
                    {new Date(o.created_at).toLocaleString("ko-KR", {
                      year: "2-digit", month: "2-digit", day: "2-digit",
                      hour: "2-digit", minute: "2-digit",
                    })}
                  </td>
                  <td className="px-4 py-3 text-xs font-medium text-ink">{name}</td>
                  <td className="px-4 py-3 text-xs text-body">{email || <span className="text-mute">-</span>}</td>
                  <td className="px-4 py-3 text-xs text-body">{prod?.name ?? "-"}</td>
                  <td className="px-4 py-3 text-xs font-mono text-ink">{formatKRW(o.amount)}</td>
                  <td className="px-4 py-3"><SBadge map={ORDER_STATUS} val={o.status} /></td>
                  <td className="px-4 py-3">
                    {result ? <SBadge map={GEN_STATUS} val={result.generation_status} /> : <span className="text-xs text-mute">-</span>}
                  </td>
                  <td className="px-4 py-3">
                    {result ? (
                      <Link href={`/results/${result.id}`} className="text-xs underline underline-offset-2 text-ink hover:text-body">
                        보기
                      </Link>
                    ) : (
                      <span className="text-xs text-mute">-</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
