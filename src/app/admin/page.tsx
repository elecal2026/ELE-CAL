import { clerkClient } from '@clerk/nextjs/server'
import { isDbConfigured, getSubscriptionStats } from '@/lib/db'
import { getStripe, isStripeConfigured } from '@/lib/stripe'
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

/** UTCミリ秒 → JSTの時（0〜23） */
function jstHour(ms: number): number {
  return new Date(ms + 9 * 3600 * 1000).getUTCHours()
}

/** UTCミリ秒 → JSTの曜日（0=日〜6=土） */
function jstDow(ms: number): number {
  return new Date(ms + 9 * 3600 * 1000).getUTCDay()
}

const DOW_LABELS = ['日', '月', '火', '水', '木', '金', '土']

/** 時間帯・曜日の棒グラフ（サーバーコンポーネント内ヘルパ） */
function BarChart({
  title,
  values,
  fullLabels,
  displayLabels,
}: {
  title: string
  values: number[]
  fullLabels: string[]
  displayLabels: string[]
}) {
  const max = Math.max(1, ...values)
  const total = values.reduce((a, b) => a + b, 0)
  const peakIdx = values.indexOf(Math.max(...values))

  return (
    <div className={styles.chartWrap}>
      <div className={styles.chartHead}>
        <span className={styles.chartTitle}>{title}</span>
        {total > 0 && (
          <span className={styles.chartPeak}>
            最多 {fullLabels[peakIdx]}（{values[peakIdx]}件）
          </span>
        )}
      </div>
      {total === 0 ? (
        <p className={styles.chartEmpty}>データなし</p>
      ) : (
        <div className={styles.chart}>
          {values.map((v, i) => (
            <div
              key={i}
              className={styles.barCol}
              title={`${fullLabels[i]}：${v}件`}
            >
              <div className={styles.barTrack}>
                <div
                  className={`${styles.bar} ${
                    i === peakIdx && v > 0 ? styles.barPeak : ''
                  }`}
                  style={{ height: `${Math.round((v / max) * 100)}%` }}
                />
              </div>
              <span className={styles.barLabel}>{displayLabels[i]}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default async function AdminDashboardPage() {
  if (!isDbConfigured()) {
    return (
      <main className={styles.main}>
        <p className={styles.empty}>DB が設定されていません。</p>
      </main>
    )
  }

  const monthStart = jstMonthStart().getTime()
  // マーケ指標（時間帯・曜日グラフ／今月の新規）の集計起点。
  // これ以前（テスト期間）の登録・契約は除外する。JST 2026-06-30 00:00。
  const STATS_CUTOFF = Date.UTC(2026, 5, 30, 0, 0, 0) - 9 * 3600 * 1000

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

  // 集計起点以降の登録のみを指標対象にする（テスト期間のアカウントを除外）
  const statsUsers = users.filter((u) => u.createdAt >= STATS_CUTOFF)

  // Stripe から全サブスクの「契約開始時刻」を取得（DBは触らない・過去分も取れる）
  let stripeSubs: { created: number; status: string }[] = []
  if (isStripeConfigured()) {
    try {
      const stripe = getStripe()!
      for await (const sub of stripe.subscriptions.list({
        status: 'all',
        limit: 100,
      })) {
        const created = sub.created * 1000
        if (created < STATS_CUTOFF) continue // テスト期間の契約は除外
        stripeSubs.push({ created, status: sub.status })
      }
    } catch (e) {
      console.error('stripe subscriptions.list failed:', e)
    }
  }

  // 指標計算
  const newUsersThisMonth = statsUsers.filter((u) => u.createdAt >= monthStart).length
  const proCount = proUserIds.length
  const newSubsThisMonth = stripeSubs.filter((s) => s.created >= monthStart).length
  const proRate = totalUsers > 0 ? Math.round((proCount / totalUsers) * 1000) / 10 : 0

  // 登録者の状態の内訳（未契約を「離脱」と「沈黙層」に分割）
  const subRowTotal = Object.values(statusCounts).reduce((a, b) => a + b, 0)
  const noneCount = statusCounts['none'] ?? 0 // Stripe行あり＆未課金＝決済まで来て離脱
  const canceledCount = statusCounts['canceled'] ?? 0
  const pastDueCount = statusCounts['past_due'] ?? 0
  const silentCount = Math.max(0, totalUsers - subRowTotal) // Stripe行なし＝決済画面未到達

  // 時間帯・曜日ヒストグラム（JST）
  const signupHours = new Array(24).fill(0)
  const signupDows = new Array(7).fill(0)
  for (const u of statsUsers) {
    signupHours[jstHour(u.createdAt)]++
    signupDows[jstDow(u.createdAt)]++
  }
  const subHours = new Array(24).fill(0)
  const subDows = new Array(7).fill(0)
  for (const s of stripeSubs) {
    subHours[jstHour(s.created)]++
    subDows[jstDow(s.created)]++
  }

  const hourFull = Array.from({ length: 24 }, (_, i) => `${i}時台`)
  const hourDisp = Array.from({ length: 24 }, (_, i) => (i % 3 === 0 ? `${i}` : ''))
  const dowFull = DOW_LABELS.map((d) => `${d}曜`)

  const now = new Date(Date.now() + 9 * 3600 * 1000)
  const periodLabel = `${now.getUTCFullYear()}年${now.getUTCMonth() + 1}月`

  const recentUsers = users.slice(0, 20)

  return (
    <main className={styles.main}>
      <p className={styles.periodNote}>
        「今月」は {periodLabel}（1日〜・日本時間）の集計です。時間帯・曜日も日本時間。
        アカウント登録は直近500件、契約はStripe全件が対象。
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
          <span className={styles.cardSub}>{periodLabel}のアカウント登録</span>
        </div>

        <div className={`${styles.card} ${styles.cardAccent}`}>
          <span className={styles.cardLabel}>⭐ Proユーザー数</span>
          <span className={styles.cardValue}>{proCount.toLocaleString()}</span>
          <span className={styles.cardSub}>課金中＋トライアル中 / 転換率 {proRate}%</span>
        </div>

        <div className={`${styles.card} ${styles.cardAccent}`}>
          <span className={styles.cardLabel}>📈 今月の新規契約</span>
          <span className={styles.cardValue}>{newSubsThisMonth.toLocaleString()}</span>
          <span className={styles.cardSub}>{periodLabel}にStripeで開始した契約</span>
        </div>
      </div>

      <h2 className={styles.sectionTitle}>
        登録が多い時間帯・曜日（アカウント登録ベース）
      </h2>
      <p className={styles.chartNote}>
        いつ「気になって登録」したか。広告を出す時間帯・曜日の目安。
      </p>
      <BarChart
        title="時間帯別の登録数"
        values={signupHours}
        fullLabels={hourFull}
        displayLabels={hourDisp}
      />
      <BarChart
        title="曜日別の登録数"
        values={signupDows}
        fullLabels={dowFull}
        displayLabels={DOW_LABELS}
      />

      <h2 className={styles.sectionTitle}>
        契約が決まる時間帯・曜日（Stripe課金ベース）
      </h2>
      <p className={styles.chartNote}>
        いつ「お金を払う」と決めたか。登録の山とズレていれば刺し方を変える余地。
      </p>
      <BarChart
        title="時間帯別の契約数"
        values={subHours}
        fullLabels={hourFull}
        displayLabels={hourDisp}
      />
      <BarChart
        title="曜日別の契約数"
        values={subDows}
        fullLabels={dowFull}
        displayLabels={DOW_LABELS}
      />

      <h2 className={styles.sectionTitle}>登録者の状態の内訳</h2>
      <p className={styles.chartNote}>
        「離脱」=決済画面まで来たが未契約。「未到達」=まだ決済画面に来ていない大多数。
      </p>
      <div className={styles.statusRow}>
        <span className={`${styles.statusChip} ${styles.chipPro}`}>
          ⭐ Pro（契約中＋トライアル） <b>{proCount}</b>
        </span>
        <span className={styles.statusChip}>
          🚪 決済まで来て離脱 <b>{noneCount}</b>
        </span>
        <span className={styles.statusChip}>
          💤 まだ決済画面に未到達 <b>{silentCount}</b>
        </span>
        {canceledCount > 0 && (
          <span className={styles.statusChip}>
            解約済み <b>{canceledCount}</b>
          </span>
        )}
        {pastDueCount > 0 && (
          <span className={styles.statusChip}>
            支払い遅延 <b>{pastDueCount}</b>
          </span>
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
  )
}
