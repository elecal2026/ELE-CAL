import { notFound } from 'next/navigation'
import { isCurrentUserAdmin } from '@/lib/admin'

// 管理者メアド（ADMIN_EMAILS）でログインしている時のみ /admin 配下を表示。
// それ以外は存在を隠すため 404 を返す。
export const dynamic = 'force-dynamic'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const allowed = await isCurrentUserAdmin()
  if (!allowed) notFound()
  return <>{children}</>
}
