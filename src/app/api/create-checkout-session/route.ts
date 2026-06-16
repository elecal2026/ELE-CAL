import { NextResponse } from 'next/server'
import { auth, clerkClient } from '@clerk/nextjs/server'
import { getStripe, isStripeConfigured } from '@/lib/stripe'
import { getSubscription, upsertSubscription } from '@/lib/db'
import { isDbConfigured } from '@/lib/db'

export async function POST() {
  if (!isStripeConfigured() || !isDbConfigured()) {
    return NextResponse.json(
      { error: 'Payment system is not configured yet' },
      { status: 503 }
    )
  }

  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const stripe = getStripe()!
  const priceId = process.env.STRIPE_PRICE_ID!

  try {
    const subscription = await getSubscription(userId)

    if (
      subscription &&
      (subscription.status === 'trialing' || subscription.status === 'active')
    ) {
      return NextResponse.json(
        { error: 'すでにご契約中です', redirectTo: '/account' },
        { status: 409 }
      )
    }

    let customerId = subscription?.stripe_customer_id

    if (!customerId) {
      const client = await clerkClient()
      const clerkUser = await client.users.getUser(userId)
      const email = clerkUser.emailAddresses.find(
        (e) => e.id === clerkUser.primaryEmailAddressId
      )?.emailAddress

      if (!email) {
        return NextResponse.json(
          { error: 'メールアドレスを取得できませんでした' },
          { status: 400 }
        )
      }

      const customer = await stripe.customers.create({
        email,
        metadata: { clerk_user_id: userId },
      })
      customerId = customer.id

      await upsertSubscription({
        clerkUserId: userId,
        stripeCustomerId: customerId,
        status: 'none',
      })
    }

    // 過去にサブスクを持っていたユーザー（DBにstripe_subscription_idが残っている）
    // にはトライアルを付与せず、即課金する
    const hasUsedTrial = !!subscription?.stripe_subscription_id

    // トライアル終了日（今日+30日）を日本語表記で計算
    const trialEndDate = new Date()
    trialEndDate.setDate(trialEndDate.getDate() + 30)
    const trialEndStr = `${trialEndDate.getFullYear()}年${trialEndDate.getMonth() + 1}月${trialEndDate.getDate()}日`

    const trialCustomText = hasUsedTrial
      ? undefined
      : {
          submit: {
            message: `30日間無料トライアル｜クレジットカード情報を登録頂くと、${trialEndStr}まで無料でお使い頂けます。無料トライアル終了1日前まで「設定」→「お支払い情報」→「サブスクリプションをキャンセル」からいつでもキャンセルできます。キャンセルしない限りプランは自動更新されます。`,
          },
        }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      ...(hasUsedTrial
        ? {}
        : {
            subscription_data: {
              trial_period_days: 30,
            },
          }),
      ...(trialCustomText ? { custom_text: trialCustomText } : {}),
      automatic_tax: { enabled: true },
      customer_update: { address: 'auto' },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'}/subscribe/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'}/subscribe`,
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('Checkout session creation failed:', error)
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}
