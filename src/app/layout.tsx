import type { Metadata } from 'next'
import { Barlow, Noto_Sans_JP } from 'next/font/google'
import { ClerkProvider } from '@clerk/nextjs'
import { auth } from '@clerk/nextjs/server'
import { jaJP } from '@clerk/localizations'
import { PaywallProvider } from '@/components/PaywallProvider'
import { getSubscription, isDbConfigured } from '@/lib/db'
import './globals.css'

// jaJPで未翻訳（void 0）のキーを補完
const customJaJP = {
  ...jaJP,
  unstable__errors: {
    ...jaJP.unstable__errors,
    external_account_not_found: 'Googleアカウントが見つかりませんでした。別のアカウントをお試しください。',
    form_identifier_not_found: 'このメールアドレスのアカウントが見つかりません。',
    form_code_incorrect: '認証コードが正しくありません。',
    captcha_invalid: 'ボット認証に失敗しました。ページを更新して再試行してください。',
    form_identifier_exists__email_address: 'このメールアドレスは既に登録されています。',
    form_identifier_exists__phone_number: 'この電話番号は既に登録されています。',
    form_identifier_exists__username: 'このユーザー名は既に使用されています。',
    form_new_password_matches_current: '新しいパスワードは現在のパスワードと異なるものにしてください。',
    form_password_incorrect: 'パスワードが正しくありません。',
    form_password_untrusted__sign_in: 'このパスワードは安全でないため使用できません。パスワードをリセットしてください。',
    phone_number_exists: 'この電話番号は既に使用されています。',
    session_exists: 'すでにログイン済みです。',
  },
}

const barlow = Barlow({
  subsets: ['latin'],
  weight: ['700', '900'],
  variable: '--font-barlow',
  display: 'swap',
})

const notoSansJP = Noto_Sans_JP({
  subsets: ['latin'],
  weight: ['400', '500', '700', '900'],
  variable: '--font-noto-sans-jp',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'ELE-CAL | 電気工事 計算・参照ツール',
  description: '電気工事 計算・参照ツール',
  icons: {
    icon: '/ELE-CAL.png',
    apple: '/ELE-CAL.png',
  },
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // サブスク状態をサーバ側で取得し、PaywallProvider に流し込む
  const { userId } = await auth()
  let isPaid = false
  if (userId && isDbConfigured()) {
    try {
      const sub = await getSubscription(userId)
      isPaid = !!sub && (sub.status === 'active' || sub.status === 'trialing')
    } catch (e) {
      // DB障害時は未契約扱い（フェールクローズ）。誘導モーダルは出るが閲覧は可能
      console.error('subscription fetch failed', e)
    }
  }

  return (
    <ClerkProvider localization={customJaJP}>
      <html lang="ja" className={`${barlow.variable} ${notoSansJP.variable}`}>
        <body>
          <PaywallProvider isPaid={isPaid} isSignedIn={!!userId}>
            {children}
          </PaywallProvider>
        </body>
      </html>
    </ClerkProvider>
  )
}
