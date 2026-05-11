import { NextRequest, NextResponse } from 'next/server'
import { auth, currentUser } from '@clerk/nextjs/server'
import {
  isDbConfigured,
  getFeedbackRequest,
  insertFeedbackReply,
} from '@/lib/db'
import { getAdminEmails } from '@/lib/mail'

async function isCurrentUserAdmin(): Promise<boolean> {
  const user = await currentUser()
  if (!user) return false
  const admins = getAdminEmails().map((e) => e.toLowerCase())
  if (admins.length === 0) return false
  const emails = user.emailAddresses.map((e) => e.emailAddress.toLowerCase())
  return emails.some((e) => admins.includes(e))
}

export async function POST(
  request: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  if (!isDbConfigured()) {
    return NextResponse.json({ error: 'DB not configured' }, { status: 503 })
  }

  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const isAdmin = await isCurrentUserAdmin()
  if (!isAdmin) {
    return NextResponse.json({ error: '返信は管理者のみ可能です' }, { status: 403 })
  }

  const { id: idParam } = await ctx.params
  const requestId = Number(idParam)
  if (!Number.isInteger(requestId) || requestId <= 0) {
    return NextResponse.json({ error: 'IDが不正です' }, { status: 400 })
  }

  const target = await getFeedbackRequest(requestId)
  if (!target) {
    return NextResponse.json({ error: '対象の要望が見つかりません' }, { status: 404 })
  }

  let payload: unknown
  try {
    payload = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const body = payload as { body?: string }
  const text = (body.body ?? '').trim()
  if (!text) return NextResponse.json({ error: '本文を入力してください' }, { status: 400 })
  if (text.length > 4000) return NextResponse.json({ error: '本文が長すぎます（4000文字まで）' }, { status: 400 })

  try {
    const reply = await insertFeedbackReply({
      requestId,
      clerkUserId: userId,
      body: text,
    })
    return NextResponse.json(
      {
        item: {
          id: reply.id,
          body: reply.body,
          createdAt: reply.created_at,
        },
      },
      { status: 201 }
    )
  } catch (err) {
    console.error('POST /api/feedback/[id]/replies failed:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
