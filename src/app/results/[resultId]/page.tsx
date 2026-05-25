import { notFound } from "next/navigation";
import { createServiceClient } from "@/lib/supabase/server";
import { MyeongsikTable } from "@/components/saju/MyeongsikTable";
import { ResultBody } from "@/components/saju/ResultBody";
import type { Myeongsik } from "@/lib/saju/manseryeok";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "결과지" };

export default async function ResultPage({
  params,
}: {
  params: Promise<{ resultId: string }>;
}) {
  const { resultId } = await params;
  const service = createServiceClient();

  const { data: result } = await service
    .from("saju_results")
    .select("id, myeongsik, interpretation_md, llm_provider, llm_model, created_at, order_id")
    .eq("id", resultId)
    .maybeSingle();

  if (!result) notFound();

  const { data: order } = await service
    .from("orders")
    .select("product_id, paid_at")
    .eq("id", result.order_id)
    .single();
  const { data: product } = order
    ? await service.from("products").select("name, slug").eq("id", order.product_id).single()
    : { data: null };

  const isDreamReading = product?.slug === "dream-reading";

  const myeongsik = result.myeongsik as unknown as Myeongsik;

  return (
    <div className="container py-12 max-w-2xl">
      <header className="mb-10">
        <p className="text-xs font-mono text-mute mb-2">RESULT</p>
        <h1 className="text-3xl font-semibold tracking-tight">{product?.name ?? "사주 풀이"}</h1>
        <p className="mt-2 text-xs text-muted-foreground">{formatDate(result.created_at)}</p>
      </header>

      {!isDreamReading && (
        <section className="mb-12">
          <h2 className="text-sm font-semibold mb-3 text-ink">사주 명식</h2>
          <MyeongsikTable myeongsik={myeongsik} />
        </section>
      )}

      <article>
        <ResultBody markdown={result.interpretation_md} />
      </article>
    </div>
  );
}
