import Link from 'next/link';
import Image from 'next/image';
import SiteHeader from '@/components/SiteHeader';
import styles from './page.module.css';

export default function Home() {
  return (
    <div className={styles.page}>
      <SiteHeader mode="top" />

      {/* HERO */}
      <div className={styles.hero}>
        <div className={styles.heroCopy}>
          <h1>ようこそ、ELE-CALへ</h1>
          {/* Q&A BANNERS */}
          <div className={styles.qaBannerArea}>
            <Link href="/questions" className={styles.qaBannerLink}>
              <Image
                src="/image/banner-faq.png"
                alt="よくある質問"
                width={1200}
                height={600}
                className={styles.qaBannerImg}
              />
            </Link>
            <Link href="/feedback" className={styles.qaBannerLink}>
              <Image
                src="/image/banner-feedback.png"
                alt="要望・フィードバック"
                width={1200}
                height={600}
                className={styles.qaBannerImg}
              />
            </Link>
          </div>
          {/* BOOKMARK + DISCLAIMER */}
          <div className={styles.bookmarkSection}>
            <p className={styles.bookmarkText}>🔖 次回もすぐ開けるよう、ブックマーク登録をおすすめします。</p>
            <p className={styles.disclaimerEmphasis}>⚠️ <strong>本ツールの計算結果は参考値です。</strong> 実務では最新の規格・基準を必ずご確認ください。</p>
          </div>
        </div>
      </div>

      {/* CARDS */}
      <div className={styles.cardsGrid}>
        {/* 01 許容電流表 */}
        <Link className={styles.card} href="/allowable_current">
          <div className={`${styles.cardHead} ${styles.red}`}>
            <span className={styles.cardNum}>01</span>
            <span className={styles.cardTitle}>許容電流表</span>
          </div>
          <div className={styles.cardIcon}>
            <Image
              src="/image/許容電流表_調整済み.png"
              alt="許容電流表"
              width={240}
              height={200}
            />
          </div>
        </Link>

        {/* 02 電圧降下計算 */}
        <Link className={styles.card} href="/voltage_drop_v2">
          <div className={`${styles.cardHead} ${styles.navy}`}>
            <span className={styles.cardNum}>02</span>
            <span className={styles.cardTitle}>電圧降下計算</span>
          </div>
          <div className={styles.cardIcon}>
            <Image
              src="/image/電圧降下計算_調整済み.png"
              alt="電圧降下計算"
              width={240}
              height={200}
            />
          </div>
        </Link>

        {/* 03 配管サイズ計算 */}
        <Link className={styles.card} href="/pipe_size">
          <div className={`${styles.cardHead} ${styles.yellow}`}>
            <span className={styles.cardNum}>03</span>
            <span className={styles.cardTitle}>配管サイズ計算</span>
          </div>
          <div className={styles.cardIcon}>
            <Image
              src="/image/配管サイズ計算_調整済み.png"
              alt="配管サイズ計算"
              width={240}
              height={200}
            />
          </div>
        </Link>

        {/* 04 ブレーカー選定 */}
        <Link className={styles.card} href="/breaker">
          <div className={`${styles.cardHead} ${styles.red}`}>
            <span className={styles.cardNum}>04</span>
            <span className={styles.cardTitle}>ブレーカー選定</span>
          </div>
          <div className={styles.cardIcon}>
            <Image
              src="/image/ブレーカー選定_調整済み.png"
              alt="ブレーカー選定"
              width={240}
              height={200}
            />
          </div>
        </Link>
      </div>

      {/* FOOTER BANNER */}
      <div className={styles.footerBanner}>
        <nav className={styles.legalRow} aria-label="法務情報">
          <Link href="/legal/tokushoho">特定商取引法</Link>
          <Link href="/legal/privacy">プライバシーポリシー</Link>
          <Link href="/legal/terms">利用規約</Link>
        </nav>

      </div>
    </div>
  );
}
