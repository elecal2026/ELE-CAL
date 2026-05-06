import { redirect } from 'next/navigation'
import { auth } from '@clerk/nextjs/server'
import { getSubscription, isDbConfigured } from '@/lib/db'
import SubscribeForm from './SubscribeForm'

export default async function SubscribePage() {
  const { userId } = await auth()

  // ログイン済みかつ既存サブスクの状態を確認
  let hasUsedTrial = false
  if (userId && isDbConfigured()) {
    try {
      const sub = await getSubscription(userId)
      // 既に有効な契約があればアカウント画面に直行
      if (sub && (sub.status === 'trialing' || sub.status === 'active')) {
        redirect('/account')
      }
      // 過去にサブスク履歴があればトライアル使用済み扱い
      hasUsedTrial = !!sub?.stripe_subscription_id
    } catch (e) {
      console.error('subscription fetch failed', e)
    }
  }

  return <SubscribeForm hasUsedTrial={hasUsedTrial} />
}
