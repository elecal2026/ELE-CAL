import { currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import SiteHeader from '@/components/SiteHeader'
import { getCurrentUserAccess } from '@/lib/access'
import AccountActions from './AccountActions'
import AccountSecurity from './AccountSecurity'

export const dynamic = 'force-dynamic'

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (isNaN(d.getTime())) return '—'
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`
}

function statusLabel(status: string | undefined): { label: string; color: string } {
  switch (status) {
    case 'active':
      return { label: '有効', color: '#16a34a' }
    case 'trialing':
      return { label: 'トライアル中', color: '#2563eb' }
    case 'past_due':
      return { label: '支払い遅延', color: '#d97706' }
    case 'canceled':
      return { label: '解約済み', color: '#6b7280' }
    case 'incomplete':
      return { label: '手続き未完了', color: '#d97706' }
    default:
      return { label: '未契約', color: '#6b7280' }
  }
}

export default async function AccountPage() {
  const access = await getCurrentUserAccess()
  if (!access.userId) {
    redirect('/sign-in')
  }

  const user = await currentUser()
  const email = user?.emailAddresses?.[0]?.emailAddress ?? ''
  const name = user?.fullName || user?.firstName || ''

  const subscription = access.subscription
  const isFreeAccess = access.accessKind === 'free_access'
  const status = isFreeAccess
    ? { label: '無料枠', color: '#16a34a' }
    : statusLabel(subscription?.status)
  const hasActiveSub = access.canManageBilling
  const hasFullAccessWithoutBilling = isFreeAccess

  return (
    <div style={{ minHeight: '100vh', background: '#f0f4f8' }}>
      <SiteHeader mode="sub" title="アカウント" />

      <div style={{ maxWidth: '640px', margin: '0 auto', padding: '1.5rem 1rem 4rem' }}>
        {/* ユーザー情報カード */}
        <section
          style={{
            background: '#fff',
            borderRadius: '14px',
            border: '1px solid #e2e8f0',
            padding: '1.25rem',
            marginBottom: '1rem',
          }}
        >
          <h2 style={{ fontSize: '0.85rem', color: '#718096', fontWeight: 600, marginBottom: '0.75rem' }}>
            アカウント情報
          </h2>
          {name && (
            <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#1a202c', marginBottom: '0.25rem' }}>
              {name}
            </div>
          )}
          <div style={{ fontSize: '0.9rem', color: '#4a5568' }}>{email}</div>
        </section>

        {/* 契約状態カード */}
        <section
          style={{
            background: '#fff',
            borderRadius: '14px',
            border: '1px solid #e2e8f0',
            padding: '1.25rem',
            marginBottom: '1rem',
          }}
        >
          <h2 style={{ fontSize: '0.85rem', color: '#718096', fontWeight: 600, marginBottom: '0.75rem' }}>
            契約状態
          </h2>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <span
              style={{
                display: 'inline-block',
                padding: '0.2rem 0.6rem',
                borderRadius: '999px',
                background: `${status.color}15`,
                color: status.color,
                fontSize: '0.8rem',
                fontWeight: 700,
              }}
            >
              ● {status.label}
            </span>
            <span style={{ fontSize: '0.95rem', color: '#1a202c', fontWeight: 600 }}>
              {isFreeAccess ? '無料枠' : 'プロプラン'}
            </span>
          </div>

          {isFreeAccess && (
            <div style={{ fontSize: '0.85rem', color: '#4a5568' }}>
              無料枠として全てのツールをご利用いただけます。お支払いは発生しません。
            </div>
          )}
          {subscription?.trial_end && subscription.status === 'trialing' && (
            <div style={{ fontSize: '0.85rem', color: '#4a5568', marginBottom: '0.25rem' }}>
              トライアル終了日: <strong>{formatDate(subscription.trial_end)}</strong>
            </div>
          )}
          {subscription?.current_period_end && (
            <div style={{ fontSize: '0.85rem', color: '#4a5568' }}>
              次回請求日: <strong>{formatDate(subscription.current_period_end)}</strong>
            </div>
          )}
          {!subscription && !hasFullAccessWithoutBilling && (
            <div style={{ fontSize: '0.85rem', color: '#4a5568' }}>
              現在ご契約はありません。
            </div>
          )}
        </section>

        {/* 操作カード */}
        {hasActiveSub ? (
          <AccountActions />
        ) : hasFullAccessWithoutBilling ? (
          <section
            style={{
              background: '#fff',
              borderRadius: '14px',
              border: '1px solid #e2e8f0',
              padding: '1.25rem',
              marginBottom: '1rem',
            }}
          >
            <div style={{ fontSize: '0.9rem', color: '#4a5568', lineHeight: 1.7 }}>
              このアカウントは無料枠のため、お支払い管理や解約手続きは不要です。
            </div>
          </section>
        ) : (
          <section
            style={{
              background: '#fff',
              borderRadius: '14px',
              border: '1px solid #e2e8f0',
              padding: '1.25rem',
              marginBottom: '1rem',
            }}
          >
            <Link
              href="/subscribe"
              style={{
                display: 'block',
                width: '100%',
                padding: '0.85rem',
                background: '#1d6fcf',
                color: '#fff',
                border: 'none',
                borderRadius: '10px',
                fontSize: '1rem',
                fontWeight: 700,
                textAlign: 'center',
                textDecoration: 'none',
              }}
            >
              プロプランに加入する
            </Link>
          </section>
        )}

        {/* セキュリティ・アカウント管理 */}
        <AccountSecurity />
      </div>
    </div>
  )
}
