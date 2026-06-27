'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { UserButton, SignInButton, SignUpButton, Show } from '@clerk/nextjs';
import styles from './SiteHeader.module.css';
import { usePaywall } from './PaywallProvider';
import { NEWS_ITEMS } from '@/data/news-data';

async function openCustomerPortal() {
  try {
    const res = await fetch('/api/customer-portal', { method: 'POST' });
    if (res.status === 503) {
      alert('決済システムは現在準備中です。');
      return;
    }
    if (res.status === 404) {
      alert('ご契約情報が見つかりません。');
      return;
    }
    const data = await res.json();
    if (data.url) {
      window.location.href = data.url;
      return;
    }
    alert(`エラーが発生しました（${res.status}）: ${data.error ?? '詳細不明'}`);
  } catch (e) {
    console.error('Portal exception', e);
    alert('通信エラーが発生しました。');
  }
}

const CardIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="5" width="20" height="14" rx="2" />
    <line x1="2" y1="10" x2="22" y2="10" />
  </svg>
);

const UserIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const BellIcon = () => (
  <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
);

const GearIcon = () => (
  <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);

interface SiteHeaderProps {
  mode: 'top' | 'sub';
  title?: string;
  backHref?: string;
}

export default function SiteHeader({ mode, title, backHref = '/' }: SiteHeaderProps) {
  const userButtonRef = useRef<HTMLDivElement>(null);
  const { canManageBilling } = usePaywall();
  const [newsOpen, setNewsOpen] = useState(false);
  const className = mode === 'sub' ? `${styles.topbar} ${styles.subMode}` : styles.topbar;

  const handleSettingsClick = () => {
    const btn = userButtonRef.current?.querySelector('button') as HTMLElement;
    btn?.click();
  };

  return (
    <>
    <header className={className}>
      <div className={styles.left}>
        <Link className={styles.logo} href="/" aria-label="ELE-CAL ホーム">
          <span className={styles.logoText}>
            ELE<span className={styles.dash}>-</span>CAL
          </span>
          <div className={styles.logoBar}></div>
        </Link>
        {mode === 'sub' && title && (
          <h1 className={styles.pageTitle}>{title}</h1>
        )}
      </div>

      <div className={styles.right}>
        {mode === 'top' && (
          <>
            <button
              className={`${styles.loginBtn} ${styles.newsBtn}`}
              type="button"
              onClick={() => setNewsOpen(true)}
              aria-label="新着情報"
            >
              <BellIcon />
              <span className={styles.newsLabel}>新着</span>
            </button>
            <Show when="signed-out">
              <SignUpButton mode="modal" forceRedirectUrl="/subscribe">
                <button className={styles.signupBtn} type="button">
                  新規登録
                </button>
              </SignUpButton>
              <SignInButton mode="modal" signUpForceRedirectUrl="/subscribe">
                <button className={`${styles.loginBtn} ${styles.loginBtnDesktop}`} type="button">
                  ログイン
                </button>
              </SignInButton>
            </Show>
            <Show when="signed-in">
              <div className={styles.settingsWrapper}>
                <button
                  className={`${styles.loginBtn} ${styles.settingsBtn}`}
                  type="button"
                  onClick={handleSettingsClick}
                >
                  <GearIcon />
                  設定
                </button>
                <div ref={userButtonRef} className={styles.hiddenUserButton}>
                  <UserButton appearance={{ elements: { userButtonPopoverActionButton__manageAccount: { display: 'none' } } }}>
                    <UserButton.MenuItems>
                      <UserButton.Link
                        label="アカウント"
                        labelIcon={<UserIcon />}
                        href="/account"
                      />
                      {canManageBilling && (
                        <UserButton.Action
                          label="お支払い管理"
                          labelIcon={<CardIcon />}
                          onClick={openCustomerPortal}
                        />
                      )}
                    </UserButton.MenuItems>
                  </UserButton>
                </div>
              </div>
            </Show>
          </>
        )}
        {mode === 'sub' && (
          <Link href={backHref} className={styles.backBtn} aria-label="トップへ戻る">
            <svg viewBox="0 0 14 14" fill="none" width="14" height="14">
              <path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className={styles.backLabel}>トップへ戻る</span>
          </Link>
        )}
      </div>
    </header>

    {newsOpen && (
      <div
        className={styles.newsOverlay}
        onClick={() => setNewsOpen(false)}
        role="presentation"
      >
        <div
          className={styles.newsModal}
          role="dialog"
          aria-modal="true"
          aria-label="新着情報"
          onClick={(e) => e.stopPropagation()}
        >
          <div className={styles.newsModalHeader}>
            <h2 className={styles.newsModalTitle}>
              <BellIcon />
              新着情報
            </h2>
            <button
              className={styles.newsCloseBtn}
              type="button"
              onClick={() => setNewsOpen(false)}
              aria-label="閉じる"
            >
              ×
            </button>
          </div>
          <div className={styles.newsModalBody}>
            {NEWS_ITEMS.length === 0 ? (
              <p className={styles.newsEmpty}>現在お知らせはありません。</p>
            ) : (
              NEWS_ITEMS.map((item, i) => (
                <div key={i} className={styles.newsItem}>
                  <p className={styles.newsDate}>{item.date}</p>
                  <p className={styles.newsBody}>{item.body}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    )}
    </>
  );
}
