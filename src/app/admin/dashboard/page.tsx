import SiteHeader from '@/components/SiteHeader'
import { clerkClient } from '@clerk/nextjs/server'
import { isDbConfigured, getSubscriptionStats } from '@/lib/db'
import styles from './page.module.css'

export const dynamic = 'force-dynamic'

/** 当月（JST）の開始時刻を UTC の Date で返す */
function jstMonthStart(): Date {
  const now = new Date()
  const jst = new Date(now.getTime() + 9 * 3600 * 1000)
  // JST の当月1日 00:00 を UTC ミリ秒に直す
  const ms = Date.UTC(jst.getUTCFullYear(), jst.getUTCMonth(), 1) - 9 * 3600 * 1000
  return new Date(ms)
}

/** YYYY/M/D 形式（JST） */
function fmtDate(ms: number): string {
  const jst = new Date(ms + 9 * 3600 * 1000)
  return `${jst.getUTCFullYear()}/${jst.getUTCMonth() + 1}/${jst.getUTCDate()}`
}

const STATUS_LABELS: Record<string, string> = {
  active: '契約中',
  trialing: 'トライアル中',
  past_due: '支払い遅延',
  canceled: '解約済み',
  none: '未契約',
}

export default async function AdminDashboardPage() {
  if (!isDbConfigured()) {
    return (
      <div className={styles.page}>
        <SiteHeader mode="sub" title="ダッシュボード" />
        <main className={styles.main}>
          <p className={styles.empty}>DB が設定されていません。</p>
        </main>
      </div>
    )
  }

  const monthStart = jstMonthStart().getTime()

  // サブスク集計（Neon）
  let proUserIds: string[] = []
  let statusCounts: Record<string, number> = {}
  try {
    const stats = await getSubscriptionStats()
    proUserIds = stats.proUserIds
    statusCounts = stats.statusCounts
  } catch (e) {
    console.error('getSubscriptionStats failed:', e)
  }
  const proIdSet = new Set(proUserIds)

  // Clerk から全ユーザー取得（登録日順）
  let totalUsers = 0
  let users: { id: string; email: string; createdAt: number }[] = []
  try {
    const client = await clerkClient()
    const res = await client.users.getUserList({
      limit: 500,
      orderBy: '-created_at',
    })
    totalUsers = res.totalCount
    users = res.data.map((u) => ({
      id: u.id,
      email: u.emailAddresses[0]?.emailAddress ?? '(メール未設定)',
      createdAt: u.createdAt,
    }))
  } catch (e) {
    console.error('clerk getUserList failed:', e)
  }

  // 指標計算
  const newUsersThisMonth = users.filter((u) => u.createdAt >= monthStart).length
  const proCount = proUserIds.length
  // 新規Pro（近似）: Proユーザーのうち Clerk 登録日が当月のもの
  const newProThisMonth = users.filter(
    (u) => proIdSet.has(u.id) && u.createdAt >= monthStart
  ).length
  const proRate = totalUsers > 0 ? Math.round((proCount / totalUsers) * 1000) / 10 : 0

  const now = new Date(Date.now() + 9 * 3600 * 1000)
  const periodLabel = `${now.getUTCFullYear()}年${now.getUTCMonth() + 1}月`

  const recentUsers = users.slice(0, 20)

  return (
    <div className={styles.page}>
      <SiteHeader mode="sub" title="ダッシュボード" />
      <main className={styles.main}>
        <p className={styles.periodNote}>
          「今月」は {periodLabel}（1日〜・日本時間）の集計です。新規Pro数は登録日ベースの概算値。
        </p>

        <div className={styles.grid}>
          <div className={styles.card}>
            <span className={styles.cardLabel}>👥 総ユーザー数</span>
            <span className={styles.cardValue}>{totalUsers.toLocaleString()}</span>
            <span className={styles.cardSub}>Clerk 登録アカウント総数</span>
          </div>

          <div className={styles.card}>
            <span className={styles.cardLabel}>🆕 今月の新規ユーザー</span>
            <span className={styles.cardValue}>{newUsersThisMonth.toLocaleString()}</span>
            <span className={styles.cardSub}>{periodLabel}の新規登録</span>
          </div>

          <div className={`${styles.card} ${styles.cardAccent}`}>
            <span className={styles.cardLabel}>⭐ Proユーザー数</span>
            <span className={styles.cardValue}>{proCount.toLocaleString()}</span>
            <span className={styles.cardSub}>課金中＋トライアル中 / 転換率 {proRate}%</span>
          </div>

          <div className={`${styles.card} ${styles.cardAccent}`}>
            <span className={styles.cardLabel}>📈 今月の新規Pro</span>
            <span className={styles.cardValue}>{newProThisMonth.toLocaleString()}</span>
            <span className={styles.cardSub}>{periodLabel}登録のProユーザー（概算）</span>
          </div>
        </div>

        <h2 className={styles.sectionTitle}>契約状況の内訳</h2>
        <div className={styles.statusRow}>
          {Object.keys(statusCounts).length === 0 ? (
            <span className={styles.statusChip}>データなし</span>
          ) : (
            Object.entries(statusCounts)
              .sort((a, b) => b[1] - a[1])
              .map(([status, n]) => (
                <span key={status} className={styles.statusChip}>
                  {STATUS_LABELS[status] ?? status} <b>{n}</b>
                </span>
              ))
          )}
        </div>

        <h2 className={styles.sectionTitle}>最近の登録ユーザー（最大20件）</h2>
        {recentUsers.length === 0 ? (
          <p className={styles.empty}>ユーザーがいません。</p>
        ) : (
          <ul className={styles.list}>
            {recentUsers.map((u) => (
              <li key={u.id} className={styles.row}>
                <span className={styles.email}>{u.email}</span>
                {proIdSet.has(u.id) && <span className={styles.proBadge}>Pro</span>}
                <span className={styles.rowDate}>{fmtDate(u.createdAt)}</span>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  )
}
