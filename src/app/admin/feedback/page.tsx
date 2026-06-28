import { clerkClient } from '@clerk/nextjs/server'
import { isDbConfigured, listFeedbackRequests } from '@/lib/db'
import FeedbackAdminClient, { type FeedbackItem } from './FeedbackAdminClient'
import styles from './page.module.css'

export const dynamic = 'force-dynamic'

export default async function AdminFeedbackPage() {
  if (!isDbConfigured()) {
    return (
      <main className={styles.main}>
        <p className={styles.empty}>DB が設定されていません。</p>
      </main>
    )
  }

  const requests = await listFeedbackRequests({ limit: 500 })

  // 投稿者のメアド・名前を Clerk から一括取得（匿名投稿は除外）
  const userIds = [
    ...new Set(
      requests
        .map((r) => r.clerk_user_id)
        .filter((id) => id && id !== 'anonymous')
    ),
  ]

  const userMap = new Map<string, { email: string; name: string }>()
  if (userIds.length > 0) {
    try {
      const client = await clerkClient()
      const { data } = await client.users.getUserList({
        userId: userIds,
        limit: 500,
      })
      for (const u of data) {
        userMap.set(u.id, {
          email: u.emailAddresses[0]?.emailAddress ?? '',
          name: u.fullName || u.firstName || '',
        })
      }
    } catch (e) {
      console.error('clerk getUserList failed:', e)
    }
  }

  const items: FeedbackItem[] = requests.map((r) => {
    const poster = userMap.get(r.clerk_user_id)
    return {
      id: r.id,
      category: r.category,
      body: r.body,
      imageUrl: r.image_url,
      status: r.status,
      createdAt: r.created_at,
      posterEmail: poster?.email || null,
      posterName: poster?.name || null,
      anonymous: r.clerk_user_id === 'anonymous',
    }
  })

  return (
    <main className={styles.main}>
      <FeedbackAdminClient items={items} />
    </main>
  )
}
