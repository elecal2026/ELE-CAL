'use client'

import { useState } from 'react'

export default function AccountActions() {
  const [loading, setLoading] = useState<'portal' | 'cancel' | null>(null)

  const openPortal = async (path: '/api/customer-portal' | '/api/customer-portal/cancel', kind: 'portal' | 'cancel') => {
    setLoading(kind)
    try {
      const res = await fetch(path, { method: 'POST' })
      if (res.status === 503) {
        alert('決済システムは現在準備中です。')
        return
      }
      if (res.status === 401) {
        alert('ログインが必要です。')
        window.location.href = '/sign-in'
        return
      }
      if (res.status === 404) {
        alert('ご契約情報が見つかりません。')
        return
      }
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
        return
      }
      alert(`エラーが発生しました（${res.status}）: ${data.error ?? '詳細不明'}`)
    } catch (e) {
      console.error('Portal exception', e)
      alert('通信エラーが発生しました。')
    } finally {
      setLoading(null)
    }
  }

  const confirmCancel = () => {
    const ok = window.confirm('プランを解約しますか？\n次のページで解約手続きを完了してください。')
    if (!ok) return
    openPortal('/api/customer-portal/cancel', 'cancel')
  }

  const isBusy = loading !== null

  return (
    <section
      style={{
        background: '#fff',
        borderRadius: '14px',
        border: '1px solid #e2e8f0',
        padding: '1.25rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.6rem',
      }}
    >
      <button
        onClick={() => openPortal('/api/customer-portal', 'portal')}
        disabled={isBusy}
        style={{
          width: '100%',
          padding: '0.85rem',
          background: loading === 'portal' ? '#93c5fd' : '#1d6fcf',
          color: '#fff',
          border: 'none',
          borderRadius: '10px',
          fontSize: '1rem',
          fontWeight: 700,
          cursor: isBusy ? 'not-allowed' : 'pointer',
        }}
      >
        {loading === 'portal' ? '処理中...' : 'お支払い管理（カード変更・請求書）'}
      </button>

      <button
        onClick={confirmCancel}
        disabled={isBusy}
        style={{
          width: '100%',
          padding: '0.85rem',
          background: '#fff',
          color: '#dc2626',
          border: '1.5px solid #dc2626',
          borderRadius: '10px',
          fontSize: '1rem',
          fontWeight: 700,
          cursor: isBusy ? 'not-allowed' : 'pointer',
        }}
      >
        {loading === 'cancel' ? '処理中...' : 'プランを解約する'}
      </button>

      <p style={{ fontSize: '0.78rem', color: '#718096', margin: '0.25rem 0 0', textAlign: 'center' }}>
        解約はStripeの安全な画面で行われます
      </p>
    </section>
  )
}
