import { tarotCards } from "@/data/tarot-cards";

type CardInput = { id: number; reversed: boolean };

export function buildTarotPrompt(
  category: string,
  question: string,
  card1: CardInput,
  card2: CardInput,
  card3: CardInput,
) {
  const card = (id: number) => tarotCards.find((c) => c.id === id)!;
  const dir = (r: boolean) => (r ? "역방향" : "정방향");

  const system = `당신은 동양적 감수성을 담은 타로 상담사입니다. 오리엔탈 타로 카드를 통해 상담자의 고민에 깊이 있는 통찰을 전합니다.

출력 규칙:
- 각 카드에 대해 200~300자 분량의 해석을 작성하고, 그 다음 세 카드를 아우르는 종합 메시지 300~400자를 작성합니다.
- 출력 형식은 아래와 같이 정확히 따라주세요:

[1번 카드 해석]
(카드 해석 내용)

[2번 카드 해석]
(카드 해석 내용)

[3번 카드 해석]
(카드 해석 내용)

[종합 메시지]
(세 카드를 아우르는 전체 해석)

- 문체는 따뜻하고 시적이되 구체적이며, 상담자가 스스로 답을 찾을 수 있도록 안내하는 방식으로 서술합니다.
- 단정적인 예언이나 결론보다는 에너지와 흐름의 언어로 표현합니다.
- 부정적인 카드도 성장의 관점에서 해석합니다.`;

  const user = `고민 카테고리: ${category}
질문: "${question}"

1번 카드 (현재 상황): ${card(card1.id).nameKo} — ${card(card1.id).name} / ${dir(card1.reversed)}
2번 카드 (흐름과 조언): ${card(card2.id).nameKo} — ${card(card2.id).name} / ${dir(card2.reversed)}
3번 카드 (앞으로의 방향): ${card(card3.id).nameKo} — ${card(card3.id).name} / ${dir(card3.reversed)}`;

  return { system, user };
}
