'use client'

import { useState, useEffect } from 'react'

export default function SubscribePage() {
  const [stripeReady, setStripeReady] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // Stripeの公開キーが設定されているかクライアント側でチェック
    setStripeReady(!!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  }, [])

  const handleSubscribe = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/create-checkout-session', { method: 'POST' })
      if (res.status === 503) {
        alert('決済システムは現在準備中です。')
        return
      }
      if (res.status === 401) {
        alert('ログインが必要です。サインインしてからお試しください。')
        window.location.href = '/sign-in'
        return
      }
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
        return
      }
      console.error('Checkout failed', { status: res.status, data })
      alert(`エラーが発生しました（${res.status}）: ${data.error ?? '詳細不明'}`)
    } catch (e) {
      console.error('Checkout exception', e)
      alert('通信エラーが発生しました。ネットワークをご確認ください。')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f0f4f8', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', maxWidth: '420px', width: '100%', overflow: 'hidden' }}>
        {/* ヘッダー */}
        <div style={{ background: 'linear-gradient(135deg, #1d6fcf, #4fa3f5)', padding: '2rem 1.5rem', textAlign: 'center', color: '#fff' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>⚡</div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '0.25rem' }}>Electrician Tools</h1>
          <p style={{ fontSize: '0.85rem', opacity: 0.85 }}>電気工事 計算・参照ツール</p>
        </div>

        {/* プラン内容 */}
        <div style={{ padding: '1.5rem' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1a202c', marginBottom: '1rem', textAlign: 'center' }}>
            プロプラン
          </h2>

          <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 1.5rem', fontSize: '0.9rem', color: '#4a5568' }}>
            {['許容電流表', '電圧降下計算', '配管サイズ計算', 'ブレーカー選定', '今後の新機能も利用可能'].map((item) => (
              <li key={item} style={{ padding: '0.4rem 0', borderBottom: '1px solid #f0f4f8' }}>
                <span style={{ color: '#1d6fcf', marginRight: '0.5rem', fontWeight: 700 }}>✓</span>
                {item}
              </li>
            ))}
          </ul>

          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <span style={{ fontSize: '2.2rem', fontWeight: 800, color: '#1d6fcf' }}>¥500</span>
            <span style={{ fontSize: '0.9rem', color: '#718096' }}> / 月（税込）</span>
            <p style={{ fontSize: '0.82rem', color: '#718096', marginTop: '0.25rem' }}>14日間の無料トライアル付き</p>
          </div>

          {/* ボタン */}
          {stripeReady === null ? (
            <div style={{ textAlign: 'center', color: '#718096', fontSize: '0.9rem' }}>読み込み中...</div>
          ) : stripeReady ? (
            <button
              onClick={handleSubscribe}
              disabled={loading}
              style={{
                width: '100%',
                padding: '0.85rem',
                background: loading ? '#93c5fd' : '#1d6fcf',
                color: '#fff',
                border: 'none',
                borderRadius: '10px',
                fontSize: '1rem',
                fontWeight: 700,
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'background 0.2s',
              }}
            >
              {loading ? '処理中...' : '無料トライアルを始める'}
            </button>
          ) : (
            <div>
              <button
                disabled
                style={{
                  width: '100%',
                  padding: '0.85rem',
                  background: '#cbd5e0',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '1rem',
                  fontWeight: 700,
                  cursor: 'not-allowed',
                }}
              >
                決済システム準備中
              </button>
              <p style={{ textAlign: 'center', fontSize: '0.78rem', color: '#a0aec0', marginTop: '0.5rem' }}>
                まもなくご利用いただけます
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
