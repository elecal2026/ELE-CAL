import { notFound, redirect } from 'next/navigation'
import { currentUser } from '@clerk/nextjs/server'
import { getAdminEmails } from '@/lib/admin'
import AdminShell from './AdminShell'

// 管理者メアド（ADMIN_EMAILS）でログインしている時のみ /admin 配下を表示。
// 未ログイン → /sign-in にリダイレクト。非管理者 → 404（存在を隠す）。
export const dynamic = 'force-dynamic'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const admins = getAdminEmails()
  if (admins.length === 0) notFound()

  const user = await currentUser()
  if (!user) redirect('/sign-in?redirect_url=/admin/feedback')

  const isAdmin = user.emailAddresses.some((e) =>
    admins.includes(e.emailAddress.toLowerCase())
  )
  if (!isAdmin) notFound()

  return <AdminShell>{children}</AdminShell>
}
