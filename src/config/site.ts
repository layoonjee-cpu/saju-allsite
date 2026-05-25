// =====================================================
// 사이트 메타 / 사업자 정보
// =====================================================
// 운영 전 본인 정보로 반드시 교체하세요. 아래는 모두 더미 데이터입니다.

export const siteConfig = {
  name: "시선",
  tagline: "당신의 사주를 함께 읽다",
  description: "정통 명리학과 AI가 만나는 곳. 운명을 점치지 않습니다. 당신의 지금을 함께 읽어드립니다.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  email: "unmyung.official@gmail.com",
  // 카카오 채널 URL — 채널 개설 후 실제 URL로 교체하세요
  kakaoChannelUrl: "#",
};

// 통신판매업 / 사업자 정보 — 법적 페이지 및 푸터에 노출됩니다.
export const businessInfo = {
  companyName: "운명론자",
  representative: "나윤지",
  businessNumber: "555-52-01094",
  mailOrderNumber: "2025-서울서초-3940",
  address: "서울시 서초구 사임당로9길 13, 제일빌딩 4층 402호",
  phone: "",
  phoneNote: "",
  email: "unmyung.official@gmail.com",
  privacyOfficer: "나윤지",
  // 호스팅 / 주요 처리 위탁 업체 — 개인정보처리방침에 노출
  hostingProvider: "Vercel Inc.",
  // 시행일 — 약관 / 개인정보처리방침 / 환불정책에 공통 노출
  effectiveDate: "2026-01-01",
};
