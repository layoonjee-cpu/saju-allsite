export type TarotCard = {
  id: number;
  name: string;
  nameKo: string;
  arcana: "major" | "minor";
  suit?: "wands" | "cups" | "swords" | "pentacles";
};

export const tarotCards: TarotCard[] = [
  // ── 메이저 아르카나 0~21 ──
  { id: 0,  name: "THE FOOL",           nameKo: "광대",           arcana: "major" },
  { id: 1,  name: "THE MAGICIAN",       nameKo: "마법사",          arcana: "major" },
  { id: 2,  name: "THE HIGH PRIESTESS", nameKo: "여사제",          arcana: "major" },
  { id: 3,  name: "THE EMPRESS",        nameKo: "여황제",          arcana: "major" },
  { id: 4,  name: "THE EMPEROR",        nameKo: "황제",            arcana: "major" },
  { id: 5,  name: "THE HIEROPHANT",     nameKo: "교황",            arcana: "major" },
  { id: 6,  name: "THE LOVERS",         nameKo: "연인",            arcana: "major" },
  { id: 7,  name: "THE CHARIOT",        nameKo: "전차",            arcana: "major" },
  { id: 8,  name: "STRENGTH",           nameKo: "힘",              arcana: "major" },
  { id: 9,  name: "THE HERMIT",         nameKo: "은둔자",          arcana: "major" },
  { id: 10, name: "WHEEL OF FORTUNE",   nameKo: "운명의 수레바퀴",  arcana: "major" },
  { id: 11, name: "JUSTICE",            nameKo: "정의",            arcana: "major" },
  { id: 12, name: "THE HANGED MAN",     nameKo: "매달린 사람",     arcana: "major" },
  { id: 13, name: "DEATH",              nameKo: "죽음",            arcana: "major" },
  { id: 14, name: "TEMPERANCE",         nameKo: "절제",            arcana: "major" },
  { id: 15, name: "THE DEVIL",          nameKo: "악마",            arcana: "major" },
  { id: 16, name: "THE TOWER",          nameKo: "탑",              arcana: "major" },
  { id: 17, name: "THE STAR",           nameKo: "별",              arcana: "major" },
  { id: 18, name: "THE MOON",           nameKo: "달",              arcana: "major" },
  { id: 19, name: "THE SUN",            nameKo: "태양",            arcana: "major" },
  { id: 20, name: "JUDGEMENT",          nameKo: "심판",            arcana: "major" },
  { id: 21, name: "THE WORLD",          nameKo: "세계",            arcana: "major" },

  // ── 완드 (WANDS) 22~35 ──
  { id: 22, name: "ACE OF WANDS",    nameKo: "완드 에이스", arcana: "minor", suit: "wands" },
  { id: 23, name: "TWO OF WANDS",    nameKo: "완드 2",      arcana: "minor", suit: "wands" },
  { id: 24, name: "THREE OF WANDS",  nameKo: "완드 3",      arcana: "minor", suit: "wands" },
  { id: 25, name: "FOUR OF WANDS",   nameKo: "완드 4",      arcana: "minor", suit: "wands" },
  { id: 26, name: "FIVE OF WANDS",   nameKo: "완드 5",      arcana: "minor", suit: "wands" },
  { id: 27, name: "SIX OF WANDS",    nameKo: "완드 6",      arcana: "minor", suit: "wands" },
  { id: 28, name: "SEVEN OF WANDS",  nameKo: "완드 7",      arcana: "minor", suit: "wands" },
  { id: 29, name: "EIGHT OF WANDS",  nameKo: "완드 8",      arcana: "minor", suit: "wands" },
  { id: 30, name: "NINE OF WANDS",   nameKo: "완드 9",      arcana: "minor", suit: "wands" },
  { id: 31, name: "TEN OF WANDS",    nameKo: "완드 10",     arcana: "minor", suit: "wands" },
  { id: 32, name: "PAGE OF WANDS",   nameKo: "완드 시종",   arcana: "minor", suit: "wands" },
  { id: 33, name: "KNIGHT OF WANDS", nameKo: "완드 기사",   arcana: "minor", suit: "wands" },
  { id: 34, name: "QUEEN OF WANDS",  nameKo: "완드 여왕",   arcana: "minor", suit: "wands" },
  { id: 35, name: "KING OF WANDS",   nameKo: "완드 왕",     arcana: "minor", suit: "wands" },

  // ── 컵 (CUPS) 36~49 ──
  { id: 36, name: "ACE OF CUPS",    nameKo: "컵 에이스", arcana: "minor", suit: "cups" },
  { id: 37, name: "TWO OF CUPS",    nameKo: "컵 2",      arcana: "minor", suit: "cups" },
  { id: 38, name: "THREE OF CUPS",  nameKo: "컵 3",      arcana: "minor", suit: "cups" },
  { id: 39, name: "FOUR OF CUPS",   nameKo: "컵 4",      arcana: "minor", suit: "cups" },
  { id: 40, name: "FIVE OF CUPS",   nameKo: "컵 5",      arcana: "minor", suit: "cups" },
  { id: 41, name: "SIX OF CUPS",    nameKo: "컵 6",      arcana: "minor", suit: "cups" },
  { id: 42, name: "SEVEN OF CUPS",  nameKo: "컵 7",      arcana: "minor", suit: "cups" },
  { id: 43, name: "EIGHT OF CUPS",  nameKo: "컵 8",      arcana: "minor", suit: "cups" },
  { id: 44, name: "NINE OF CUPS",   nameKo: "컵 9",      arcana: "minor", suit: "cups" },
  { id: 45, name: "TEN OF CUPS",    nameKo: "컵 10",     arcana: "minor", suit: "cups" },
  { id: 46, name: "PAGE OF CUPS",   nameKo: "컵 시종",   arcana: "minor", suit: "cups" },
  { id: 47, name: "KNIGHT OF CUPS", nameKo: "컵 기사",   arcana: "minor", suit: "cups" },
  { id: 48, name: "QUEEN OF CUPS",  nameKo: "컵 여왕",   arcana: "minor", suit: "cups" },
  { id: 49, name: "KING OF CUPS",   nameKo: "컵 왕",     arcana: "minor", suit: "cups" },

  // ── 소드 (SWORDS) 50~63 ──
  { id: 50, name: "ACE OF SWORDS",    nameKo: "소드 에이스", arcana: "minor", suit: "swords" },
  { id: 51, name: "TWO OF SWORDS",    nameKo: "소드 2",      arcana: "minor", suit: "swords" },
  { id: 52, name: "THREE OF SWORDS",  nameKo: "소드 3",      arcana: "minor", suit: "swords" },
  { id: 53, name: "FOUR OF SWORDS",   nameKo: "소드 4",      arcana: "minor", suit: "swords" },
  { id: 54, name: "FIVE OF SWORDS",   nameKo: "소드 5",      arcana: "minor", suit: "swords" },
  { id: 55, name: "SIX OF SWORDS",    nameKo: "소드 6",      arcana: "minor", suit: "swords" },
  { id: 56, name: "SEVEN OF SWORDS",  nameKo: "소드 7",      arcana: "minor", suit: "swords" },
  { id: 57, name: "EIGHT OF SWORDS",  nameKo: "소드 8",      arcana: "minor", suit: "swords" },
  { id: 58, name: "NINE OF SWORDS",   nameKo: "소드 9",      arcana: "minor", suit: "swords" },
  { id: 59, name: "TEN OF SWORDS",    nameKo: "소드 10",     arcana: "minor", suit: "swords" },
  { id: 60, name: "PAGE OF SWORDS",   nameKo: "소드 시종",   arcana: "minor", suit: "swords" },
  { id: 61, name: "KNIGHT OF SWORDS", nameKo: "소드 기사",   arcana: "minor", suit: "swords" },
  { id: 62, name: "QUEEN OF SWORDS",  nameKo: "소드 여왕",   arcana: "minor", suit: "swords" },
  { id: 63, name: "KING OF SWORDS",   nameKo: "소드 왕",     arcana: "minor", suit: "swords" },

  // ── 펜타클 (PENTACLES) 64~77 ──
  { id: 64, name: "ACE OF PENTACLES",    nameKo: "펜타클 에이스", arcana: "minor", suit: "pentacles" },
  { id: 65, name: "TWO OF PENTACLES",    nameKo: "펜타클 2",      arcana: "minor", suit: "pentacles" },
  { id: 66, name: "THREE OF PENTACLES",  nameKo: "펜타클 3",      arcana: "minor", suit: "pentacles" },
  { id: 67, name: "FOUR OF PENTACLES",   nameKo: "펜타클 4",      arcana: "minor", suit: "pentacles" },
  { id: 68, name: "FIVE OF PENTACLES",   nameKo: "펜타클 5",      arcana: "minor", suit: "pentacles" },
  { id: 69, name: "SIX OF PENTACLES",    nameKo: "펜타클 6",      arcana: "minor", suit: "pentacles" },
  { id: 70, name: "SEVEN OF PENTACLES",  nameKo: "펜타클 7",      arcana: "minor", suit: "pentacles" },
  { id: 71, name: "EIGHT OF PENTACLES",  nameKo: "펜타클 8",      arcana: "minor", suit: "pentacles" },
  { id: 72, name: "NINE OF PENTACLES",   nameKo: "펜타클 9",      arcana: "minor", suit: "pentacles" },
  { id: 73, name: "TEN OF PENTACLES",    nameKo: "펜타클 10",     arcana: "minor", suit: "pentacles" },
  { id: 74, name: "PAGE OF PENTACLES",   nameKo: "펜타클 시종",   arcana: "minor", suit: "pentacles" },
  { id: 75, name: "KNIGHT OF PENTACLES", nameKo: "펜타클 기사",   arcana: "minor", suit: "pentacles" },
  { id: 76, name: "QUEEN OF PENTACLES",  nameKo: "펜타클 여왕",   arcana: "minor", suit: "pentacles" },
  { id: 77, name: "KING OF PENTACLES",   nameKo: "펜타클 왕",     arcana: "minor", suit: "pentacles" },
];

export function getCardImagePath(id: number): string {
  return `/tarot/card_${String(id).padStart(2, "0")}.png`;
}

export function getCardBackPath(): string {
  return "/tarot/card_back.png";
}
