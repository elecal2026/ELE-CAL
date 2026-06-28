'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import styles from './admin-shell.module.css'

const NAV = [
  { href: '/admin', icon: '📊', label: 'ダッシュボード' },
  { href: '/admin/feedback', icon: '📨', label: '問い合わせ管理' },
] as const

/** 現在のパスからページタイトルを決める */
function titleOf(pathname: string): string {
  if (pathname.startsWith('/admin/feedback')) return '問い合わせ管理'
  return 'ダッシュボード'
}

/** 現在地判定（/admin は完全一致、他は前方一致） */
function isActive(href: string, pathname: string): boolean {
  if (href === '/admin') return pathname === '/admin'
  return pathname.startsWith(href)
}

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <div className={styles.brand}>
          <span className={styles.brandMark} aria-hidden>⚡</span>
          <span className={styles.brandText}>ELE-CAL 管理</span>
        </div>

        <nav className={styles.nav} aria-label="管理メニュー">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={isActive(item.href, pathname) ? styles.navItemActive : styles.navItem}
            >
              <span className={styles.navIcon} aria-hidden>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        <Link href="/" className={styles.backLink}>
          ← サイトに戻る
        </Link>
      </aside>

      <div className={styles.content}>
        <header className={styles.topbar}>
          <h1 className={styles.pageTitle}>{titleOf(pathname)}</h1>
        </header>
        <div className={styles.body}>{children}</div>
      </div>
    </div>
  )
}
