import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getStripe, isStripeConfigured } from '@/lib/stripe'
import { getSubscription, upsertSubscription } from '@/lib/db'
import { isDbConfigured } from '@/lib/db'

export async function POST() {
  // Stripe未設定チェック
  if (!isStripeConfigured() || !isDbConfigured()) {
    return NextResponse.json(
      { error: 'Payment system is not configured yet' },
      { status: 503 }
    )
  }

  // 認証チェック
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const stripe = getStripe()!
  const priceId = process.env.STRIPE_PRICE_ID!

  try {
    // 既存のサブスク情報を確認
    let subscription = await getSubscription(userId)
    let customerId = subscription?.stripe_customer_id

    // Stripe Customerがなければ作成
    if (!customerId) {
      const customer = await stripe.customers.create({
        metadata: { clerk_user_id: userId },
      })
      customerId = customer.id

      // DB に Clerk ↔ Stripe の紐付けを保存
      await upsertSubscription({
        clerkUserId: userId,
        stripeCustomerId: customerId,
        status: 'none',
      })
    }

    // Checkout Session作成
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      subscription_data: {
        trial_period_days: 14,
      },
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
