import { NextRequest, NextResponse } from 'next/server'
import { auth, currentUser } from '@clerk/nextjs/server'
import { put } from '@vercel/blob'
import { isDbConfigured, getSubscription } from '@/lib/db'
import { getAdminEmails } from '@/lib/mail'

const MAX_BYTES = 8 * 1024 * 1024 // 8MB
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif']

async function isCurrentUserAdmin(): Promise<boolean> {
  const user = await currentUser()
  if (!user) return false
  const admins = getAdminEmails().map((e) => e.toLowerCase())
  if (admins.length === 0) return false
  const emails = user.emailAddresses.map((e) => e.emailAddress.toLowerCase())
  return emails.some((e) => admins.includes(e))
}

async function isCurrentUserPaid(userId: string): Promise<boolean> {
  if (!isDbConfigured()) return false
  const sub = await getSubscription(userId)
  return !!sub && (sub.status === 'trialing' || sub.status === 'active')
}

export async function POST(request: NextRequest) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const isAdmin = await isCurrentUserAdmin()
  if (!isAdmin) {
    const paid = await isCurrentUserPaid(userId)
    if (!paid) {
      return NextResponse.json(
        { error: 'アップロードにはプロプラン契約が必要です' },
        { status: 403 }
      )
    }
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json({ error: 'Blob未設定' }, { status: 503 })
  }

  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 })
  }

  const file = formData.get('file')
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'ファイルが選択されていません' }, { status: 400 })
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: '対応形式: PNG/JPEG/WebP/GIF' }, { status: 400 })
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: '画像が大きすぎます（8MBまで）' }, { status: 400 })
  }

  const ext = file.name.includes('.') ? file.name.split('.').pop() : 'png'
  const safeName = `feedback/${userId}/${Date.now()}.${ext}`

  try {
    const blob = await put(safeName, file, {
      access: 'public',
      addRandomSuffix: true,
    })
    return NextResponse.json({ url: blob.url }, { status: 201 })
  } catch (err) {
    console.error('POST /api/feedback/upload failed:', err)
    return NextResponse.json({ error: 'アップロードに失敗しました' }, { status: 500 })
  }
}
