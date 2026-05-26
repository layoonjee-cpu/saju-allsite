"""
사주 API 호출 및 데이터 포맷 유틸리티
luckyloveme.com API → 16종 분석 데이터 → LLM 프롬프트용 텍스트
"""

import httpx
import os
from typing import Any

SAJU_API_URL = os.environ.get("SAJU_API_URL", "https://luckyloveme.com/api/saju-full-analysis")
SAJU_API_KEY = os.environ.get("SAJU_API_KEY", "")

ALL_FIELDS = [
    "ganji", "sipseong", "sinStrength", "gyeokguk", "gyeokgukYongsin",
    "twelveFortune", "daeun", "seun", "weolun", "hapchung",
    "guiin", "sibisinsals", "bigyeonGeobjae", "hongyeom", "dohwa", "hwagae",
]


def build_birth_info(saju_input: dict) -> dict:
    """saju_inputs DB row → luckyloveme API BirthInfo 형식"""
    birth_date = saju_input.get("birth_date") or "1900-01-01"
    y, m, d = birth_date.split("-")
    birth_time = saju_input.get("birth_time")
    time_unknown = saju_input.get("time_unknown", False)
    has_time = not time_unknown and birth_time

    info: dict = {
        "birthYear": y,
        "birthMonth": str(int(m)),
        "birthDay": str(int(d)),
        "calendarType": "음력" if saju_input.get("calendar") == "lunar" else "양력",
        "gender": saju_input.get("gender", "female"),
    }
    if has_time:
        parts = birth_time.split(":")
        hh, mm = parts[0], parts[1]  # 초(ss) 무시 — PostgreSQL TIME 타입 대응
        info["birthHour"] = str(int(hh))
        info["birthMinute"] = str(int(mm))
    return info


def fetch_saju_analysis(birth_info: dict) -> dict:
    """luckyloveme API 호출 → 16종 분석 데이터 반환"""
    if not SAJU_API_KEY:
        return {}
    try:
        response = httpx.post(
            SAJU_API_URL,
            json={"birthInfo": birth_info, "fields": ALL_FIELDS},
            headers={"Authorization": f"Bearer {SAJU_API_KEY}"},
            timeout=30.0,
        )
        response.raise_for_status()
        return response.json()
    except Exception as e:
        print(f"[saju-api] 호출 실패: {e}")
        return {}


def format_ganji(ganji: Any) -> str:
    """천간지지 4기둥 포맷"""
    if not ganji:
        return "(데이터 없음)"
    lines = []
    for pillar, label in [("year", "년주"), ("month", "월주"), ("day", "일주"), ("hour", "시주")]:
        p = ganji.get(pillar) if isinstance(ganji, dict) else None
        if p:
            lines.append(f"  {label}: {p.get('gan', '')}({p.get('ganHanja', '')}) / {p.get('ji', '')}({p.get('jiHanja', '')})")
        elif pillar == "hour":
            lines.append(f"  시주: (시 미상)")
    return "\n".join(lines)


def format_sipseong(sipseong: Any) -> str:
    if not sipseong:
        return "(없음)"
    if isinstance(sipseong, dict):
        items = []
        for k, v in sipseong.items():
            items.append(f"{k}: {v}")
        return " / ".join(items)
    return str(sipseong)


def format_hapchung(hapchung: Any) -> str:
    """합충형해파 — 각 관계를 한 줄로 정리"""
    if not hapchung:
        return "없음"
    if isinstance(hapchung, list):
        if not hapchung:
            return "없음"
        lines = []
        for item in hapchung:
            if not isinstance(item, dict):
                continue
            src_pos = item.get("sourcePosition", "")
            src_ji = item.get("source", "")
            tgt_pos = item.get("targetPosition", "")
            tgt_ji = item.get("target", "")
            rel_type = item.get("type", "")
            meaning = item.get("meaning", "")
            line = f"  - {src_pos}({src_ji}) ↔ {tgt_pos}({tgt_ji}): {rel_type}"
            if meaning:
                line += f" — {meaning}"
            lines.append(line)
        return "\n".join(lines) if lines else "없음"
    return str(hapchung)


def format_guiin(guiin: Any) -> str:
    """귀인 — 비어있는 종류 제외하고 발견된 것만 출력"""
    if not guiin or not isinstance(guiin, dict):
        return "없음"
    found = []
    for key, val in guiin.items():
        if isinstance(val, list) and val:
            items_str = ", ".join(
                f"{v.get('position','')}{v.get('ji','')}({v.get('name','')})"
                for v in val if isinstance(v, dict)
            )
            found.append(f"  - {key}: {items_str}")
    return "\n".join(found) if found else "없음"


def format_weolun(weolun: Any) -> str:
    """월운 — 현재 + 향후 5개월만"""
    if not weolun or not isinstance(weolun, dict):
        return "(없음)"
    lines = []
    current = weolun.get("currentWeolun")
    if current and isinstance(current, dict):
        label = current.get("monthLabel", "")
        ganji = current.get("ganji", "")
        lines.append(f"  [현재월] {label} {ganji}")
    upcoming = weolun.get("upcomingWeoluns", [])
    if isinstance(upcoming, list):
        for item in upcoming[:5]:
            if isinstance(item, dict):
                label = item.get("monthLabel", "")
                ganji = item.get("ganji", "")
                rel = item.get("sipseongRelation", "")
                lines.append(f"  - {label} {ganji} / 십성: {rel}")
    return "\n".join(lines) if lines else "(없음)"


def format_gyeokguk_yongsin(gky: Any) -> str:
    """격국용신 심층 — 핵심 정보 압축"""
    if not gky or not isinstance(gky, dict):
        return "(없음)"
    parts = []
    if gky.get("geokgukType"):
        parts.append(f"격국: {gky['geokgukType']}")
    if gky.get("seongPaGeok"):
        parts.append(f"성격·파격: {gky['seongPaGeok']}")
    if gky.get("geokgukYongsin"):
        parts.append(f"격국용신: {gky['geokgukYongsin']}")
    if gky.get("sangsin"):
        parts.append(f"상신: {gky['sangsin']}")
    if gky.get("gisin"):
        parts.append(f"기신: {gky['gisin']}")
    if gky.get("summary"):
        parts.append(f"요약: {gky['summary']}")
    return "\n  ".join(parts) if parts else "(없음)"


def stringify_value(val: Any, depth: int = 0) -> str:
    """범용 값 직렬화"""
    if val is None:
        return "(없음)"
    if isinstance(val, str):
        return val
    if isinstance(val, (int, float, bool)):
        return str(val)
    if isinstance(val, list):
        if not val:
            return "(없음)"
        items = [stringify_value(v, depth + 1) for v in val[:10]]
        return "\n  ".join(filter(None, items))
    if isinstance(val, dict):
        lines = []
        for k, v in list(val.items())[:15]:
            sv = stringify_value(v, depth + 1)
            if sv and sv != "(없음)":
                lines.append(f"{k}: {sv}")
        return "\n  ".join(lines) if lines else "(없음)"
    return str(val)


FIELD_LABELS = {
    "ganji": "천간지지(天干地支) 4기둥",
    "sipseong": "십성(十星) 배치",
    "sinStrength": "신강·신약(身强身弱)",
    "gyeokguk": "격국(格局)",
    "gyeokgukYongsin": "격국용신(格局用神) — 자평진전 체계",
    "twelveFortune": "12운성(運星)",
    "daeun": "대운(大運) 흐름",
    "seun": "세운(歲運) 흐름",
    "weolun": "월운(月運) 흐름",
    "hapchung": "합·충·형·해·파(合沖刑害破)",
    "guiin": "귀인(貴人) 현황",
    "sibisinsals": "12신살(神煞)",
    "bigyeonGeobjae": "비견(比肩)·겁재(劫財) 현황",
    "hongyeom": "홍염살(紅艶殺)",
    "dohwa": "도화살(桃花殺)",
    "hwagae": "화개살(華蓋殺)",
}

FIELD_FORMATTERS = {
    "ganji": format_ganji,
    "hapchung": format_hapchung,
    "guiin": format_guiin,
    "weolun": format_weolun,
    "gyeokgukYongsin": format_gyeokguk_yongsin,
}


def format_saju_context(analysis: dict, birth_info: dict) -> str:
    """API 응답 → LLM 프롬프트용 텍스트"""
    if not analysis:
        return "(사주 API 데이터 없음 — 기본 명식으로 분석 진행)"

    lines = ["[사주 풀 명식 16종 데이터]"]

    # 기본 정보
    year = birth_info.get("birthYear", "")
    month = birth_info.get("birthMonth", "")
    day = birth_info.get("birthDay", "")
    hour = birth_info.get("birthHour", "")
    minute = birth_info.get("birthMinute", "")
    calendar = birth_info.get("calendarType", "양력")
    gender = "남성" if birth_info.get("gender") == "male" else "여성"

    time_str = f" {hour}시 {minute}분" if hour else " (시 미상)"
    lines.append(f"생년월일: {year}년 {month}월 {day}일{time_str} ({calendar}) | 성별: {gender}")
    lines.append("")

    for field in ALL_FIELDS:
        val = analysis.get(field)
        if val is None:
            continue
        label = FIELD_LABELS.get(field, field)
        formatter = FIELD_FORMATTERS.get(field, stringify_value)
        formatted = formatter(val)
        if formatted and formatted not in ("(없음)", "(데이터 없음)"):
            lines.append(f"▶ {label}")
            lines.append(f"  {formatted}")
            lines.append("")

    return "\n".join(lines)


def generate_ohaeng_svg(analysis: dict) -> str:
    """오행 분포 SVG 막대 그래프 생성"""
    # sipseong에서 오행 카운트 추정 (간단 구현)
    # 실제로는 ganji 데이터에서 오행을 집계해야 하나, API 응답 구조에 따라 다름
    ganji = analysis.get("ganji", {})

    ohaeng_map = {
        "갑": "목", "을": "목", "인": "목", "묘": "목",
        "병": "화", "정": "화", "사": "화", "오": "화",
        "무": "토", "기": "토", "진": "토", "술": "토", "축": "토", "미": "토",
        "경": "금", "신": "금", "신": "금", "유": "금",
        "임": "수", "계": "수", "자": "수", "해": "수",
    }

    counts = {"목": 0, "화": 0, "토": 0, "금": 0, "수": 0}

    if isinstance(ganji, dict):
        for pillar in ["year", "month", "day", "hour"]:
            p = ganji.get(pillar, {})
            if isinstance(p, dict):
                gan = p.get("gan", "").lower()
                ji = p.get("ji", "").lower()
                for ch in [gan, ji]:
                    if ch in ohaeng_map:
                        counts[ohaeng_map[ch]] += 1

    total = sum(counts.values()) or 8
    colors = {"목": "#4CAF50", "화": "#F44336", "토": "#FF9800", "금": "#9E9E9E", "수": "#2196F3"}

    bars = []
    for i, (elem, count) in enumerate(counts.items()):
        pct = int(count / total * 100)
        x = 40 + i * 70
        bar_h = max(int(pct * 1.2), 5)
        color = colors[elem]
        bars.append(f'<rect x="{x}" y="{140 - bar_h}" width="50" height="{bar_h}" fill="{color}" rx="4"/>')
        bars.append(f'<text x="{x + 25}" y="{155}" text-anchor="middle" font-size="12" fill="#1A1A1A">{elem}</text>')
        bars.append(f'<text x="{x + 25}" y="{130 - bar_h}" text-anchor="middle" font-size="10" fill="#666">{count}</text>')

    return f'''<svg viewBox="0 0 420 170" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:420px">
  <text x="210" y="20" text-anchor="middle" font-size="13" font-weight="bold" fill="#1A1A1A">오행(五行) 분포</text>
  {''.join(bars)}
  <line x1="30" y1="140" x2="390" y2="140" stroke="#ccc" stroke-width="1"/>
</svg>'''


def generate_daeun_table_html(analysis: dict) -> str:
    """대운 흐름표 HTML"""
    daeun = analysis.get("daeun")
    if not daeun or not isinstance(daeun, list):
        return "<p>(대운 데이터 없음)</p>"

    rows = []
    for item in daeun[:10]:
        if not isinstance(item, dict):
            continue
        age = item.get("startAge", "")
        gan = item.get("gan", "")
        ji = item.get("ji", "")
        sipseong = item.get("sipseong", "")
        rows.append(f"<tr><td>{age}세~</td><td>{gan}{ji}</td><td>{sipseong}</td></tr>")

    if not rows:
        return "<p>(대운 데이터 없음)</p>"

    return f"""
<table class="data-table">
  <thead><tr><th>시작 나이</th><th>대운 간지</th><th>십성</th></tr></thead>
  <tbody>{''.join(rows)}</tbody>
</table>"""
