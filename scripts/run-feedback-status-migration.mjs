// docs/migration-feedback-status.sql を Neon に投入する1回限りスクリプト
// 実行: node --env-file=.env.local scripts/run-feedback-status-migration.mjs

import { neon } from '@neondatabase/serverless'
import { readFileSync } from 'node:fs'

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL 未設定')
  process.exit(1)
}

const sql = neon(process.env.DATABASE_URL)
const raw = readFileSync('docs/migration-feedback-status.sql', 'utf-8')

// 行コメントを除去してからセミコロン分割
const stripped = raw
  .split('\n')
  .filter((line) => !line.trim().startsWith('--'))
  .join('\n')

const statements = stripped
  .split(';')
  .map((s) => s.trim())
  .filter((s) => s.length > 0)

console.log(`実行: ${statements.length} ステートメント`)

let ok = 0
for (const stmt of statements) {
  const head = stmt.replace(/\s+/g, ' ').slice(0, 80)
  try {
    await sql.query(stmt)
    ok++
    console.log(`  OK  ${head}`)
  } catch (e) {
    console.error(`  NG  ${head}`)
    console.error(`       ${e.message}`)
    process.exit(1)
  }
}

console.log(`完了: ${ok}/${statements.length}`)
