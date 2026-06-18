"use client";

import { useState } from "react";
import { toast } from "sonner";

type Coupon = {
  id: string;
  code: string;
  uses_left: number;
  expires_at: string | null;
  note: string | null;
  product_id: string | null;
  created_at: string;
};

type Product = { id: string; name: string; slug: string };

function randomCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

export function CouponManager({
  initialCoupons,
  products,
}: {
  initialCoupons: Coupon[];
  products: Product[];
}) {
  const [coupons, setCoupons] = useState<Coupon[]>(initialCoupons);
  const [code, setCode] = useState("");
  const [productId, setProductId] = useState("");
  const [usesLeft, setUsesLeft] = useState("1");
  const [expiresAt, setExpiresAt] = useState("");
  const [note, setNote] = useState("");
  const [creating, setCreating] = useState(false);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const trimCode = code.trim().toUpperCase();
    if (!trimCode) { toast.error("쿠폰 코드를 입력하세요."); return; }

    setCreating(true);
    const res = await fetch("/api/admin/coupons", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code: trimCode,
        product_id: productId || null,
        uses_left: parseInt(usesLeft) || 1,
        expires_at: expiresAt || null,
        note: note || null,
      }),
    });
    const json = await res.json();
    setCreating(false);

    if (!res.ok) { toast.error(json.error ?? "생성 실패"); return; }

    toast.success(`쿠폰 [${trimCode}] 생성 완료`);
    setCoupons([json.coupon, ...coupons]);
    setCode(""); setNote(""); setExpiresAt(""); setProductId(""); setUsesLeft("1");
  }

  async function handleDelete(id: string, c: string) {
    if (!confirm(`쿠폰 [${c}]을 삭제할까요?`)) return;
    const res = await fetch("/api/admin/coupons", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (!res.ok) { toast.error("삭제 실패"); return; }
    toast.success("삭제됨");
    setCoupons(coupons.filter((cp) => cp.id !== id));
  }

  const prodMap = new Map(products.map((p) => [p.id, p.name]));

  return (
    <div className="space-y-8">
      {/* 생성 폼 */}
      <div className="border border-hairline rounded-xl p-6 bg-canvas">
        <h2 className="text-sm font-semibold text-ink mb-4">새 쿠폰 생성</h2>
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs text-mute font-medium">쿠폰 코드 *</label>
              <div className="flex gap-2">
                <input
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="예: SAJU2026FREE"
                  className="flex-1 h-9 px-3 text-sm border border-input rounded-lg font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <button
                  type="button"
                  onClick={() => setCode(randomCode())}
                  className="h-9 px-3 text-xs border border-input rounded-lg hover:bg-surface-soft transition-colors whitespace-nowrap"
                >
                  자동생성
                </button>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-mute font-medium">메모 (인플루언서 이름 등)</label>
              <input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="예: 인플루언서 홍길동"
                className="w-full h-9 px-3 text-sm border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-mute font-medium">사용 가능 횟수 (-1 = 무제한)</label>
              <input
                type="number"
                value={usesLeft}
                onChange={(e) => setUsesLeft(e.target.value)}
                min="-1"
                className="w-full h-9 px-3 text-sm border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-mute font-medium">만료일 (비워두면 영구)</label>
              <input
                type="datetime-local"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                className="w-full h-9 px-3 text-sm border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div className="space-y-1.5 col-span-2">
              <label className="text-xs text-mute font-medium">상품 제한 (비워두면 모든 상품)</label>
              <select
                value={productId}
                onChange={(e) => setProductId(e.target.value)}
                className="w-full h-9 px-3 text-sm border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring bg-background"
              >
                <option value="">모든 상품</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          </div>
          <button
            type="submit"
            disabled={creating}
            className="h-10 px-6 text-sm font-semibold rounded-lg bg-ink text-canvas hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {creating ? "생성 중..." : "쿠폰 생성"}
          </button>
        </form>
      </div>

      {/* 쿠폰 목록 */}
      <div>
        <h2 className="text-sm font-semibold text-ink mb-3">쿠폰 목록 ({coupons.length}개)</h2>
        {coupons.length === 0 ? (
          <p className="text-sm text-mute py-8 text-center">생성된 쿠폰이 없습니다.</p>
        ) : (
          <div className="border border-hairline rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-hairline bg-surface-soft/30">
                  {["코드", "메모", "상품", "남은 횟수", "만료일", ""].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-[10px] font-mono uppercase tracking-wider text-mute whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {coupons.map((c) => {
                  const isExpired = c.expires_at ? new Date(c.expires_at) < new Date() : false;
                  const isUsedUp = c.uses_left !== -1 && c.uses_left <= 0;
                  return (
                    <tr key={c.id} className={`border-b border-hairline last:border-0 ${(isExpired || isUsedUp) ? "opacity-50" : ""}`}>
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs font-bold tracking-widest text-ink">{c.code}</span>
                      </td>
                      <td className="px-4 py-3 text-xs text-mute">{c.note ?? "-"}</td>
                      <td className="px-4 py-3 text-xs text-mute">
                        {c.product_id ? (prodMap.get(c.product_id) ?? "-") : "모든 상품"}
                      </td>
                      <td className="px-4 py-3 text-xs font-mono">
                        {c.uses_left === -1 ? "∞ 무제한" : isUsedUp ? "소진됨" : `${c.uses_left}회`}
                      </td>
                      <td className="px-4 py-3 text-xs text-mute whitespace-nowrap">
                        {c.expires_at
                          ? new Date(c.expires_at).toLocaleDateString("ko-KR")
                          : "영구"}
                        {isExpired && " (만료)"}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleDelete(c.id, c.code)}
                          className="text-[11px] text-red-500 hover:underline"
                        >
                          삭제
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
