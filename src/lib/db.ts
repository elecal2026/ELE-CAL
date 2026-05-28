import { neon } from '@neondatabase/serverless'

/** DB接続が設定されているかチェック */
export function isDbConfigured(): boolean {
  return !!process.env.DATABASE_URL
}

/** SQLクエリを実行（tagged template literal） */
function sql() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not configured')
  }
  return neon(process.env.DATABASE_URL)
}

/** サブスク情報の型 */
export interface Subscription {
  id: string
  clerk_user_id: string
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  status: string
  trial_end: string | null
  current_period_end: string | null
  updated_at: string
}

/** ClerkユーザーIDからサブスク状態を取得 */
export async function getSubscription(clerkUserId: string): Promise<Subscription | null> {
  const query = sql()
  const rows = await query`SELECT * FROM subscriptions WHERE clerk_user_id = ${clerkUserId} LIMIT 1`
  return (rows[0] as Subscription) ?? null
}

/** サブスク情報を作成または更新 */
export async function upsertSubscription(data: {
  clerkUserId: string
  stripeCustomerId: string
  stripeSubscriptionId?: string
  status?: string
  trialEnd?: Date | null
  currentPeriodEnd?: Date | null
}): Promise<void> {
  const query = sql()
  const subId = data.stripeSubscriptionId ?? null
  const status = data.status ?? 'none'
  const trialEnd = data.trialEnd ?? null
  const periodEnd = data.currentPeriodEnd ?? null

  await query`
    INSERT INTO subscriptions (clerk_user_id, stripe_customer_id, stripe_subscription_id, status, trial_end, current_period_end, updated_at)
    VALUES (${data.clerkUserId}, ${data.stripeCustomerId}, ${subId}, ${status}, ${trialEnd}, ${periodEnd}, NOW())
    ON CONFLICT (clerk_user_id)
    DO UPDATE SET
      stripe_customer_id = COALESCE(${data.stripeCustomerId}, subscriptions.stripe_customer_id),
      stripe_subscription_id = COALESCE(${subId}, subscriptions.stripe_subscription_id),
      status = COALESCE(${status}, subscriptions.status),
      trial_end = COALESCE(${trialEnd}, subscriptions.trial_end),
      current_period_end = COALESCE(${periodEnd}, subscriptions.current_period_end),
      updated_at = NOW()
  `
}

/** Stripe顧客IDからサブスク状態を更新（Webhook用） */
export async function updateSubscriptionByCustomerId(data: {
  stripeCustomerId: string
  stripeSubscriptionId?: string
  status: string
  trialEnd?: Date | null
  currentPeriodEnd?: Date | null
}): Promise<void> {
  const query = sql()
  const subId = data.stripeSubscriptionId ?? null
  const trialEnd = data.trialEnd ?? null
  const periodEnd = data.currentPeriodEnd ?? null

  await query`
    UPDATE subscriptions SET
      stripe_subscription_id = COALESCE(${subId}, stripe_subscription_id),
      status = ${data.status},
      trial_end = COALESCE(${trialEnd}, trial_end),
      current_period_end = COALESCE(${periodEnd}, current_period_end),
      updated_at = NOW()
    WHERE stripe_customer_id = ${data.stripeCustomerId}
  `
}

// ============================================================
// 要望投稿フォーム（feedback_requests / feedback_replies）
// ============================================================

export type FeedbackCategory = 'feature' | 'bug' | 'improvement'

/** 対応状況: open=新着（未対応） / done=完了済 */
export type FeedbackStatus = 'open' | 'done'

export interface FeedbackRequestRow {
  id: number
  clerk_user_id: string
  category: FeedbackCategory
  body: string
  image_url: string | null
  status: FeedbackStatus
  created_at: string
  updated_at: string
}

export interface FeedbackReplyRow {
  id: number
  request_id: number
  clerk_user_id: string
  body: string
  created_at: string
}

/** 要望一覧を取得（管理者なら全件、ユーザーなら自分の投稿のみ） */
export async function listFeedbackRequests(opts: {
  clerkUserId?: string
  limit?: number
}): Promise<FeedbackRequestRow[]> {
  const query = sql()
  const limit = opts.limit ?? 100
  if (opts.clerkUserId) {
    const rows = await query`
      SELECT * FROM feedback_requests
      WHERE clerk_user_id = ${opts.clerkUserId}
      ORDER BY created_at DESC
      LIMIT ${limit}
    `
    return rows as FeedbackRequestRow[]
  }
  const rows = await query`
    SELECT * FROM feedback_requests
    ORDER BY created_at DESC
    LIMIT ${limit}
  `
  return rows as FeedbackRequestRow[]
}

/** 指定ID群に紐づく返信を一括取得（N+1回避） */
export async function listRepliesByRequestIds(
  requestIds: number[]
): Promise<FeedbackReplyRow[]> {
  if (requestIds.length === 0) return []
  const query = sql()
  const rows = await query`
    SELECT * FROM feedback_replies
    WHERE request_id = ANY(${requestIds}::bigint[])
    ORDER BY created_at ASC
  `
  return rows as FeedbackReplyRow[]
}

/** 要望投稿 */
export async function insertFeedbackRequest(data: {
  clerkUserId: string
  category: FeedbackCategory
  body: string
  imageUrl: string | null
}): Promise<FeedbackRequestRow> {
  const query = sql()
  const rows = await query`
    INSERT INTO feedback_requests (clerk_user_id, category, body, image_url)
    VALUES (${data.clerkUserId}, ${data.category}, ${data.body}, ${data.imageUrl})
    RETURNING *
  `
  return rows[0] as FeedbackRequestRow
}

/** 管理者返信 */
export async function insertFeedbackReply(data: {
  requestId: number
  clerkUserId: string
  body: string
}): Promise<FeedbackReplyRow> {
  const query = sql()
  const rows = await query`
    INSERT INTO feedback_replies (request_id, clerk_user_id, body)
    VALUES (${data.requestId}, ${data.clerkUserId}, ${data.body})
    RETURNING *
  `
  return rows[0] as FeedbackReplyRow
}

/** 要望1件取得 */
export async function getFeedbackRequest(
  id: number
): Promise<FeedbackRequestRow | null> {
  const query = sql()
  const rows = await query`
    SELECT * FROM feedback_requests WHERE id = ${id} LIMIT 1
  `
  return (rows[0] as FeedbackRequestRow) ?? null
}

/** 対応状況を更新（管理者用） */
export async function updateFeedbackStatus(
  id: number,
  status: FeedbackStatus
): Promise<FeedbackRequestRow | null> {
  const query = sql()
  const rows = await query`
    UPDATE feedback_requests
    SET status = ${status}, updated_at = NOW()
    WHERE id = ${id}
    RETURNING *
  `
  return (rows[0] as FeedbackRequestRow) ?? null
}
