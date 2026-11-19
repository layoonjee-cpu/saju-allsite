import React from "react";
import { Text, View } from "@react-pdf/renderer";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Style = Record<string, any>;

const FONT = "NotoSansKR";

// 새 색상 팔레트
const COLORS = {
  wine: "#6d3045",
  gold: "#c9a84c",
  dark: "#2a2520",
  muted: "#666666",
  light: "#999999",
};

const s = {
  h1: { 
    fontFamily: FONT, 
    fontWeight: 700, 
    fontSize: 16, 
    color: COLORS.wine, 
    marginTop: 24, 
    marginBottom: 8,
    paddingBottom: 6,
    borderBottomWidth: 2,
    borderBottomColor: COLORS.gold,
  } as Style,
  h2: { 
    fontFamily: FONT, 
    fontWeight: 700, 
    fontSize: 13, 
    color: COLORS.wine, 
    marginTop: 18, 
    marginBottom: 6 
  } as Style,
  h3: { 
    fontFamily: FONT, 
    fontWeight: 700, 
    fontSize: 11, 
    color: COLORS.dark, 
    marginTop: 14, 
    marginBottom: 5 
  } as Style,
  p: { 
    fontFamily: FONT, 
    fontWeight: 400, 
    fontSize: 10.5, 
    color: COLORS.dark, 
    lineHeight: 1.8, 
    marginBottom: 8,
    textAlign: "justify",
  } as Style,
  bullet: { 
    fontFamily: FONT, 
    fontWeight: 400, 
    fontSize: 10.5, 
    color: COLORS.dark, 
    lineHeight: 1.75, 
    marginBottom: 4, 
    marginLeft: 14,
    paddingLeft: 8,
  } as Style,
  divider: { 
    borderBottomWidth: 1, 
    borderBottomColor: "rgba(109, 48, 69, 0.15)", 
    marginTop: 12, 
    marginBottom: 12 
  } as Style,
  mute: { 
    fontFamily: FONT, 
    fontWeight: 400, 
    fontSize: 9, 
    color: COLORS.muted 
  } as Style,
  // 하이라이트 박스 (인용/강조)
  highlight: {
    backgroundColor: "rgba(109, 48, 69, 0.06)",
    borderLeftWidth: 3,
    borderLeftColor: COLORS.wine,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginVertical: 10,
  } as Style,
  highlightText: {
    fontFamily: FONT,
    fontSize: 10,
    color: COLORS.dark,
    lineHeight: 1.7,
  } as Style,
};

/** **bold** 인라인 처리 → Text children 배열 */
function renderInline(text: string, baseStyle: Style): React.ReactElement {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  if (parts.length === 1) {
    return <Text style={baseStyle}>{text}</Text>;
  }
  return (
    <Text style={baseStyle}>
      {parts.map((part, i) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return (
            <Text key={i} style={{ ...baseStyle, fontWeight: 700, color: COLORS.wine }}>
              {part.slice(2, -2)}
            </Text>
          );
        }
        return <Text key={i}>{part}</Text>;
      })}
    </Text>
  );
}

/** 마크다운 문자열 → react-pdf View 엘리먼트 배열 */
export function markdownToElements(md: string): React.ReactElement[] {
  const lines = md.split("\n");
  const elements: React.ReactElement[] = [];
  let paraBuffer: string[] = [];
  let key = 0;
  let inBlockquote = false;
  let blockquoteLines: string[] = [];

  function flushPara() {
    if (paraBuffer.length === 0) return;
    const text = paraBuffer.join(" ").trim();
    if (text) elements.push(<View key={key++} wrap={false}>{renderInline(text, s.p)}</View>);
    paraBuffer = [];
  }

  function flushBlockquote() {
    if (blockquoteLines.length === 0) return;
    const text = blockquoteLines.map(l => l.replace(/^>\s?/, "")).join(" ").trim();
    if (text) {
      elements.push(
        <View key={key++} style={s.highlight} wrap={false}>
          {renderInline(text, s.highlightText)}
        </View>
      );
    }
    blockquoteLines = [];
    inBlockquote = false;
  }

  for (const raw of lines) {
    const line = raw.trimEnd();

    // 블록쿼트 처리
    if (/^>/.test(line)) {
      flushPara();
      inBlockquote = true;
      blockquoteLines.push(line);
      continue;
    } else if (inBlockquote) {
      flushBlockquote();
    }

    // H1
    if (/^# /.test(line)) {
      flushPara();
      elements.push(
        <View key={key++} wrap={false}>
          <Text style={s.h1}>{line.replace(/^# /, "")}</Text>
        </View>
      );
      continue;
    }
    // H2
    if (/^## /.test(line)) {
      flushPara();
      elements.push(<Text key={key++} style={s.h2}>{line.replace(/^## /, "")}</Text>);
      continue;
    }
    // H3
    if (/^### /.test(line)) {
      flushPara();
      elements.push(<Text key={key++} style={s.h3}>{line.replace(/^### /, "")}</Text>);
      continue;
    }
    // 구분선
    if (/^---+$/.test(line)) {
      flushPara();
      elements.push(<View key={key++} style={s.divider} />);
      continue;
    }
    // 순서 없는 리스트
    if (/^[-*] /.test(line)) {
      flushPara();
      const text = line.replace(/^[-*] /, "• ");
      elements.push(<View key={key++} wrap={false}>{renderInline(text, s.bullet)}</View>);
      continue;
    }
    // 순서 있는 리스트
    if (/^\d+\. /.test(line)) {
      flushPara();
      elements.push(<View key={key++} wrap={false}>{renderInline(line, s.bullet)}</View>);
      continue;
    }
    // 빈 줄 → 단락 구분
    if (line.trim() === "") {
      flushPara();
      continue;
    }
    // 일반 텍스트 → 버퍼 축적
    paraBuffer.push(line);
  }
  
  flushPara();
  flushBlockquote();

  return elements;
}
