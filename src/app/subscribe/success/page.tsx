import Link from 'next/link'

export default function SubscribeSuccessPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#f0f4f8', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', maxWidth: '420px', width: '100%', padding: '2.5rem 1.5rem', textAlign: 'center' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎉</div>
        <h1 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#1a202c', marginBottom: '0.5rem' }}>
          登録が完了しました！
        </h1>
        <p style={{ fontSize: '0.9rem', color: '#4a5568', marginBottom: '0.25rem' }}>
          14日間の無料トライアルが開始されました。
        </p>
        <p style={{ fontSize: '0.85rem', color: '#718096', marginBottom: '2rem' }}>
          すべてのツールをご利用いただけます。
        </p>
        <Link
          href="/"
          style={{
            display: 'inline-block',
            padding: '0.75rem 2rem',
            background: '#1d6fcf',
            color: '#fff',
            borderRadius: '10px',
            fontSize: '1rem',
            fontWeight: 700,
            textDecoration: 'none',
          }}
        >
          ツールを使い始める
        </Link>
      </div>
    </div>
  )
}
