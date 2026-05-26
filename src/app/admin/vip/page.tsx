import Link from "next/link";
import { requireAdminPassword } from "@/lib/admin-auth";
import { createServiceClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import { formatKRW } from "@/lib/utils";

export const metadata = { title: "VIP PDF 관리 | 시선 어드민" };
export const dynamic = "force-dynamic";

type SearchParams = Promise<{ status?: string }>;

const GEN_STATUS: Record<string, { label: string; cls: string }> = {
  generating: { label: "생성중 ⏳", cls: "bg-amber-100 text-amber-800 border-amber-300" },
  complete: { label: "완료 ✓", cls: "bg-green-100 text-green-800 border-green-300" },
  failed: { label: "실패 ✗", cls: "bg-red-100 text-red-800 border-red-300" },
};

export default async function AdminVipPage({ searchParams }: { searchParams: SearchParams }) {
  await requireAdminPassword("/admin/vip");
  const { status: statusFilter } = await searchParams;

  if (!isSupabaseConfigured()) {
    return (
      <div className="container py-12 max-w-xl">
        <h1 className="text-2xl font-semibold mb-4">VIP PDF 관리</h1>
        <p className="text-sm text-body">Supabase 미연결 상태입니다.</p>
      </div>
    );
  }

  const svc = createServiceClient();

  // ── 프리미엄 상품 ID ─────────────────────────────────────────
  const { data: premiumProd } = await svc
    .from("products")
    .select("id, name")
    .eq("slug", "premium-saju")
    .single();

  if (!premiumProd) {
    return (
      <div className="container py-12 max-w-xl">
        <h1 className="text-2xl font-semibold mb-4">VIP PDF 관리</h1>
        <p className="text-sm text-body">premium-saju 상품을 찾을 수 없습니다.</p>
      </div>
    );
  }

  // ── 주문 + 결과 ──────────────────────────────────────────────
  const ordersQ = svc
    .from("orders")
    .select("id, order_id, amount, status, created_at, guest_email, user_id")
    .eq("product_id", premiumProd.id)
    .order("created_at", { ascending: false })
    .limit(200);

  const { data: vipOrders } = await ordersQ;
  const orderIds = (vipOrders ?? []).map((o) => o.id);

  const [{ data: results }, { data: inputs }] = await Promise.all([
    orderIds.length
      ? svc.from("saju_results").select("id, order_id, generation_status, pdf_url, created_at").in("order_id", orderIds)
      : { data: [] },
    orderIds.length
      ? svc.from("saju_inputs").select("order_id, name").in("order_id", orderIds)
      : { data: [] },
  ]);

  const resultMap = new Map((results ?? []).map((r) => [r.order_id, r]));
  const nameMap = new Map((inputs ?? []).map((i) => [i.order_id, i.name ?? "고객"]));

  // ── 이메일 ───────────────────────────────────────────────────
  const userIds = [...new Set((vipOrders ?? []).filter((o) => o.user_id).map((o) => o.user_id as string))];
  const emailMap = new Map<string, string>();
  if (userIds.length > 0) {
    try {
      const { data: { users } } = await svc.auth.admin.listUsers({ perPage: 1000 });
      users.forEach((u) => { if (u.email) emailMap.set(u.id, u.email); });
    } catch { /* ignore */ }
  }

  // ── 목록 조합 + 상태 필터 ─────────────────────────────────────
  let rows = (vipOrders ?? []).map((o) => ({
    order: o,
    result: resultMap.get(o.id),
    name: nameMap.get(o.id) ?? "고객",
    email: o.guest_email ?? (o.user_id ? emailMap.get(o.user_id) ?? "" : ""),
  }));

  if (statusFilter && statusFilter !== "all") {
    rows = rows.filter((r) => {
      if (statusFilter === "generating") return r.result?.generation_status === "generating";
      if (statusFilter === "complete") return r.result?.generation_status === "complete";
      if (statusFilter === "failed") return r.result?.generation_status === "failed";
      if (statusFilter === "none") return !r.result;
      return true;
    });
  }

  // ── 통계 ─────────────────────────────────────────────────────
  const total = rows.length;
  const generating = rows.filter((r) => r.result?.generation_status === "generating").length;
  const complete = rows.filter((r) => r.result?.generation_status === "complete").length;
  const failed = rows.filter((r) => r.result?.generation_status === "failed").length;
  const noResult = rows.filter((r) => !r.result).length;
  const totalRevenue = (vipOrders ?? []).filter((o) => o.status === "paid").reduce((s, o) => s + (o.amount ?? 0), 0);

  return (
    <div className="container py-10 max-w-5xl">
      {/* 헤더 */}
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin" className="text-xs text-mute hover:text-ink underline underline-offset-2">← 대시보드</Link>
        <span className="text-mute text-xs">/</span>
        <p className="text-xs font-mono text-mute">ADMIN / VIP PDF 관리</p>
      </div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-ink">VIP PDF 관리</h1>
          <p className="text-xs text-mute mt-1">{premiumProd.name}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-mute">VIP 총 매출</p>
          <p className="text-xl font-mono font-semibold text-ink">{formatKRW(totalRevenue)}</p>
        </div>
      </div>

      {/* 통계 */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        {[
          { label: "전체", value: total, cls: "border-hairline" },
          { label: "생성중", value: generating, cls: generating > 0 ? "border-amber-400 bg-amber-50" : "border-hairline" },
          { label: "완료", value: complete, cls: "border-green-300 bg-green-50" },
          { label: "실패", value: failed, cls: failed > 0 ? "border-red-400 bg-red-50" : "border-hairline" },
          { label: "미생성", value: noResult, cls: "border-hairline" },
        ].map((s) => (
          <div key={s.label} className={`rounded-lg border p-3 ${s.cls}`}>
            <p className="text-[10px] font-mono text-mute uppercase">{s.label}</p>
            <p className="text-xl font-semibold font-mono text-ink mt-1">{s.value}</p>
          </div>
        ))}
      </div>

      {/* 상태 필터 탭 */}
      <div className="flex flex-wrap gap-2 mb-4">
        {[
          { key: "", label: "전체" },
          { key: "generating", label: "생성중" },
          { key: "complete", label: "완료" },
          { key: "failed", label: "실패" },
          { key: "none", label: "미생성" },
        ].map((f) => {
          const active = (statusFilter ?? "") === f.key;
          return (
            <Link
              key={f.key || "all"}
              href={f.key ? `/admin/vip?status=${f.key}` : "/admin/vip"}
              className={`px-3 h-7 inline-flex items-center rounded-full text-xs border transition-colors ${active ? "bg-ink text-canvas border-ink" : "border-hairline text-body hover:border-ink"}`}
            >
              {f.label}
            </Link>
          );
        })}
      </div>

      <p className="text-[11px] font-mono text-mute mb-3">{rows.length} ROWS</p>

      {/* 테이블 */}
      <div className="border border-hairline rounded-lg overflow-x-auto">
        <table className="w-full text-sm whitespace-nowrap">
          <thead>
            <tr className="border-b border-hairline bg-surface-soft/30">
              {["신청일시", "주문자명", "이메일", "결제금액", "PDF 상태", "생성일시", "결과"].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-[10px] font-mono uppercase tracking-wider text-mute">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-16 text-center text-sm text-mute">
                  해당 조건의 VIP 주문이 없습니다.
                </td>
              </tr>
            ) : rows.map(({ order: o, result: r, name, email }) => (
              <tr key={o.id} className="border-b border-hairline last:border-0 hover:bg-surface-soft/20">
                <td className="px-4 py-3 text-xs text-mute">
                  {new Date(o.created_at).toLocaleString("ko-KR", {
                    year: "2-digit", month: "2-digit", day: "2-digit",
                    hour: "2-digit", minute: "2-digit",
                  })}
                </td>
                <td className="px-4 py-3 text-xs font-medium text-ink">{name}</td>
                <td className="px-4 py-3 text-xs text-body">{email || <span className="text-mute">-</span>}</td>
                <td className="px-4 py-3 text-xs font-mono text-ink">{formatKRW(o.amount)}</td>
                <td className="px-4 py-3">
                  {r ? (
                    <span className={`inline-block px-2 py-0.5 rounded border text-[10px] font-medium ${GEN_STATUS[r.generation_status]?.cls ?? "bg-muted border-hairline text-mute"}`}>
                      {GEN_STATUS[r.generation_status]?.label ?? r.generation_status}
                    </span>
                  ) : (
                    <span className="inline-block px-2 py-0.5 rounded border text-[10px] font-medium bg-muted border-hairline text-mute">미생성</span>
                  )}
                </td>
                <td className="px-4 py-3 text-xs text-mute">
                  {r ? new Date(r.created_at).toLocaleString("ko-KR", {
                    month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit",
                  }) : "-"}
                </td>
                <td className="px-4 py-3">
                  {r?.generation_status === "complete" ? (
                    <Link href={`/results/${r.id}`} className="text-xs underline underline-offset-2 text-ink hover:text-body">
                      보기 →
                    </Link>
                  ) : (
                    <span className="text-xs text-mute">-</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
