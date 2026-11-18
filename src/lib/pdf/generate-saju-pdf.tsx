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
    color: "#30262B",
    backgroundColor: "#FFFCF8",
  },
  // ── 표지: 시선사주 와인·골드 리포트 ──
  coverPage: {
    fontFamily: FONT,
    paddingTop: 148,
    paddingBottom: 80,
    paddingHorizontal: 78,
    backgroundColor: "#371C29",
  },
  coverFrame: {
    position: "absolute", top: 35, bottom: 35, left: 35, right: 35,
    borderWidth: 1, borderColor: "#A48459",
  },
  coverMark: {
    position: "absolute", top: 57, right: 76,
    fontFamily: FONT, fontSize: 11, color: "#D6B17A", letterSpacing: 2,
  },
  coverBrand: {
    fontFamily: FONT,
    fontSize: 11,
    fontWeight: 700,
    color: "#D6B17A",
    letterSpacing: 3,
    marginBottom: 50,
  },
  coverTitle: {
    fontFamily: FONT,
    fontSize: 32,
    fontWeight: 700,
    color: "#FFF8EF",
    marginBottom: 12,
    lineHeight: 1.4,
  },
  coverSubtitle: {
    fontFamily: FONT,
    fontSize: 15,
    fontWeight: 400,
    color: "#E9D8C9",
    marginBottom: 58,
  },
  coverDivider: {
    borderBottomWidth: 2,
    borderBottomColor: "#D6B17A",
    width: 74,
    marginBottom: 36,
  },
  coverInfoRow: {
    fontFamily: FONT,
    fontSize: 11,
    color: "#F1E6DC",
    marginBottom: 12,
    fontWeight: 400,
  },
  coverInfoLabel: {
    fontFamily: FONT,
    fontWeight: 700,
    color: "#D6B17A",
  },
  coverFooter: {
    position: "absolute",
    bottom: 68,
    left: 78,
    right: 78,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  coverFooterText: {
    fontFamily: FONT,
    fontSize: 9,
    color: "#C5AB9C",
  },
  // ── 본문 ──
  header: {
    position: "absolute",
    top: 20,
    left: 56,
    right: 56,
    flexDirection: "row",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#D9C4A6",
    paddingBottom: 7,
  },
  headerText: {
    fontSize: 8,
    color: "#6D3D4E",
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
    color: "#A4816F",
    fontFamily: FONT,
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
        <View style={styles.coverFrame} />
        <Text style={styles.coverMark}>視線 · SISEON</Text>
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

        {/* 본문 콘텐츠 — flex:1 래퍼 없이 직접 배치해야 react-pdf가 다음 페이지로 자동 분할 */}
        {bodyElements}

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
