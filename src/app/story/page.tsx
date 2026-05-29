import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import styles from "./story.module.css";

export const metadata: Metadata = {
  title: "시선사주 스토리",
  description: "정통 명리학과 AI 데이터가 함께 들여다보는 당신의 사주. 시선(視線)의 브랜드 스토리와 16가지 분석 도구를 소개합니다.",
};

export default function StoryPage() {
  return (
    <div className={styles.page}>
      {/* ━━━ HERO ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <div className={styles.heroIllustration}>
            <Image
              src="/profile_image.png"
              alt="시선 사주 — 한복을 입은 인물"
              fill
              className="object-cover"
              priority
            />
          </div>
          <div className={styles.heroCopy}>
            <div className={styles.heroLabelEn}>SISEON · 視線</div>
            <h1 className={styles.heroHeadline}>
              시선을 사로잡는<br />
              <span className="accent" style={{ color: "#2A8074" }}>사주분석</span>
            </h1>
            <hr className={styles.heroDivider} />
            <p className={styles.heroSubcopy}>
              정통 명리학과 AI 데이터가 함께 들여다보는<br />
              당신의 사주, 그 깊은 결
            </p>
            <div className={styles.heroBadge}>深 視 線 · 깊은 시선</div>
          </div>
        </div>
      </section>

      {/* ━━━ INTRO QUOTE ━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section className={styles.introQuote}>
        <blockquote>
          &ldquo;운명을 점치지 않습니다.<br />
          <span className="accent" style={{ color: "#E8954A" }}>당신의 지금</span>을 함께 읽어드립니다.&rdquo;
        </blockquote>
        <cite>— 시선 사주 드림 —</cite>
      </section>

      {/* ━━━ WHY SISEON ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section className={styles.container}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionEn}>WHY SISEON</div>
          <h2 className={styles.sectionTitle}>왜 시선이어야 하는가</h2>
          <hr className={styles.divider} />
        </div>
        <div className={styles.whyGrid}>
          <div className={styles.whyCard}>
            <div className={styles.hanja} style={{ fontFamily: "var(--font-display, 'Noto Serif KR', serif)", fontSize: 32, color: "#2A8074", marginBottom: "0.5rem", fontWeight: 500 }}>壹</div>
            <div className={styles.title} style={{ fontSize: 14, fontWeight: 500, marginBottom: "0.5rem" }}>정통 명리학</div>
            <div className={styles.desc} style={{ fontSize: 12, color: "#6B6863", lineHeight: 1.6 }}>16종 분석 도구를 빠짐없이 적용</div>
          </div>
          <div className={styles.whyCard}>
            <div style={{ fontFamily: "var(--font-display, 'Noto Serif KR', serif)", fontSize: 32, color: "#2A8074", marginBottom: "0.5rem", fontWeight: 500 }}>貳</div>
            <div style={{ fontSize: 14, fontWeight: 500, marginBottom: "0.5rem" }}>AI 데이터 분석</div>
            <div style={{ fontSize: 12, color: "#6B6863", lineHeight: 1.6 }}>수만 건의 사례에서 길어 올린 통찰</div>
          </div>
          <div className={styles.whyCard}>
            <div style={{ fontFamily: "var(--font-display, 'Noto Serif KR', serif)", fontSize: 32, color: "#2A8074", marginBottom: "0.5rem", fontWeight: 500 }}>參</div>
            <div style={{ fontSize: 14, fontWeight: 500, marginBottom: "0.5rem" }}>현실적 조언</div>
            <div style={{ fontSize: 12, color: "#6B6863", lineHeight: 1.6 }}>일상에서 바로 쓸 수 있는 해답</div>
          </div>
        </div>
      </section>

      {/* ━━━ PRODUCT LINEUP ━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section className={styles.container}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionEn}>PRODUCT</div>
          <h2 className={styles.sectionTitle}>시선의 다섯 가지 시선</h2>
          <hr className={styles.divider} />
        </div>
        <div className={styles.productList}>

          <Link href="/products/today-fortune" className={styles.productCard}>
            <div className={styles.iconHanja}>日</div>
            <div className={styles.productInfo}>
              <div className={styles.nameRow}>
                <span className={styles.productName}>오늘의 운세</span>
                <span className={styles.productMeta}>매일 무료</span>
              </div>
              <div className={styles.productDesc}>매일 아침, 오늘 하루의 결을 짚어드려요</div>
            </div>
            <div className={`${styles.productPrice} ${styles.productPriceFree}`}>무료</div>
          </Link>

          <Link href="/products/dream-reading" className={styles.productCard}>
            <div className={styles.iconHanja}>夢</div>
            <div className={styles.productInfo}>
              <div className={styles.nameRow}>
                <span className={styles.productName}>꿈꾸는 시선</span>
                <span className={styles.productMeta}>꿈해몽</span>
              </div>
              <div className={styles.productDesc}>잊을 수 없는 그 꿈, 반드시 짚고 넘어가야 해요</div>
            </div>
            <div className={styles.productPrice}>1,900<small>원</small></div>
          </Link>

          <Link href="/products/basic-saju" className={styles.productCard}>
            <div className={styles.iconHanja}>輕</div>
            <div className={styles.productInfo}>
              <div className={styles.nameRow}>
                <span className={styles.productName}>가벼운 시선 사주</span>
                <span className={styles.productMeta}>기본 사주풀이 · 입문</span>
              </div>
              <div className={styles.productDesc}>내 사주를 처음 들여다보는 분께 권하는 입문 상품</div>
            </div>
            <div className={styles.productPrice} style={{ textAlign: "right" }}>
              <span style={{ fontSize: 10, color: "#bbb", textDecoration: "line-through", display: "block", lineHeight: 1.3 }}>9,900원</span>
              4,900<small>원</small>
            </div>
          </Link>

          <Link href="/products/love-saju" className={styles.productCard}>
            <div className={`${styles.iconHanja} ${styles.iconHanjaPink}`}>緣</div>
            <div className={styles.productInfo}>
              <div className={styles.nameRow}>
                <span className={styles.productName}>연인의 시선</span>
                <span className={styles.productMeta}>10가지 궁합분석 · 심층</span>
              </div>
              <div className={styles.productDesc}>두 사람의 결, 갈등의 원인과 해결의 실마리까지</div>
            </div>
            <div className={styles.productPrice} style={{ textAlign: "right" }}>
              <span style={{ fontSize: 10, color: "#bbb", textDecoration: "line-through", display: "block", lineHeight: 1.3 }}>50,000원</span>
              20,000<small>원</small>
            </div>
          </Link>

          <Link href="/products/premium-saju" className={`${styles.productCard} ${styles.productCardVip}`}>
            <div className={styles.vipBadge}>VIP · 베스트셀러</div>
            <div className={`${styles.iconHanja} ${styles.iconHanjaLg}`}>深</div>
            <div className={styles.productInfo}>
              <div className={styles.nameRow}>
                <span className={styles.productName}>깊은 시선 사주</span>
                <span className={styles.productMeta}>27개 섹션 · 완전분석</span>
              </div>
              <div className={styles.productDesc}>당신의 인생 전체를 한 권의 책처럼 펼쳐드립니다</div>
            </div>
            <div className={styles.productCardVipPrice}>
              <span style={{ fontSize: 10, color: "#b0a89a", textDecoration: "line-through", display: "block", lineHeight: 1.3, textAlign: "right" }}>60,000원</span>
              30,000<small style={{ fontSize: 11, color: "#9B958B", marginLeft: 2 }}>원</small>
            </div>
          </Link>

        </div>
      </section>

      {/* ━━━ PREMIUM DEEP DIVE ━━━━━━━━━━━━━━━━━━━━━━ */}
      <section className={styles.container}>
        <div className={styles.premiumBox}>
          <div className={styles.premiumHeader}>
            <div className={styles.premiumLabel}>PREMIUM</div>
            <h2 className={styles.premiumTitle}>깊은 시선 사주 (VIP)</h2>
            <div className={styles.premiumSub}>27개 섹션 심층분석 · 정통 명리학 16종 도구의 총체</div>
          </div>

          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <div className={styles.statValue}>16<small>종</small></div>
              <div className={styles.statLabel}>분석 도구</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statValue}>27<small>개</small></div>
              <div className={styles.statLabel}>심층 섹션</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statValue}>15<small>개월</small></div>
              <div className={styles.statLabel}>월별 운세</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statValue}>10<small>년</small></div>
              <div className={styles.statLabel}>대운 분석</div>
            </div>
          </div>

          <div className={styles.whatYouGet}>
            <div className={styles.whatHeading}>WHAT YOU GET</div>
            <div className={styles.whatList}>
              <div className={styles.whatItem}>
                <div className={`${styles.iconHanja} ${styles.iconHanjaSm}`}>命</div>
                <div>
                  <div className={styles.whatItemTitle}>사주 원국 정밀 분석</div>
                  <div className={styles.whatItemDesc}>명식·오행 균형·사주 구조의 전체 지도</div>
                </div>
              </div>
              <div className={styles.whatItem}>
                <div className={`${styles.iconHanja} ${styles.iconHanjaSm}`}>性</div>
                <div>
                  <div className={styles.whatItemTitle}>타고난 기질과 성향</div>
                  <div className={styles.whatItemDesc}>당신이라는 사람의 본질, 강점과 약점</div>
                </div>
              </div>
              <div className={styles.whatItem}>
                <div className={`${styles.iconHanja} ${styles.iconHanjaSm}`}>運</div>
                <div>
                  <div className={styles.whatItemTitle}>대운 시기별 흐름</div>
                  <div className={styles.whatItemDesc}>10년 단위로 펼쳐지는 인생의 큰 물결과 결정적 시기</div>
                </div>
              </div>
              <div className={`${styles.whatItem} ${styles.whatItemMoney}`}>
                <div className={`${styles.iconHanja} ${styles.iconHanjaSm}`} style={{ background: "#E8954A", color: "white" }}>財</div>
                <div>
                  <div className={styles.whatItemTitle} style={{ color: "#7A3F12", display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                    평생 재물운 (강화 분석) <span className={styles.badgeCore}>CORE</span>
                  </div>
                  <div className={styles.whatItemDesc} style={{ color: "#7A3F12" }}>재물 그릇·돈의 흐름·횡재수와 손재수의 시기까지</div>
                </div>
              </div>
              <div className={styles.whatItem}>
                <div className={`${styles.iconHanja} ${styles.iconHanjaSm}`}>愛</div>
                <div>
                  <div className={styles.whatItemTitle}>연애운 · 결혼운</div>
                  <div className={styles.whatItemDesc}>인연의 시기, 어울리는 사람의 결, 평생의 동반자 상</div>
                </div>
              </div>
              <div className={styles.whatItem}>
                <div className={`${styles.iconHanja} ${styles.iconHanjaSm}`}>貴</div>
                <div>
                  <div className={styles.whatItemTitle}>내 인생의 귀인</div>
                  <div className={styles.whatItemDesc}>어디서, 어떤 모습으로 당신을 도울 사람이 나타날지</div>
                </div>
              </div>
              <div className={styles.whatItem}>
                <div className={`${styles.iconHanja} ${styles.iconHanjaSm}`}>開</div>
                <div>
                  <div className={styles.whatItemTitle}>나만의 개운법</div>
                  <div className={styles.whatItemDesc}>사주에 맞춰 일상에서 실천할 수 있는 운을 여는 방법</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ━━━ 16 TOOLS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section className={styles.container}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionEn}>16 TOOLS</div>
          <h2 className={styles.sectionTitle}>시선을 사로잡는 16가지 시선</h2>
          <div className={styles.sectionSub}>정통 명리학의 모든 분석 도구를 한 자리에</div>
          <hr className={styles.divider} />
        </div>

        {/* 카테고리 壹 */}
        <div className={styles.toolsCategory}>
          <div className={styles.toolsCategoryHeader}>
            <div className={styles.toolsCategoryNum}>壹</div>
            <div className={styles.toolsCategoryTitle}>뼈대 세우기 — 사주의 골격</div>
            <div className={styles.toolsCategoryCount}>3종</div>
          </div>
          <div className={styles.toolList}>
            <div className={styles.toolCard}>
              <div className={styles.toolCardHead}>
                <span className={styles.toolNum}>01</span>
                <span className={styles.toolName}>사주팔자 — 천간지지</span>
              </div>
              <div className={styles.toolDesc}>태어난 연·월·일·시를 천간과 지지의 조합으로 표시한 여덟 글자. 년주(조상·뿌리), 월주(부모·사회), 일주(나와 배우자), 시주(자녀·말년)로 인생의 네 기둥을 세웁니다. 모든 분석의 출발점입니다.</div>
            </div>
            <div className={styles.toolCard}>
              <div className={styles.toolCardHead}>
                <span className={styles.toolNum}>02</span>
                <span className={styles.toolName}>십성 분석</span>
              </div>
              <div className={styles.toolDesc}>나(일간)와 나머지 글자들의 관계를 비겁성·식상성·재성·관성·인성 다섯 쌍 열 가지로 분류합니다. 어떤 십성이 많고 적은지가 성격·진로·재물 그릇을 결정합니다.</div>
            </div>
            <div className={styles.toolCard}>
              <div className={styles.toolCardHead}>
                <span className={styles.toolNum}>03</span>
                <span className={styles.toolName}>신강신약 분석</span>
              </div>
              <div className={styles.toolDesc}>일간(나)이 사주 안에서 얼마나 강한 힘을 가졌는지 7단계로 판별합니다. 극왕부터 극약까지. 신강이면 추진력과 재물을 다스릴 힘, 신약이면 주변 도움이 중요해집니다.</div>
            </div>
          </div>
        </div>

        {/* 카테고리 貳 */}
        <div className={styles.toolsCategory}>
          <div className={styles.toolsCategoryHeader}>
            <div className={styles.toolsCategoryNum}>貳</div>
            <div className={styles.toolsCategoryTitle}>그릇 판단 — 양대 학파의 시선</div>
            <div className={styles.toolsCategoryCount}>2종</div>
          </div>
          <div className={styles.toolList}>
            <div className={styles.toolCard}>
              <div className={styles.toolCardHead}>
                <span className={styles.toolNum}>04</span>
                <span className={styles.toolName}>격국 분석 — 억부용신 체계</span>
              </div>
              <div className={styles.toolDesc}>사주를 큰 틀(格)로 분류하고, 일간이 강하면 빼주고 약하면 보태주는 억부용신 방식으로 용신·희신·기신을 결정합니다. 대운과 세운이 어떤 오행을 만났을 때 길흉이 되는지 판단하는 결정적 기준입니다.</div>
            </div>
            <div className={`${styles.toolCard} ${styles.toolCardHighlight}`}>
              <div className={styles.toolCardHead}>
                <span className={styles.toolNum}>05</span>
                <span className={styles.toolName}>격국용신 — 자평진전 체계</span>
                <span className={styles.toolBadge}>고급</span>
              </div>
              <div className={styles.toolDesc}>청나라 심효첨의 『자평진전』 체계로 격국을 성격(成格)과 파격(破格)으로 정밀하게 판별합니다. 격국용신·상신·기신을 잡고, 합거·충거 현상까지 탐지. 시중 일반 사주 사이트에는 거의 없는 고급 기능입니다.</div>
            </div>
          </div>
        </div>

        {/* 카테고리 參 */}
        <div className={styles.toolsCategory}>
          <div className={styles.toolsCategoryHeader}>
            <div className={styles.toolsCategoryNum}>參</div>
            <div className={styles.toolsCategoryTitle}>시간의 흐름 — 운의 파도</div>
            <div className={styles.toolsCategoryCount}>3종</div>
          </div>
          <div className={styles.toolList}>
            <div className={styles.toolCard}>
              <div className={styles.toolCardHead}>
                <span className={styles.toolNum}>06</span>
                <span className={styles.toolName}>대운 분석</span>
              </div>
              <div className={styles.toolDesc}>10년 단위로 흐르는 큰 운. 첫 대운이 시작되는 나이와 순행·역행도 사주마다 다릅니다. 인생 전체의 큰 흐름과 황금기·전환점을 파악하는 핵심 도구입니다.</div>
            </div>
            <div className={styles.toolCard}>
              <div className={styles.toolCardHead}>
                <span className={styles.toolNum}>07</span>
                <span className={styles.toolName}>세운 분석</span>
              </div>
              <div className={styles.toolDesc}>한 해 단위 운세. 그 해의 천간·지지가 본인 사주와 만나 일으키는 작용을 봅니다. 대운이라는 큰 흐름 위에 세운이 얹혀 한 해의 색깔을 결정합니다.</div>
            </div>
            <div className={`${styles.toolCard} ${styles.toolCardHighlight}`}>
              <div className={styles.toolCardHead}>
                <span className={styles.toolNum}>08</span>
                <span className={styles.toolName}>월운 분석</span>
                <span className={styles.toolBadge}>15개월</span>
              </div>
              <div className={styles.toolDesc}>달 단위 운세를 최근 3개월 + 현재 + 향후 11개월, 총 15개월로 분석합니다. 지나간 흐름까지 함께 풀어내어 분석의 신뢰성을 직접 검증할 수 있는 시선만의 차별점입니다.</div>
            </div>
          </div>
        </div>

        {/* 카테고리 肆 */}
        <div className={styles.toolsCategory}>
          <div className={styles.toolsCategoryHeader}>
            <div className={styles.toolsCategoryNum}>肆</div>
            <div className={styles.toolsCategoryTitle}>에너지의 상태</div>
            <div className={styles.toolsCategoryCount}>1종</div>
          </div>
          <div className={styles.toolList}>
            <div className={styles.toolCard}>
              <div className={styles.toolCardHead}>
                <span className={styles.toolNum}>09</span>
                <span className={styles.toolName}>12운성 분석</span>
              </div>
              <div className={styles.toolDesc}>일간이 각 지지에서 어떤 에너지 상태에 있는지 사람의 일생에 비유한 12단계. 장생·관대·건록·제왕은 활동기, 쇠·병·사·묘는 수렴기, 절·태·양은 재충전기. 같은 십성도 어느 단계에 있느냐에 따라 풀이가 크게 달라집니다.</div>
            </div>
          </div>
        </div>

        {/* 카테고리 伍 */}
        <div className={styles.toolsCategory}>
          <div className={styles.toolsCategoryHeader}>
            <div className={styles.toolsCategoryNum}>伍</div>
            <div className={styles.toolsCategoryTitle}>관계의 작용 — 글자의 화학반응</div>
            <div className={styles.toolsCategoryCount}>1종</div>
          </div>
          <div className={styles.toolList}>
            <div className={styles.toolCard}>
              <div className={styles.toolCardHead}>
                <span className={styles.toolNum}>10</span>
                <span className={styles.toolName}>합충형해파 분석</span>
              </div>
              <div className={styles.toolDesc}>사주 글자들이 만나 일으키는 다섯 가지 화학반응. 합(인연·결합), 충(사건·이별), 형(관재·구설), 해(은근한 갈등), 파(깨짐). 대운·세운이 본인 사주와 어떤 합충을 일으키는지가 그해 가장 큰 사건의 단서가 됩니다.</div>
            </div>
          </div>
        </div>

        {/* 카테고리 陸 */}
        <div className={styles.toolsCategory}>
          <div className={styles.toolsCategoryHeader}>
            <div className={styles.toolsCategoryNum}>陸</div>
            <div className={styles.toolsCategoryTitle}>길흉의 보조 표식 — 귀인과 신살</div>
            <div className={styles.toolsCategoryCount}>6종</div>
          </div>
          <div className={styles.toolList}>
            <div className={styles.toolCard}>
              <div className={styles.toolCardHead}>
                <span className={styles.toolNum}>11</span>
                <span className={styles.toolName}>귀인 분석 — 16종 귀인</span>
              </div>
              <div className={styles.toolDesc}>사주에 깃든 길성(吉星) 16종을 봅니다. 천을귀인·천덕귀인·월덕귀인·문창귀인·학당귀인·암록·금여 등. 어디서 어떤 도움이 들어오는지 알려주는 통로입니다.</div>
            </div>
            <div className={styles.toolCard}>
              <div className={styles.toolCardHead}>
                <span className={styles.toolNum}>12</span>
                <span className={styles.toolName}>십이신살 분석</span>
              </div>
              <div className={styles.toolDesc}>십이지를 기반으로 도출되는 12종 신살. 겁살·재살·천살·지살·년살·월살·망신살·장성살·반안살·역마살·육해살·화개살. 이동·관재·인기·권위 등 인생의 사건적 키워드를 알려줍니다.</div>
            </div>
            <div className={`${styles.toolCard} ${styles.toolCardMoney}`}>
              <div className={styles.toolCardHead}>
                <span className={styles.toolNum}>13</span>
                <span className={styles.toolName}>비견 · 겁재 분석</span>
                <span className={styles.toolBadge}>재물 핵심</span>
              </div>
              <div className={styles.toolDesc}>나와 같은 오행의 글자. 자아·독립성·경쟁심이 강해지고, 동업·돈 빌려주기·공동 투자에서 손실 위험이 높아지는 비겁쟁재(比劫爭財) 현상을 진단합니다. 재물운 분석의 핵심 근거입니다.</div>
            </div>
            <div className={styles.toolCard}>
              <div className={styles.toolCardHead}>
                <span className={styles.toolNum}>14</span>
                <span className={styles.toolName}>홍염살 분석</span>
              </div>
              <div className={styles.toolDesc}>이성에게 매력을 발산하는 살. 도화살과는 달리 은근하고 깊은 매력, 술자리·예술 분야의 끌림을 의미합니다. 강하면 인기와 예술적 재능이 도드라집니다.</div>
            </div>
            <div className={styles.toolCard}>
              <div className={styles.toolCardHead}>
                <span className={styles.toolNum}>15</span>
                <span className={styles.toolName}>도화살 분석</span>
              </div>
              <div className={styles.toolDesc}>인기·매력·이성운을 보는 신살. 자오묘유 지지에서 도출됩니다. 잘 발휘되면 예술·연예·서비스업의 큰 자산, 어설피 쓰면 이성 문제로 이어집니다. 요즘은 매력을 다루는 능력으로 해석합니다.</div>
            </div>
            <div className={styles.toolCard}>
              <div className={styles.toolCardHead}>
                <span className={styles.toolNum}>16</span>
                <span className={styles.toolName}>화개살 분석</span>
              </div>
              <div className={styles.toolDesc}>예술·종교·학문·고독을 상징하는 신살. 진술축미 지지에서 도출됩니다. 강하면 깊이 있는 사유와 종교성, 예술적 재능이 두드러지지만 외로움의 정서도 함께 따라옵니다.</div>
            </div>
          </div>
        </div>
      </section>

      {/* ━━━ DIFFERENCE ━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section className={styles.container}>
        <div className={styles.differenceBox}>
          <div className={styles.differenceWatermark}>深</div>
          <div className={styles.differenceLabel}>DIFFERENCE</div>
          <div className={styles.differenceTitle}>
            시중 사주 사이트와<br />결정적으로 다른 두 가지
          </div>
          <div className={styles.differenceList}>
            <div className={styles.differenceItem}>
              <div className={styles.differenceNum}>一</div>
              <div>
                <div className={styles.differenceName}>양대 학파의 동시 적용</div>
                <div className={styles.differenceDesc}>억부용신과 자평진전 격국용신 — 명리학 양대 체계를 동시에 적용해 같은 사주를 두 관점에서 교차 분석합니다.</div>
              </div>
            </div>
            <div className={styles.differenceItem}>
              <div className={styles.differenceNum}>二</div>
              <div>
                <div className={styles.differenceName}>검증 가능한 월운 분석</div>
                <div className={styles.differenceDesc}>최근 3개월 + 현재 + 향후 11개월. 미래 예측만 보여주는 분석과 달리, 지나간 흐름까지 함께 풀어내어 신뢰성을 직접 검증할 수 있습니다.</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ━━━ FOR YOU ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section className={styles.container}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionEn}>FOR YOU</div>
          <h2 className={styles.sectionTitle}>이런 분께 권해드려요</h2>
          <hr className={styles.divider} />
        </div>
        <div className={styles.foryouGrid}>
          <div className={styles.foryouCard}>
            <div className={styles.foryouDot}>·</div>
            <div className={styles.foryouText}>인생의 큰 결정을 앞두고<br />방향을 잡고 싶은 분</div>
          </div>
          <div className={styles.foryouCard}>
            <div className={styles.foryouDot}>·</div>
            <div className={styles.foryouText}>막연한 운세가 아닌<br />구체적인 통찰이 필요한 분</div>
          </div>
          <div className={styles.foryouCard}>
            <div className={styles.foryouDot}>·</div>
            <div className={styles.foryouText}>재물운의 흐름을<br />제대로 알고 싶은 분</div>
          </div>
          <div className={styles.foryouCard}>
            <div className={styles.foryouDot}>·</div>
            <div className={styles.foryouText}>왜 그렇게 살아왔는지<br />이제 한 번쯤 알고 싶은 분</div>
          </div>
        </div>
      </section>

      {/* ━━━ CTA ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section className={styles.container}>
        <div className={styles.ctaSection}>
          <h2 className={styles.ctaHeadline}>
            당신의 결을 함께 들여다볼<br />준비가 되어 있습니다
          </h2>
          <Link href="/products" className={styles.btnCta}>
            상담 시작하기 →
          </Link>
          <div className={styles.ctaFooterLine}>視 線 · 시선을 사로잡는 사주분석</div>
        </div>
      </section>
    </div>
  );
}
