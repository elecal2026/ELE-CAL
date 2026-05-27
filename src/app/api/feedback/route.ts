import { NextRequest, NextResponse } from 'next/server'
import { auth, currentUser } from '@clerk/nextjs/server'
import {
  isDbConfigured,
  insertFeedbackRequest,
  type FeedbackCategory,
} from '@/lib/db'
import { notifyAdmins } from '@/lib/mail'

const VALID_CATEGORIES: FeedbackCategory[] = ['feature', 'bug', 'improvement']
const CATEGORY_LABEL: Record<FeedbackCategory, string> = {
  feature: '機能要望',
  bug: 'バグ報告',
  improvement: '改善提案',
}

export async function POST(request: NextRequest) {
  if (!isDbConfigured()) {
    return NextResponse.json({ error: 'DB not configured' }, { status: 503 })
  }

  const { userId } = await auth()
  const actualUserId = userId || 'anonymous'

  let payload: unknown
  try {
    payload = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const body = payload as {
    category?: string
    body?: string
  }

  if (!body.category || !(VALID_CATEGORIES as string[]).includes(body.category)) {
    return NextResponse.json({ error: 'カテゴリが不正です' }, { status: 400 })
  }
  const text = (body.body ?? '').trim()
  if (!text) return NextResponse.json({ error: '本文を入力してください' }, { status: 400 })
  if (text.length > 4000) return NextResponse.json({ error: '本文が長すぎます（4000文字まで）' }, { status: 400 })

  try {
    const inserted = await insertFeedbackRequest({
      clerkUserId: actualUserId,
      category: body.category as FeedbackCategory,
      body: text,
      imageUrl: null,
    })

    // 管理者にメール通知（失敗しても投稿は成功扱い）
    const user = userId ? await currentUser() : null
    const fromEmail = user?.emailAddresses?.[0]?.emailAddress ?? '(匿名)'
    const fromName = user?.fullName || user?.firstName || ''
    await notifyAdmins({
      subject: `[ELE-CAL] 新しい${CATEGORY_LABEL[inserted.category]}が届きました`,
      text: [
        `投稿者: ${fromName} <${fromEmail}>`,
        `種別: ${CATEGORY_LABEL[inserted.category]}`,
        '',
        '------- 本文 -------',
        text,
      ].join('\n'),
    })

    return NextResponse.json({ ok: true }, { status: 201 })
  } catch (err) {
    console.error('POST /api/feedback failed:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
