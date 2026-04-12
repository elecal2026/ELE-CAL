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
