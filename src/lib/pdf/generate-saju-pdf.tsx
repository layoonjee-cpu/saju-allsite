import React from "react";
import {
  Document,
  Page,
  View,
  Text,
  StyleSheet,
  renderToBuffer,
  Font,
} from "@react-pdf/renderer";
import { registerKoreanFonts } from "./fonts";
import { markdownToElements } from "./markdown-to-elements";

const FONT = "NotoSansKR";

const styles = StyleSheet.create({
  page: {
    fontFamily: FONT,
    fontSize: 10.5,
    paddingTop: 56,
    paddingBottom: 56,
    paddingHorizontal: 56,
    color: "#2A2A2A",
  },
  // ── 표지 ──
  coverPage: {
    fontFamily: FONT,
    paddingTop: 120,
    paddingBottom: 80,
    paddingHorizontal: 72,
    backgroundColor: "#F8F9F9",
  },
  coverBrand: {
    fontSize: 11,
    fontWeight: 700,
    color: "#2D5C5C",
    letterSpacing: 3,
    marginBottom: 40,
  },
  coverTitle: {
    fontSize: 26,
    fontWeight: 700,
    color: "#1A1A1A",
    marginBottom: 8,
    lineHeight: 1.4,
  },
  coverSubtitle: {
    fontSize: 14,
    fontWeight: 400,
    color: "#555555",
    marginBottom: 48,
  },
  coverDivider: {
    borderBottomWidth: 1,
    borderBottomColor: "#2D5C5C",
    width: 48,
    marginBottom: 32,
  },
  coverInfoRow: {
    fontSize: 11,
    color: "#444444",
    marginBottom: 8,
    fontWeight: 400,
  },
  coverInfoLabel: {
    fontWeight: 700,
    color: "#2D5C5C",
  },
  coverFooter: {
    position: "absolute",
    bottom: 48,
    left: 72,
    right: 72,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  coverFooterText: {
    fontSize: 9,
    color: "#AAAAAA",
  },
  // ── 본문 ──
  header: {
    position: "absolute",
    top: 20,
    left: 56,
    right: 56,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  headerText: {
    fontSize: 8,
    color: "#AAAAAA",
    fontFamily: FONT,
  },
  footer: {
    position: "absolute",
    bottom: 20,
    left: 56,
    right: 56,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  footerText: {
    fontSize: 8,
    color: "#AAAAAA",
    fontFamily: FONT,
  },
  content: {
    flex: 1,
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
    generatedAt,
  } = input;

  const nameDisplay = customerName ?? "고객";
  const genderLabel = gender === "male" ? "남성" : gender === "female" ? "여성" : "";
  const calLabel = calendar === "lunar" ? "음력" : "양력";
  const timeDisplay = timeUnknown ? "시간 미상" : birthTime ? birthTime : "";
  const birthDisplay = [
    birthDate ?? "",
    timeDisplay,
    calLabel,
    genderLabel,
  ].filter(Boolean).join(" · ");

  const bodyElements = markdownToElements(interpretationMd);

  const doc = (
    <Document title={`${productName} — ${nameDisplay}`} author="시선사주">
      {/* ── 표지 ── */}
      <Page size="A4" style={styles.coverPage}>
        <Text style={styles.coverBrand}>시선사주  ·  視線四柱</Text>
        <Text style={styles.coverTitle}>{productName}</Text>
        <Text style={styles.coverSubtitle}>{nameDisplay}님의 분석 보고서</Text>
        <View style={styles.coverDivider} />
        <Text style={styles.coverInfoRow}>
          <Text style={styles.coverInfoLabel}>고객명  </Text>
          {nameDisplay}
        </Text>
        {birthDate && (
          <Text style={styles.coverInfoRow}>
            <Text style={styles.coverInfoLabel}>생년월일  </Text>
            {birthDisplay}
          </Text>
        )}
        <Text style={styles.coverInfoRow}>
          <Text style={styles.coverInfoLabel}>생성일  </Text>
          {generatedAt}
        </Text>
        <View style={styles.coverFooter}>
          <Text style={styles.coverFooterText}>© 시선사주</Text>
          <Text style={styles.coverFooterText}>saju7.kr</Text>
        </View>
      </Page>

      {/* ── 본문 ── */}
      <Page size="A4" style={styles.page}>
        {/* 헤더 */}
        <View style={styles.header} fixed>
          <Text style={styles.headerText}>{productName}  ·  {nameDisplay}</Text>
          <Text style={styles.headerText}>시선사주</Text>
        </View>

        {/* 본문 콘텐츠 */}
        <View style={styles.content}>{bodyElements}</View>

        {/* 푸터 */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>© 시선사주  ·  saju7.kr</Text>
          <Text
            style={styles.footerText}
            render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`}
          />
        </View>
      </Page>
    </Document>
  );

  return renderToBuffer(doc);
}
