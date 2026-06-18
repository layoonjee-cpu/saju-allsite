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

function downloadCouponImage(coupon: Coupon, productName?: string) {
  const SCALE = 2;
  const W = 800, H = 520;

  const canvas = document.createElement("canvas");
  canvas.width = W * SCALE;
  canvas.height = H * SCALE;
  const ctx = canvas.getContext("2d")!;
  ctx.scale(SCALE, SCALE);

  // ── 배경: 샤넬 블랙 그라디언트 ────────────────────────
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, "#111111");
  bg.addColorStop(1, "#1A1A1A");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // ── 상단 골드 라인 ──────────────────────────────────
  ctx.fillStyle = "#C9A96E";
  ctx.fillRect(0, 0, W, 4);

  // ── 브랜드 (우상단) ──────────────────────────────────
  ctx.fillStyle = "#C9A96E";
  ctx.font = "13px serif";
  ctx.textAlign = "right";
  ctx.fillText("視線 시선사주", W - 52, 40);

  // ── VIP Coupon 타이틀 ────────────────────────────────
  ctx.fillStyle = "#C9A96E";
  ctx.font = "bold 52px serif";
  ctx.textAlign = "left";
  ctx.fillText("VIP Coupon", 52, 98);

  // ── 구분선 1 ─────────────────────────────────────────
  ctx.strokeStyle = "rgba(201,169,110,0.4)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(52, 118); ctx.lineTo(W - 52, 118);
  ctx.stroke();

  // ── 인플루언서 이름 (note 있을 때만) ───────────────────
  let codeY = 195;
  if (coupon.note) {
    ctx.fillStyle = "rgba(255,255,255,0.6)";
    ctx.font = "15px sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(`인플루언서 이름 : ${coupon.note}`, 52, 155);
    codeY = 205;
  }

  // ── VIP CODE 레이블 ──────────────────────────────────
  ctx.fillStyle = "#C9A96E";
  ctx.font = "bold 12px sans-serif";
  ctx.textAlign = "left";
  ctx.fillText("V I P   C O D E", 52, coupon.note ? 188 : 165);

  // ── 쿠폰 코드 ────────────────────────────────────────
  ctx.fillStyle = "#FFFFFF";
  ctx.font = "bold 68px monospace";
  ctx.fillText(coupon.code, 48, codeY + 58);

  // ── 구분선 2 ─────────────────────────────────────────
  const divY2 = codeY + 82;
  ctx.strokeStyle = "rgba(201,169,110,0.4)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(52, divY2); ctx.lineTo(W - 52, divY2);
  ctx.stroke();

  // ── 세부 정보 ────────────────────────────────────────
  const expiry = coupon.expires_at
    ? new Date(coupon.expires_at).toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" }) + " 까지"
    : "기간 제한 없음";
  const uses = coupon.uses_left === -1 ? "무제한 사용 가능" : `${coupon.uses_left}회 사용 가능`;
  const product = productName ?? "모든 상품 사용 가능";

  const rows = [
    { label: "사용 기한", value: expiry },
    { label: "사용 횟수", value: uses },
    { label: "사용 상품", value: product },
  ];

  rows.forEach(({ label, value }, i) => {
    const y = divY2 + 36 + i * 38;
    ctx.fillStyle = "rgba(255,255,255,0.45)";
    ctx.font = "13px sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(label, 52, y);
    ctx.fillStyle = "rgba(255,255,255,0.9)";
    ctx.font = "15px sans-serif";
    ctx.fillText(value, 170, y);
  });

  // ── 하단 골드 라인 ──────────────────────────────────
  ctx.fillStyle = "#C9A96E";
  ctx.fillRect(0, H - 4, W, 4);

  // ── JPG 다운로드 ─────────────────────────────────────
  canvas.toBlob(
    (blob) => {
      if (!blob) { toast.error("이미지 생성 실패"); return; }
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `시선사주_VIP_${coupon.code}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    },
    "image/jpeg",
    0.96,
  );
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
                  const productName = c.product_id ? prodMap.get(c.product_id) : undefined;
                  return (
                    <tr key={c.id} className={`border-b border-hairline last:border-0 ${(isExpired || isUsedUp) ? "opacity-50" : ""}`}>
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs font-bold tracking-widest text-ink">{c.code}</span>
                      </td>
                      <td className="px-4 py-3 text-xs text-mute">{c.note ?? "-"}</td>
                      <td className="px-4 py-3 text-xs text-mute">
                        {c.product_id ? (productName ?? "-") : "모든 상품"}
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
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => downloadCouponImage(c, productName)}
                            className="text-[11px] text-[#2D5C5C] font-medium hover:underline whitespace-nowrap"
                            title="VIP 입장코드 이미지 다운로드"
                          >
                            이미지 ↓
                          </button>
                          <button
                            onClick={() => handleDelete(c.id, c.code)}
                            className="text-[11px] text-red-500 hover:underline"
                          >
                            삭제
                          </button>
                        </div>
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
