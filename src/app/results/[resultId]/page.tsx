import { notFound } from "next/navigation";
import { createServiceClient } from "@/lib/supabase/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { MyeongsikTable } from "@/components/saju/MyeongsikTable";
import { OhaengChart } from "@/components/saju/OhaengChart";
import { VipVisuals } from "@/components/saju/VipVisuals";
import { ResultBody } from "@/components/saju/ResultBody";
import { ResultShareButtons } from "@/components/saju/ResultShareButtons";
import { VipGeneratingBanner } from "@/components/saju/VipGeneratingBanner";
import { VipDownloadButton } from "@/components/saju/VipDownloadButton";
import type { Myeongsik } from "@/lib/saju/manseryeok";
import { formatDate } from "@/lib/utils";

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
    .select("id, myeongsik, interpretation_md, llm_provider, llm_model, created_at, order_id, generation_status, pdf_url, email_sent_at, raw_saju_json")
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
    .select("product_id, paid_at, amount")
    .eq("id", result.order_id)
    .single();
  const { data: product } = order
    ? await service.from("products").select("name, slug").eq("id", order.product_id).single()
    : { data: null };

  const isDreamReading = product?.slug === "dream-reading";
  const isPremiumVip = product?.slug === "premium-saju";
  const isGenerating = result.generation_status === "generating";
  const hasPdf = !!result.pdf_url;
  const isFree = (order?.amount ?? 0) === 0;

  const myeongsik = result.myeongsik as unknown as Myeongsik;
  const showChart = !isDreamReading && !isFree && !(isPremiumVip && isGenerating);

  return (
    <div className="container py-12 max-w-2xl">
      <header className="mb-10">
        <p className="text-xs font-mono text-mute mb-2">RESULT</p>
        <h1 className="text-3xl font-semibold tracking-tight">{product?.name ?? "사주 풀이"}</h1>
        <p className="mt-2 text-xs text-muted-foreground">{formatDate(result.created_at)}</p>
      </header>

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
        <section className="mb-6">
          <h2 className="text-sm font-semibold mb-3 text-ink">사주 명식</h2>
          <MyeongsikTable myeongsik={myeongsik} />
        </section>
      )}

      {/* 오행 분포 차트 (꿈해몽·무료·VIP생성중 제외) */}
      {showChart && (
        <section className="mb-10">
          <OhaengChart myeongsik={myeongsik} />
        </section>
      )}

      {/* VIP 전용 시각화 (신강신약 게이지 + 격국 배지) */}
      {isPremiumVip && !isGenerating && result.raw_saju_json && (
        <VipVisuals rawJson={result.raw_saju_json} />
      )}

      {/* 마크다운 결과 (VIP 생성중이면 숨김) */}
      {!isGenerating && result.interpretation_md && (
        <article>
          <ResultBody markdown={result.interpretation_md} />
        </article>
      )}

      {/* 분석 결과 저장 버튼 (유료 상품만, VIP 생성중 제외) */}
      {!isFree && !isGenerating && (
        <ResultShareButtons
          resultId={resultId}
          productName={product?.name ?? "사주 분석"}
        />
      )}
    </div>
  );
}
