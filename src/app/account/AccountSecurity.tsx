'use client'

import { useState } from 'react'
import { useUser } from '@clerk/nextjs'

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.6rem 0.75rem',
  border: '1px solid #cbd5e0',
  borderRadius: '8px',
  fontSize: '0.9rem',
  boxSizing: 'border-box',
}

const btnStyle = (color: string, disabled: boolean): React.CSSProperties => ({
  padding: '0.7rem 1.25rem',
  background: disabled ? '#a0aec0' : color,
  color: '#fff',
  border: 'none',
  borderRadius: '8px',
  fontSize: '0.9rem',
  fontWeight: 700,
  cursor: disabled ? 'not-allowed' : 'pointer',
})

export default function AccountSecurity() {
  const { user } = useUser()

  // パスワード変更
  const [currentPw, setCurrentPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [pwMsg, setPwMsg] = useState<{ text: string; ok: boolean } | null>(null)
  const [pwLoading, setPwLoading] = useState(false)

  // メアド変更
  const [newEmail, setNewEmail] = useState('')
  const [emailMsg, setEmailMsg] = useState<{ text: string; ok: boolean } | null>(null)
  const [emailLoading, setEmailLoading] = useState(false)

  const hasPassword = user?.passwordEnabled
  const isGoogleUser = user?.externalAccounts?.some(ea => ea.provider === 'google') ?? false

  const handlePasswordChange = async () => {
    if (!currentPw || !newPw) return
    setPwLoading(true)
    setPwMsg(null)
    try {
      await user?.updatePassword({ currentPassword: currentPw, newPassword: newPw })
      setPwMsg({ text: 'パスワードを変更しました', ok: true })
      setCurrentPw('')
      setNewPw('')
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'エラーが発生しました'
      setPwMsg({ text: msg, ok: false })
    } finally {
      setPwLoading(false)
    }
  }

  const handleEmailChange = async () => {
    if (!newEmail) return
    setEmailLoading(true)
    setEmailMsg(null)
    try {
      const emailAddr = await user?.createEmailAddress({ email: newEmail })
      await emailAddr?.prepareVerification({ strategy: 'email_code' })
      setEmailMsg({ text: `${newEmail} に確認メールを送信しました。メール内のリンクをクリックして変更を完了してください。`, ok: true })
      setNewEmail('')
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'エラーが発生しました'
      setEmailMsg({ text: msg, ok: false })
    } finally {
      setEmailLoading(false)
    }
  }

  const sectionStyle: React.CSSProperties = {
    background: '#fff',
    borderRadius: '14px',
    border: '1px solid #e2e8f0',
    padding: '1.25rem',
    marginBottom: '1rem',
  }

  const labelStyle: React.CSSProperties = {
    fontSize: '0.82rem',
    color: '#4a5568',
    marginBottom: '0.3rem',
    display: 'block',
  }

  return (
    <>
      {/* パスワード変更 */}
      {hasPassword && (
        <section style={sectionStyle}>
          <h2 style={{ fontSize: '0.85rem', color: '#718096', fontWeight: 600, marginBottom: '0.75rem' }}>
            パスワード変更
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            <div>
              <label style={labelStyle}>現在のパスワード</label>
              <input
                type="password"
                value={currentPw}
                onChange={e => setCurrentPw(e.target.value)}
                style={inputStyle}
                placeholder="現在のパスワード"
              />
            </div>
            <div>
              <label style={labelStyle}>新しいパスワード</label>
              <input
                type="password"
                value={newPw}
                onChange={e => setNewPw(e.target.value)}
                style={inputStyle}
                placeholder="新しいパスワード（8文字以上）"
              />
            </div>
            {pwMsg && (
              <p style={{ fontSize: '0.82rem', color: pwMsg.ok ? '#16a34a' : '#dc2626', margin: 0 }}>
                {pwMsg.text}
              </p>
            )}
            <button
              onClick={handlePasswordChange}
              disabled={pwLoading || !currentPw || !newPw}
              style={btnStyle('#1d6fcf', pwLoading || !currentPw || !newPw)}
            >
              {pwLoading ? '変更中...' : 'パスワードを変更する'}
            </button>
          </div>
        </section>
      )}

      {/* メールアドレス変更（Google認証ユーザーには非表示） */}
      {!isGoogleUser && <section style={sectionStyle}>
        <h2 style={{ fontSize: '0.85rem', color: '#718096', fontWeight: 600, marginBottom: '0.75rem' }}>
          メールアドレス変更
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          <div>
            <label style={labelStyle}>新しいメールアドレス</label>
            <input
              type="email"
              value={newEmail}
              onChange={e => setNewEmail(e.target.value)}
              style={inputStyle}
              placeholder="new@example.com"
            />
          </div>
          {emailMsg && (
            <p style={{ fontSize: '0.82rem', color: emailMsg.ok ? '#16a34a' : '#dc2626', margin: 0, lineHeight: 1.6 }}>
              {emailMsg.text}
            </p>
          )}
          <button
            onClick={handleEmailChange}
            disabled={emailLoading || !newEmail}
            style={btnStyle('#1d6fcf', emailLoading || !newEmail)}
          >
            {emailLoading ? '送信中...' : '確認メールを送信する'}
          </button>
        </div>
      </section>}
    </>
  )
}
