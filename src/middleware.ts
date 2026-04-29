import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { getSubscription, isDbConfigured } from '@/lib/db'

// 課金が必要なページ（電圧降下・ブレーカー選定）
const isPaidRoute = createRouteMatcher([
  '/voltage_drop(.*)',
  '/voltage_drop_v2(.*)',
  '/breaker(.*)',
])

// 有効なサブスク状態
const VALID_STATUSES = new Set(['active', 'trialing'])

export default clerkMiddleware(async (auth, req) => {
  if (!isPaidRoute(req)) return

  const { userId } = await auth()

  // 未ログイン → サインインへ
  if (!userId) {
    const url = new URL('/sign-in', req.url)
    return NextResponse.redirect(url)
  }

  // DB未設定時は認証のみで通す（フェールオープン運用）
  if (!isDbConfigured()) return

  // サブスク状態を確認
  try {
    const sub = await getSubscription(userId)
    if (sub && VALID_STATUSES.has(sub.status)) return
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
    '/((?!_next|.*\\..*).*)',
    '/(api|trpc)(.*)',
  ],
}
