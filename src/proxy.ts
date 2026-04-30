import { clerkMiddleware } from '@clerk/nextjs/server'

// freemium 化に伴い、ルート単位での有料判定は廃止。
// 全ページに匿名アクセス可、各ツール内の「追加」アクション等で課金導線を出す方式に移行。
// ここでは Clerk の認証情報をリクエストに付与するだけにとどめ、
// サブスク状態は layout.tsx 側で getSubscription() を使って取得する。
export default clerkMiddleware()

export const config = {
  matcher: [
    // Next.js内部・静的ファイルを除外
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}
