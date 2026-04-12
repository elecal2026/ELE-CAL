import Link from 'next/link'

export default function PrivacyPolicyPage() {
  return (
    <div className="main-content" style={{ maxWidth: '720px', paddingTop: '2rem', paddingBottom: '3rem' }}>
      <Link href="/" style={{ color: 'var(--accent)', textDecoration: 'none', fontSize: '0.9rem' }}>← ホームへ戻る</Link>

      <h1 style={{ fontSize: '1.4rem', fontWeight: 800, margin: '1.5rem 0 1rem', color: 'var(--text-primary)' }}>
        プライバシーポリシー
      </h1>

      <div className="card" style={{ fontSize: '0.9rem', lineHeight: 1.8 }}>
        <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>最終更新日：（日付を記入）</p>

        <Section title="1. 収集する情報">
          <p>当サービスでは、以下の情報を収集します。</p>
          <ul style={{ paddingLeft: '1.5rem', marginTop: '0.5rem' }}>
            <li>Googleアカウント情報（氏名、メールアドレス）</li>
            <li>お支払い情報（Stripeを通じて処理。カード情報は当サービスでは保持しません）</li>
            <li>サービスの利用状況</li>
          </ul>
        </Section>

        <Section title="2. 情報の利用目的">
          <ul style={{ paddingLeft: '1.5rem' }}>
            <li>サービスの提供・運営</li>
            <li>ユーザー認証・アクセス管理</li>
            <li>月額料金の請求処理</li>
            <li>サービスの改善・新機能の開発</li>
            <li>お問い合わせへの対応</li>
          </ul>
        </Section>

        <Section title="3. 第三者提供">
          <p>当サービスでは、以下の外部サービスを利用しています。</p>
          <ul style={{ paddingLeft: '1.5rem', marginTop: '0.5rem' }}>
            <li>Clerk（認証）</li>
            <li>Stripe（決済処理）</li>
            <li>Vercel（ホスティング）</li>
            <li>Neon（データベース）</li>
          </ul>
          <p style={{ marginTop: '0.5rem' }}>上記以外の第三者への個人情報の提供は、法令に基づく場合を除き、行いません。</p>
        </Section>

        <Section title="4. クッキー">
          <p>認証状態の維持のためにクッキーを使用しています。</p>
        </Section>

        <Section title="5. お問い合わせ">
          <p>プライバシーに関するお問い合わせは以下までご連絡ください。</p>
          <p style={{ marginTop: '0.5rem' }}>メール：（メールアドレスを記入）</p>
        </Section>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: '1.5rem' }}>
      <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--accent)', marginBottom: '0.5rem' }}>{title}</h2>
      {children}
    </section>
  )
}
