import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

export async function GET(request: NextRequest) {
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? new URL(request.url).origin;

  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const next = searchParams.get("state") ?? "/mypage";

    if (!code) {
      return NextResponse.redirect(`${siteUrl}/login?error=kakao_no_code`);
    }

    const restApiKey = process.env.NEXT_PUBLIC_KAKAO_REST_API_KEY;
    if (!restApiKey) {
      return NextResponse.redirect(`${siteUrl}/login?error=kakao_config`);
    }

    // 1. 카카오 code → access_token 교환
    const tokenRes = await fetch("https://kauth.kakao.com/oauth/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded;charset=utf-8",
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        client_id: restApiKey,
        redirect_uri: `${siteUrl}/auth/kakao/callback`,
        code,
        ...(process.env.KAKAO_CLIENT_SECRET
          ? { client_secret: process.env.KAKAO_CLIENT_SECRET }
          : {}),
      }),
    });
    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) {
      console.error("[kakao-callback] token error:", tokenData);
      return NextResponse.redirect(`${siteUrl}/login?error=kakao_token`);
    }

    // 2. 카카오 사용자 정보 조회
    const userRes = await fetch("https://kapi.kakao.com/v2/user/me", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const kakaoUser = await userRes.json();
    const email =
      kakaoUser.kakao_account?.email as string | undefined;
    const nickname =
      (kakaoUser.kakao_account?.profile?.nickname as string | undefined) ??
      "카카오 사용자";
    if (!email) {
      return NextResponse.redirect(`${siteUrl}/login?error=kakao_no_email`);
    }

    // 3. Supabase admin 클라이언트 — serverEnv() 우회, 이 라우트에 필요한 키만 사용
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY;
    if (!supabaseUrl || !supabaseSecretKey) {
      console.error("[kakao-callback] missing SUPABASE env vars");
      return NextResponse.redirect(`${siteUrl}/login?error=server_config`);
    }
    const service = createSupabaseClient(supabaseUrl, supabaseSecretKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // 4. Magic link 생성 (사용자 없으면 자동 생성)
    const { data: linkData, error: linkError } =
      await service.auth.admin.generateLink({
        type: "magiclink",
        email,
        options: { data: { display_name: nickname } },
      });
    if (linkError || !linkData?.properties?.action_link) {
      console.error("[kakao-callback] generateLink error:", linkError);
      return NextResponse.redirect(`${siteUrl}/login?error=kakao_session`);
    }

    // 5. Magic link를 서버에서 직접 호출 → Location 헤더에서 토큰 추출
    //    브라우저 redirect dance 없이 완전 서버사이드 처리
    const verifyRes = await fetch(linkData.properties.action_link, {
      redirect: "manual",
    });
    const location = verifyRes.headers.get("location") ?? "";

    // 5a. Implicit flow: Location: SITE_URL#access_token=...&refresh_token=...
    const hashIdx = location.indexOf("#");
    if (hashIdx !== -1) {
      const hashParams = new URLSearchParams(location.slice(hashIdx + 1));
      const accessToken = hashParams.get("access_token");
      const refreshToken = hashParams.get("refresh_token");

      if (accessToken && refreshToken) {
        const supabase = await createClient();
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        if (!sessionError) {
          return NextResponse.redirect(`${siteUrl}${next}`);
        }
        console.error("[kakao-callback] setSession error:", sessionError);
      }
    }

    // 5b. PKCE flow 폴백: Location: SITE_URL?code=...
    try {
      const locUrl = new URL(location);
      const authCode = locUrl.searchParams.get("code");
      if (authCode) {
        const supabase = await createClient();
        const { error } = await supabase.auth.exchangeCodeForSession(authCode);
        if (!error) {
          return NextResponse.redirect(`${siteUrl}${next}`);
        }
      }
    } catch {
      // location이 유효한 URL이 아닌 경우 무시
    }

    console.error(
      "[kakao-callback] could not extract session from location:",
      location,
    );
    return NextResponse.redirect(`${siteUrl}/login?error=kakao_session`);
  } catch (err) {
    // 예상치 못한 에러도 500 대신 로그인 에러 페이지로
    console.error("[kakao-callback] unhandled error:", err);
    return NextResponse.redirect(`${siteUrl}/login?error=kakao_unknown`);
  }
}
