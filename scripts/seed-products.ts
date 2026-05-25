// pnpm seed:products
// src/config/products.seed.ts 의 내용을 DB에 upsert합니다.
// .env.local 또는 .env 의 NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SECRET_KEY 필요.

import { createClient } from "@supabase/supabase-js";
import { productsSeed } from "../src/config/products.seed";

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) {
    console.error("✗ NEXT_PUBLIC_SUPABASE_URL 또는 SUPABASE_SECRET_KEY가 없습니다.");
    process.exit(1);
  }
  const supabase = createClient(url, key);

  for (const p of productsSeed) {
    const { error } = await supabase.from("products").upsert(p, { onConflict: "slug" });
    if (error) {
      console.error(`✗ ${p.slug}: ${error.message}`);
      process.exitCode = 1;
    } else {
      console.log(`✓ ${p.slug}`);
    }
  }
}

main();
