'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function SubscribeForm({ hasUsedTrial }: { hasUsedTrial: boolean }) {
  const [stripeReady, setStripeReady] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(false)

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
      const data = await res.json().catch(() => ({}))
      if (res.status === 503) {
        alert(data.error ?? '決済システムは現在準備中です。')
        return
      }
      if (res.status === 401) {
        alert('ログインが必要です。サインインしてからお試しください。')
        window.location.href = '/sign-in'
        return
      }
      if (res.status === 409) {
        window.location.href = data.redirectTo ?? '/account'
        return
      }
      if (!res.ok) {
        const message = data.error ?? '詳細不明'
        console.error('Checkout failed', { status: res.status, data })
        alert(`エラーが発生しました（${res.status}）：${message}`)
        return
      }
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

  const buttonLabel = loading
    ? '処理中...'
    : hasUsedTrial
      ? 'プランに登録する'
      : '無料で全てのツールを使う'

  // トライアル済みの場合は従来デザイン
  if (hasUsedTrial) {
    return (
      <div style={{ minHeight: '100vh', background: '#F4F4F4', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
        <div style={{ background: '#fff', borderRadius: '10px', border: '1px solid #E0E0E0', boxShadow: '0 4px 16px rgba(0,0,0,0.08)', maxWidth: '420px', width: '100%', overflow: 'hidden' }}>
          <div style={{ background: '#1C2B4A', padding: '2rem 1.5rem', textAlign: 'center', color: '#fff' }}>
            <div style={{ fontSize: '1.8rem', fontWeight: 900, letterSpacing: '0.04em', marginBottom: '0.25rem', fontFamily: 'Barlow, sans-serif' }}>
              ELE<span style={{ color: '#C8281E' }}>-</span>CAL
            </div>
            <div style={{ height: '3px', width: '60px', margin: '0.5rem auto 0.75rem', background: 'linear-gradient(to right, #C8281E 60%, #E8A020 60%)', borderRadius: '2px' }} />
            <p style={{ fontSize: '0.85rem', opacity: 0.8 }}>電気工事 計算・参照ツール</p>
          </div>
          <div style={{ padding: '1.5rem' }}>
            <div style={{ textAlign: 'center', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '1rem', fontWeight: 700, color: '#1C2B4A' }}>プロプラン</span>
            </div>
            <div style={{ textAlign: 'center', marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1C2B4A' }}>550円</span>
              <span style={{ fontSize: '0.9rem', color: '#888' }}>／月（税込）</span>
            </div>
            <p style={{ fontSize: '0.82rem', color: '#888', textAlign: 'center', marginBottom: '1.25rem' }}>
              ※無料トライアルをご利用済みの方はプロプランの更新となります。
            </p>
            {stripeReady === null ? (
              <div style={{ textAlign: 'center', color: '#888', fontSize: '0.9rem' }}>読み込み中...</div>
            ) : stripeReady ? (
              <button
                onClick={handleSubscribe}
                disabled={loading}
                style={{
                  width: '100%', padding: '0.85rem',
                  background: loading ? '#8399c4' : '#1C2B4A',
                  color: '#fff', border: 'none', borderRadius: '8px',
                  fontSize: '1rem', fontWeight: 700,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'background 0.2s',
                  fontFamily: 'Noto Sans JP, sans-serif',
                }}
              >
                {buttonLabel}
              </button>
            ) : (
              <div>
                <button disabled style={{ width: '100%', padding: '0.85rem', background: '#ccc', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '1rem', fontWeight: 700, cursor: 'not-allowed', fontFamily: 'Noto Sans JP, sans-serif' }}>
                  決済システム準備中
                </button>
                <p style={{ textAlign: 'center', fontSize: '0.78rem', color: '#aaa', marginTop: '0.5rem' }}>まもなくご利用いただけます</p>
              </div>
            )}
            <p style={{ textAlign: 'center', marginTop: '1rem' }}>
              <Link href="/" style={{ fontSize: '0.82rem', color: '#888', textDecoration: 'none' }}>
                今は登録しない → ELE-CALトップへ
              </Link>
            </p>
          </div>
        </div>
      </div>
    )
  }

  // 新規登録（トライアル未使用）: 新デザイン
  return (
    <div style={{ minHeight: '100vh', background: '#F4F4F4', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div style={{ background: '#fff', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.12)', maxWidth: '400px', width: '100%', padding: '2rem 1.5rem', textAlign: 'center' }}>
        <p style={{ fontSize: '0.8rem', color: '#555', marginBottom: '0.6rem' }}>
          新規登録の方限定！
        </p>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 900, color: '#1C2B4A', lineHeight: 1.5, marginBottom: '1.25rem' }}>
          全てのツールが<br />
          <span style={{ fontSize: '1.6rem' }}>30日間 無料</span><br />
          で使い放題
        </h2>

        {stripeReady === null ? (
          <div style={{ color: '#888', fontSize: '0.9rem', marginBottom: '1.25rem' }}>読み込み中...</div>
        ) : stripeReady ? (
          <button
            onClick={handleSubscribe}
            disabled={loading}
            style={{
              display: 'block', width: '100%', padding: '1rem',
              background: loading ? '#c9891a' : '#E8A020',
              color: '#fff', border: 'none', borderRadius: '8px',
              fontSize: '1rem', fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'background 0.2s',
              marginBottom: '1.25rem',
              fontFamily: 'Noto Sans JP, sans-serif',
            }}
          >
            {buttonLabel}
          </button>
        ) : (
          <div style={{ marginBottom: '1.25rem' }}>
            <button disabled style={{ display: 'block', width: '100%', padding: '1rem', background: '#ccc', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '1rem', fontWeight: 700, cursor: 'not-allowed', fontFamily: 'Noto Sans JP, sans-serif' }}>
              決済システム準備中
            </button>
            <p style={{ textAlign: 'center', fontSize: '0.78rem', color: '#aaa', marginTop: '0.5rem' }}>まもなくご利用いただけます</p>
          </div>
        )}

        <ul style={{ textAlign: 'left', fontSize: '0.8rem', color: '#555', lineHeight: 1.85, listStyle: 'none', marginBottom: '1.25rem' }}>
          <li style={{ display: 'flex', gap: '0.3rem', marginBottom: '0.3rem' }}><span>・</span><span>上のボタンから申込完了するだけ。</span></li>
          <li style={{ display: 'flex', gap: '0.3rem', marginBottom: '0.3rem' }}><span>・</span><span>無料トライアル終了まで課金は発生せず、いつでもキャンセル可能です。キャンセル料などの料金は一切発生しません。</span></li>
          <li style={{ display: 'flex', gap: '0.3rem' }}><span>・</span><span>無料トライアル終了後は有料プランに移行して課金が発生します。</span></li>
        </ul>

        <Link
          href="/"
          style={{ fontSize: '0.8rem', color: '#1d6fcf', textDecoration: 'none' }}
        >
          いいえ、通常の無料会員として使用する →
        </Link>
      </div>
    </div>
  )
}
