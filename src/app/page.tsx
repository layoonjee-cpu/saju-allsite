import { HeroBanner } from "@/components/landing/HeroBanner";
import { ProductLineup } from "@/components/landing/ProductLineup";
import { CTA } from "@/components/landing/CTA";

export default function HomePage() {
  return (
    <>
      <HeroBanner />
      <ProductLineup />
      <CTA />
    </>
  );
}
