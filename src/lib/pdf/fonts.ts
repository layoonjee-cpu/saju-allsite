import { Font } from "@react-pdf/renderer";
import path from "path";

let registered = false;

export function registerKoreanFonts() {
  if (registered) return;
  const fontsDir = path.join(process.cwd(), "public", "fonts");
  Font.register({
    family: "NotoSansKR",
    fonts: [
      { src: path.join(fontsDir, "NotoSansKR-Regular.woff2"), fontWeight: 400 },
      { src: path.join(fontsDir, "NotoSansKR-Bold.woff2"), fontWeight: 700 },
    ],
  });
  registered = true;
}
