import { Font } from "@react-pdf/renderer";

let registered = false;

export function registerKoreanFonts() {
  if (registered) return;
  // public/fonts/ 파일은 Vercel CDN에서 정적 서빙됨
  // process.cwd() 경로로 직접 접근하면 Vercel 서버리스에서 실패하므로
  // NEXT_PUBLIC_SITE_URL 기반 HTTP URL로 fetch
  const base = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
  Font.register({
    family: "NotoSansKR",
    fonts: [
      { src: `${base}/fonts/NotoSansKR-Regular.ttf`, fontWeight: 400 },
      { src: `${base}/fonts/NotoSansKR-Bold.ttf`, fontWeight: 700 },
    ],
  });
  registered = true;
}
