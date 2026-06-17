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
  // 未ログイン → サインインへ。ログイン済み未契約 → 課金ページへ
  const primaryHref = isSignedIn ? '/subscribe' : '/sign-in?redirect_url=/subscribe'
  const primaryLabel = isSignedIn ? 'プランを見る' : 'ログイン / 新規登録'
  const heading = '全ての機能を使うには登録が必要です'
  const body = '全ての機能を使う為には、「無料トライアル」の登録又は、「サブスクリプション」の更新が必要です。下記のボタンからご確認下さい。'

  return (
    <div className="paywall-overlay" role="dialog" aria-modal="true" aria-labelledby="paywall-title" onClick={onClose}>
      <div className="paywall-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="paywall-icon" aria-hidden="true">🔒</div>
        <h2 id="paywall-title" className="paywall-title">{heading}</h2>
        <p className="paywall-body">{body}</p>
        <div className="paywall-actions">
          <a className="paywall-btn-primary" href={primaryHref}>{primaryLabel}</a>
          <button type="button" className="paywall-btn-secondary" onClick={onClose}>閉じる</button>
        </div>
      </div>
    </div>
  )
}
