import { NextRequest, NextResponse } from 'next/server'
import { isCurrentUserAdmin } from '@/lib/admin'
import {
  isDbConfigured,
  updateFeedbackStatus,
  type FeedbackStatus,
} from '@/lib/db'

const VALID_STATUSES: FeedbackStatus[] = ['open', 'done']

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isCurrentUserAdmin())) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  if (!isDbConfigured()) {
    return NextResponse.json({ error: 'DB not configured' }, { status: 503 })
  }

  const { id } = await params
  const numId = Number(id)
  if (!Number.isInteger(numId) || numId <= 0) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 })
  }

  let payload: unknown
  try {
    payload = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const body = payload as { status?: string }
  if (!body.status || !(VALID_STATUSES as string[]).includes(body.status)) {
    return NextResponse.json({ error: 'status が不正です' }, { status: 400 })
  }

  try {
    const updated = await updateFeedbackStatus(numId, body.status as FeedbackStatus)
    if (!updated) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    return NextResponse.json({ ok: true, status: updated.status })
  } catch (err) {
    console.error('PATCH /api/admin/feedback/[id] failed:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
