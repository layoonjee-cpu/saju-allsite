import { CatalogView } from "@/components/renewal/CatalogView";
import { getCatalog } from "@/components/renewal/catalog";
export const metadata = { title: "상품 둘러보기" };
export default async function ProductsPage() { return <CatalogView products={await getCatalog()} />; }
