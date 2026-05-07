'use client'

import { useState, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'

export default function SubscribeForm({ hasUsedTrial }: { hasUsedTrial: boolean }) {
  const [stripeReady, setStripeReady] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(false)
  const [testLoading, setTestLoading] = useState(false)
  const { user } = useUser()

  // 自分のClerk userIDと一致する場合のみテストボタンを表示
  const testUserId = process.env.NEXT_PUBLIC_TEST_USER_CLERK_ID
  const isTestUser = !!testUserId && user?.id === testUserId

  useEffect(() => {
    setStripeReady(!!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  }, [])

  const handleSubscribe = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      if (res.status === 503) {
        alert('決済システムは現在準備中です。')
        return
      }
      if (res.status === 401) {
        alert('ログインが必要です。サインインしてからお試しください。')
        window.location.href = '/sign-in'
        return
      }
      if (res.status === 409) {
        const data = await res.json().catch(() => ({}))
        window.location.href = data.redirectTo ?? '/account'
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

  // テスト課金ハンドラ（自分のみ）
  const handleTestCheckout = async () => {
    setTestLoading(true)
    try {
      const res = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ testMode: true }),
      })
      const data = await res.json().catch(() => ({}))
      if (res.status === 403) {
        alert('テスト課金は自分のアカウントのみ利用可能です。')
        return
      }
      if (!res.ok) {
        alert(`エラー（${res.status}）: ${data.error ?? '詳細不明'}`)
        return
      }
      if (data.url) {
        window.location.href = data.url
      }
    } catch (e) {
      console.error('Test checkout exception', e)
      alert('通信エラーが発生しました。')
    } finally {
      setTestLoading(false)
    }
  }

  const buttonLabel = loading
    ? '処理中...'
    : hasUsedTrial
      ? 'プランに登録する'
      : '無料トライアルを始める'

  return (
    <div style={{ minHeight: '100vh', background: '#f0f4f8', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', maxWidth: '420px', width: '100%', overflow: 'hidden' }}>
        <div style={{ background: 'linear-gradient(135deg, #1d6fcf, #4fa3f5)', padding: '2rem 1.5rem', textAlign: 'center', color: '#fff' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>⚡</div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '0.25rem' }}>Electrician Tools</h1>
          <p style={{ fontSize: '0.85rem', opacity: 0.85 }}>電気工事 計算・参照ツール</p>
        </div>

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
            {hasUsedTrial ? (
              <p style={{ fontSize: '0.82rem', color: '#718096', marginTop: '0.25rem' }}>
                登録後すぐにご利用いただけます
              </p>
            ) : (
              <p style={{ fontSize: '0.82rem', color: '#718096', marginTop: '0.25rem' }}>
                14日間の無料トライアル付き
              </p>
            )}
          </div>

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
              {buttonLabel}
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

          {/* テスト課金ボタン：自分のアカウントのみ表示 */}
          {isTestUser && (
            <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px dashed #e2e8f0' }}>
              <button
                onClick={handleTestCheckout}
                disabled={testLoading}
                style={{
                  width: '100%',
                  padding: '0.7rem',
                  background: testLoading ? '#fcd34d' : '#f59e0b',
                  color: '#1a202c',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '0.88rem',
                  fontWeight: 700,
                  cursor: testLoading ? 'not-allowed' : 'pointer',
                  transition: 'background 0.2s',
                }}
              >
                {testLoading ? '処理中...' : '🧪 テスト課金（¥300・即時）'}
              </button>
              <p style={{ textAlign: 'center', fontSize: '0.72rem', color: '#a0aec0', marginTop: '0.4rem' }}>
                動作確認用・管理者のみ表示
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

