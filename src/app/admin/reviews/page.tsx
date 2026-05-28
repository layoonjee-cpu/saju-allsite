import { requireAdminPassword } from "@/lib/admin-auth";
import { createServiceClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils";
import { ReviewActionButtons } from "@/components/admin/ReviewActionButtons";

export const metadata = { title: "후기 관리 | 시선 어드민" };
export const dynamic = "force-dynamic";

function Stars({ value }: { value: number }) {
  return (
    <span aria-label={`${value}점`}>
      <span className="text-amber-500">{"★".repeat(value)}</span>
      <span className="text-gray-300">{"★".repeat(5 - value)}</span>
    </span>
  );
}

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  pending:  { label: "검토중",  cls: "bg-amber-100 text-amber-800 border-amber-300" },
  approved: { label: "게시됨",  cls: "bg-green-100 text-green-800 border-green-300" },
  rejected: { label: "거절됨",  cls: "bg-red-100 text-red-800 border-red-300" },
};

export default async function AdminReviewsPage() {
  await requireAdminPassword("/admin/reviews");
  const svc = createServiceClient();

  // 전체 후기 (pending 먼저 정렬)
  const { data: reviews } = await svc
    .from("reviews")
    .select("id, rating, content, status, created_at, product_id, user_id")
    .order("status", { ascending: true })   // pending < approved < rejected 알파벳 순 — pending 우선
    .order("created_at", { ascending: false });

  const productIds = [...new Set((reviews ?? []).map((r) => r.product_id))];
  const { data: products } = productIds.length
    ? await svc.from("products").select("id, name").in("id", productIds)
    : { data: [] };
  const productMap = new Map((products ?? []).map((p) => [p.id, p.name]));

  const pendingCount = (reviews ?? []).filter((r) => r.status === "pending").length;

  return (
    <div className="container py-10 max-w-4xl">
      <div className="flex items-center gap-3 mb-6">
        <a href="/admin" className="text-xs text-mute hover:text-ink underline underline-offset-2">← 대시보드</a>
        <span className="text-mute text-xs">/</span>
        <p className="text-xs font-mono text-mute">ADMIN / 후기 관리</p>
      </div>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-ink">후기 관리</h1>
          <p className="text-xs text-mute mt-1">작성된 후기를 검토하고 게시 여부를 결정합니다</p>
        </div>
        {pendingCount > 0 && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 border border-amber-300">
            검토 필요 {pendingCount}건
          </span>
        )}
      </div>

      <p className="text-[11px] font-mono text-mute mb-3">{(reviews ?? []).length} ROWS</p>

      <div className="border border-hairline rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-hairline bg-surface-soft/30">
              {["작성일", "상품", "별점", "내용", "상태", "액션"].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-[10px] font-mono uppercase tracking-wider text-mute whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(reviews ?? []).length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-16 text-center text-sm text-mute">
                  작성된 후기가 없습니다.
                </td>
              </tr>
            ) : (
              (reviews ?? []).map((r) => {
                const s = STATUS_MAP[r.status] ?? STATUS_MAP.pending;
                return (
                  <tr key={r.id} className="border-b border-hairline last:border-0 hover:bg-surface-soft/20">
                    <td className="px-4 py-3 text-xs text-mute whitespace-nowrap align-top">
                      {formatDate(r.created_at)}
                    </td>
                    <td className="px-4 py-3 text-xs text-ink align-top whitespace-nowrap">
                      {productMap.get(r.product_id) ?? "-"}
                    </td>
                    <td className="px-4 py-3 align-top whitespace-nowrap">
                      <Stars value={r.rating} />
                    </td>
                    <td className="px-4 py-3 text-xs text-charcoal align-top max-w-[280px]">
                      <p className="line-clamp-3 leading-relaxed">{r.content}</p>
                    </td>
                    <td className="px-4 py-3 align-top whitespace-nowrap">
                      <span className={`inline-block px-2 py-0.5 rounded border text-[10px] font-medium ${s.cls}`}>
                        {s.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 align-top whitespace-nowrap">
                      <ReviewActionButtons reviewId={r.id} currentStatus={r.status} />
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
