import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

const isPublicRoute = createRouteMatcher([
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/subscribe(.*)',
  '/api/stripe-webhook',
  '/legal(.*)',
])

export default clerkMiddleware(async (auth, request) => {
  // 公開ルートはそのまま通す
  if (isPublicRoute(request)) {
    return
  }

  // 未ログインユーザーはサインインページへ
  const { userId } = await auth.protect()

  // Stripe未設定 → サブスクチェックをスキップ（全ツール利用可能）
  if (!process.env.STRIPE_SECRET_KEY || !process.env.DATABASE_URL) {
    return
  }

  // Stripe設定済み → DBでサブスク状態をチェック
  // Edge Runtime対応のため、動的インポート
  const { neon } = await import('@neondatabase/serverless')
  const sql = neon(process.env.DATABASE_URL)

  const rows = await sql`SELECT status, current_period_end FROM subscriptions WHERE clerk_user_id = ${userId} LIMIT 1`

  const subscription = rows[0]
  const status = subscription?.status

  // active または trialing → 通過
  if (status === 'active' || status === 'trialing') {
    return
  }

  // past_due → 再決済ページへ
  // canceled / none / レコードなし → サブスクライブページへ
  const subscribeUrl = new URL('/subscribe', request.url)
  return NextResponse.redirect(subscribeUrl)
})

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}
