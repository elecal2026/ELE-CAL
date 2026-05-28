import nodemailer from 'nodemailer'
import { getAdminEmails } from './admin'

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
  try {
    await getTransporter().sendMail({
      from: process.env.GMAIL_USER,
      to: admins.join(','),
      subject: opts.subject,
      text: opts.text,
    })
  } catch (err) {
    console.error('[mail] 通知送信失敗:', err)
  }
}

/** ユーザー1名にメール送信。失敗してもエラーは throw せずログのみ */
export async function sendToUser(opts: {
  to: string
  subject: string
  text: string
}): Promise<void> {
  if (!isMailConfigured()) {
    console.warn('[mail] GMAIL_USER / GMAIL_APP_PASSWORD 未設定。通知スキップ')
    return
  }
  try {
    await getTransporter().sendMail({
      from: `ELE-CAL <${process.env.GMAIL_USER}>`,
      to: opts.to,
      subject: opts.subject,
      text: opts.text,
    })
  } catch (err) {
    console.error('[mail] ユーザー通知送信失敗:', err)
  }
}
