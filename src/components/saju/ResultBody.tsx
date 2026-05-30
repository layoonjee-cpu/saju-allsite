import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

/** 마침표 뒤 붙어 있는 문장들을 단락 단위로 분리합니다.
 *  헤더·리스트·표·빈 줄은 건드리지 않고, 본문 줄에서만 적용합니다. */
function breakSentences(md: string): string {
  return md
    .split("\n")
    .map((line) => {
      // 구조적 줄은 그대로 통과
      if (
        !line.trim() ||
        /^#{1,6}\s/.test(line) ||      // 헤더
        /^[-*+|>]/.test(line) ||       // 리스트·인용·표
        /^\d+\.\s/.test(line) ||       // 순서 리스트
        /^---+$/.test(line)            // 구분선
      ) {
        return line;
      }
      // 한글 문자 + 마침표 + 공백 + 한글·영문 대문자 → 두 칸 줄바꿈
      return line.replace(/([가-힣])\. (?=[가-힣A-Z])/g, "$1.\n\n");
    })
    .join("\n");
}

export function ResultBody({ markdown }: { markdown: string }) {
  return (
    <div className="prose-saju">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{breakSentences(markdown)}</ReactMarkdown>
    </div>
  );
}
