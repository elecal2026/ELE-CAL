'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

const VISIBLE_MS = 2500

function ToastInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const isThanks = searchParams.get('feedback') === 'thanks'
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!isThanks) return
    setVisible(true)
    const hideTimer = setTimeout(() => setVisible(false), VISIBLE_MS)
    const cleanTimer = setTimeout(() => {
      router.replace('/', { scroll: false })
    }, VISIBLE_MS + 400)
    return () => {
      clearTimeout(hideTimer)
      clearTimeout(cleanTimer)
    }
  }, [isThanks, router])

  if (!isThanks) return null

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: 'fixed',
        top: '24px',
        left: '50%',
        transform: `translateX(-50%) translateY(${visible ? '0' : '-16px'})`,
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.35s ease, transform 0.35s ease',
        background: '#16a34a',
        color: '#fff',
        padding: '12px 20px',
        borderRadius: '999px',
        fontSize: '0.95rem',
        fontWeight: 700,
        boxShadow: '0 8px 24px rgba(22,163,74,0.35)',
        zIndex: 9999,
        pointerEvents: 'none',
      }}
    >
      投稿ありがとうございました
    </div>
  )
}

export default function FeedbackThanksToast() {
  return (
    <Suspense fallback={null}>
      <ToastInner />
    </Suspense>
  )
}
