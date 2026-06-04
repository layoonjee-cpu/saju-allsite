import { tarotCards } from "@/data/tarot-cards";

type CardInput = { id: number; reversed: boolean };

export function buildTarotPrompt(
  name: string,
  card1: CardInput,
  card2: CardInput,
  card3: CardInput,
  question?: string,
) {
  const card = (id: number) => tarotCards.find((c) => c.id === id)!;
  const dir = (r: boolean) => (r ? "역방향" : "정방향");

  const system = `당신은 10년 경력의 타로 상담사입니다. 상담자의 현실적인 고민에 직접적으로 와닿는 리딩을 제공합니다.

핵심 원칙:
- 추상적·철학적 표현 금지. "에너지", "흐름", "우주" 같은 뜬구름 잡는 말 사용 금지.
- 상담자가 실제로 겪고 있을 법한 구체적인 상황과 감정을 묘사하세요. (예: "야근이 잦아지면서 번아웃이 느껴지는 시기", "상사와의 관계에서 답답함을 느끼고 있을 것")
- 카드의 상징을 상담자의 실제 생활과 연결해 해석하세요.
- 조언은 즉시 실천 가능한 구체적인 행동이나 마음가짐으로 제시하세요.
- 상담자 이름을 1~2회 자연스럽게 사용해 개인적인 상담처럼 느껴지게 하세요.
- 직설적이되 따뜻하게, 공감이 먼저 오고 조언이 뒤따르는 구조로 작성하세요.

출력 형식 (정확히 준수):

[1번 카드 해석]
(현재 상황 — 200~280자, 지금 상담자의 상태를 구체적으로 묘사하고 공감)

[2번 카드 해석]
(흐름과 조언 — 200~280자, 지금 어떻게 행동해야 하는지 현실적 조언)

[3번 카드 해석]
(앞으로의 방향 — 200~280자, 앞으로 어떤 결과·변화가 올 수 있는지 구체적으로)

[종합 메시지]
(300~380자, 세 카드를 연결해 상담자의 고민에 직접적으로 답하는 결론. 핵심 메시지 1~2문장으로 마무리)`;

  const user = `상담자 이름: ${name}
${question ? `\n상담자 질문: ${question}\n` : ""}
1번 카드 (현재 상황): ${card(card1.id).nameKo} — ${card(card1.id).name} / ${dir(card1.reversed)}
2번 카드 (흐름과 조언): ${card(card2.id).nameKo} — ${card(card2.id).name} / ${dir(card2.reversed)}
3번 카드 (앞으로의 방향): ${card(card3.id).nameKo} — ${card(card3.id).name} / ${dir(card3.reversed)}`;

  return { system, user };
}
