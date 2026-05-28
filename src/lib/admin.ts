import { currentUser } from '@clerk/nextjs/server'

/** ADMIN_EMAILS 環境変数からカンマ区切りで管理者メアド配列を返す（小文字化・正規化済み） */
export function getAdminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
}

/** 現在ログイン中のユーザーが管理者か判定。未ログイン・ADMIN_EMAILS未設定なら false */
export async function isCurrentUserAdmin(): Promise<boolean> {
  const admins = getAdminEmails()
  if (admins.length === 0) return false
  const user = await currentUser()
  if (!user) return false
  return user.emailAddresses.some((e) =>
    admins.includes(e.emailAddress.toLowerCase())
  )
}
