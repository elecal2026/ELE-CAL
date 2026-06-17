import { redirect } from 'next/navigation'
import { getCurrentUserAccess } from '@/lib/access'
import SubscribeForm from './SubscribeForm'

export default async function SubscribePage({
  searchParams,
}: {
  searchParams: Promise<{ preview?: string }>
}) {
  const { preview } = await searchParams
  const access = await getCurrentUserAccess()

  // 既に有効な契約、または無料枠ならアカウント画面に直行（?preview=true でスキップ）
  if ((access.accessKind === 'paid' || access.accessKind === 'free_access') && preview !== 'true') {
    redirect('/account')
  }

  const hasUsedTrial = !!access.subscription?.stripe_subscription_id

  return <SubscribeForm hasUsedTrial={hasUsedTrial} />
}
