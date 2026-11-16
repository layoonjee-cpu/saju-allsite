import Link from "next/link";
import { formatKRW } from "@/lib/utils";
import { CatalogProduct, editorial, productHref } from "./catalog";
import styles from "./renewal.module.css";

function ProductCard({p, featured = false}: {p:CatalogProduct; featured?:boolean}) {
  const e = editorial[p.slug];
  const symbols: Record<string,string> = {"today-fortune":"日","ilju-sticker":"壹","dream-reading":"夢","basic-saju":"命","tarot-siren":"問","love-saju":"緣","ziwei-saju":"星","premium-saju":"深"};
  return <Link href={productHref(p.slug)} className={`${styles.card} ${featured ? styles.featured : ""}`}>
    <div className={styles.cardArt} aria-hidden="true"><span className={styles.artCircle}/><span className={styles.symbol}>{symbols[p.slug] ?? "視"}</span><span className={styles.artCaption}>SISEON · 視線</span></div>
    <div className={styles.cardCopy}>
      <span className={styles.eyebrow}>{e?.eyebrow ?? "시선 사주"}</span>
      <h3>{e?.question ?? p.name}</h3>
      <p className={styles.productName}>{p.name}</p>
      <p className={styles.cardDetail}>{e?.detail ?? p.description}</p>
      <div className={styles.cardBottom}><strong>{p.price === 0 ? "무료" : formatKRW(p.price)}</strong><span>자세히 보기 <span aria-hidden="true">↗</span></span></div>
    </div>
  </Link>;
}

export function CatalogView({products, home = false}: {products:CatalogProduct[];home?:boolean}) {
  const groups = [
    {key:"start", index:"01", title:"가볍게 시작하는 시선", subtitle:"무료부터 4,900원까지. 부담 없이 나를 알아가는 첫걸음."},
    {key:"focus", index:"02", title:"지금의 고민에 집중", subtitle:"하나의 질문, 혹은 두 사람의 관계를 더 가까이."},
    {key:"deep", index:"03", title:"삶을 깊게 읽는 보고서", subtitle:"더 넓은 시간과 영역을 살펴보고 싶을 때."},
  ];
  const known = products.filter(p => editorial[p.slug]);
  const other = products.filter(p => !editorial[p.slug]);
  return <div className={styles.shell}>
    {home ? <>
      <section className={styles.hero}>
        <div className={styles.heroText}><span className={styles.heroKicker}>SISEON · 視線</span><h1>지금 나에게 필요한<br/><em>하나의 시선.</em></h1><p>가볍게 시작해도, 깊이 들여다봐도 괜찮아요.<br/>당신의 질문에 맞는 사주를 고르세요.</p><div className={styles.heroActions}><Link href="/products/basic-saju" className={styles.primaryBtn}>4,900원 사주부터 보기 <span aria-hidden="true">↗</span></Link><Link href="/products/today-fortune" className={styles.textBtn}>오늘의 운세 무료로 보기</Link></div></div>
        <div className={styles.heroArt} aria-hidden="true"><span className={styles.moon}/><span className={styles.orbit}/><span className={styles.heroGlyph}>視線</span><span className={styles.heroArtLabel}>운명을 단정하지 않고, 지금을 함께 읽습니다.</span></div>
      </section>
      <nav className={styles.quickNav} aria-label="상품 가격대별 바로가기"><a href="#start"><span>첫 시선</span><b>무료 ~ 4,900원</b></a><a href="#focus"><span>고민별 시선</span><b>타로 · 궁합</b></a><a href="#deep"><span>깊은 시선</span><b>심층 보고서</b></a></nav>
      <section className={styles.intro}><span>THE SISEON WAY</span><p>운명을 점치지 않습니다.<br/><strong>당신의 지금</strong>을 함께 읽어드립니다.</p></section>
    </> : <header className={styles.catalogHeader}><span className={styles.eyebrow}>SISEON COLLECTION</span><h1>어떤 질문을 가지고 오셨나요?</h1><p>오늘의 작은 궁금증부터 인생 전체를 보는 보고서까지.<br/>가격과 내용을 비교하고 나에게 맞는 시선을 고르세요.</p><nav className={styles.catalogNav} aria-label="상품 분류"><a href="#start">가볍게 시작</a><a href="#focus">고민에 집중</a><a href="#deep">깊이 읽기</a></nav></header>}
    {groups.map(g => { const items = known.filter(p => editorial[p.slug].group === g.key).sort((a,b) => g.key === "start" ? (a.slug === "basic-saju" ? -1 : b.slug === "basic-saju" ? 1 : a.price-b.price) : 0); if (!items.length) return null; return <section id={g.key} key={g.key} className={styles.group}><div className={styles.groupHeading}><span>{g.index} / 03</span><h2>{g.title}</h2><p>{g.subtitle}</p></div><div className={styles.cardGrid}>{items.map(p => <ProductCard key={p.slug} p={p} featured={p.slug === "basic-saju" || p.slug === "premium-saju"}/>)}</div></section>; })}
    {other.length > 0 && <section className={styles.group}><div className={styles.groupHeading}><h2>더 많은 시선</h2></div><div className={styles.cardGrid}>{other.map(p=><ProductCard key={p.slug} p={p}/>)}</div></section>}
    <section className={styles.compare}><span className={styles.eyebrow}>NOT SURE WHERE TO START?</span><h2>처음이라면 이렇게 골라보세요.</h2><div><Link href="/products/basic-saju"><span>나를 처음 알아보고 싶다면</span><strong>가벼운 시선 <span aria-hidden="true">↗</span></strong></Link><Link href="/products/premium-saju"><span>삶의 흐름을 한 번에 보고 싶다면</span><strong>깊은 시선 <span aria-hidden="true">↗</span></strong></Link></div></section>
    <p className={styles.caution}>사주는 삶을 이해하는 참고 자료입니다. 개인의 미래를 확정하거나 전문적 판단을 대신하지 않습니다.</p>
  </div>;
}
