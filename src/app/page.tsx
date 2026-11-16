import { CatalogView } from "@/components/renewal/CatalogView";
import { getCatalog } from "@/components/renewal/catalog";
export default async function HomePage() { return <CatalogView products={await getCatalog()} home />; }
