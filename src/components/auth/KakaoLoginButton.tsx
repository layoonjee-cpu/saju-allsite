"use client";

type Props = {
  redirectTo?: string;
  label?: string;
};

export function KakaoLoginButton({ redirectTo = "/mypage", label = "카카오로 계속하기" }: Props) {
  function handleClick() {
    const restApiKey = process.env.NEXT_PUBLIC_KAKAO_REST_API_KEY;
    if (!restApiKey) {
      console.error("NEXT_PUBLIC_KAKAO_REST_API_KEY is not set");
      return;
    }
    const callbackUri = `${window.location.origin}/auth/kakao/callback`;
    const kakaoAuthUrl =
      `https://kauth.kakao.com/oauth/authorize` +
      `?client_id=${restApiKey}` +
      `&redirect_uri=${encodeURIComponent(callbackUri)}` +
      `&response_type=code` +
      `&state=${encodeURIComponent(redirectTo)}`;
    window.location.href = kakaoAuthUrl;
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="flex w-full items-center justify-center gap-2.5 h-11 rounded-xl font-semibold text-[14px] text-[#1a1a1a] transition-opacity hover:opacity-90 active:opacity-75"
      style={{ backgroundColor: "#FEE500" }}
    >
      {/* 카카오 말풍선 아이콘 */}
      <svg width="19" height="18" viewBox="0 0 19 18" fill="none" aria-hidden="true">
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M9.5 1C5.08 1 1.5 3.806 1.5 7.25c0 2.24 1.48 4.2 3.72 5.332l-.948 3.54c-.084.316.266.574.546.394l4.128-2.73c.174.014.35.024.554.024 4.42 0 8-2.806 8-6.25C17.5 3.806 13.92 1 9.5 1z"
          fill="#1A1A1A"
        />
      </svg>
      {label}
    </button>
  );
}
