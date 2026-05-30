'use client';

import Link from 'next/link';
import { UserButton, SignInButton, Show } from '@clerk/nextjs';
import styles from './SiteHeader.module.css';

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

interface SiteHeaderProps {
  mode: 'top' | 'sub';
  title?: string;
  backHref?: string;
}

export default function SiteHeader({ mode, title, backHref = '/' }: SiteHeaderProps) {
  const className = mode === 'sub' ? `${styles.topbar} ${styles.subMode}` : styles.topbar;

  return (
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
            <Show when="signed-out">
              <SignInButton mode="modal">
                <button className={styles.loginBtn} type="button">
                  ログイン
                </button>
              </SignInButton>
            </Show>
            <Show when="signed-in">
              <UserButton
                appearance={{
                  elements: {
                    userButtonAvatarBox: { width: 36, height: 36 },
                  },
                }}
              >
                <UserButton.MenuItems>
                  <UserButton.Link
                    label="アカウント"
                    labelIcon={<UserIcon />}
                    href="/account"
                  />
                  <UserButton.Action
                    label="お支払い管理"
                    labelIcon={<CardIcon />}
                    onClick={openCustomerPortal}
                  />
                </UserButton.MenuItems>
              </UserButton>
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
  );
}
