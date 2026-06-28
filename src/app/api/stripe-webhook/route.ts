import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getStripe, isStripeConfigured } from '@/lib/stripe'
import { updateSubscriptionByCustomerId, isDbConfigured } from '@/lib/db'
import { sendToUser, notifyAdmins } from '@/lib/mail'

export async function POST(request: NextRequest) {
  if (!isStripeConfigured() || !isDbConfigured()) {
    return NextResponse.json({ error: 'Not configured' }, { status: 503 })
  }

  const stripe = getStripe()!
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    )
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        const subAny = subscription as unknown as Record<string, unknown>
        await updateSubscriptionByCustomerId({
          stripeCustomerId: subscription.customer as string,
          stripeSubscriptionId: subscription.id,
          status: subscription.status,
          trialEnd: subscription.trial_end
            ? new Date(subscription.trial_end * 1000)
            : null,
          currentPeriodEnd: typeof subAny.current_period_end === 'number'
            ? new Date(subAny.current_period_end * 1000)
            : new Date(),
        })

        if (event.type === 'customer.subscription.created') {
          const customer = await stripe.customers.retrieve(subscription.customer as string)
          const email = (!customer.deleted && (customer as Stripe.Customer).email) || null
          const isTrial = subscription.status === 'trialing'

          // 管理者へ新規契約を通知（メール失敗してもwebhookは成功させる）
          await notifyAdmins({
            subject: isTrial
              ? '【ELE-CAL】新規トライアル開始'
              : '【ELE-CAL】新規契約（即課金）',
            text: `新しい契約が発生しました。

メール: ${email ?? '(取得できず)'}
種別: ${isTrial ? 'トライアル開始' : '即課金'}
ステータス: ${subscription.status}
Stripe顧客ID: ${subscription.customer}
日時: ${new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' })}

▼ 管理ダッシュボード
https://ele-cal.com/admin`,
          })

          if (email) {
            await sendToUser({
              to: email,
              subject: isTrial
                ? '【ELE-CAL】トライアル期間が開始しました'
                : '【ELE-CAL】プロプランのご登録ありがとうございます',
              text: isTrial
                ? `ELE-CAL プロプランのトライアルが開始しました。

トライアル期間中は、電圧降下計算・ブレーカー選定などの全機能をお試しいただけます。

▼ アプリを開く
https://ele-cal.com

トライアル終了後は自動的に月額550円（税込）のプロプランに移行します。
解約はいつでもアカウントページから行えます。
https://ele-cal.com/account

ELE-CAL サポートチーム`
                : `ELE-CAL プロプランにご登録いただきありがとうございます。

電圧降下計算・ブレーカー選定などの全機能がご利用いただけます。

▼ アプリを開く
https://ele-cal.com

解約はいつでもアカウントページから行えます。
https://ele-cal.com/account

ELE-CAL サポートチーム`,
            })
          }
        }
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        await updateSubscriptionByCustomerId({
          stripeCustomerId: subscription.customer as string,
          stripeSubscriptionId: subscription.id,
          status: 'canceled',
        })
        break
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice
        if (invoice.customer) {
          await updateSubscriptionByCustomerId({
            stripeCustomerId: invoice.customer as string,
            status: 'active',
          })
        }
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        if (invoice.customer) {
          await updateSubscriptionByCustomerId({
            stripeCustomerId: invoice.customer as string,
            status: 'past_due',
          })
        }
        break
      }
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook handler error:', error)
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    )
  }
}
