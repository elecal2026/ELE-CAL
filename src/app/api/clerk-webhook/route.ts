import { NextRequest, NextResponse } from 'next/server'
import { Webhook } from 'svix'
import { sendToUser } from '@/lib/mail'

type ClerkUserCreatedEvent = {
  type: 'user.created'
  data: {
    id: string
    email_addresses: { email_address: string; id: string }[]
    primary_email_address_id: string
    first_name: string | null
    last_name: string | null
  }
}

export async function POST(request: NextRequest) {
  const webhookSecret = process.env.CLERK_WEBHOOK_SECRET
  if (!webhookSecret) {
    console.warn('[clerk-webhook] CLERK_WEBHOOK_SECRET 未設定。スキップ')
    return NextResponse.json({ received: true })
  }

  const body = await request.text()
  const svixId = request.headers.get('svix-id') ?? ''
  const svixTimestamp = request.headers.get('svix-timestamp') ?? ''
  const svixSignature = request.headers.get('svix-signature') ?? ''

  let event: ClerkUserCreatedEvent
  try {
    const wh = new Webhook(webhookSecret)
    event = wh.verify(body, {
      'svix-id': svixId,
      'svix-timestamp': svixTimestamp,
      'svix-signature': svixSignature,
    }) as ClerkUserCreatedEvent
  } catch (err) {
    console.error('[clerk-webhook] 署名検証失敗:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  if (event.type === 'user.created') {
    const primary = event.data.email_addresses.find(
      (e) => e.id === event.data.primary_email_address_id
    )
    const email = primary?.email_address
    if (email) {
      await sendToUser({
        to: email,
        subject: '【ELE-CAL】ご登録ありがとうございます',
        text: `ELE-CALにご登録いただきありがとうございます。

電気設備の設計計算ツール「ELE-CAL」をぜひご活用ください。

▼ アプリを開く
https://ele-cal.com

プロプランへのアップグレードで、電圧降下計算・ブレーカー選定などの全機能がご利用いただけます。

ご不明な点はフィードバックフォームよりお気軽にお問い合わせください。
https://ele-cal.com/feedback

ELE-CAL サポートチーム`,
      })
    }
  }

  return NextResponse.json({ received: true })
}
