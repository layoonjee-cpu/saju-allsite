"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function KakaoSessionPage() {
  return (
    <Suspense fallback={<p className="p-8 text-center text-muted-foreground">로그인 중...</p>}>
      <SessionHandler />
    </Suspense>
  );
}

function SessionHandler() {
  const router = useRouter();
  const search = useSearchParams();
  const next = search.get("next") ?? "/mypage";

  useEffect(() => {
    // Supabase magic link implicit flow redirects with hash fragment:
    // #access_token=...&refresh_token=...&token_type=bearer&type=magiclink
    const hash = window.location.hash.substring(1); // strip leading '#'
    const params = new URLSearchParams(hash);
    const access_token = params.get("access_token");
    const refresh_token = params.get("refresh_token");

    if (!access_token || !refresh_token) {
      console.error("[kakao-session] missing tokens in hash fragment");
      router.replace("/login?error=kakao_session");
      return;
    }

    const supabase = createClient();
    supabase.auth
      .setSession({ access_token, refresh_token })
      .then(({ error }) => {
        if (error) {
          console.error("[kakao-session] setSession error:", error);
          router.replace("/login?error=kakao_session");
        } else {
          router.replace(next);
        }
      });
  }, [next, router]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <p className="text-muted-foreground">카카오 로그인 처리 중...</p>
    </div>
  );
}
