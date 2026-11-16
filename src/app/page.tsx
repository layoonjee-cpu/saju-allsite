import { SiseonStorefront } from "@/components/landing/SiseonStorefront";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import { getCurrentUser } from "@/lib/auth";
import { productsSeed } from "@/config/products.seed";

type Product = { slug: string; name: string; description: string; price: number };
export default async function HomePage() {
  let products: Product[] = [];
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const { data } = await supabase.from("products").select("slug,name,description,price").eq("is_active", true).order("display_order", { ascending: true });
    products = data ?? [];
  }
  if (!products.length) products = productsSeed.filter(p => p.is_active).map(({slug,name,description,price}) => ({slug,name,description,price}));
  const isLoggedIn = isSupabaseConfigured() ? !!(await getCurrentUser()) : false;
  return <SiseonStorefront products={products} isLoggedIn={isLoggedIn} />;
}
