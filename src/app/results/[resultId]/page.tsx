import { notFound } from "next/navigation";
import Link from "next/link";
import { createServiceClient } from "@/lib/supabase/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { MyeongsikTable } from "@/components/saju/MyeongsikTable";
import { ResultBody } from "@/components/saju/ResultBody";
import { VipGeneratingBanner } from "@/components/saju/VipGeneratingBanner";
import { VipDownloadButton } from "@/components/saju/VipDownloadButton";
import type { Myeongsik } from "@/lib/saju/manseryeok";
import { formatDate } from "@/lib/utils";
import { siteConfig } from "@/config/site";

export const metadata = { title: "결과지" };

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

export default async function ResultPage({
  params,
}: {
  params: Promise<{ resultId: string }>;
}) {
  const { resultId } = await params;
  const service = createServiceClient();

  const { data: result } = await service
    .from("saju_results")
    .select("id, myeongsik, interpretation_md, llm_provider, llm_model, created_at, order_id, generation_status, pdf_url, email_sent_at")
    .eq("id", resultId)
    .maybeSingle();

  if (!result) notFound();

  // ─── 7일 열람 만료 체크 ──────────────────────────────────
  const isAdmin = await isAdminAuthenticated();
  const emailSentAt = result.email_sent_at ? new Date(result.email_sent_at).getTime() : null;
  const isExpired = !isAdmin && emailSentAt !== null && Date.now() - emailSentAt > SEVEN_DAYS_MS;

  if (isExpired) {
    return (
      <div className="container py-24 max-w-md text-center">
        <p className="text-5xl mb-6">⏰</p>
        <h1 className="text-xl font-semibold text-ink">열람 기간이 만료되었습니다</h1>
        <p className="text-sm text-mute mt-3 leading-relaxed">
          분석지 열람 기간(이메일 발송 후 7일)이 지났습니다.<br />
          추가 문의는 운영자에게 연락해 주세요.
        </p>
      </div>
    );
  }

  const { data: order } = await service
    .from("orders")
    .select("product_id, paid_at")
    .eq("id", result.order_id)
    .single();
  const { data: product } = order
    ? await service.from("products").select("name, slug").eq("id", order.product_id).single()
    : { data: null };

  // ─── 수령 방법 조회 ──────────────────────────────────────
  const { data: inputRow } = await service
    .from("saju_inputs")
    .select("delivery_method")
    .eq("order_id", result.order_id)
    .maybeSingle();

  const deliveryMethod = (inputRow as { delivery_method?: string } | null)?.delivery_method ?? "web";
  const isKakaoDelivery = deliveryMethod === "kakao";
  const isEmailDelivery = deliveryMethod === "email";

  const isDreamReading = product?.slug === "dream-reading";
  const isPremiumVip = product?.slug === "premium-saju";
  const isGenerating = result.generation_status === "generating";
  const hasPdf = !!result.pdf_url;

  const myeongsik = result.myeongsik as unknown as Myeongsik;

  return (
    <div className="container py-12 max-w-2xl">
      <header className="mb-10">
        <p className="text-xs font-mono text-mute mb-2">RESULT</p>
        <h1 className="text-3xl font-semibold tracking-tight">{product?.name ?? "사주 풀이"}</h1>
        <p className="mt-2 text-xs text-muted-foreground">{formatDate(result.created_at)}</p>
      </header>

      {/* ── 카톡 수령 배너 ── */}
      {isKakaoDelivery && !isGenerating && (
        <div className="mb-8 rounded-2xl bg-[#FEE500] p-5">
          <div className="flex items-start gap-3">
            <span className="text-2xl leading-none">💬</span>
            <div className="flex-1">
              <p className="font-bold text-[#1a1730] text-sm mb-1">카카오채널로 분석지를 받아보세요</p>
              <p className="text-xs text-[#3a3a3a] leading-relaxed mb-3">
                아래 버튼을 눌러 채널을 추가하신 후, <strong>이름과 신청 상품명</strong>을 보내주시면
                분석지를 카카오톡으로 보내드립니다.
              </p>
              <Link
                href={siteConfig.kakaoChannelUrl || "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-[#1a1730] text-[#FEE500] text-sm font-bold px-4 py-2.5 rounded-xl hover:opacity-90 transition-opacity"
              >
                <span>💬</span> 카카오채널 추가하기
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ── 이메일 발송 완료 배너 ── */}
      {isEmailDelivery && result.email_sent_at && (
        <div className="mb-8 rounded-2xl bg-[#f0f9f6] border border-[#2D5C5C]/25 p-4 flex items-start gap-3">
          <span className="text-xl leading-none">📧</span>
          <div>
            <p className="font-bold text-[#2D5C5C] text-sm mb-0.5">분석지를 이메일로 발송했습니다</p>
            <p className="text-xs text-[#4a4a6a]">
              메일함을 확인해 주세요. 스팸함에 있을 수 있습니다.
            </p>
          </div>
        </div>
      )}

      {/* VIP 생성 중 배너 */}
      {isPremiumVip && isGenerating && (
        <VipGeneratingBanner resultId={resultId} />
      )}

      {/* VIP PDF 다운로드 버튼 */}
      {isPremiumVip && hasPdf && (
        <VipDownloadButton resultId={resultId} />
      )}

      {/* 사주 명식표 (꿈해몽·VIP 생성중 제외) */}
      {!isDreamReading && !(isPremiumVip && isGenerating) && (
        <section className="mb-12">
          <h2 className="text-sm font-semibold mb-3 text-ink">사주 명식</h2>
          <MyeongsikTable myeongsik={myeongsik} />
        </section>
      )}

      {/* 마크다운 결과 (VIP 생성중이면 숨김) */}
      {!isGenerating && result.interpretation_md && (
        <article>
          <ResultBody markdown={result.interpretation_md} />
        </article>
      )}
    </div>
  );
}
