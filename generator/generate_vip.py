"""
깊은 시선 VIP 사주 보고서 생성기
Supabase → 사주 API → 55회 Claude 호출 → HTML → Playwright PDF → Storage → 이메일
"""

import os
import re
import sys
import time
import asyncio
import tempfile
from pathlib import Path
from datetime import datetime

from openai import OpenAI
import resend
from supabase import create_client, Client
from jinja2 import Environment, FileSystemLoader
from playwright.sync_api import sync_playwright
from dotenv import load_dotenv

from saju_utils import (
    build_birth_info,
    fetch_saju_analysis,
    format_saju_context,
    generate_ohaeng_svg,
    generate_daeun_table_html,
)
from prompts import get_all_chapters, PARTS_META

# ── 환경변수 로드 ──────────────────────────────────────────────
load_dotenv()

OPENAI_API_KEY = os.environ["OPENAI_API_KEY"]
SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_SECRET_KEY = os.environ["SUPABASE_SECRET_KEY"]
RESEND_API_KEY = os.environ.get("RESEND_API_KEY", "")
RESEND_FROM_EMAIL = os.environ.get("RESEND_FROM_EMAIL", "noreply@saju7.kr")
SITE_URL = os.environ.get("SITE_URL", "https://www.saju7.kr")
LLM_MODEL = os.environ.get("LLM_MODEL", "").strip() or "gpt-4o"

DRY_RUN = "--dry-run" in sys.argv  # HTML만 생성, API 호출 없음
GENERATOR_DIR = Path(__file__).parent


# ── Supabase 클라이언트 ────────────────────────────────────────
def get_supabase() -> Client:
    return create_client(SUPABASE_URL, SUPABASE_SECRET_KEY)


# ── 대기 중인 작업 조회 ────────────────────────────────────────
def fetch_pending(supabase: Client) -> list[dict]:
    res = (
        supabase.table("saju_results")
        .select("id, order_id, myeongsik, created_at")
        .eq("generation_status", "generating")
        .execute()
    )
    return res.data or []


# ── 사주 입력 정보 조회 ────────────────────────────────────────
def load_saju_input(supabase: Client, order_id: str) -> dict:
    res = (
        supabase.table("saju_inputs")
        .select("*")
        .eq("order_id", order_id)
        .single()
        .execute()
    )
    return res.data or {}


# ── 주문자 이메일 조회 ────────────────────────────────────────
def get_user_email(supabase: Client, order_id: str) -> str | None:
    try:
        order_res = (
            supabase.table("orders")
            .select("user_id")
            .eq("id", order_id)
            .single()
            .execute()
        )
        user_id = order_res.data.get("user_id") if order_res.data else None
        if not user_id:
            return None
        user_res = (
            supabase.rpc("get_user_email", {"uid": user_id})
            .execute()
        )
        return user_res.data
    except Exception as e:
        print(f"  [email] 이메일 조회 실패: {e}")
        return None


# ── 55개 챕터 LLM 호출 ─────────────────────────────────────────
def generate_all_chapters(
    name: str, saju_context: str, start_year: int
) -> dict[str, str]:
    """챕터 키 → 본문 텍스트 딕셔너리 반환"""
    if DRY_RUN:
        print("  [dry-run] LLM 호출 건너뜀 — 샘플 텍스트로 대체")
        chapters_raw = get_all_chapters(name, saju_context, start_year)
        return {
            key: f"[DRY-RUN] {key} 챕터 샘플 텍스트입니다. 실제 실행 시 GPT-4o가 상세 내용을 작성합니다."
            for key, _ in chapters_raw
        }

    client = OpenAI(api_key=OPENAI_API_KEY)
    chapters_raw = get_all_chapters(name, saju_context, start_year)
    results: dict[str, str] = {}
    total = len(chapters_raw)

    for i, (key, user_prompt) in enumerate(chapters_raw, 1):
        print(f"  [{i:02d}/{total}] {key} 생성 중...", end=" ", flush=True)
        t0 = time.time()
        try:
            resp = client.chat.completions.create(
                model=LLM_MODEL,
                max_tokens=4096,
                messages=[
                    {"role": "system", "content": _get_system_prompt()},
                    {"role": "user", "content": user_prompt},
                ],
            )
            content = resp.choices[0].message.content or ""
            results[key] = content
            elapsed = time.time() - t0
            chars = len(content)
            print(f"완료 ({chars:,}자, {elapsed:.1f}s)")
        except Exception as e:
            print(f"실패 — {e}")
            results[key] = f"[생성 오류: {key}]"
        # API rate limit 방지
        time.sleep(0.3)

    return results


def _get_system_prompt() -> str:
    from prompts import SYSTEM_PROMPT
    return SYSTEM_PROMPT


# ── 생년월일 문자열 포맷 ───────────────────────────────────────
def format_birth_date_str(saju_input: dict) -> str:
    birth_date = saju_input.get("birth_date") or ""
    calendar_type = "음력" if saju_input.get("calendar") == "lunar" else "양력"
    birth_time = saju_input.get("birth_time")
    time_unknown = saju_input.get("time_unknown", False)

    date_str = birth_date.replace("-", "년 ", 1).replace("-", "월 ") + "일"
    if time_unknown or not birth_time:
        time_str = "(시 미상)"
    else:
        parts = birth_time.split(":")
        hh, mm = parts[0], parts[1]  # 초(ss) 무시
        time_str = f"{int(hh)}시 {int(mm)}분"

    return f"{date_str} {time_str} ({calendar_type})"


# ── 마크다운 인라인 변환 ───────────────────────────────────────
def _md_inline(text: str) -> str:
    """**bold** → <strong>, *italic* → <em>"""
    text = re.sub(r'\*\*(.+?)\*\*', r'<strong>\1</strong>', text)
    text = re.sub(r'\*(.+?)\*', r'<em>\1</em>', text)
    return text


def text_to_html(text: str) -> str:
    """GPT 생성 텍스트 → HTML 변환 (단락 분리 + 마크다운 처리)"""
    if not text:
        return ""
    paras = []
    for block in text.split("\n\n"):
        block = block.strip()
        if not block:
            continue
        # 헤딩
        if block.startswith("### "):
            paras.append(f"<h3>{_md_inline(block[4:])}</h3>")
        elif block.startswith("## "):
            paras.append(f"<h3>{_md_inline(block[3:])}</h3>")
        elif block.startswith("# "):
            paras.append(f"<h3>{_md_inline(block[2:])}</h3>")
        # 리스트 블록 (- 또는 * 로 시작하는 줄이 포함된 경우)
        elif any(ln.strip().startswith("- ") or ln.strip().startswith("* ")
                 for ln in block.split("\n")):
            items = []
            for ln in block.split("\n"):
                ln = ln.strip()
                if ln.startswith("- ") or ln.startswith("* "):
                    items.append(f"<li>{_md_inline(ln[2:])}</li>")
                elif ln:
                    items.append(f"<li>{_md_inline(ln)}</li>")
            paras.append("<ul>" + "".join(items) + "</ul>")
        else:
            # 일반 단락 — 줄바꿈을 공백으로 합쳐 한 단락으로
            lines = [_md_inline(ln.strip()) for ln in block.split("\n") if ln.strip()]
            paras.append("<p>" + " ".join(lines) + "</p>")
    return "\n".join(paras)


# ── 사주 4기둥 테이블 데이터 구성 ─────────────────────────────
def build_pillars(analysis: dict) -> dict:
    """가나, 지지, 십성 등 4기둥 → 템플릿용 flat dict
    템플릿이 pillars.hour_gan, pillars.day_gan 등으로 직접 접근하므로 flat dict 반환.
    """
    ganji = analysis.get("ganji", {})
    sipseong = analysis.get("sipseong", {})
    twelve = analysis.get("twelveFortune", {})

    result = {}
    for pillar_key, prefix in [("year", "year"), ("month", "month"), ("day", "day"), ("hour", "hour")]:
        p = ganji.get(pillar_key, {}) if isinstance(ganji, dict) else {}
        ss = sipseong.get(pillar_key, "") if isinstance(sipseong, dict) else ""
        tf = twelve.get(pillar_key, "") if isinstance(twelve, dict) else ""

        if isinstance(p, dict):
            result[f"{prefix}_gan"] = p.get("gan", "")
            result[f"{prefix}_ji"] = p.get("ji", "")
        else:
            result[f"{prefix}_gan"] = "(미상)" if pillar_key == "hour" else ""
            result[f"{prefix}_ji"] = ""

        result[f"{prefix}_gan_sipseong"] = ss
        result[f"{prefix}_ji_twelvef"] = tf

    return result


# ── PART 구조 → 챕터 배치 ─────────────────────────────────────
def build_parts(chapter_texts: dict[str, str], start_year: int = 2026) -> list[dict]:
    """prompts.PARTS_META 기반으로 챕터를 PART별로 분류"""
    parts = []
    for meta in PARTS_META:
        # PART 10: 연도별 챕터를 동적으로 구성
        if meta["num"] == "10":
            chapter_list = [(f"p10_{start_year + i}", f"{start_year + i}년 운세") for i in range(10)]
        else:
            chapter_list = meta["chapters"]

        part_chapters = []
        for idx, (ch_key, ch_title) in enumerate(chapter_list, 1):
            text = chapter_texts.get(ch_key, "")
            is_wealth = meta["num"] == "04"
            paragraphs = [p.strip() for p in text.split("\n\n") if p.strip()]
            part_chapters.append({
                "key": ch_key,
                "num": f"PART {meta['num']} — {idx:02d}",   # 템플릿 chapter.num 용
                "title": ch_title,
                "text": text,
                "is_wealth": is_wealth,
                "paragraphs": paragraphs,
                "content": text_to_html(text),               # 템플릿 chapter.content | safe 용
            })
        parts.append({
            "num": meta["num"],
            "title": meta["title"],
            "hanja": meta.get("hanja", ""),
            "desc": meta.get("desc", ""),
            "deco": meta.get("deco", ""),
            "chapters": part_chapters,
        })
    return parts


# ── Jinja2 HTML 렌더링 ─────────────────────────────────────────
def render_html(
    saju_input: dict,
    analysis: dict,
    chapter_texts: dict[str, str],
) -> str:
    env = Environment(
        loader=FileSystemLoader(str(GENERATOR_DIR / "templates")),
        autoescape=False,
    )
    tmpl = env.get_template("vip_report.html.jinja2")

    name = saju_input.get("name") or "고객"
    gender = saju_input.get("gender", "female")
    calendar_type = saju_input.get("calendar", "solar")
    birth_date = saju_input.get("birth_date") or ""

    # 시작 연도 (세운용)
    try:
        birth_year = int(birth_date[:4]) if birth_date else 1990
        current_year = datetime.now().year
        start_year = max(current_year - 1, birth_year + 20)
    except Exception:
        start_year = datetime.now().year

    ctx = {
        "name": name,
        "birth_date_str": format_birth_date_str(saju_input),
        "gender_text": "남성" if gender == "male" else "여성",
        "calendar_text": "음력" if calendar_type == "lunar" else "양력",
        "birth_time_str": saju_input.get("birth_time") or "(시 미상)",
        "report_date": datetime.now().strftime("%Y년 %m월 %d일"),
        "pillars": build_pillars(analysis),
        "ohaeng_svg": generate_ohaeng_svg(analysis),
        "daeun_table": generate_daeun_table_html(analysis),
        "parts": build_parts(chapter_texts, start_year),
        "site_url": SITE_URL,
    }
    return tmpl.render(**ctx)


# ── HTML → PDF (Playwright) ────────────────────────────────────
def html_to_pdf(html: str) -> bytes:
    with tempfile.NamedTemporaryFile(suffix=".html", mode="w", encoding="utf-8", delete=False) as f:
        f.write(html)
        tmp_path = f.name

    try:
        with sync_playwright() as p:
            browser = p.chromium.launch()
            page = browser.new_page()
            page.goto(f"file://{tmp_path}", wait_until="networkidle", timeout=60_000)
            # 폰트 로드 대기
            page.wait_for_timeout(3000)
            pdf_bytes = page.pdf(
                format="A5",
                print_background=True,
                margin={"top": "15mm", "bottom": "15mm", "left": "12mm", "right": "12mm"},
            )
            browser.close()
        return pdf_bytes
    finally:
        Path(tmp_path).unlink(missing_ok=True)


# ── Supabase Storage 업로드 ────────────────────────────────────
def upload_pdf(supabase: Client, result_id: str, pdf_bytes: bytes) -> str:
    path = f"{result_id}.pdf"
    supabase.storage.from_("vip-pdfs").upload(
        path,
        pdf_bytes,
        {"content-type": "application/pdf", "upsert": "true"},
    )
    return path


# ── DB 업데이트 ────────────────────────────────────────────────
def update_result(supabase: Client, result_id: str, pdf_path: str, status: str = "complete"):
    supabase.table("saju_results").update({
        "generation_status": status,
        "pdf_url": pdf_path,
    }).eq("id", result_id).execute()


def mark_failed(supabase: Client, result_id: str):
    supabase.table("saju_results").update({
        "generation_status": "failed",
    }).eq("id", result_id).execute()


# ── 이메일 발송 ────────────────────────────────────────────────
def send_email(name: str, email: str, result_id: str):
    if not RESEND_API_KEY or not email:
        print(f"  [email] 건너뜀 (key={bool(RESEND_API_KEY)}, email={email})")
        return

    resend.api_key = RESEND_API_KEY
    download_url = f"{SITE_URL}/results/{result_id}"

    try:
        resend.Emails.send({
            "from": RESEND_FROM_EMAIL,
            "to": [email],
            "subject": f"[시선] {name}님의 깊은 시선 VIP 보고서가 완성되었습니다",
            "html": f"""
<!DOCTYPE html>
<html lang="ko">
<head><meta charset="UTF-8"></head>
<body style="font-family: 'Apple SD Gothic Neo', 'Noto Sans KR', sans-serif; background:#F5F0E6; margin:0; padding:0;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
    <tr>
      <td style="background:#2D5C5C;padding:32px 40px;text-align:center;">
        <h1 style="color:#F5F0E6;font-size:22px;margin:0;letter-spacing:2px;">시선 視線</h1>
        <p style="color:#a8c5c5;font-size:13px;margin:8px 0 0;">정통 명리학 × AI</p>
      </td>
    </tr>
    <tr>
      <td style="padding:40px;">
        <p style="font-size:16px;color:#1A1A1A;line-height:1.7;">
          <strong>{name}님</strong>, 안녕하세요.<br><br>
          정성을 담아 작성한 <strong>깊은 시선 VIP 사주 보고서</strong>가 완성되었습니다.
        </p>
        <p style="font-size:14px;color:#555;line-height:1.8;">
          총 <strong>11~12만 자</strong>의 심층 분석이 담긴 PDF 보고서를<br>
          아래 버튼을 눌러 확인하고 다운로드하세요.
        </p>
        <div style="text-align:center;margin:36px 0;">
          <a href="{download_url}"
             style="display:inline-block;background:#2D5C5C;color:#F5F0E6;text-decoration:none;padding:16px 40px;border-radius:8px;font-size:16px;font-weight:bold;letter-spacing:1px;">
            보고서 확인 및 다운로드
          </a>
        </div>
        <p style="font-size:12px;color:#999;text-align:center;">
          링크는 7일간 유효합니다. 문의: {RESEND_FROM_EMAIL}
        </p>
      </td>
    </tr>
    <tr>
      <td style="background:#F5F0E6;padding:20px 40px;text-align:center;">
        <p style="font-size:11px;color:#aaa;margin:0;">
          © 시선(視線) | <a href="{SITE_URL}" style="color:#2D5C5C;">{SITE_URL}</a>
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
""",
        })
        print(f"  [email] 발송 완료 → {email}")
    except Exception as e:
        print(f"  [email] 발송 실패: {e}")


# ── 단건 처리 ──────────────────────────────────────────────────
def generate_one(supabase: Client, result: dict):
    result_id = result["id"]
    order_id = result["order_id"]
    print(f"\n{'='*60}")
    print(f"[VIP] result_id={result_id}")

    try:
        # 1. 사주 입력 정보 로드
        saju_input = load_saju_input(supabase, order_id)
        if not saju_input:
            print("  [오류] saju_inputs 데이터 없음")
            mark_failed(supabase, result_id)
            return
        name = saju_input.get("name") or "고객"
        print(f"  이름: {name} | 생년월일: {saju_input.get('birth_date')}")

        # 2. 사주 API 16종 데이터
        print("  [1/6] 사주 API 호출 중...")
        birth_info = build_birth_info(saju_input)
        analysis = fetch_saju_analysis(birth_info) if not DRY_RUN else {}
        saju_context = format_saju_context(analysis, birth_info)
        print(f"  사주 컨텍스트 길이: {len(saju_context):,}자")

        # 시작 연도 계산
        birth_date = saju_input.get("birth_date") or ""
        try:
            birth_year = int(birth_date[:4])
            start_year = max(datetime.now().year - 1, birth_year + 20)
        except Exception:
            start_year = datetime.now().year

        # 3. 55챕터 LLM 호출
        print(f"  [2/6] GPT 호출 시작 (model={LLM_MODEL})...")
        chapter_texts = generate_all_chapters(name, saju_context, start_year)
        total_chars = sum(len(v) for v in chapter_texts.values())
        print(f"  총 {len(chapter_texts)}챕터 / {total_chars:,}자 생성 완료")

        # 4. HTML 렌더링
        print("  [3/6] HTML 렌더링 중...")
        html = render_html(saju_input, analysis, chapter_texts)
        print(f"  HTML 크기: {len(html):,}자")

        # dry-run: HTML 저장 후 종료
        if DRY_RUN:
            out_path = GENERATOR_DIR / f"dry_run_{result_id}.html"
            out_path.write_text(html, encoding="utf-8")
            print(f"  [dry-run] HTML 저장 → {out_path}")
            return

        # 5. PDF 변환
        print("  [4/6] Playwright PDF 변환 중...")
        pdf_bytes = html_to_pdf(html)
        print(f"  PDF 크기: {len(pdf_bytes):,} bytes ({len(pdf_bytes)//1024} KB)")

        # 6. Storage 업로드
        print("  [5/6] Supabase Storage 업로드 중...")
        pdf_path = upload_pdf(supabase, result_id, pdf_bytes)
        print(f"  업로드 완료: {pdf_path}")

        # 7. DB 업데이트
        print("  [6/6] DB 업데이트 중...")
        update_result(supabase, result_id, pdf_path, "complete")

        # 8. 이메일 발송
        email = get_user_email(supabase, order_id)
        if email:
            send_email(name, email, result_id)

        print(f"  [완료] {result_id}")

    except Exception as e:
        import traceback
        print(f"  [오류] {e}")
        traceback.print_exc()
        try:
            mark_failed(supabase, result_id)
        except Exception:
            pass


# ── 메인 ──────────────────────────────────────────────────────
def main():
    print(f"[VIP Generator] {datetime.now().strftime('%Y-%m-%d %H:%M:%S')} 시작")
    if DRY_RUN:
        print("[dry-run 모드] LLM·PDF·스토리지 건너뜀")

    supabase = get_supabase()
    pending = fetch_pending(supabase)

    if not pending:
        print("[완료] 처리 대기 중인 작업 없음")
        return

    print(f"[대기] {len(pending)}건 처리 시작")
    for result in pending:
        generate_one(supabase, result)

    print(f"\n[VIP Generator] 전체 완료 ({len(pending)}건)")


if __name__ == "__main__":
    main()
