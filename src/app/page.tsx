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
          <p>
            電気工事の計算・参照を、スピーディに正確に。<br />
            現場の頼れるパートナーとして、業務をサポートします。
          </p>
        </div>
        <div className={styles.heroImage}>
          <Image
            src="/image/hero.png"
            alt="電気設備イラスト"
            width={760}
            height={600}
            priority
          />
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
          <div className={styles.cardBottom}>
            <div className={styles.cardDesc}>
              電線の種類やサイズ別の<br />許容電流を確認できます。
            </div>
            <div className={`${styles.arrowBtn} ${styles.red}`}>
              <svg viewBox="0 0 16 16" fill="none">
                <path d="M3 8h10M9 4l4 4-4 4" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
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
          <div className={styles.cardBottom}>
            <div className={styles.cardDesc}>
              電線の長さや電流から<br />電圧降下を計算します。
            </div>
            <div className={`${styles.arrowBtn} ${styles.navy}`}>
              <svg viewBox="0 0 16 16" fill="none">
                <path d="M3 8h10M9 4l4 4-4 4" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
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
          <div className={styles.cardBottom}>
            <div className={styles.cardDesc}>
              占有率ルールに基づき<br />配管サイズを計算します。
            </div>
            <div className={`${styles.arrowBtn} ${styles.yellow}`}>
              <svg viewBox="0 0 16 16" fill="none">
                <path d="M3 8h10M9 4l4 4-4 4" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
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
          <div className={styles.cardBottom}>
            <div className={styles.cardDesc}>
              負荷電流からブレーカーの<br />定格を算出します。
            </div>
            <div className={`${styles.arrowBtn} ${styles.red}`}>
              <svg viewBox="0 0 16 16" fill="none">
                <path d="M3 8h10M9 4l4 4-4 4" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>
        </Link>
      </div>

      {/* FOOTER BANNER */}
      <div className={styles.footerBanner}>
        <div className={styles.bannerInner}>
          <div className={styles.bannerIcon}>
            <svg viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M14 2L3 7v8c0 6.2 4.7 12 11 13.9C21.3 27 26 21.2 26 15V7L14 2z" stroke="#1C2B4A" strokeWidth="1.8" fill="none" strokeLinejoin="round" />
              <polyline points="9,14 12.5,17.5 19,10" stroke="#1C2B4A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            </svg>
          </div>
          <div className={styles.bannerText}>
            <strong>信頼できる計算を、すべての現場に。</strong>
            <span>最新の規格・基準に基づいた計算で、確かな安全と効率を支えます。</span>
          </div>
        </div>

        <nav className={styles.legalRow} aria-label="法務情報">
          <Link href="/legal/tokushoho">特定商取引法</Link>
          <Link href="/legal/privacy">プライバシーポリシー</Link>
          <Link href="/legal/terms">利用規約</Link>
        </nav>

        <p className={styles.disclaimer}>
          本ツールの計算結果は参考値です。実務では最新の規格・基準をご確認ください。
        </p>
      </div>
    </div>
  );
}
