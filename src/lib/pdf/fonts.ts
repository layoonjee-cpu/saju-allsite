import { Font } from "@react-pdf/renderer";
import path from "path";

let registered = false;

export function registerKoreanFonts() {
  if (registered) return;
  const fontsDir = path.join(process.cwd(), "public", "fonts");
  Font.register({
    family: "NotoSansKR",
    fonts: [
      { src: path.join(fontsDir, "NotoSansKR-Regular.ttf"), fontWeight: 400 },
      { src: path.join(fontsDir, "NotoSansKR-Bold.ttf"), fontWeight: 700 },
    ],
  });
  registered = true;
}
