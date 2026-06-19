'use client'

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'

interface PaywallContextValue {
  /** 有料契約または無料枠により、全機能を使えるかどうか */
  isPaid: boolean
  /** Stripe の支払い管理画面を開けるかどうか */
  canManageBilling: boolean
  /** サインイン済みかどうか */
  isSignedIn: boolean
  /**
   * 課金が必要な操作の直前で呼ぶ。
   * 契約中なら true を返してそのまま操作を続行、未契約なら誘導モーダルを開いて false を返す。
   */
  requirePaid: () => boolean
  /** 明示的に誘導モーダルを開く */
  openPaywall: () => void
  closePaywall: () => void
}

const PaywallContext = createContext<PaywallContextValue | null>(null)

export function usePaywall(): PaywallContextValue {
  const ctx = useContext(PaywallContext)
  if (!ctx) throw new Error('usePaywall は PaywallProvider 配下で使ってください')
  return ctx
}

export function PaywallProvider({
  children,
  isPaid,
  canManageBilling,
  isSignedIn,
}: {
  children: ReactNode
  isPaid: boolean
  canManageBilling: boolean
  isSignedIn: boolean
}) {
  const [isOpen, setIsOpen] = useState(false)

  const openPaywall = useCallback(() => setIsOpen(true), [])
  const closePaywall = useCallback(() => setIsOpen(false), [])
  const requirePaid = useCallback(() => {
    if (isPaid) return true
    setIsOpen(true)
    return false
  }, [isPaid])

  return (
    <PaywallContext.Provider value={{ isPaid, canManageBilling, isSignedIn, requirePaid, openPaywall, closePaywall }}>
      {children}
      {isOpen && <PaywallModal isSignedIn={isSignedIn} onClose={closePaywall} />}
    </PaywallContext.Provider>
  )
}

function PaywallModal({ isSignedIn, onClose }: { isSignedIn: boolean; onClose: () => void }) {
  const [loading, setLoading] = useState(false)

  const handleCheckout = async () => {
    if (!isSignedIn) {
      window.location.href = '/sign-in?redirect_url=/subscribe'
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      const data = await res.json().catch(() => ({}))
      if (res.status === 409) {
        window.location.href = data.redirectTo ?? '/account'
        return
      }
      if (res.status === 401) {
        window.location.href = '/sign-in?redirect_url=/subscribe'
        return
      }
      if (!res.ok) {
        alert(`エラーが発生しました（${res.status}）：${data.error ?? '詳細不明'}`)
        return
      }
      if (data.url) {
        window.location.href = data.url
        return
      }
      alert('エラーが発生しました。再度お試しください。')
    } catch {
      alert('通信エラーが発生しました。ネットワークをご確認ください。')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="paywall-overlay" role="dialog" aria-modal="true" aria-labelledby="paywall-title" onClick={onClose}>
      <div className="paywall-dialog" onClick={(e) => e.stopPropagation()}>
        <p className="paywall-badge">新規登録の方限定！</p>
        <h2 id="paywall-title" className="paywall-title">
          全てのツールが<br />
          <span className="paywall-title-highlight">30日間 無料</span><br />
          で使い放題
        </h2>
        <button
          onClick={handleCheckout}
          disabled={loading}
          className="paywall-btn-primary"
        >
          {loading ? '処理中...' : '無料で全てのツールを使う'}
        </button>
        <ul className="paywall-list">
          <li>上のボタンから申込完了するだけ。</li>
          <li>無料トライアル終了まで課金は発生せず、いつでもキャンセル可能です。キャンセル料などの料金は一切発生しません。</li>
          <li>無料トライアル終了後は有料プランに移行して課金が発生します。</li>
        </ul>
        <button type="button" className="paywall-skip" onClick={onClose}>
          いいえ、通常の無料会員として使用する →
        </button>
      </div>
    </div>
  )
}
