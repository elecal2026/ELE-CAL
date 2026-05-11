-- ============================================================
-- 要望投稿フォーム（/feedback）DBマイグレ
-- ============================================================
-- 旧質問BOX（掲示板型）テーブルを撤去し、要望投稿（1:1窓口）テーブルを作成
-- 投稿者は自分の投稿のみ閲覧可能、管理者は全件閲覧可能
-- 管理者からの返信機能あり、画像添付任意
-- ============================================================

-- 旧テーブル削除（存在すれば）
DROP TABLE IF EXISTS question_comments;
DROP TABLE IF EXISTS questions;

-- 要望本体
CREATE TABLE IF NOT EXISTS feedback_requests (
  id            BIGSERIAL PRIMARY KEY,
  clerk_user_id TEXT NOT NULL,
  category      TEXT NOT NULL CHECK (category IN ('feature', 'bug', 'improvement')),
  body          TEXT NOT NULL,
  image_url     TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_feedback_requests_user
  ON feedback_requests (clerk_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feedback_requests_created
  ON feedback_requests (created_at DESC);

-- 管理者返信
CREATE TABLE IF NOT EXISTS feedback_replies (
  id            BIGSERIAL PRIMARY KEY,
  request_id    BIGINT NOT NULL REFERENCES feedback_requests(id) ON DELETE CASCADE,
  clerk_user_id TEXT NOT NULL,
  body          TEXT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_feedback_replies_request
  ON feedback_replies (request_id, created_at);
