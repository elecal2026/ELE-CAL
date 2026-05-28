-- ============================================================
-- 要望投稿（/feedback）に対応状況 status を追加するDBマイグレ
-- ============================================================
-- 管理ページ（/admin/feedback）で 未対応 / 対応中 / 完了 を管理するため
-- feedback_requests に status カラムを追加する。
-- 既存行は DEFAULT 'open'（未対応）で埋まる。
-- ※ Neon の dev / main 両ブランチに投入が必要。
-- ============================================================

ALTER TABLE feedback_requests
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'open'
  CHECK (status IN ('open', 'in_progress', 'done'));

CREATE INDEX IF NOT EXISTS idx_feedback_requests_status
  ON feedback_requests (status, created_at DESC);
