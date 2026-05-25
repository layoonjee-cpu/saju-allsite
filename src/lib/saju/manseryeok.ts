// =====================================================
// 만세력 어댑터
// =====================================================
// 외부 만세력 API가 있으면 호출, 없으면 mock(데모) 반환.
// 수강생은 본인이 쓰는 API에 맞춰 callExternalManseryeok() 만 갈아끼우면 됩니다.

// serverEnv() 전체 검증 우회 — 만세력 API URL만 process.env 직접 사용

export type Pillar = {
  cheongan: string; // 천간
  jiji: string; // 지지
};

export type Myeongsik = {
  year: Pillar;
  month: Pillar;
  day: Pillar;
  hour: Pillar | null; // 시 모르는 경우 null
};

export type ManseryeokInput = {
  birthDate: string; // YYYY-MM-DD
  birthTime: string | null; // HH:mm
  timeUnknown: boolean;
  calendar: "solar" | "lunar";
  gender: "male" | "female";
};

export async function computeMyeongsik(input: ManseryeokInput): Promise<Myeongsik> {
  const manseryeokUrl = process.env.MANSERYEOK_API_URL;
  const manseryeokKey = process.env.MANSERYEOK_API_KEY;
  if (manseryeokUrl) {
    return callExternalManseryeok(input, manseryeokUrl, manseryeokKey);
  }
  return mockMyeongsik(input);
}

async function callExternalManseryeok(
  input: ManseryeokInput,
  url: string,
  apiKey: string | undefined,
): Promise<Myeongsik> {
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
    },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    throw new Error(`Manseryeok API failed: ${res.status}`);
  }
  return (await res.json()) as Myeongsik;
}

// 데모용 결정론적 mock — 진짜 만세력 계산 X
// 수강생이 빈 .env로도 결제 → 결과 페이지까지 도달할 수 있도록 함
function mockMyeongsik(input: ManseryeokInput): Myeongsik {
  const cheongan = ["갑", "을", "병", "정", "무", "기", "경", "신", "임", "계"];
  const jiji = ["자", "축", "인", "묘", "진", "사", "오", "미", "신", "유", "술", "해"];
  const d = new Date(input.birthDate);
  const year = d.getFullYear();
  const month = d.getMonth() + 1;
  const day = d.getDate();
  const hour = input.timeUnknown || !input.birthTime ? null : parseInt(input.birthTime.split(":")[0], 10);

  const pick = (n: number, arr: string[]) => arr[((n % arr.length) + arr.length) % arr.length];

  return {
    year: { cheongan: pick(year - 4, cheongan), jiji: pick(year - 4, jiji) },
    month: { cheongan: pick(year + month, cheongan), jiji: pick(month + 1, jiji) },
    day: { cheongan: pick(year + month + day, cheongan), jiji: pick(day, jiji) },
    hour: hour === null ? null : { cheongan: pick(hour, cheongan), jiji: pick(Math.floor((hour + 1) / 2), jiji) },
  };
}
