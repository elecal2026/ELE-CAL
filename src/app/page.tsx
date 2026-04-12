import Link from 'next/link';
import Image from 'next/image';
import { UserButton } from '@clerk/nextjs';


export default function Home() {
  return (
    <>
      {/* ヘッダー */}
      <header className="top-header">
        <div style={{ position: 'absolute', top: '0.75rem', right: '0.75rem' }}>
          <UserButton />
        </div>
        <Link
          href="/admin"
          aria-label="管理ツール"
          className="admin-btn-header"
        >
          🛠️ 管理ツール
        </Link>
        <Image
          src="/ELE-CAL.png"
          alt="ELE-CAL ロゴ"
          width={120}
          height={120}
          className="top-logo"
          priority
        />
        <h1>ELE-CAL</h1>
        <p className="subtitle">電気工事 計算・参照ツール</p>
      </header>

      {/* メニュー */}
      <nav className="menu-grid" aria-label="ツール一覧">
        <Link className="menu-card" href="/allowable_current">
          <span className="card-icon">📋</span>
          <span className="card-name">許容電流表</span>
          <span className="card-sub">電線種類・サイズ別</span>
        </Link>

        <Link className="menu-card" href="/voltage_drop_v2">
          <span className="card-icon">🔌</span>
          <span className="card-name">電圧降下計算</span>
          <span className="card-sub">簡易係数法・幹線分岐対応</span>
        </Link>

        <Link className="menu-card" href="/pipe_size">
          <span className="card-icon">🔧</span>
          <span className="card-name">配管サイズ計算</span>
          <span className="card-sub">占有率 32% / 48%</span>
        </Link>

        <Link className="menu-card" href="/breaker">
          <span className="card-icon">⚡</span>
          <span className="card-name">ブレーカー選定</span>
          <span className="card-sub">負荷電流から定格を算出</span>
        </Link>
      </nav>

      {/* フッター */}
      <footer className="top-footer">
        <p>本ツールの計算結果は参考値です。実務では最新の規格・基準をご確認ください。</p>
        <nav style={{ marginTop: '0.75rem', display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <Link href="/legal/tokushoho" style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textDecoration: 'none' }}>特定商取引法</Link>
          <Link href="/legal/privacy" style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textDecoration: 'none' }}>プライバシーポリシー</Link>
          <Link href="/legal/terms" style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textDecoration: 'none' }}>利用規約</Link>
        </nav>
      </footer>


    </>
  );
}
