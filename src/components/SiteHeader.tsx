import Link from 'next/link';
import { UserButton, SignInButton, Show } from '@clerk/nextjs';
import styles from './SiteHeader.module.css';

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
          </>
        )}
        {mode === 'sub' && (
          <Link href={backHref} className={styles.backBtn}>
            <svg viewBox="0 0 14 14" fill="none" width="14" height="14">
              <path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            トップへ戻る
          </Link>
        )}
      </div>
    </header>
  );
}
