import Link from "next/link";

type BannerProduct = { slug?: string };

/** Brand strip shared by the storefront and product pages. */
export function TopBanner({ products: _products }: { products?: BannerProduct[] }) {
  return <div className="h-14 md:h-[64px] bg-[#3c1620] border-b border-[#a77b57] flex items-center justify-center">
    <Link href="/products" className="flex items-baseline gap-3 px-4 text-[#f5e7d3] hover:text-white transition-colors" aria-label="시선사주 상품 보러 가기">
      <span className="text-[26px] md:text-[30px] font-medium tracking-[-.1em]" style={{ fontFamily: "'Noto Serif KR',serif" }}>시선</span>
      <span className="text-[10px] md:text-[11px] font-semibold tracking-[.2em] text-[#d8b389]">視線 · SISEON</span>
    </Link>
  </div>;
}
