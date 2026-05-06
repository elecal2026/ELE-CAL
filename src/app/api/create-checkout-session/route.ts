import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
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

    // すでに有効な契約がある場合は新規Checkoutを作らずアカウント画面に誘導
    if (subscription && (subscription.status === 'trialing' || subscription.status === 'active')) {
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
    const hasUsedTrial = !!subscription?.stripe_subscription_id

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
