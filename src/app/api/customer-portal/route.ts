import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getStripe, isStripeConfigured } from '@/lib/stripe'
import { getSubscription, isDbConfigured } from '@/lib/db'

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

  try {
    const subscription = await getSubscription(userId)
    if (!subscription?.stripe_customer_id) {
      return NextResponse.json(
        { error: 'No subscription found' },
        { status: 404 }
      )
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: subscription.stripe_customer_id,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'}/`,
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('Customer portal session creation failed:', error)
    return NextResponse.json(
      { error: 'Failed to create portal session' },
      { status: 500 }
    )
  }
}
