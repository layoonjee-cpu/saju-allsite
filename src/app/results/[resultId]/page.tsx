import Link from "next/link";
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
import { SipsinChart } from "@/components/saju/SipsinChart";
import { LoveOhaengChart } from "@/components/saju/LoveOhaengChart";
import { TodayFortuneCard, type TodayFortuneData } from "@/components/saju/TodayFortuneCard";
import { IljuStickerCard, type IljuStickerData } from "@/components/saju/IljuStickerCard";
import { ExtraQuestionSection } from "@/components/saju/ExtraQuestionSection";
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
    .select("id, myeongsik, interpretation_md, llm_provider, llm_model, created_at, order_id, generation_status, pdf_url, email_sent_at, raw_saju_json, extra_question, extra_question_answer")
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

  // saju_inputs — 이름·파트너 이름 조회 (궁합 타이틀용)
  const { data: sajuInput } = await service
    .from("saju_inputs")
    .select("name, partner_name")
    .eq("order_id", result.order_id)
    .maybeSingle();

  // 후기 작성 여부 (추가 질문 잠금 해제 조건)
  const { data: existingReview } = await service
    .from("reviews")
    .select("id")
    .eq("order_id", result.order_id)
    .maybeSingle();
  const hasReview = !!existingReview;

  const isDreamReading = product?.slug === "dream-reading";
  const isPremiumVip = product?.slug === "premium-saju";
  const isLoveSaju = product?.slug === "love-saju";
  const isTodayFortune = product?.slug === "today-fortune";
  const isIljuSticker = product?.slug === "ilju-sticker";
  const isBasicSaju = product?.slug === "basic-saju";
  const isGenerating = result.generation_status === "generating";
  const hasPdf = !!result.pdf_url;
  const isFree = (order?.amount ?? 0) === 0;
  // 추가 질문 기능: 결제금액 1900원 이상 상품에 한해 표시
  const showExtraQuestion = (order?.amount ?? 0) >= 1900 && !isTodayFortune && !isIljuSticker;

  // 불량 콘텐츠 감지 (LLM 거부 응답 / 너무 짧은 텍스트)
  const isBadContent = (() => {
    if (!isPremiumVip || result.generation_status !== "complete") return false;
    const md = result.interpretation_md ?? "";
    const lower = md.toLowerCase();
    return (
      md.length < 200 ||
      lower.includes("i'm sorry") ||
      lower.includes("i cannot") ||
      lower.includes("i can't assist") ||
      lower.includes("죄송합니다만")
    );
  })();

  // 배너 표시 조건: 생성중이거나 불량 콘텐츠 감지됨
  const showBanner = isPremiumVip && (isGenerating || isBadContent);

  const myeongsik = result.myeongsik as unknown as Myeongsik;
  const showChart = !isDreamReading && !isIljuSticker && !isFree && !showBanner;

  // 오늘의 운세 — JSON 파싱 시도 (성공 시 TodayFortuneCard 사용)
  let todayFortuneData: TodayFortuneData | null = null;
  if (isTodayFortune && result.interpretation_md) {
    try {
      const md = result.interpretation_md.trim()
        .replace(/^```json\n?/, "")
        .replace(/\n?```$/, "");
      todayFortuneData = JSON.parse(md) as TodayFortuneData;
    } catch {
      // JSON 파싱 실패 → fallback: ResultBody로 표시
    }
  }

  // 일주스티커 — JSON 파싱 시도 (성공 시 IljuStickerCard 사용)
  let iljuStickerData: IljuStickerData | null = null;
  if (isIljuSticker && result.interpretation_md) {
    try {
      const md = result.interpretation_md.trim()
        .replace(/^```json\n?/, "")
        .replace(/\n?```$/, "");
      iljuStickerData = JSON.parse(md) as IljuStickerData;
    } catch {
      // JSON 파싱 실패 → fallback: ResultBody로 표시
    }
  }

  // 궁합 오행 비교 차트용 — raw_saju_json에 _partner_myeongsik 이 저장된 경우 추출
  const partnerMyeongsikRaw = (() => {
    if (!isLoveSaju || !result.raw_saju_json) return null;
    const raw = result.raw_saju_json as Record<string, unknown>;
    return (raw._partner_myeongsik as Myeongsik | undefined) ?? null;
  })();

  return (
    <div className="container py-12 max-w-2xl">
      <header className="mb-10">
        <p className="text-xs font-mono text-mute mb-2">RESULT</p>
        {isLoveSaju && sajuInput?.name && sajuInput?.partner_name ? (
          <>
            <h1 className="text-3xl font-semibold tracking-tight">
              {sajuInput.name}님과 {sajuInput.partner_name}님의 궁합 분석
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">{product?.name}</p>
          </>
        ) : (
          <h1 className="text-3xl font-semibold tracking-tight">{product?.name ?? "사주 풀이"}</h1>
        )}
        <p className="mt-2 text-xs text-muted-foreground">{formatDate(result.created_at)}</p>
      </header>

      {/* VIP 생성 중 배너 (생성중 OR 불량 콘텐츠 감지) */}
      {showBanner && (
        <VipGeneratingBanner resultId={resultId} />
      )}

      {/* VIP PDF 다운로드 버튼 */}
      {isPremiumVip && hasPdf && (
        <VipDownloadButton resultId={resultId} />
      )}

      {/* 사주 명식표 (꿈해몽·일주스티커·VIP 생성중·불량 콘텐츠 제외) */}
      {!isDreamReading && !isIljuSticker && !showBanner && (
        <section className="mb-6">
          <h2 className="text-sm font-semibold mb-3 text-ink">사주 명식</h2>
          {/* 궁합: 두 사람 명식 나란히 */}
          {isLoveSaju && partnerMyeongsikRaw ? (
            <div className="space-y-4">
              <div>
                <p className="text-xs text-muted-foreground mb-2 font-medium">{sajuInput?.name ?? "나"}</p>
                <MyeongsikTable myeongsik={myeongsik} rawJson={result.raw_saju_json ?? undefined} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-2 font-medium">{sajuInput?.partner_name ?? "상대방"}</p>
                <MyeongsikTable myeongsik={partnerMyeongsikRaw} />
              </div>
            </div>
          ) : (
            <MyeongsikTable myeongsik={myeongsik} rawJson={result.raw_saju_json ?? undefined} />
          )}
        </section>
      )}

      {/* 궁합 오행 분포 비교 차트 — love-saju + 파트너 명식이 저장된 경우만 */}
      {isLoveSaju && partnerMyeongsikRaw && !showBanner && (
        <section className="mb-8">
          <h2 className="text-sm font-semibold mb-3 text-ink">오행 분포 비교</h2>
          <LoveOhaengChart
            mainMyeongsik={myeongsik}
            partnerMyeongsik={partnerMyeongsikRaw}
            nameA={sajuInput?.name ?? "나"}
            nameB={sajuInput?.partner_name ?? "상대방"}
          />
        </section>
      )}

      {/* 오행 분포 차트 (꿈해몽·무료·VIP생성중 제외, 궁합은 위 비교차트로 대체) */}
      {showChart && !isLoveSaju && (
        <section className="mb-10">
          <OhaengChart myeongsik={myeongsik} />
        </section>
      )}

      {/* VIP 전용 시각화 (신강신약 게이지 + 격국 배지) — 불량 콘텐츠일 때는 숨김 */}
      {isPremiumVip && !showBanner && result.raw_saju_json && (
        <VipVisuals rawJson={result.raw_saju_json} />
      )}

      {/* 십신(十神) 분포 차트 — VIP + raw_saju_json 있을 때만 */}
      {isPremiumVip && !showBanner && result.raw_saju_json && (
        <section className="mb-6">
          <SipsinChart rawJson={result.raw_saju_json} />
        </section>
      )}

      {/* 일주스티커: 구조화 카드 (JSON 파싱 성공 시) */}
      {isIljuSticker && iljuStickerData ? (
        <IljuStickerCard data={iljuStickerData} />
      ) : /* 오늘의 운세: 구조화 카드 (JSON 파싱 성공 시) */
      isTodayFortune && todayFortuneData ? (
        <TodayFortuneCard data={todayFortuneData} />
      ) : (
        /* 마크다운 결과 (배너 표시 중이거나 불량 콘텐츠면 숨김) */
        !showBanner && !isBadContent && result.interpretation_md && (
          <article>
            <ResultBody markdown={result.interpretation_md} />
          </article>
        )
      )}

      {/* ── 기본사주 → 깊은시선 VIP 업셀 배너 ── */}
      {isBasicSaju && !showBanner && (
        <section className="mt-10 rounded-2xl overflow-hidden shadow-xl">
          {/* 헤더 */}
          <div className="bg-[#1a3a38] px-6 pt-7 pb-5 text-center">
            <p className="text-[10px] font-bold tracking-[0.2em] text-teal-300/60 mb-2">UPGRADE · 깊은 시선 VIP</p>
            <h2 className="text-white text-[22px] font-black leading-snug">
              아직 사주의{" "}
              <span className="text-amber-400">10%</span>
              밖에 못 보셨어요
            </h2>
            <p className="mt-2 text-teal-200/70 text-[13px]">
              아래 <span className="text-white font-bold">27가지 분석</span> 중 오늘 확인하신 건 극히 일부입니다
            </p>
          </div>

          {/* 심층 분석 14개 */}
          <div className="bg-[#1a3a38] px-5 pb-1">
            <p className="text-[10px] font-bold tracking-widest text-teal-400/70 mb-2 pl-1">— 심층 분석 · 14개 섹션</p>
            <div className="space-y-1.5">
              {[
                ["01", "프롤로그 · 사주팔자 원국 구조"],
                ["02", "일간의 본질 · 신강신약 분석"],
                ["03", "음양오행 · 십성(十星) 분포"],
                ["04", "격국(格局) · 용신(用神) 분석"],
                ["05", "어린 시절 · 성장 환경 · 타고난 성품"],
                ["06", "직업 적성 · 재능과 추천 직업군"],
                ["07", "직장운 · 사업운 · 성공 전략"],
                ["08", "재물 그릇 · 타고난 경제 에너지"],
                ["09", "재물운 흐름 · 시기별 전략"],
                ["10", "연애 성향 · 감정 패턴"],
                ["11", "이상형 · 배우자운 · 결혼 시기"],
                ["12", "건강운 · 체질과 주의 부위"],
                ["13", "귀인운 · 인간관계 패턴"],
                ["14", "대운(大運) 흐름 · 황금기와 저점"],
              ].map(([num, label]) => (
                <div key={num} className="flex items-center gap-2.5 bg-white/5 rounded-lg px-3 py-2">
                  <span className="text-[10px] font-black text-teal-500 w-5 shrink-0 text-center">{num}</span>
                  <span className="text-teal-100 text-[12px] leading-snug">{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 월별 운세 12개 */}
          <div className="bg-[#1a3a38] px-5 pt-4 pb-1">
            <p className="text-[10px] font-bold tracking-widest text-teal-400/70 mb-2 pl-1">— 월별 운세 · 12개월</p>
            <div className="bg-white/5 rounded-lg px-4 py-3 flex items-center gap-3">
              <span className="text-teal-400 text-lg">📅</span>
              <span className="text-teal-100 text-[12px] leading-snug">현재월부터 12개월 각각 심층 분석 <span className="text-teal-400">(섹션 15~26)</span></span>
            </div>
          </div>

          {/* 마무리 */}
          <div className="bg-[#1a3a38] px-5 pt-4 pb-5">
            <p className="text-[10px] font-bold tracking-widest text-teal-400/70 mb-2 pl-1">— 마무리 · 1개 섹션</p>
            <div className="bg-white/5 rounded-lg px-4 py-3 flex items-center gap-3">
              <span className="text-amber-400 text-lg">✨</span>
              <span className="text-teal-100 text-[12px] leading-snug">합충형해파 · 개운법 · 종합 결론 <span className="text-teal-400">(섹션 27)</span></span>
            </div>
          </div>

          {/* 훅 메시지 + 가격 + CTA */}
          <div className="bg-[#0f2625] px-5 pt-5 pb-6 text-center">
            <p className="text-teal-200 text-[13px] leading-relaxed mb-4 font-medium">
              총 27가지 분석을 통해<br />
              <span className="text-white font-bold">두 번 다시 사주를 안 보셔도 될</span><br />
              프리미엄 분석입니다
            </p>
            <div className="flex items-baseline justify-center gap-2 mb-1">
              <span className="text-white/35 text-sm line-through font-mono">60,000원</span>
              <span className="text-white text-[30px] font-black leading-none font-mono">30,000원</span>
            </div>
            <p className="text-amber-400 text-[12px] font-bold mb-4">50% 특가</p>
            <Link
              href="/products/premium-saju"
              className="flex items-center justify-center w-full py-3.5 rounded-2xl text-[15px] font-bold text-[#0f2625] bg-amber-400 hover:bg-amber-300 active:scale-[0.98] transition-all"
            >
              나머지 90% 전체 확인하기 →
            </Link>
          </div>
        </section>
      )}

      {/* 분析 결과 저장 버튼 (유료 상품만, 배너 숨김 상태에서만) */}
      {!isFree && !showBanner && (
        <ResultShareButtons
          resultId={resultId}
          productName={product?.name ?? "사주 분析"}
        />
      )}

      {/* 추가 질문 섹션 (1900원 이상 결제 상품, 배너·오류 상태 제외) */}
      {showExtraQuestion && !showBanner && (
        <ExtraQuestionSection
          resultId={resultId}
          hasReview={hasReview}
          reviewUrl={`/mypage/orders/${result.order_id}/review?next=/results/${resultId}`}
          existingQuestion={result.extra_question ?? null}
          existingAnswer={result.extra_question_answer ?? null}
        />
      )}
    </div>
  );
}
