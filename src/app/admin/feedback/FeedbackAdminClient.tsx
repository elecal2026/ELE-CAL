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
const STATUS_ORDER: Status[] = ['open', 'done']

function formatDateTime(iso: string): string {
  const d = new Date(iso)
  if (isNaN(d.getTime())) return iso
  const p = (n: number) => String(n).padStart(2, '0')
  const now = new Date()
  const isToday =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  if (isToday) return `${p(d.getHours())}:${p(d.getMinutes())}`
  return `${p(d.getMonth() + 1)}/${p(d.getDate())}`
}

function formatDateTimeFull(iso: string): string {
  const d = new Date(iso)
  if (isNaN(d.getTime())) return iso
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}/${p(d.getMonth() + 1)}/${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`
}

export default function FeedbackAdminClient({ items: initial }: { items: FeedbackItem[] }) {
  const [items, setItems] = useState<FeedbackItem[]>(initial)
  const [categoryFilter, setCategoryFilter] = useState<'all' | Category>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | Status>('open')
  const [updatingId, setUpdatingId] = useState<number | null>(null)
  const [selected, setSelected] = useState<FeedbackItem | null>(null)

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
    if (selected?.id === id) setSelected((s) => s ? { ...s, status } : s)
    try {
      const res = await fetch(`/api/admin/feedback/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (!res.ok) throw new Error('更新失敗')
    } catch {
      setItems(prev)
      if (selected?.id === id) setSelected((s) => s ? { ...s, status: prev.find(i => i.id === id)?.status ?? s.status } : s)
      alert('対応状況の更新に失敗しました')
    } finally {
      setUpdatingId(null)
    }
  }

  const openModal = (item: FeedbackItem) => {
    const current = items.find((i) => i.id === item.id) ?? item
    setSelected(current)
  }

  const closeModal = () => setSelected(null)

  return (
    <>
      {/* サマリ＋フィルタ */}
      <div className={styles.toolbar}>
        <div className={styles.filterGroup}>
          <button
            className={statusFilter === 'all' ? styles.filterBtnActive : styles.filterBtn}
            onClick={() => setStatusFilter('all')}
          >
            すべて <span className={styles.filterCount}>{items.length}</span>
          </button>
          {STATUS_ORDER.map((s) => (
            <button
              key={s}
              className={statusFilter === s ? styles.filterBtnActive : styles.filterBtn}
              onClick={() => setStatusFilter(s)}
            >
              {STATUS_LABEL[s]} <span className={styles.filterCount}>{counts[s]}</span>
            </button>
          ))}
        </div>

        <div className={styles.filterGroup}>
          <button
            className={categoryFilter === 'all' ? styles.filterBtnActive : styles.filterBtn}
            onClick={() => setCategoryFilter('all')}
          >
            種別: すべて
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
      </div>

      {/* 一覧 */}
      {filtered.length === 0 ? (
        <p className={styles.empty}>該当する投稿はありません。</p>
      ) : (
        <ul className={styles.list}>
          {filtered.map((item) => (
            <li
              key={item.id}
              className={`${styles.row} ${item.status === 'done' ? styles.rowDone : ''}`}
              onClick={() => openModal(item)}
            >
              <span
                className={styles.statusDot}
                style={{ color: item.status === 'open' ? '#d97706' : '#a0aec0' }}
                title={STATUS_LABEL[item.status]}
              >
                {item.status === 'open' ? '●' : '✓'}
              </span>

              <span
                className={styles.catBadge}
                style={{
                  background: `${CATEGORY_COLOR[item.category]}15`,
                  color: CATEGORY_COLOR[item.category],
                }}
              >
                {CATEGORY_LABEL[item.category]}
              </span>

              <span className={styles.preview}>{item.body}</span>

              {item.imageUrl && <span className={styles.imageIcon} title="画像あり">🖼</span>}

              <span className={styles.rowDate}>{formatDateTime(item.createdAt)}</span>
            </li>
          ))}
        </ul>
      )}

      {/* モーダル */}
      {selected && (
        <div className={styles.overlay} onClick={closeModal}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHead}>
              <span
                className={styles.catBadge}
                style={{
                  background: `${CATEGORY_COLOR[selected.category]}15`,
                  color: CATEGORY_COLOR[selected.category],
                }}
              >
                {CATEGORY_LABEL[selected.category]}
              </span>
              <span className={styles.modalDate}>{formatDateTimeFull(selected.createdAt)}</span>
              <button className={styles.closeBtn} onClick={closeModal} aria-label="閉じる">✕</button>
            </div>

            <p className={styles.modalBody}>{selected.body}</p>

            {selected.imageUrl && (
              <a href={selected.imageUrl} target="_blank" rel="noopener noreferrer">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={selected.imageUrl} alt="添付画像" className={styles.modalImage} />
              </a>
            )}

            <div className={styles.modalPoster}>
              {selected.anonymous || !selected.posterEmail ? (
                <span className={styles.anon}>匿名（未ログイン）</span>
              ) : (
                <span className={styles.posterEmail}>{selected.posterEmail}</span>
              )}
            </div>

            <div className={styles.modalFoot}>
              <span className={styles.currentStatus}>
                現在: {STATUS_LABEL[selected.status]}
              </span>
              {selected.status === 'open' ? (
                <button
                  className={styles.doneBtn}
                  disabled={updatingId === selected.id}
                  onClick={() => handleStatusChange(selected.id, 'done')}
                >
                  {updatingId === selected.id ? '更新中…' : '✓ 完了済にする'}
                </button>
              ) : (
                <button
                  className={styles.reopenBtn}
                  disabled={updatingId === selected.id}
                  onClick={() => handleStatusChange(selected.id, 'open')}
                >
                  {updatingId === selected.id ? '更新中…' : '↩ 新着に戻す'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
