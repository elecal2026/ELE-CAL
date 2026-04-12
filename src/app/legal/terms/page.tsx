import Link from 'next/link'

export default function TermsPage() {
  return (
    <div className="main-content" style={{ maxWidth: '720px', paddingTop: '2rem', paddingBottom: '3rem' }}>
      <Link href="/" style={{ color: 'var(--accent)', textDecoration: 'none', fontSize: '0.9rem' }}>← ホームへ戻る</Link>

      <h1 style={{ fontSize: '1.4rem', fontWeight: 800, margin: '1.5rem 0 1rem', color: 'var(--text-primary)' }}>
        利用規約
      </h1>

      <div className="card" style={{ fontSize: '0.9rem', lineHeight: 1.8 }}>
        <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>最終更新日：（日付を記入）</p>

        <Section title="第1条（適用）">
          <p>本規約は、当サービス「Electrician Tools」（以下「本サービス」）の利用条件を定めるものです。ユーザーは本規約に同意の上、本サービスを利用するものとします。</p>
        </Section>

        <Section title="第2条（サービス内容）">
          <p>本サービスは、電気工事に関する各種計算ツール（許容電流表、電圧降下計算、配管サイズ計算、ブレーカー選定等）をWebブラウザ上で提供するものです。</p>
        </Section>

        <Section title="第3条（料金・支払い）">
          <ul style={{ paddingLeft: '1.5rem' }}>
            <li>本サービスは月額課金制です。</li>
            <li>初回登録時に14日間の無料トライアル期間があります。</li>
            <li>トライアル終了後は登録されたクレジットカードに自動課金されます。</li>
            <li>料金は税込表示です。</li>
          </ul>
        </Section>

        <Section title="第4条（解約）">
          <ul style={{ paddingLeft: '1.5rem' }}>
            <li>解約はカスタマーポータルからいつでも可能です。</li>
            <li>解約後は、現在の課金期間の終了日までサービスをご利用いただけます。</li>
            <li>日割り返金は行っておりません。</li>
          </ul>
        </Section>

        <Section title="第5条（免責事項）">
          <ul style={{ paddingLeft: '1.5rem' }}>
            <li>本サービスの計算結果は参考値であり、正確性を保証するものではありません。</li>
            <li>実際の施工設計では、最新の規格・基準をご確認ください。</li>
            <li>本サービスの利用により生じた損害について、作成者は一切の責任を負いません。</li>
          </ul>
        </Section>

        <Section title="第6条（禁止事項）">
          <ul style={{ paddingLeft: '1.5rem' }}>
            <li>本サービスの不正利用・リバースエンジニアリング</li>
            <li>第三者へのアカウント共有・貸与</li>
            <li>サーバーへの過度な負荷をかける行為</li>
          </ul>
        </Section>

        <Section title="第7条（規約の変更）">
          <p>当方は、必要に応じて本規約を変更できるものとします。変更後の規約は、本ページに掲載した時点で効力を生じるものとします。</p>
        </Section>

        <Section title="第8条（準拠法・管轄）">
          <p>本規約は日本法に準拠し、紛争が生じた場合は（管轄裁判所を記入）を第一審の専属的合意管轄裁判所とします。</p>
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
