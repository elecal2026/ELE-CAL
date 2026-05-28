'use client'

import { useState } from 'react'
import styles from './page.module.css'

export interface FeedbackItem {
  id: number
  category: 'feature' | 'bug' | 'improvement'
  body: string
  imageUrl: string | null
  status: 'open' | 'done'
  createdAt: string
  posterEmail: string | null
  posterName: string | null
  anonymous: boolean
}

type Category = FeedbackItem['category']
type Status = FeedbackItem['status']

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

const STATUS_LABEL: Record<Status, string> = {
  open: '新着',
  done: '完了済',
}
const STATUS_COLOR: Record<Status, string> = {
  open: '#d97706',
  done: '#16a34a',
}
const STATUS_ORDER: Status[] = ['open', 'done']

function formatDateTime(iso: string): string {
  const d = new Date(iso)
  if (isNaN(d.getTime())) return iso
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}/${p(d.getMonth() + 1)}/${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`
}

export default function FeedbackAdminClient({ items: initial }: { items: FeedbackItem[] }) {
  const [items, setItems] = useState<FeedbackItem[]>(initial)
  const [categoryFilter, setCategoryFilter] = useState<'all' | Category>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | Status>('all')
  const [updatingId, setUpdatingId] = useState<number | null>(null)

  const counts: Record<Status, number> = {
    open: items.filter((i) => i.status === 'open').length,
    done: items.filter((i) => i.status === 'done').length,
  }

  const filtered = items.filter((i) => {
    if (categoryFilter !== 'all' && i.category !== categoryFilter) return false
    if (statusFilter !== 'all' && i.status !== statusFilter) return false
    return true
  })

  const handleStatusChange = async (id: number, status: Status) => {
    const prev = items
    setUpdatingId(id)
    setItems((cur) => cur.map((i) => (i.id === id ? { ...i, status } : i)))
    try {
      const res = await fetch(`/api/admin/feedback/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (!res.ok) throw new Error('更新失敗')
    } catch {
      setItems(prev)
      alert('対応状況の更新に失敗しました')
    } finally {
      setUpdatingId(null)
    }
  }

  return (
    <>
      <div className={styles.summary}>
        <span className={styles.summaryTotal}>全 {items.length} 件</span>
        <span style={{ color: STATUS_COLOR.open }}>新着 {counts.open}</span>
        <span style={{ color: STATUS_COLOR.done }}>完了済 {counts.done}</span>
      </div>

      <div className={styles.toolbar}>
        <div className={styles.filterGroup}>
          <span className={styles.filterLabel}>種別</span>
          <button
            className={categoryFilter === 'all' ? styles.filterBtnActive : styles.filterBtn}
            onClick={() => setCategoryFilter('all')}
          >
            すべて
          </button>
          {(Object.keys(CATEGORY_LABEL) as Category[]).map((c) => (
            <button
              key={c}
              className={categoryFilter === c ? styles.filterBtnActive : styles.filterBtn}
              onClick={() => setCategoryFilter(c)}
            >
              {CATEGORY_LABEL[c]}
            </button>
          ))}
        </div>

        <div className={styles.filterGroup}>
          <span className={styles.filterLabel}>状況</span>
          <button
            className={statusFilter === 'all' ? styles.filterBtnActive : styles.filterBtn}
            onClick={() => setStatusFilter('all')}
          >
            すべて
          </button>
          {STATUS_ORDER.map((s) => (
            <button
              key={s}
              className={statusFilter === s ? styles.filterBtnActive : styles.filterBtn}
              onClick={() => setStatusFilter(s)}
            >
              {STATUS_LABEL[s]}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className={styles.empty}>該当する投稿はありません。</p>
      ) : (
        <ul className={styles.list}>
          {filtered.map((item) => (
            <li
              key={item.id}
              className={item.status === 'done' ? `${styles.card} ${styles.cardDone}` : styles.card}
            >
              <div className={styles.cardHead}>
                <span
                  className={styles.badge}
                  style={{
                    background: `${CATEGORY_COLOR[item.category]}15`,
                    color: CATEGORY_COLOR[item.category],
                  }}
                >
                  {CATEGORY_LABEL[item.category]}
                </span>
                <span className={styles.date}>{formatDateTime(item.createdAt)}</span>
              </div>

              <p className={styles.body}>{item.body}</p>

              {item.imageUrl && (
                <a href={item.imageUrl} target="_blank" rel="noopener noreferrer">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={item.imageUrl} alt="添付画像" className={styles.image} />
                </a>
              )}

              <div className={styles.poster}>
                {item.anonymous || !item.posterEmail ? (
                  <span className={styles.anon}>匿名（未ログイン）</span>
                ) : (
                  <span>
                    {item.posterName && <strong>{item.posterName}</strong>}{' '}
                    <span className={styles.posterEmail}>{item.posterEmail}</span>
                  </span>
                )}
              </div>

              <div className={styles.cardFoot}>
                <span
                  className={styles.statusBadge}
                  style={{
                    background: `${STATUS_COLOR[item.status]}15`,
                    color: STATUS_COLOR[item.status],
                  }}
                >
                  ● {STATUS_LABEL[item.status]}
                </span>
                <label className={styles.statusControl}>
                  <input
                    type="checkbox"
                    className={styles.statusCheckbox}
                    checked={item.status === 'done'}
                    disabled={updatingId === item.id}
                    onChange={(e) =>
                      handleStatusChange(item.id, e.target.checked ? 'done' : 'open')
                    }
                  />
                  完了済にする
                </label>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}
