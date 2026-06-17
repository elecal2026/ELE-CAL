import Link from 'next/link';
import Image from 'next/image';
import SiteHeader from '@/components/SiteHeader';
import FeedbackThanksToast from '@/components/FeedbackThanksToast';
import styles from './page.module.css';

export default function Home() {
  return (
    <div className={styles.page}>
      <FeedbackThanksToast />
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
          {/* DISCLAIMER */}
          <div className={styles.bookmarkSection}>
            <p className={styles.disclaimerEmphasis}>⚠️ 本ツールは、「内線規程 第14版 JEAC8001-2022」を参考資料の一つとして計算しております。計算結果は目安としてご利用いただき、最終的なご判断は、実際の条件をご確認のうえお客様にてお願いいたします。</p>
          </div>
        </div>
      </div>

      {/* CARDS */}
      <div className={styles.cardsGrid}>
        {/* 01 許容電流表 */}
        <Link className={styles.card} href="/allowable_current">
          <div className={`${styles.cardHead} ${styles.navy}`}>
            <span className={styles.cardTitle}>許容電流表</span>
          </div>
          <div className={styles.cardIcon}>
            <Image
              src="/image/allowable_current.png"
              alt="許容電流表"
              width={240}
              height={200}
            />
          </div>
        </Link>

        {/* 02 ブレーカー選定 */}
        <Link className={styles.card} href="/breaker">
          <div className={`${styles.cardHead} ${styles.red}`}>
            <span className={styles.cardTitle}>ブレーカー選定</span>
          </div>
          <div className={styles.cardIcon}>
            <Image
              src="/image/breaker.png"
              alt="ブレーカー選定"
              width={240}
              height={200}
            />
          </div>
        </Link>

        {/* 03 集合住宅幹線設計 */}
        <Link className={styles.card} href="/apartment_main">
          <div className={`${styles.cardHead} ${styles.red}`}>
            <span className={styles.cardTitle}>集合住宅幹線設計</span>
          </div>
          <div className={styles.cardIcon}>
            <Image
              src="/image/apartment_main.png"
              alt="集合住宅幹線設計"
              width={240}
              height={200}
            />
          </div>
        </Link>

        {/* 04 配管サイズ計算 */}
        <Link className={styles.card} href="/pipe_size">
          <div className={`${styles.cardHead} ${styles.yellow}`}>
            <span className={styles.cardTitle}>配管サイズ計算</span>
          </div>
          <div className={styles.cardIcon}>
            <Image
              src="/image/pipe_size.png"
              alt="配管サイズ計算"
              width={240}
              height={200}
            />
          </div>
        </Link>

        {/* 05 ケーブルラック簡易選定 */}
        <Link className={styles.card} href="/cable_rack">
          <div className={`${styles.cardHead} ${styles.yellow}`}>
            <span className={styles.cardTitle}>ラックサイズ選定</span>
          </div>
          <div className={styles.cardIcon}>
            <Image
              src="/image/cable_rack.png"
              alt="ケーブルラック簡易選定"
              width={240}
              height={200}
            />
          </div>
        </Link>

        {/* 06 電圧降下計算 */}
        <Link className={styles.card} href="/voltage_drop_v2">
          <div className={`${styles.cardHead} ${styles.navy}`}>
            <span className={styles.cardTitle}>電圧降下計算</span>
          </div>
          <div className={styles.cardIcon}>
            <Image
              src="/image/voltage_drop.png"
              alt="電圧降下計算"
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
