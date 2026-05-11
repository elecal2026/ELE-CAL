import { NextRequest, NextResponse } from 'next/server'
import { auth, currentUser } from '@clerk/nextjs/server'
import {
  isDbConfigured,
  getSubscription,
  listFeedbackRequests,
  listRepliesByRequestIds,
  insertFeedbackRequest,
  type FeedbackCategory,
  type FeedbackRequestRow,
  type FeedbackReplyRow,
} from '@/lib/db'
import { notifyAdmins, getAdminEmails } from '@/lib/mail'

const VALID_CATEGORIES: FeedbackCategory[] = ['feature', 'bug', 'improvement']
const CATEGORY_LABEL: Record<FeedbackCategory, string> = {
  feature: '機能要望',
  bug: 'バグ報告',
  improvement: '改善提案',
}

interface ApiReply {
  id: number
  body: string
  createdAt: string
}

interface ApiFeedback {
  id: number
  category: FeedbackCategory
  body: string
  imageUrl: string | null
  createdAt: string
  isMine: boolean
  /** 管理者ビュー用：投稿者ID（ユーザーには露出させない） */
  clerkUserId?: string
  replies: ApiReply[]
}

function toApi(
  row: FeedbackRequestRow,
  replies: FeedbackReplyRow[],
  currentUserId: string,
  isAdmin: boolean
): ApiFeedback {
  return {
    id: row.id,
    category: row.category,
    body: row.body,
    imageUrl: row.image_url,
    createdAt: row.created_at,
    isMine: row.clerk_user_id === currentUserId,
    clerkUserId: isAdmin ? row.clerk_user_id : undefined,
    replies: replies.map((r) => ({
      id: r.id,
      body: r.body,
      createdAt: r.created_at,
    })),
  }
}

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

export async function GET() {
  if (!isDbConfigured()) {
    return NextResponse.json({ error: 'DB not configured' }, { status: 503 })
  }

  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const isAdmin = await isCurrentUserAdmin()

  try {
    const requests = await listFeedbackRequests({
      clerkUserId: isAdmin ? undefined : userId,
      limit: 100,
    })
    const ids = requests.map((r) => r.id)
    const replies = await listRepliesByRequestIds(ids)
    const byRequest = new Map<number, FeedbackReplyRow[]>()
    for (const rep of replies) {
      const arr = byRequest.get(rep.request_id) ?? []
      arr.push(rep)
      byRequest.set(rep.request_id, arr)
    }
    const items = requests.map((r) =>
      toApi(r, byRequest.get(r.id) ?? [], userId, isAdmin)
    )
    return NextResponse.json({ items, isAdmin })
  } catch (err) {
    console.error('GET /api/feedback failed:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  if (!isDbConfigured()) {
    return NextResponse.json({ error: 'DB not configured' }, { status: 503 })
  }

  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const isAdmin = await isCurrentUserAdmin()
  if (!isAdmin) {
    const paid = await isCurrentUserPaid(userId)
    if (!paid) {
      return NextResponse.json(
        { error: '投稿にはプロプラン契約が必要です' },
        { status: 403 }
      )
    }
  }

  let payload: unknown
  try {
    payload = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const body = payload as {
    category?: string
    body?: string
    imageUrl?: string | null
  }

  if (!body.category || !(VALID_CATEGORIES as string[]).includes(body.category)) {
    return NextResponse.json({ error: 'カテゴリが不正です' }, { status: 400 })
  }
  const text = (body.body ?? '').trim()
  if (!text) return NextResponse.json({ error: '本文を入力してください' }, { status: 400 })
  if (text.length > 4000) return NextResponse.json({ error: '本文が長すぎます（4000文字まで）' }, { status: 400 })

  try {
    const inserted = await insertFeedbackRequest({
      clerkUserId: userId,
      category: body.category as FeedbackCategory,
      body: text,
      imageUrl: body.imageUrl ?? null,
    })

    // 管理者にメール通知（失敗しても投稿は成功扱い）
    const user = await currentUser()
    const fromEmail = user?.emailAddresses?.[0]?.emailAddress ?? '(不明)'
    const fromName = user?.fullName || user?.firstName || ''
    void notifyAdmins({
      subject: `[ELE-CAL] 新しい${CATEGORY_LABEL[inserted.category]}が届きました`,
      text: [
        `投稿者: ${fromName} <${fromEmail}>`,
        `種別: ${CATEGORY_LABEL[inserted.category]}`,
        `画像: ${inserted.image_url ?? 'なし'}`,
        '',
        '------- 本文 -------',
        text,
        '',
        '------- 管理画面 -------',
        '/feedback で返信できます',
      ].join('\n'),
    })

    return NextResponse.json({ item: toApi(inserted, [], userId, isAdmin) }, { status: 201 })
  } catch (err) {
    console.error('POST /api/feedback failed:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
