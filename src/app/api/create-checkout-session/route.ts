import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getStripe, isStripeConfigured } from '@/lib/stripe'
import { getSubscription, upsertSubscription } from '@/lib/db'
import { isDbConfigured } from '@/lib/db'

export async function POST(request: NextRequest) {
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

  // リクエストbodyから testMode フラグを取得
  const body = await request.json().catch(() => ({}))
  const testMode = body?.testMode === true

  // テスト課金モード：TEST_USER_CLERK_ID と一致するユーザーのみ許可
  const testUserId = process.env.TEST_USER_CLERK_ID
  const isTestUser = !!testUserId && userId === testUserId

  if (testMode && !isTestUser) {
    return NextResponse.json({ error: 'テスト課金は許可されていません' }, { status: 403 })
  }

  // テスト課金時に STRIPE_PRICE_ID_TEST 未設定なら本番Priceへの暴発を防ぐため停止
  if (testMode && !process.env.STRIPE_PRICE_ID_TEST) {
    return NextResponse.json(
      { error: 'STRIPE_PRICE_ID_TEST が未設定です' },
      { status: 503 }
    )
  }

  const stripe = getStripe()!

  // testModeのときは300円テスト用Price IDを使い、それ以外は通常Price ID
  const priceId = testMode
    ? process.env.STRIPE_PRICE_ID_TEST!
    : process.env.STRIPE_PRICE_ID!

  try {
    const subscription = await getSubscription(userId)

    // すでに有効な契約がある場合は新規Checkoutを作らずアカウント画面に誘導
    // （テストモードはこのチェックをスキップして何度でも試せるようにする）
    if (
      !testMode &&
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
      const customer = await stripe.customers.create({
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
    // テストモードは常に即課金（トライアルなし）
    const hasUsedTrial = testMode || !!subscription?.stripe_subscription_id

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      ...(hasUsedTrial
        ? {}
        : {
            subscription_data: {
              trial_period_days: 14,
            },
          }),
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
