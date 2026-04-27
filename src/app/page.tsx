import Link from 'next/link';
import Image from 'next/image';
import { UserButton, SignInButton, Show } from '@clerk/nextjs';
import styles from './page.module.css';

export default function Home() {
  return (
    <div className={styles.page}>
      {/* TOP BAR */}
      <div className={styles.topbar}>
        <div className={styles.logo}>
          <span className={styles.logoText}>
            ELE<span className={styles.dash}>-</span>CAL
          </span>
          <div className={styles.logoBar}></div>
        </div>

        <div className={styles.userArea}>
          <Show when="signed-out">
            <SignInButton mode="modal">
              <button className={styles.googleBtn} type="button">
                <svg viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4" />
                  <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853" />
                  <path d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" fill="#FBBC05" />
                  <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 7.293C4.672 5.166 6.656 3.58 9 3.58z" fill="#EA4335" />
                </svg>
                Googleでログイン
              </button>
            </SignInButton>
          </Show>
          <Show when="signed-in">
            <UserButton />
          </Show>
        </div>
      </div>

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
