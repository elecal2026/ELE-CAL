import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

// 課金が必要なページ（電圧降下・ブレーカー選定）
const isPaidRoute = createRouteMatcher([
  '/voltage_drop(.*)',
  '/voltage_drop_v2(.*)',
  '/breaker(.*)',
])

// 有効なサブスク状態
const VALID_STATUSES = new Set(['active', 'trialing'])

export default clerkMiddleware(async (auth, req) => {
  // 無料ページ（トップ、許容電流表、配管サイズなど）はそのまま通す
  if (!isPaidRoute(req)) return

  const { userId } = await auth()

  // 未ログイン → サインインへ
  if (!userId) {
    const url = new URL('/sign-in', req.url)
    return NextResponse.redirect(url)
  }

  // Stripe/DB未設定 → 認証のみで通す（フェールオープン運用）
  if (!process.env.STRIPE_SECRET_KEY || !process.env.DATABASE_URL) {
    return
  }

  // サブスク状態を確認（Edge Runtime対応で動的インポート）
  try {
    const { neon } = await import('@neondatabase/serverless')
    const sql = neon(process.env.DATABASE_URL)
    const rows = await sql`SELECT status FROM subscriptions WHERE clerk_user_id = ${userId} LIMIT 1`

    const status = rows[0]?.status
    if (status && VALID_STATUSES.has(status)) return
  } catch (e) {
    console.error('subscription check failed', e)
    // DB障害時は通す（フェールオープン）
    return
  }

  // 未契約 → サブスク案内へ
  const url = new URL('/subscribe', req.url)
  return NextResponse.redirect(url)
})

export const config = {
  matcher: [
    // Next.js内部・静的ファイルを除外
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}
