'use client'

import { useEffect, useState, useCallback, type FormEvent } from 'react'
import { useUser } from '@clerk/nextjs'
import SiteHeader from '@/components/SiteHeader'
import { usePaywall } from '@/components/PaywallProvider'
import styles from './page.module.css'

type Category = 'feature' | 'bug' | 'improvement'

interface ApiReply {
  id: number
  body: string
  createdAt: string
}

interface ApiFeedback {
  id: number
  category: Category
  body: string
  imageUrl: string | null
  createdAt: string
  isMine: boolean
  clerkUserId?: string
  replies: ApiReply[]
}

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

function formatDateTime(iso: string): string {
  const d = new Date(iso)
  if (isNaN(d.getTime())) return '—'
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  const hh = String(d.getHours()).padStart(2, '0')
  const mi = String(d.getMinutes()).padStart(2, '0')
  return `${yyyy}/${mm}/${dd} ${hh}:${mi}`
}

export default function FeedbackPage() {
  const { isSignedIn } = useUser()
  const { requirePaid, isPaid } = usePaywall()

  const [items, setItems] = useState<ApiFeedback[]>([])
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  // 投稿フォーム状態
  const [category, setCategory] = useState<Category>('feature')
  const [body, setBody] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const fetchItems = useCallback(async () => {
    if (!isSignedIn) {
      setItems([])
      setLoading(false)
      return
    }
    setLoading(true)
    setLoadError(null)
    try {
      const res = await fetch('/api/feedback', { cache: 'no-store' })
      if (res.status === 401) {
        setItems([])
        return
      }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? `読み込みに失敗 (${res.status})`)
      }
      const data = (await res.json()) as { items: ApiFeedback[]; isAdmin: boolean }
      setItems(data.items)
      setIsAdmin(data.isAdmin)
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : '読み込みに失敗しました')
    } finally {
      setLoading(false)
    }
  }, [isSignedIn])

  useEffect(() => {
    void fetchItems()
  }, [fetchItems])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!isSignedIn || !isPaid) {
      if (!requirePaid()) return
    }
    if (!body.trim()) {
      setSubmitError('本文を入力してください')
      return
    }

    setSubmitting(true)
    setSubmitError(null)

    try {
      let imageUrl: string | null = null
      if (file) {
        const form = new FormData()
        form.append('file', file)
        const upRes = await fetch('/api/feedback/upload', { method: 'POST', body: form })
        if (!upRes.ok) {
          const upErr = await upRes.json().catch(() => ({}))
          throw new Error(upErr.error ?? '画像アップロードに失敗')
        }
        const upData = (await upRes.json()) as { url: string }
        imageUrl = upData.url
      }

      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category, body: body.trim(), imageUrl }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error ?? '投稿に失敗')
      }

      setBody('')
      setFile(null)
      setCategory('feature')
      // ファイル input をリセット
      const fileInput = document.getElementById('feedback-file') as HTMLInputElement | null
      if (fileInput) fileInput.value = ''
      await fetchItems()
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : '投稿に失敗しました')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className={styles.page}>
      <SiteHeader mode="sub" title="要望・バグ報告" />

      <main className={styles.main}>
        <p className={styles.lead}>
          ELE-CAL への機能要望やバグ報告をお寄せください。
          投稿は管理者のみが確認します。返信があるとここに表示されます。
        </p>

        {/* 投稿フォーム */}
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
                rows={6}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="例：許容電流計算で、〇〇のケースが計算できると助かります"
                maxLength={4000}
              />
              <div className={styles.charCount}>{body.length} / 4000</div>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>画像（任意・スクショなど）</label>
              <input
                id="feedback-file"
                type="file"
                accept="image/*"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                className={styles.fileInputHidden}
              />
              {!file && (
                <label htmlFor="feedback-file" className={styles.fileButton}>
                  <span className={styles.fileButtonIcon}>📷</span>
                  <span>画像を選択する</span>
                </label>
              )}
              {file && (
                <div className={styles.filePreview}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={URL.createObjectURL(file)}
                    alt="プレビュー"
                    className={styles.filePreviewImg}
                  />
                  <div className={styles.filePreviewMeta}>
                    <div className={styles.filePreviewName}>{file.name}</div>
                    <div className={styles.filePreviewSize}>
                      {(file.size / 1024).toFixed(1)} KB
                    </div>
                  </div>
                  <button
                    type="button"
                    className={styles.fileRemoveBtn}
                    onClick={() => {
                      setFile(null)
                      const fi = document.getElementById('feedback-file') as HTMLInputElement | null
                      if (fi) fi.value = ''
                    }}
                  >
                    削除
                  </button>
                </div>
              )}
            </div>

            {submitError && <div className={styles.error}>{submitError}</div>}

            <button type="submit" className={styles.submitBtn} disabled={submitting}>
              {submitting ? '送信中...' : '投稿する'}
            </button>
            {!isSignedIn && (
              <p className={styles.note}>※ 投稿にはログイン＋プロプラン契約が必要です</p>
            )}
          </form>
        </section>

        {/* 投稿一覧 */}
        <section className={styles.listSection}>
          <h2 className={styles.sectionTitle}>
            {isAdmin ? '全件' : 'あなたの投稿'}（{items.length}件）
          </h2>

          {loading && <div className={styles.empty}>読み込み中...</div>}
          {loadError && <div className={styles.error}>{loadError}</div>}
          {!loading && !loadError && !isSignedIn && (
            <div className={styles.empty}>
              ログインすると、あなたの投稿と返信が表示されます。
            </div>
          )}
          {!loading && !loadError && isSignedIn && items.length === 0 && (
            <div className={styles.empty}>まだ投稿はありません。</div>
          )}

          <div className={styles.list}>
            {items.map((item) => (
              <FeedbackCard
                key={item.id}
                item={item}
                isAdmin={isAdmin}
                onReplied={fetchItems}
              />
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}

function FeedbackCard({
  item,
  isAdmin,
  onReplied,
}: {
  item: ApiFeedback
  isAdmin: boolean
  onReplied: () => void
}) {
  const [replyBody, setReplyBody] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleReply = async (e: FormEvent) => {
    e.preventDefault()
    if (!replyBody.trim()) {
      setError('本文を入力してください')
      return
    }
    setSending(true)
    setError(null)
    try {
      const res = await fetch(`/api/feedback/${item.id}/replies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: replyBody.trim() }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error ?? '返信に失敗')
      }
      setReplyBody('')
      onReplied()
    } catch (err) {
      setError(err instanceof Error ? err.message : '返信に失敗しました')
    } finally {
      setSending(false)
    }
  }

  return (
    <article className={styles.card}>
      <header className={styles.cardHeader}>
        <span
          className={styles.badge}
          style={{ background: `${CATEGORY_COLOR[item.category]}15`, color: CATEGORY_COLOR[item.category] }}
        >
          {CATEGORY_LABEL[item.category]}
        </span>
        <span className={styles.date}>{formatDateTime(item.createdAt)}</span>
        {isAdmin && item.clerkUserId && (
          <span className={styles.userId}>{item.clerkUserId.slice(0, 12)}...</span>
        )}
        {item.replies.length > 0 ? (
          <span className={styles.statusReplied}>返信済み</span>
        ) : (
          <span className={styles.statusPending}>未対応</span>
        )}
      </header>

      <div className={styles.cardBody}>{item.body}</div>

      {item.imageUrl && (
        <div className={styles.imageWrap}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={item.imageUrl} alt="添付画像" className={styles.image} />
        </div>
      )}

      {item.replies.length > 0 && (
        <div className={styles.replies}>
          <div className={styles.repliesTitle}>管理者からの返信</div>
          {item.replies.map((rep) => (
            <div key={rep.id} className={styles.replyItem}>
              <div className={styles.replyDate}>{formatDateTime(rep.createdAt)}</div>
              <div className={styles.replyBody}>{rep.body}</div>
            </div>
          ))}
        </div>
      )}

      {isAdmin && (
        <form onSubmit={handleReply} className={styles.replyForm}>
          <textarea
            className={styles.replyTextarea}
            rows={3}
            value={replyBody}
            onChange={(e) => setReplyBody(e.target.value)}
            placeholder="管理者として返信..."
            maxLength={4000}
          />
          {error && <div className={styles.error}>{error}</div>}
          <button type="submit" className={styles.replyBtn} disabled={sending}>
            {sending ? '送信中...' : '返信する'}
          </button>
        </form>
      )}
    </article>
  )
}
