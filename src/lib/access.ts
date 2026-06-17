import { auth, currentUser } from '@clerk/nextjs/server'
import { getSubscription, isDbConfigured, type Subscription } from './db'

export type AccessKind = 'anonymous' | 'free' | 'paid' | 'free_access' | 'bypass'

type ClerkEmailAddress = {
  readonly emailAddress: string
  readonly verification: {
    readonly status: string
  } | null
}

export interface CurrentUserAccess {
  userId: string | null
  isSignedIn: boolean
  hasFullAccess: boolean
  canManageBilling: boolean
  accessKind: AccessKind
  subscription: Subscription | null
  freeAccessEmail: string | null
}

function parseEmailList(value: string | undefined): string[] {
  return (value ?? '')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean)
}

export function getFreeAccessEmails(): string[] {
  return parseEmailList(process.env.FREE_ACCESS_EMAILS)
}

function findFreeAccessEmail(emailAddresses: readonly ClerkEmailAddress[]): string | null {
  const freeAccessEmails = getFreeAccessEmails()
  if (freeAccessEmails.length === 0) return null

  const matched = emailAddresses.find((email) => {
    const address = email.emailAddress.trim().toLowerCase()
    return (
      email.verification?.status === 'verified' &&
      freeAccessEmails.includes(address)
    )
  })

  return matched?.emailAddress.toLowerCase() ?? null
}

function isActiveSubscription(subscription: Subscription | null): boolean {
  return subscription?.status === 'active' || subscription?.status === 'trialing'
}

export async function getCurrentUserAccess(): Promise<CurrentUserAccess> {
  const { userId } = await auth()
  let subscription: Subscription | null = null
  let freeAccessEmail: string | null = null

  if (userId) {
    const user = await currentUser()
    freeAccessEmail = findFreeAccessEmail(user?.emailAddresses ?? [])

    if (isDbConfigured()) {
      try {
        subscription = await getSubscription(userId)
      } catch (error) {
        console.error('subscription fetch failed', error)
      }
    }
  }

  const paid = isActiveSubscription(subscription)
  const canManageBilling = paid && !!subscription?.stripe_customer_id

  if (paid) {
    return {
      userId,
      isSignedIn: !!userId,
      hasFullAccess: true,
      canManageBilling,
      accessKind: 'paid',
      subscription,
      freeAccessEmail,
    }
  }

  if (freeAccessEmail) {
    return {
      userId,
      isSignedIn: true,
      hasFullAccess: true,
      canManageBilling: false,
      accessKind: 'free_access',
      subscription,
      freeAccessEmail,
    }
  }

  if (process.env.BYPASS_PAYWALL === 'true') {
    return {
      userId,
      isSignedIn: !!userId,
      hasFullAccess: true,
      canManageBilling,
      accessKind: 'bypass',
      subscription,
      freeAccessEmail,
    }
  }

  return {
    userId,
    isSignedIn: !!userId,
    hasFullAccess: false,
    canManageBilling: false,
    accessKind: userId ? 'free' : 'anonymous',
    subscription,
    freeAccessEmail,
  }
}
