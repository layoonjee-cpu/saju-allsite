import Link from "next/link";
import { requireAdminPassword } from "@/lib/admin-auth";
import { createServiceClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import { formatKRW } from "@/lib/utils";

export const metadata = { title: "관리자 대시보드 | 시선" };
export const dynamic = "force-dynamic";

// ── 공통 컴포넌트 ───────────────────────────────────────────────
function StatCard({
  label, value, sub, highlight = false,
}: { label: string; value: string; sub?: string; highlight?: boolean }) {
  return (
    <div className={`rounded-xl border p-5 ${highlight ? "border-amber-400 bg-amber-50" : "border-hairline bg-canvas"}`}>
      <p className="text-[11px] font-mono text-mute uppercase tracking-wider mb-2">{label}</p>
      <p className={`text-2xl font-semibold font-mono ${highlight ? "text-amber-700" : "text-ink"}`}>{value}</p>
      {sub && <p className="text-xs text-mute mt-1">{sub}</p>}
    </div>
  );
}

const ORDER_STATUS: Record<string, { label: string; cls: string }> = {
  paid: { label: "결제완료", cls: "bg-green-100 text-green-800 border-green-300" },
  pending: { label: "대기", cls: "bg-amber-100 text-amber-800 border-amber-300" },
  failed: { label: "실패", cls: "bg-red-100 text-red-800 border-red-300" },
};

const GEN_STATUS: Record<string, { label: string; cls: string }> = {
  generating: { label: "생성중", cls: "bg-amber-100 text-amber-800 border-amber-300" },
  complete: { label: "완료", cls: "bg-green-100 text-green-800 border-green-300" },
  failed: { label: "실패", cls: "bg-red-100 text-red-800 border-red-300" },
};

function Badge({ map, val }: { map: Record<string, { label: string; cls: string }>; val: string }) {
  const s = map[val] ?? { label: val, cls: "bg-muted border-hairline text-mute" };
  return (
    <span className={`inline-block px-1.5 py-0.5 rounded border text-[10px] font-medium ${s.cls}`}>
      {s.label}
    </span>
  );
}

// ── 메인 ──────────────────────────────────────────────────────────
export default async function AdminDashboard() {
  await requireAdminPassword("/admin");

  if (!isSupabaseConfigured()) {
    return (
      <div className="container py-12 max-w-xl">
        <h1 className="text-2xl font-semibold mb-4">관리자 대시보드</h1>
        <p className="text-sm text-body">Supabase 미연결 상태입니다. 환경변수를 설정해 주세요.</p>
      </div>
    );
  }

  const svc = createServiceClient();

  // ── 매출 통계 ─────────────────────────────────────────────────
  const { data: paidOrders } = await svc
    .from("orders")
    .select("amount, created_at")
    .eq("status", "paid");

  const totalRevenue = (paidOrders ?? []).reduce((s, o) => s + (o.amount ?? 0), 0);
  const totalOrders = paidOrders?.length ?? 0;
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const monthRevenue = (paidOrders ?? [])
    .filter((o) => o.created_at >= monthStart)
    .reduce((s, o) => s + (o.amount ?? 0), 0);
  const monthOrders = (paidOrders ?? []).filter((o) => o.created_at >= monthStart).length;

  // ── VIP 현황 ─────────────────────────────────────────────────
  const [{ data: nonComplete }, { data: withPdf }] = await Promise.all([
    svc.from("saju_results")
      .select("id, order_id, generation_status, pdf_url, created_at")
      .neq("generation_status", "complete")
      .order("created_at", { ascending: false })
      .limit(10),
    svc.from("saju_results")
      .select("id, order_id, generation_status, pdf_url, created_at")
      .eq("generation_status", "complete")
      .not("pdf_url", "is", null)
      .order("created_at", { ascending: false })
      .limit(10),
  ]);
  const seenIds = new Set<string>();
  const recentVip = [...(nonComplete ?? []), ...(withPdf ?? [])]
    .filter((r) => { if (seenIds.has(r.id)) return false; seenIds.add(r.id); return true; })
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 10);
  const vipGenerating = (nonComplete ?? []).filter((r) => r.generation_status === "generating").length;

  // ── VIP 주문정보 조인 ─────────────────────────────────────────
  const vipOIds = recentVip.map((r) => r.order_id);
  const vipInfoMap = new Map<string, { name: string; email: string }>();
  if (vipOIds.length > 0) {
    const [{ data: ordersData }, { data: inputsData }] = await Promise.all([
      svc.from("orders").select("id, guest_email, user_id").in("id", vipOIds),
      svc.from("saju_inputs").select("order_id, name").in("order_id", vipOIds),
    ]);
    const nameMap = new Map((inputsData ?? []).map((i) => [i.order_id, i.name ?? "고객"]));
    const userIds = [...new Set((ordersData ?? []).filter((o) => o.user_id).map((o) => o.user_id as string))];
    const emailMap = new Map<string, string>();
    if (userIds.length > 0) {
      try {
        const { data: { users } } = await svc.auth.admin.listUsers({ perPage: 1000 });
        users.forEach((u) => { if (u.email) emailMap.set(u.id, u.email); });
      } catch { /* ignore */ }
    }
    for (const o of ordersData ?? []) {
      vipInfoMap.set(o.id, {
        name: nameMap.get(o.id) ?? "고객",
        email: o.guest_email ?? (o.user_id ? emailMap.get(o.user_id) ?? "" : ""),
      });
    }
  }

  // ── 최근 주문 (8건) ──────────────────────────────────────────
  const { data: recentOrders } = await svc
    .from("orders")
    .select("id, amount, status, created_at, guest_email, user_id, product_id")
    .order("created_at", { ascending: false })
    .limit(8);

  const prodIds = [...new Set((recentOrders ?? []).map((o) => o.product_id))];
  const { data: prods } = prodIds.length
    ? await svc.from("products").select("id, name").in("id", prodIds)
    : { data: [] };
  const prodMap = new Map((prods ?? []).map((p) => [p.id, p.name]));

  const rOrderIds = (recentOrders ?? []).map((o) => o.id);
  const { data: rInputs } = rOrderIds.length
    ? await svc.from("saju_inputs").select("order_id, name").in("order_id", rOrderIds)
    : { data: [] };
  const rNameMap = new Map((rInputs ?? []).map((i) => [i.order_id, i.name ?? "고객"]));

  return (
    <div className="container py-10 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="text-[11px] font-mono text-mute uppercase tracking-wider mb-1">시선 ADMIN</p>
          <h1 className="text-2xl font-semibold text-ink">관리자 대시보드</h1>
        </div>
        <form action="/admin/logout" method="post">
          <button type="submit" className="text-xs text-mute hover:text-ink underline underline-offset-2">
            로그아웃
          </button>
        </form>
      </div>

      {/* 매출 통계 카드 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard label="총 누적 매출" value={formatKRW(totalRevenue)} sub={`총 ${totalOrders}건`} />
        <StatCard label="이번 달 매출" value={formatKRW(monthRevenue)} sub={`${monthOrders}건`} />
        <StatCard label="이번 달 주문" value={`${monthOrders}건`} sub={`전체 ${totalOrders}건`} />
        <StatCard
          label="VIP 생성 대기"
          value={`${vipGenerating}건`}
          sub={vipGenerating > 0 ? "5분 내 처리됩니다" : "대기 없음"}
          highlight={vipGenerating > 0}
        />
      </div>

      {/* 빠른 메뉴 */}
      <div className="grid grid-cols-3 gap-3 mb-10">
        {[
          { href: "/admin/orders", label: "주문 관리", desc: "전체 결제 · 신청 내역" },
          { href: "/admin/vip", label: "VIP PDF 관리", desc: "생성 대기 · 완료 · 실패" },
          { href: "https://app.tosspayments.com", label: "토스 대시보드 ↗", desc: "환불 · 취소 처리", ext: true },
        ].map((item) => (
          <Link
            key={item.href}
            href={item.href}
            {...(item.ext ? { target: "_blank", rel: "noreferrer" } : {})}
            className="block rounded-lg border border-hairline bg-canvas hover:border-ink/30 transition-colors p-4"
          >
            <p className="text-sm font-medium text-ink mb-0.5">{item.label}</p>
            <p className="text-xs text-mute">{item.desc}</p>
          </Link>
        ))}
      </div>

      {/* 2단 테이블 */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* 최근 주문 */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-ink">최근 주문</h2>
            <Link href="/admin/orders" className="text-xs text-mute hover:text-ink underline underline-offset-2">
              전체 보기 →
            </Link>
          </div>
          <div className="border border-hairline rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-hairline bg-surface-soft/30">
                  {["날짜", "이름", "상품", "금액", "상태"].map((h) => (
                    <th key={h} className="px-3 py-2.5 text-left text-[10px] font-mono uppercase tracking-wider text-mute">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(recentOrders ?? []).length === 0 ? (
                  <tr><td colSpan={5} className="px-3 py-8 text-center text-xs text-mute">주문 없음</td></tr>
                ) : (recentOrders ?? []).map((o) => (
                  <tr key={o.id} className="border-b border-hairline last:border-0 hover:bg-surface-soft/20">
                    <td className="px-3 py-2.5 text-xs text-mute whitespace-nowrap">
                      {new Date(o.created_at).toLocaleDateString("ko-KR", { month: "2-digit", day: "2-digit" })}
                    </td>
                    <td className="px-3 py-2.5 text-xs font-medium text-ink">{rNameMap.get(o.id) ?? "-"}</td>
                    <td className="px-3 py-2.5 text-xs text-body truncate max-w-[80px]">{prodMap.get(o.product_id) ?? "-"}</td>
                    <td className="px-3 py-2.5 text-xs font-mono text-ink whitespace-nowrap">{formatKRW(o.amount)}</td>
                    <td className="px-3 py-2.5"><Badge map={ORDER_STATUS} val={o.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* VIP PDF 현황 */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-ink">VIP PDF 최근 현황</h2>
            <Link href="/admin/vip" className="text-xs text-mute hover:text-ink underline underline-offset-2">
              전체 보기 →
            </Link>
          </div>
          <div className="border border-hairline rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-hairline bg-surface-soft/30">
                  {["날짜", "이름", "이메일", "상태"].map((h) => (
                    <th key={h} className="px-3 py-2.5 text-left text-[10px] font-mono uppercase tracking-wider text-mute">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentVip.length === 0 ? (
                  <tr><td colSpan={4} className="px-3 py-8 text-center text-xs text-mute">VIP 주문 없음</td></tr>
                ) : recentVip.map((r) => {
                  const info = vipInfoMap.get(r.order_id);
                  return (
                    <tr key={r.id} className="border-b border-hairline last:border-0 hover:bg-surface-soft/20">
                      <td className="px-3 py-2.5 text-xs text-mute whitespace-nowrap">
                        {new Date(r.created_at).toLocaleDateString("ko-KR", { month: "2-digit", day: "2-digit" })}
                      </td>
                      <td className="px-3 py-2.5 text-xs font-medium text-ink">{info?.name ?? "-"}</td>
                      <td className="px-3 py-2.5 text-xs text-mute truncate max-w-[90px]">{info?.email ?? "-"}</td>
                      <td className="px-3 py-2.5"><Badge map={GEN_STATUS} val={r.generation_status} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
