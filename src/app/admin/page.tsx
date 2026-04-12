import Link from 'next/link'

// 管理ツールに格納するページ一覧
const ADMIN_TOOLS = [
  {
    href: '/admin/voltage_drop_legacy',
    icon: '📉',
    name: '電圧降下計算（旧版）',
    sub: 'インピーダンス法・JCS 103A参考',
    badge: '旧版',
  },
]

export default function AdminPage() {
  return (
    <>
      {/* ヘッダー */}
      <header className="top-header">
        <Link href="/" className="back-link" style={{ position: 'absolute', top: '0.75rem', left: '0.75rem', fontSize: '1.2rem', textDecoration: 'none' }} aria-label="ホームへ戻る">←</Link>
        <span className="logo-icon">🛠️</span>
        <h1>管理ツール</h1>
        <p className="subtitle">過去の仮ページ・計算過程など</p>
      </header>

      {/* 説明 */}
      <div style={{ maxWidth: '700px', margin: '0 auto', padding: '1.5rem 1rem 0.5rem' }}>
        <div style={{
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '10px',
          padding: '0.9rem 1.2rem',
          fontSize: '0.85rem',
          color: 'var(--text-muted)',
          lineHeight: 1.7,
        }}>
          💡 このページには、開発中に作成した仮ページや計算過程の確認用ページがまとめられています。<br />
          通常の利用には<Link href="/" style={{ color: 'var(--accent)', textDecoration: 'none' }}>メインページ</Link>をご利用ください。
        </div>
      </div>

      {/* 各ツール詳細情報 / 変更修正履歴 */}
      <div style={{ maxWidth: '700px', margin: '0 auto', padding: '1rem 1rem 0', display: 'flex', flexDirection: 'row', gap: '0.6rem' }}>
        <Link
          href="/admin/tool-specs"
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            padding: '0.85rem 1rem',
            background: 'var(--accent)',
            color: '#fff',
            borderRadius: '10px',
            textDecoration: 'none',
            fontWeight: 600,
            fontSize: '0.95rem',
            border: 'none',
            cursor: 'pointer',
            transition: 'background 0.15s',
          }}
        >
          📖 各ツール詳細情報
        </Link>
        <Link
          href="/admin/changelog"
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            padding: '0.85rem 1rem',
            background: 'var(--accent)',
            color: '#fff',
            borderRadius: '10px',
            textDecoration: 'none',
            fontWeight: 600,
            fontSize: '0.95rem',
            border: 'none',
            cursor: 'pointer',
            transition: 'background 0.15s',
          }}
        >
          📝 変更修正履歴
        </Link>
      </div>

      {/* ツール一覧 */}
      <nav className="menu-grid" aria-label="管理ツール一覧" style={{ marginTop: '1rem' }}>
        {ADMIN_TOOLS.map((tool) => (
          <Link key={tool.href} className="menu-card" href={tool.href} style={{ position: 'relative' }}>
            {tool.badge && (
              <span style={{
                position: 'absolute',
                top: '0.5rem',
                right: '0.5rem',
                fontSize: '0.65rem',
                background: 'rgba(255,160,0,0.18)',
                color: '#ffb300',
                border: '1px solid rgba(255,160,0,0.35)',
                borderRadius: '4px',
                padding: '1px 6px',
                fontWeight: 600,
              }}>{tool.badge}</span>
            )}
            <span className="card-icon">{tool.icon}</span>
            <span className="card-name">{tool.name}</span>
            <span className="card-sub">{tool.sub}</span>
          </Link>
        ))}
      </nav>

      {/* フッター */}
      <footer className="top-footer">
        <p>管理ツールのページは開発・確認用です。実務での使用はメインページをご利用ください。</p>
      </footer>
    </>
  )
}
