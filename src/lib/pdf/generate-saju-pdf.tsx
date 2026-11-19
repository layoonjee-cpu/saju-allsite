import React from "react";
import {
  Document,
  Page,
  View,
  Text,
  Image,
  StyleSheet,
  renderToBuffer,
} from "@react-pdf/renderer";
import { registerKoreanFonts } from "./fonts";
import { markdownToElements } from "./markdown-to-elements";
import path from "path";
import fs from "fs";

const FONT = "NotoSansKR";

// 색상 팔레트
const COLORS = {
  wine: "#6d3045",
  gold: "#c9a84c",
  dark: "#2a2520",
  muted: "#666666",
  light: "#999999",
  paper: "#faf8f5",
  border: "rgba(109, 48, 69, 0.2)",
};

const styles = StyleSheet.create({
  // ── 표지 (이미지 배경) ──
  coverPage: {
    position: "relative",
  },
  coverImage: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
  },
  // ── 본문 페이지 ──
  page: {
    fontFamily: FONT,
    fontSize: 10.5,
    paddingTop: 56,
    paddingBottom: 56,
    paddingHorizontal: 56,
    color: COLORS.dark,
    backgroundColor: COLORS.paper,
  },
  // ── 헤더 ──
  header: {
    position: "absolute",
    top: 24,
    left: 56,
    right: 56,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerLeft: {
    fontSize: 8,
    color: COLORS.wine,
    letterSpacing: 0.5,
    fontFamily: FONT,
  },
  headerRight: {
    fontSize: 8,
    color: COLORS.light,
    fontFamily: FONT,
  },
  // ── 푸터 ──
  footer: {
    position: "absolute",
    bottom: 24,
    left: 56,
    right: 56,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  footerText: {
    fontSize: 7,
    color: COLORS.light,
    fontFamily: FONT,
  },
  footerPage: {
    fontSize: 8,
    color: COLORS.wine,
    fontWeight: 600,
    fontFamily: FONT,
  },
  // ── 폴백 텍스트 표지 ──
  fallbackCover: {
    fontFamily: FONT,
    paddingTop: 120,
    paddingBottom: 80,
    paddingHorizontal: 72,
    backgroundColor: COLORS.paper,
  },
  fallbackBrand: {
    fontFamily: FONT,
    fontSize: 11,
    color: COLORS.wine,
    letterSpacing: 2,
    marginBottom: 32,
  },
  fallbackTitle: {
    fontFamily: FONT,
    fontSize: 24,
    fontWeight: 700,
    color: COLORS.dark,
    marginBottom: 8,
  },
  fallbackSubtitle: {
    fontFamily: FONT,
    fontSize: 12,
    color: COLORS.muted,
    marginBottom: 40,
  },
  fallbackDivider: {
    borderBottomWidth: 2,
    borderBottomColor: COLORS.gold,
    width: 40,
    marginBottom: 24,
  },
  fallbackName: {
    fontFamily: FONT,
    fontSize: 10,
    color: COLORS.dark,
    marginBottom: 6,
  },
  fallbackBirth: {
    fontFamily: FONT,
    fontSize: 10,
    color: COLORS.muted,
  },
});

type PdfInput = {
  interpretationMd: string;
  productName: string;
  customerName: string | null;
  birthDate: string | null;
  birthTime: string | null;
  timeUnknown: boolean;
  gender: "male" | "female" | null;
  calendar: "solar" | "lunar" | null;
  generatedAt: string;
};

/** 상품명에 따라 표지 이미지 선택 */
function getCoverImagePath(productName: string): string {
  const coverDir = path.join(process.cwd(), "public", "pdf-covers");
  
  // 별의 시선 (자미두수)
  if (productName.includes("별의 시선") || productName.includes("자미두수")) {
    return path.join(coverDir, "cover-star.png");
  }
  // 깊은 시선 (VIP)
  if (productName.includes("깊은 시선") || productName.includes("VIP") || productName.includes("프리미엄")) {
    return path.join(coverDir, "cover-deep.png");
  }
  // 기본 (가벼운 시선, 연인의 시선 등)
  return path.join(coverDir, "cover-basic.png");
}

/** 표지 이미지를 base64로 로드 */
function loadCoverImage(productName: string): string | null {
  try {
    const imagePath = getCoverImagePath(productName);
    if (fs.existsSync(imagePath)) {
      const imageBuffer = fs.readFileSync(imagePath);
      return `data:image/png;base64,${imageBuffer.toString("base64")}`;
    }
  } catch (e) {
    console.error("표지 이미지 로드 실패:", e);
  }
  return null;
}

export async function generateSajuPdf(input: PdfInput): Promise<Buffer> {
  registerKoreanFonts();

  const {
    interpretationMd,
    productName,
    customerName,
    birthDate,
    birthTime,
    timeUnknown,
    gender,
    calendar,
  } = input;

  const nameDisplay = customerName ?? "고객";
  const genderLabel = gender === "male" ? "남" : gender === "female" ? "여" : "";
  const calLabel = calendar === "lunar" ? "음력" : "양력";
  const timeDisplay = timeUnknown ? "시간 미상" : birthTime ? birthTime : "";
  const birthDisplay = [
    birthDate ?? "",
    timeDisplay,
    calLabel,
    genderLabel,
  ].filter(Boolean).join(" · ");

  // 표지 이미지 로드
  const coverImageSrc = loadCoverImage(productName);

  // 본문 마크다운 → 엘리먼트
  const bodyElements = markdownToElements(interpretationMd);

  const doc = (
    <Document title={`${productName} — ${nameDisplay}`} author="시선사주">
      {/* ── 표지 (이미지 배경) ── */}
      {coverImageSrc ? (
        <Page size="A4" style={styles.coverPage}>
          <Image src={coverImageSrc} style={styles.coverImage} />
        </Page>
      ) : (
        /* 이미지 없을 경우 폴백 텍스트 표지 */
        <Page size="A4" style={styles.fallbackCover}>
          <Text style={styles.fallbackBrand}>視 線 · SISEON</Text>
          <Text style={styles.fallbackTitle}>{productName}</Text>
          <Text style={styles.fallbackSubtitle}>{nameDisplay}님의 분석서</Text>
          <View style={styles.fallbackDivider} />
          <Text style={styles.fallbackName}>{nameDisplay} 님</Text>
          {birthDate && (
            <Text style={styles.fallbackBirth}>{birthDisplay}</Text>
          )}
        </Page>
      )}

      {/* ── 본문 ── */}
      <Page size="A4" style={styles.page}>
        {/* 헤더 */}
        <View style={styles.header} fixed>
          <Text style={styles.headerLeft}>{productName}</Text>
          <Text style={styles.headerRight}>{nameDisplay} 님</Text>
        </View>

        {/* 본문 콘텐츠 */}
        {bodyElements}

        {/* 푸터 */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>© 시선사주 · saju7.kr</Text>
          <Text
            style={styles.footerPage}
            render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`}
          />
        </View>
      </Page>
    </Document>
  );

  return renderToBuffer(doc);
}
