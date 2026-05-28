import Link from "next/link";
import { requireAdminPassword } from "@/lib/admin-auth";
import { createServiceClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import { formatKRW } from "@/lib/utils";
import { SendEmailButton } from "@/components/admin/SendEmailButton";
import { SajuDataButton } from "@/components/admin/SajuDataButton";
import { ExtraAnalysisButton } from "@/components/admin/ExtraAnalysisButton";

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

const GENDER_LABEL: Record<string, string> = { male: "남", female: "여" };
const CALENDAR_LABEL: Record<string, string> = { lunar: "음력", solar: "양력" };

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

  // ── 상품 목록 ────────────────────────────────────────────────
  const { data: products } = await svc
    .from("products")
    .select("id, slug, name")
    .eq("is_active", true)
    .order("display_order");
  const prodMap = new Map((products ?? []).map((p) => [p.id, p]));

  // ── 주문 조회 ────────────────────────────────────────────────
  let query = svc
    .from("orders")
    .select("id, order_id, amount, status, created_at, guest_email, user_id, product_id")
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
  const orderIds = (orders ?? []).map((o) => o.id);

  // ── saju_inputs 조인 (이름 + 생년월일 + 성별 + 음양력) ──────
  const [{ data: inputs }, { data: results }] = await Promise.all([
    orderIds.length
      ? svc
          .from("saju_inputs")
          .select("order_id, name, birth_date, birth_time, gender, calendar, time_unknown")
          .in("order_id", orderIds)
      : { data: [] },
    orderIds.length
      ? svc
          .from("saju_results")
          .select("id, order_id, generation_status, pdf_url")
          .in("order_id", orderIds)
      : { data: [] },
  ]);

  const inputMap = new Map((inputs ?? []).map((i) => [i.order_id, i]));
  const resultMap = new Map((results ?? []).map((r) => [r.order_id, r]));

  // ── 회원 이메일 조회 ─────────────────────────────────────────
  const userIds = [
    ...new Set(
      (orders ?? []).filter((o) => o.user_id).map((o) => o.user_id as string)
    ),
  ];
  const emailMap = new Map<string, string>();
  if (userIds.length > 0) {
    try {
      const { data: { users } } = await svc.auth.admin.listUsers({ perPage: 1000 });
      users.forEach((u) => { if (u.email) emailMap.set(u.id, u.email); });
    } catch { /* ignore */ }
  }

  // ── 매출 요약 ────────────────────────────────────────────────
  const paidList = (orders ?? []).filter((o) => o.status === "paid");
  const totalRevenue = paidList.reduce((s, o) => s + (o.amount ?? 0), 0);

  return (
    <div className="container py-10 max-w-6xl">
      {/* 헤더 */}
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin" className="text-xs text-mute hover:text-ink underline underline-offset-2">
          ← 대시보드
        </Link>
        <span className="text-mute text-xs">/</span>
        <p className="text-xs font-mono text-mute">ADMIN / 주문 관리</p>
      </div>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-ink">주문 관리</h1>
          <p className="text-xs text-mute mt-1">분석 요청을 관리합니다</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-mute">조회된 결제 합계</p>
          <p className="text-xl font-mono font-semibold text-ink">{formatKRW(totalRevenue)}</p>
          <p className="text-xs text-mute">{paidList.length}건 결제완료</p>
        </div>
      </div>

      {/* 필터 탭 */}
      <div className="flex flex-wrap gap-2 mb-4">
        {[
          { key: "", label: `전체 (${(orders ?? []).length})` },
          { key: "paid", label: `결제완료 (${(orders ?? []).filter((o) => o.status === "paid").length})` },
          { key: "pending", label: `대기 (${(orders ?? []).filter((o) => o.status === "pending").length})` },
          { key: "failed", label: `실패 (${(orders ?? []).filter((o) => o.status === "failed").length})` },
        ].map((f) => {
          const href = [f.key ? `status=${f.key}` : "", productFilter ? `product=${productFilter}` : ""]
            .filter(Boolean).join("&");
          const active = (status ?? "") === f.key;
          return (
            <Link
              key={f.key || "all"}
              href={href ? `/admin/orders?${href}` : "/admin/orders"}
              className={`px-3 h-8 inline-flex items-center rounded-full text-xs border font-medium transition-colors ${
                active ? "bg-ink text-canvas border-ink" : "border-hairline text-body hover:border-ink"
              }`}
            >
              {f.label}
            </Link>
          );
        })}
        <span className="text-mute text-xs self-center mx-1">|</span>
        {[{ slug: "", name: "모든 상품" }, ...(products ?? [])].map((p) => {
          const slug = (p as { slug: string; name: string }).slug;
          const href = [status ? `status=${status}` : "", slug ? `product=${slug}` : ""]
            .filter(Boolean).join("&");
          const active = (productFilter ?? "") === slug;
          return (
            <Link
              key={slug || "all"}
              href={href ? `/admin/orders?${href}` : "/admin/orders"}
              className={`px-3 h-8 inline-flex items-center rounded-full text-xs border transition-colors ${
                active ? "bg-ink text-canvas border-ink" : "border-hairline text-body hover:border-ink"
              }`}
            >
              {p.name}
            </Link>
          );
        })}
      </div>

      <p className="text-[11px] font-mono text-mute mb-3">{(orders ?? []).length} ROWS</p>

      {/* 테이블 */}
      <div className="border border-hairline rounded-lg overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-hairline bg-surface-soft/30">
              {["생성일", "고객명", "생년월일", "상품", "상태", "액션"].map((h) => (
                <th
                  key={h}
                  className="px-4 py-3 text-left text-[10px] font-mono uppercase tracking-wider text-mute whitespace-nowrap"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(orders ?? []).length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-16 text-center text-sm text-mute">
                  조건에 맞는 주문이 없습니다.
                </td>
              </tr>
            ) : (
              (orders ?? []).map((o) => {
                const email = o.guest_email ?? (o.user_id ? emailMap.get(o.user_id) ?? "" : "");
                const inp = inputMap.get(o.id);
                const result = resultMap.get(o.id);
                const prod = prodMap.get(o.product_id);

                // 시간 포맷 (PostgreSQL TIME → "HH:MM")
                const birthTime = inp?.birth_time
                  ? (() => {
                      const parts = (inp.birth_time as string).split(":");
                      return `${parseInt(parts[0], 10)}:${parts[1]}`;
                    })()
                  : "";
                const timeDisplay = inp?.time_unknown ? "시 미상" : birthTime;
                const genderLabel = GENDER_LABEL[inp?.gender ?? ""] ?? "";
                const calLabel = CALENDAR_LABEL[inp?.calendar ?? ""] ?? "";

                return (
                  <tr key={o.id} className="border-b border-hairline last:border-0 hover:bg-surface-soft/20">
                    {/* 생성일 */}
                    <td className="px-4 py-3 text-xs text-mute whitespace-nowrap align-top">
                      {new Date(o.created_at).toLocaleDateString("ko-KR", {
                        year: "numeric",
                        month: "numeric",
                        day: "numeric",
                      })}
                    </td>

                    {/* 고객명 + 성별·음양력 + 이메일 */}
                    <td className="px-4 py-3 align-top">
                      <p className="text-xs font-semibold text-ink">{inp?.name ?? "-"}</p>
                      <p className="text-[11px] text-mute mt-0.5">
                        {[genderLabel, calLabel].filter(Boolean).join(" · ")}
                      </p>
                      {email && (
                        <p className="text-[11px] text-mute truncate max-w-[160px]" title={email}>
                          {email}
                        </p>
                      )}
                    </td>

                    {/* 생년월일 + 시간 */}
                    <td className="px-4 py-3 whitespace-nowrap align-top">
                      <p className="text-xs text-ink">{inp?.birth_date ?? "-"}</p>
                      <p className="text-[11px] text-mute mt-0.5">{timeDisplay}</p>
                    </td>

                    {/* 상품 + 금액 */}
                    <td className="px-4 py-3 align-top">
                      <p className="text-xs text-ink">{prod?.name ?? "-"}</p>
                      <p className="text-[11px] font-mono text-mute mt-0.5">{formatKRW(o.amount)}</p>
                    </td>

                    {/* 결제상태 + 분석상태 */}
                    <td className="px-4 py-3 whitespace-nowrap align-top">
                      <div className="flex flex-col gap-1">
                        <SBadge map={ORDER_STATUS} val={o.status} />
                        {result && <SBadge map={GEN_STATUS} val={result.generation_status} />}
                      </div>
                    </td>

                    {/* 액션 */}
                    <td className="px-4 py-3 align-top">
                      <div className="flex items-center gap-3 whitespace-nowrap flex-wrap">
                        {result ? (
                          <Link
                            href={`/results/${result.id}`}
                            className="text-[11px] text-[#2D5C5C] hover:underline font-medium"
                          >
                            🔍 분석지
                          </Link>
                        ) : (
                          <span className="text-[11px] text-mute">분석지 없음</span>
                        )}
                        <SajuDataButton
                          orderId={o.id}
                          name={inp?.name ?? null}
                          birthDate={inp?.birth_date ?? null}
                        />
                        {result && result.generation_status === "complete" && (
                          <>
                            <SendEmailButton
                              resultId={result.id}
                              name={inp?.name ?? "고객"}
                              hasEmail={!!email}
                            />
                            <ExtraAnalysisButton
                              resultId={result.id}
                              name={inp?.name ?? "고객"}
                              hasEmail={!!email}
                            />
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
