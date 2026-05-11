import { neon } from '@neondatabase/serverless'

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL 未設定')
  process.exit(1)
}

const sql = neon(process.env.DATABASE_URL)

const tables = await sql`
  SELECT table_name FROM information_schema.tables
  WHERE table_schema='public'
    AND table_name IN ('feedback_requests','feedback_replies','questions','question_comments')
  ORDER BY table_name
`
console.log('テーブル状態:')
console.table(tables)

const cols = await sql`
  SELECT table_name, column_name, data_type
  FROM information_schema.columns
  WHERE table_schema='public'
    AND table_name IN ('feedback_requests','feedback_replies')
  ORDER BY table_name, ordinal_position
`
console.log('\nカラム:')
console.table(cols)
