# ELE-CAL Agent Notes

This is the real ELE-CAL app source directory.

## Resume Checklist

On every resume:

1. Read the current-status log with UTF-8:
   `C:\Users\y9_a1\Projects\事業所ごと\河島さん\ELE-CAL開発フォルダ\ELE-CAL個人用\ログ\README.md`
2. Check this worktree:
   `git status --short`
3. Inspect uncommitted changes before editing. Treat changes you did not make as user-owned.

## Project Shape

- App: Next.js App Router / TypeScript / React
- Auth: Clerk
- Billing: Stripe
- DB: Neon
- Production: `https://ele-cal.com`
- GitHub remote: `https://github.com/elecal2026/ELE-CAL.git`

Important app paths:

- `src/app/page.tsx` - top page
- `src/components/PaywallProvider.tsx` - freemium/paywall UI
- `src/proxy.ts` - Clerk proxy
- `src/app/api/create-checkout-session/route.ts` - Stripe Checkout
- `src/app/api/stripe-webhook/route.ts` - Stripe webhook endpoint
- `src/lib/db.ts` - Neon DB helpers
- `src/data/faq-data.ts` - FAQ content
- `docs/根拠/` - calculation/reference evidence

## Evidence Sources

For calculation/reference work, start with the extracted and curated evidence in this app repo:

- `docs/根拠/` - verified extracted evidence, table data notes, audit reports, and source-to-implementation mapping. Use this first when checking implemented formulas or constants.
- `docs/根拠/README.md` - explains evidence operations, metadata headers, source page conventions, and which evidence file maps to each tool.
- `docs/根拠/参照ページ索引.md` - quick index of required/conditional source pages by tool.
- `docs/根拠/詳細照合_作業台帳.md` - detailed reconciliation ledger for source-to-code checks.

The original source materials live outside the repo and are the final authority when values must be confirmed:

- `C:\Users\y9_a1\Projects\事業所ごと\河島さん\ELE-CAL開発フォルダ\根拠資料\内線規程\` - JEAC 8001-2022 original PDFs and full converted Markdown under `md化/`.
- `C:\Users\y9_a1\Projects\事業所ごと\河島さん\ELE-CAL開発フォルダ\根拠資料\公共建築\` - public building electrical specification/standard drawing PDFs and converted Markdown.
- `C:\Users\y9_a1\Projects\事業所ごと\河島さん\ELE-CAL開発フォルダ\根拠資料\_rendered_pages\` - rendered PNG pages for visual PDF checks.

Workflow: use `docs/根拠/` for fast orientation, use `根拠資料/*/md化/` to read the surrounding original text, and confirm final numeric/table values against the original PDF or rendered page when precision matters. Do not copy full paid-source text into the repo; keep repo evidence to extracted snippets, tables, page references, and audit notes.

## Working Rules

- Use `Get-Content -Encoding UTF8` when reading Japanese files in Windows PowerShell.
- Do not revert or overwrite uncommitted user changes.
- Keep implementation changes inside this app directory unless the user asks otherwise.
- Do not edit `.env.local` unless the user explicitly asks.
- Run `npm run build` for verification when the change touches app behavior or TypeScript.
- Use the real webhook path `/api/stripe-webhook` when checking Stripe CLI notes.
- Neon migrations must be applied to both dev and production branches when schema changes are involved.

## Logging Rules

The parent folder has an existing project log convention:

- Daily log: `..\ELE-CAL個人用\ログ\YYYY-MM-DD.md`
- Current-status summary: `..\ELE-CAL個人用\ログ\README.md`

At a clear stopping point, append a daily log entry. Updating the current-status `README.md` is an overwrite, so show a short proposed summary to the user and wait for approval before replacing it.

