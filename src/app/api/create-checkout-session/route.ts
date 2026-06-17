import { NextResponse } from 'next/server'
import { clerkClient } from '@clerk/nextjs/server'
import type Stripe from 'stripe'
import { getStripe, isStripeConfigured } from '@/lib/stripe'
import { upsertSubscription } from '@/lib/db'
import { isDbConfigured } from '@/lib/db'
import { getCurrentUserAccess } from '@/lib/access'

type StripeErrorLike = {
  type?: string
  code?: string
  param?: string
  message?: string
  statusCode?: number
}

function toStripeError(error: unknown): StripeErrorLike {
  return error && typeof error === 'object' ? (error as StripeErrorLike) : {}
}

function isMissingStripeResource(error: unknown): boolean {
  const stripeError = toStripeError(error)
  return (
    stripeError.type === 'StripeInvalidRequestError' &&
    stripeError.code === 'resource_missing'
  )
}

async function getPrimaryEmail(userId: string): Promise<string | undefined> {
  try {
    const client = await clerkClient()
    const clerkUser = await client.users.getUser(userId)
    return clerkUser.emailAddresses.find(
      (e) => e.id === clerkUser.primaryEmailAddressId
    )?.emailAddress
  } catch (error) {
    console.warn('Failed to fetch Clerk primary email for checkout:', error)
    return undefined
  }
}

async function ensureStripeCustomer(params: {
  stripe: Stripe
  userId: string
  existingCustomerId: string | null | undefined
  email: string | undefined
}): Promise<{ customerId: string; shouldPersist: boolean }> {
  const { stripe, userId, existingCustomerId, email } = params

  if (existingCustomerId) {
    try {
      const customer = await stripe.customers.retrieve(existingCustomerId)
      if (!customer.deleted) {
        if (email && !customer.email) {
          await stripe.customers.update(existingCustomerId, { email })
        }
        return { customerId: existingCustomerId, shouldPersist: false }
      }
      console.warn('Stored Stripe customer is deleted; recreating customer')
    } catch (error) {
      if (!isMissingStripeResource(error)) {
        throw error
      }
      console.warn('Stored Stripe customer was not found; recreating customer')
    }
  }

  const createParams: Stripe.CustomerCreateParams = {
    metadata: { clerk_user_id: userId },
  }
  if (email) {
    createParams.email = email
  }

  const customer = await stripe.customers.create(createParams)
  return { customerId: customer.id, shouldPersist: true }
}

function publicCheckoutError(error: unknown): {
  error: string
  status: number
} {
  const stripeError = toStripeError(error)

  if (stripeError.type?.startsWith('Stripe')) {
    if (
      stripeError.code === 'resource_missing' &&
      stripeError.param?.includes('price')
    ) {
      return {
        error: '決済プランの設定に不整合があります。管理者にお問い合わせください。',
        status: 503,
      }
    }

    return {
      error: '決済サービス側でエラーが発生しました。時間をおいて再度お試しください。',
      status: 502,
    }
  }

  return {
    error: '決済画面の作成に失敗しました。時間をおいて再度お試しください。',
    status: 500,
  }
}

export async function POST() {
  const access = await getCurrentUserAccess()
  if (!access.userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (access.accessKind === 'paid' || access.accessKind === 'free_access') {
    return NextResponse.json(
      { error: 'すでに全機能をご利用いただけます', redirectTo: '/account' },
      { status: 409 }
    )
  }

  if (!isStripeConfigured() || !isDbConfigured()) {
    return NextResponse.json(
      { error: 'Payment system is not configured yet' },
      { status: 503 }
    )
  }

  const stripe = getStripe()!
  const priceId = process.env.STRIPE_PRICE_ID!

  try {
    const subscription = access.subscription

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

    const email = await getPrimaryEmail(access.userId)
    const ensuredCustomer = await ensureStripeCustomer({
      stripe,
      userId: access.userId,
      existingCustomerId: customerId,
      email,
    })
    customerId = ensuredCustomer.customerId

    if (ensuredCustomer.shouldPersist) {
      await upsertSubscription({
        clerkUserId: access.userId,
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
    const stripeError = toStripeError(error)
    console.error('Checkout session creation failed:', {
      type: stripeError.type,
      code: stripeError.code,
      param: stripeError.param,
      statusCode: stripeError.statusCode,
      message: stripeError.message,
      raw: stripeError.type ? undefined : error,
    })
    const response = publicCheckoutError(error)
    return NextResponse.json(
      { error: response.error },
      { status: response.status }
    )
  }
}
