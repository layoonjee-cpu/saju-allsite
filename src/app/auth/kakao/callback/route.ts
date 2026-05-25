import { NextResponse, type NextRequest } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code  = searchParams.get("code");
  const next  = searchParams.get("state") ?? "/mypage";
  const redirectUri = `${origin}/auth/kakao/callback`;

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=kakao_no_code`);
  }

  const restApiKey = process.env.NEXT_PUBLIC_KAKAO_REST_API_KEY;
  if (!restApiKey) {
    return NextResponse.redirect(`${origin}/login?error=kakao_config`);
  }

  // 1. 카카오 액세스 토큰 교환
  const tokenRes = await fetch("https://kauth.kakao.com/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded;charset=utf-8" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      client_id: restApiKey,
      redirect_uri: redirectUri,
      code,
    }),
  });

  const tokenData = await tokenRes.json();
  if (!tokenData.access_token) {
    console.error("[kakao-callback] token error:", tokenData);
    return NextResponse.redirect(`${origin}/login?error=kakao_token`);
  }

  // 2. 카카오 사용자 정보 조회
  const userRes = await fetch("https://kapi.kakao.com/v2/user/me", {
    headers: { Authorization: `Bearer ${tokenData.access_token}` },
  });
  const kakaoUser = await userRes.json();

  const email    = kakaoUser.kakao_account?.email as string | undefined;
  const nickname = (kakaoUser.kakao_account?.profile?.nickname as string | undefined) ?? "카카오 사용자";

  if (!email) {
    // 이메일 동의 항목 미설정 시 — 카카오 동의항목에서 이메일을 선택동의로 설정해야 함
    return NextResponse.redirect(`${origin}/login?error=kakao_no_email`);
  }

  // 3. Supabase 세션 생성 (사용자 없으면 자동 생성)
  const service = createServiceClient();
  const { data: linkData, error: linkError } = await service.auth.admin.generateLink({
    type: "magiclink",
    email,
    options: {
      data: { display_name: nickname },
      redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}`,
    },
  });

  if (linkError || !linkData?.properties?.action_link) {
    console.error("[kakao-callback] generateLink error:", linkError);
    return NextResponse.redirect(`${origin}/login?error=kakao_session`);
  }

  return NextResponse.redirect(linkData.properties.action_link);
}
