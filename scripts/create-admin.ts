// pnpm create:admin <email>
// 지정한 이메일을 가진 회원을 관리자(is_admin=true)로 토글합니다.
// 회원이 먼저 가입되어 있어야 합니다.

import { createClient } from "@supabase/supabase-js";

async function main() {
  const email = process.argv[2];
  if (!email) {
    console.error("사용법: pnpm create:admin <email>");
    process.exit(1);
  }
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) {
    console.error("✗ NEXT_PUBLIC_SUPABASE_URL 또는 SUPABASE_SECRET_KEY가 없습니다.");
    process.exit(1);
  }
  const supabase = createClient(url, key);

  const { data, error } = await supabase
    .from("profiles")
    .update({ is_admin: true })
    .eq("email", email)
    .select("id, email, is_admin");

  if (error) {
    console.error(`✗ ${error.message}`);
    process.exit(1);
  }
  if (!data || data.length === 0) {
    console.error(`✗ ${email} 계정을 찾을 수 없습니다. 먼저 회원가입을 진행하세요.`);
    process.exit(1);
  }
  console.log(`✓ ${email} → is_admin=true`);
}

main();
