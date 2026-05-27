import nodemailer from 'nodemailer'

/** ADMIN_EMAILS 環境変数からカンマ区切りで管理者メアド配列を返す */
export function getAdminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
}

function isMailConfigured(): boolean {
  return !!process.env.GMAIL_USER && !!process.env.GMAIL_APP_PASSWORD
}

let cachedTransporter: nodemailer.Transporter | null = null

function getTransporter(): nodemailer.Transporter {
  if (cachedTransporter) return cachedTransporter
  cachedTransporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  })
  return cachedTransporter
}

/** 管理者全員にメール通知。失敗してもエラーは throw せずログのみ */
export async function notifyAdmins(opts: {
  subject: string
  text: string
}): Promise<void> {
  if (!isMailConfigured()) {
    console.warn('[mail] GMAIL_USER / GMAIL_APP_PASSWORD 未設定。通知スキップ')
    return
  }
  const admins = getAdminEmails()
  if (admins.length === 0) {
    console.warn('[mail] ADMIN_EMAILS 未設定。通知スキップ')
    return
  }
  console.log('[mail] 送信開始 to:', admins.join(','))
  try {
    const result = await getTransporter().sendMail({
      from: process.env.GMAIL_USER,
      to: admins.join(','),
      subject: opts.subject,
      text: opts.text,
    })
    console.log('[mail] 送信完了 messageId:', result.messageId, 'response:', result.response)
  } catch (err) {
    console.error('[mail] 通知送信失敗:', err)
  }
}
