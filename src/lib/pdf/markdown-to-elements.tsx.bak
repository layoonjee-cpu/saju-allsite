import React from "react";
import { Text, View } from "@react-pdf/renderer";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Style = Record<string, any>;

const FONT = "NotoSansKR";
const COLOR_TEAL = "#2D5C5C";
const COLOR_BODY = "#2A2A2A";
const COLOR_MUTE = "#888888";

const s = {
  h1: { fontFamily: FONT, fontWeight: 700, fontSize: 16, color: COLOR_TEAL, marginTop: 20, marginBottom: 6 } as Style,
  h2: { fontFamily: FONT, fontWeight: 700, fontSize: 14, color: COLOR_TEAL, marginTop: 16, marginBottom: 5 } as Style,
  h3: { fontFamily: FONT, fontWeight: 700, fontSize: 12, color: "#333333", marginTop: 12, marginBottom: 4 } as Style,
  p:  { fontFamily: FONT, fontWeight: 400, fontSize: 10.5, color: COLOR_BODY, lineHeight: 1.75, marginBottom: 6 } as Style,
  bullet: { fontFamily: FONT, fontWeight: 400, fontSize: 10.5, color: COLOR_BODY, lineHeight: 1.75, marginBottom: 3, marginLeft: 12 } as Style,
  divider: { borderBottomWidth: 1, borderBottomColor: "#DDDDDD", marginTop: 10, marginBottom: 10 } as Style,
  mute: { fontFamily: FONT, fontWeight: 400, fontSize: 9, color: COLOR_MUTE } as Style,
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
            <Text key={i} style={{ ...baseStyle, fontWeight: 700 }}>
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

  function flushPara() {
    if (paraBuffer.length === 0) return;
    const text = paraBuffer.join(" ").trim();
    if (text) elements.push(<View key={key++}>{renderInline(text, s.p)}</View>);
    paraBuffer = [];
  }

  for (const raw of lines) {
    const line = raw.trimEnd();

    // H1
    if (/^# /.test(line)) {
      flushPara();
      elements.push(<Text key={key++} style={s.h1}>{line.replace(/^# /, "")}</Text>);
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
      elements.push(<View key={key++}>{renderInline(text, s.bullet)}</View>);
      continue;
    }
    // 순서 있는 리스트
    if (/^\d+\. /.test(line)) {
      flushPara();
      elements.push(<View key={key++}>{renderInline(line, s.bullet)}</View>);
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

  return elements;
}
