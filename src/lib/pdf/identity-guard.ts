import type { createServiceClient } from "@/lib/supabase/server";

/** Fail closed when a report names another known customer in its analysis text. */
export async function assertPdfCustomerIdentity(
  svc: ReturnType<typeof createServiceClient>,
  content: string,
  customerName: string | null | undefined,
  partnerName?: string | null,
): Promise<void> {
  if (!customerName?.trim()) return;
  const allowed = new Set([customerName.trim(), partnerName?.trim()].filter(Boolean));
  const { data, error } = await svc.from("saju_inputs").select("name").limit(1000);
  if (error) throw new Error("고객명 대조에 실패했습니다. PDF 발급을 중단합니다.");
  const others = new Set((data ?? []).map((r) => r.name?.trim()).filter(
    (name): name is string => !!name && name.length >= 2 && !allowed.has(name),
  ));
  for (const name of others) {
    // A shorter customer name must not match inside the actual owner's full name.
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    if (new RegExp(`(^|[^가-힣])${escaped}(님| 씨)`).test(content)) {
      throw new Error("분석 본문에 주문자와 다른 고객명이 있어 PDF 발급을 중단합니다.");
    }
  }
}
