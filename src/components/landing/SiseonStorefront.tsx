"use client";

import { useEffect, useMemo, useRef } from "react";
import { storefrontMarkup } from "./siseon-markup";
import "./siseon-storefront.css";

type Product = { slug: string; name: string; description: string; price: number };
const originals: Record<string, number> = { "ziwei-saju": 100000, "premium-saju": 100000 };
const names: Record<string, string> = {
  "ziwei-saju": "별의 시선", "premium-saju": "깊은 시선", "today-fortune": "오늘의 운세",
  "ilju-sticker": "일주스티커", "dream-reading": "꿈꾸는 시선", "basic-saju": "가벼운 시선",
  "tarot-siren": "타로의 시선", "love-saju": "연인의 시선",
};
const messages: Record<string, string> = {
  "ziwei-saju": "중국 황제가 보던 소름돋는 동양 점성술, 올해부터 향후 10년간 월별 운세 종합 분석",
  "premium-saju": "27개 분석 섹션으로 삶의 큰 흐름을 읽어보세요.",
};
const money = (amount: number) => `${amount.toLocaleString("ko-KR")}원`;
const productUrl = (slug: string) => slug === "tarot-siren" ? "/tarot" : `/products/${slug}`;
const slugFromUrl = (url: URL) => url.pathname === "/tarot" ? "tarot-siren" : url.pathname.startsWith("/products/") ? url.pathname.split("/")[2] : null;

export function SiseonStorefront({ products, isLoggedIn }: { products: Product[]; isLoggedIn: boolean }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const markup = useMemo(() => storefrontMarkup
    .replace("__ACCOUNT_URL__", isLoggedIn ? "/mypage" : "/login")
    .replace("__ACCOUNT_LABEL__", isLoggedIn ? "마이페이지" : "로그인"), [isLoggedIn]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const bySlug = new Map(products.map(p => [p.slug, p]));
    const bar = root.querySelector<HTMLElement>("#offerBar")!;
    const q = <T extends Element>(selector: string) => root.querySelector<T>(selector)!;
    const discount = (slug: string) => {
      const product = bySlug.get(slug), original = originals[slug];
      return product && original && product.price < original ? Math.round((1 - product.price / original) * 100) : 0;
    };
    for (const slug of ["ziwei-saju", "premium-saju"]) {
      const badge = q<HTMLElement>(slug === "ziwei-saju" ? ".premiumViolet .saleFlag" : ".premiumGold .saleFlag");
      const pct = discount(slug);
      badge.textContent = `${pct}% 할인`;
      badge.hidden = !pct;
    }
    // Only active catalog entries may lead to a detail page.
    root.querySelectorAll<HTMLAnchorElement>('a[href^="/products/"], a[href="/tarot"]').forEach(a => {
      const slug = slugFromUrl(new URL(a.href));
      if (slug && !bySlug.has(slug)) a.hidden = true;
    });
    const showOffer = (slug: string) => {
      const product = bySlug.get(slug);
      if (!product) return;
      const premium = slug === "ziwei-saju" || slug === "premium-saju";
      bar.classList.toggle("dual", !premium);
      root.classList.toggle("offerOpen", premium);
      root.classList.toggle("offerDualOpen", !premium);
      if (premium) {
        const pct = discount(slug);
        q<HTMLElement>("#offerBadge").textContent = pct ? `${pct}% 할인` : "판매가";
        q<HTMLElement>("#offerName").textContent = names[slug];
        const original = q<HTMLElement>("#offerOriginal");
        original.replaceChildren();
        if (pct) {
          original.append("정가 ");
          const del = document.createElement("del");
          del.textContent = money(originals[slug]);
          original.append(del);
        }
        q<HTMLElement>("#offerSale").textContent = `${pct ? "할인가" : "판매가"} ${money(product.price)}`;
        q<HTMLElement>("#offerCopy").textContent = messages[slug];
        const cta = q<HTMLAnchorElement>("#offerCta");
        cta.href = productUrl(slug);
        cta.textContent = `${names[slug]} 자세히 보기 ↗`;
      } else {
        const chosen = q<HTMLAnchorElement>("#selectedProductLink");
        chosen.href = productUrl(slug);
        chosen.textContent = `선택한 ${names[slug] ?? product.name} 계속 보기 ↗`;
        ["ziwei-saju", "premium-saju"].forEach((key, index) => {
          const card = q<HTMLElement>(index === 0 ? ".dualOffer.violet" : ".dualOffer.gold");
          const p = bySlug.get(key), pct = discount(key);
          card.hidden = !p;
          if (!p) return;
          card.querySelector<HTMLElement>(".dualBadge")!.textContent = pct ? `${pct}% 할인` : "판매가";
          card.querySelector<HTMLElement>(".dualOriginal")!.hidden = !pct;
          card.querySelector<HTMLElement>(".dualSale")!.innerHTML = `<small>${pct ? "할인가" : "판매가"}</small>${money(p.price)}`;
        });
      }
      bar.hidden = false;
    };
    const hide = () => { bar.hidden = true; root.classList.remove("offerOpen", "offerDualOpen"); };
    const click = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      if (target.closest(".offerClose")) { hide(); return; }
      const a = target.closest<HTMLAnchorElement>("a[href]");
      if (!a || a.dataset.direct === "true") return;
      const url = new URL(a.href);
      if (url.origin !== window.location.origin) return;
      const slug = slugFromUrl(url);
      if (slug && bySlug.has(slug)) { event.preventDefault(); showOffer(slug); }
    };
    const keydown = (event: KeyboardEvent) => { if (event.key === "Escape") hide(); };
    const submit = (event: Event) => {
      event.preventDefault();
      const input = q<HTMLInputElement>("#questionInput");
      const text = input.value.trim();
      if (!text) { input.focus(); return; }
      const slug = /꿈|태몽/.test(text) ? "dream-reading" : /타로|선택|결정/.test(text) ? "tarot-siren"
        : /연애|궁합|남자|여자|연인|사람|재회|결혼|상대/.test(text) ? "love-saju"
        : /돈|재물|직업|이직|사업|일|영역/.test(text) ? "ziwei-saju"
        : /평생|인생|대운|전체|종합/.test(text) ? "premium-saju" : "basic-saju";
      const selected = bySlug.has(slug) ? slug : "basic-saju";
      q<HTMLElement>("#resultTitle").textContent = names[selected] ?? "시선의 풀이";
      q<HTMLElement>("#resultDesc").textContent = bySlug.get(selected)?.description ?? "지금의 질문에 가까운 상품을 살펴보세요.";
      q<HTMLAnchorElement>("#resultLink").href = productUrl(selected);
      q<HTMLElement>("#questionResult").hidden = false;
    };
    root.addEventListener("click", click);
    document.addEventListener("keydown", keydown);
    const form = q<HTMLFormElement>("#questionForm");
    form.addEventListener("submit", submit);
    return () => { root.removeEventListener("click", click); document.removeEventListener("keydown", keydown); form.removeEventListener("submit", submit); };
  }, [products]);

  return <div ref={rootRef} className="siseonStorefront" dangerouslySetInnerHTML={{ __html: markup }} />;
}
