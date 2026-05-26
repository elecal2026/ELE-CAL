'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import SiteHeader from '@/components/SiteHeader'
import styles from './page.module.css'

type Category = 'feature' | 'bug' | 'improvement'

const CATEGORY_LABEL: Record<Category, string> = {
  feature: '機能要望',
  bug: 'バグ報告',
  improvement: '改善提案',
}

const CATEGORY_COLOR: Record<Category, string> = {
  feature: '#1d6fcf',
  bug: '#dc2626',
  improvement: '#16a34a',
}

export default function FeedbackPage() {
  const router = useRouter()

  const [category, setCategory] = useState<Category>('feature')
  const [body, setBody] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!body.trim()) {
      setSubmitError('本文を入力してください')
      return
    }

    setSubmitting(true)
    setSubmitError(null)

    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category, body: body.trim() }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error ?? '投稿に失敗')
      }

      router.push('/?feedback=thanks')
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : '投稿に失敗しました')
      setSubmitting(false)
    }
  }

  return (
    <div className={styles.page}>
      <SiteHeader mode="sub" title="要望・バグ報告" />

      <main className={styles.main}>
        <p className={styles.lead}>
          ELE-CAL への機能要望やバグ報告をお寄せください。
          内容は管理者のみが確認します。お名前・連絡先の入力は不要です。
        </p>

        <section className={styles.formCard}>
          <h2 className={styles.cardTitle}>新しい投稿</h2>
          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.field}>
              <label className={styles.label}>種別</label>
              <div className={styles.radioGroup}>
                {(Object.keys(CATEGORY_LABEL) as Category[]).map((cat) => (
                  <label key={cat} className={styles.radioItem}>
                    <input
                      type="radio"
                      name="category"
                      value={cat}
                      checked={category === cat}
                      onChange={() => setCategory(cat)}
                    />
                    <span style={{ color: CATEGORY_COLOR[cat] }}>{CATEGORY_LABEL[cat]}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className={styles.field}>
              <label htmlFor="feedback-body" className={styles.label}>
                内容 <span className={styles.required}>*</span>
              </label>
              <textarea
                id="feedback-body"
                className={styles.textarea}
                rows={8}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="例：許容電流計算で、〇〇のケースが計算できると助かります"
                maxLength={4000}
              />
              <div className={styles.charCount}>{body.length} / 4000</div>
            </div>

            {submitError && <div className={styles.error}>{submitError}</div>}

            <button type="submit" className={styles.submitBtn} disabled={submitting}>
              {submitting ? '送信中...' : '投稿する'}
            </button>
          </form>
        </section>
      </main>
    </div>
  )
}
