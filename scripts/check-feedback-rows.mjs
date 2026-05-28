import { neon } from '@neondatabase/serverless'

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL 未設定')
  process.exit(1)
}

const sql = neon(process.env.DATABASE_URL)

const rows = await sql`
  SELECT id, category, status, left(body, 40) AS body_head, clerk_user_id, created_at
  FROM feedback_requests
  ORDER BY created_at DESC
`
console.log(`feedback_requests: ${rows.length} 件`)
console.table(rows)
