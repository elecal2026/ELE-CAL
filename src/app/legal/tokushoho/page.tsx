import Link from 'next/link'

export default function TokushohoPage() {
  return (
    <div className="main-content" style={{ maxWidth: '720px', paddingTop: '2rem', paddingBottom: '3rem' }}>
      <Link href="/" style={{ color: 'var(--accent)', textDecoration: 'none', fontSize: '0.9rem' }}>← ホームへ戻る</Link>

      <h1 style={{ fontSize: '1.4rem', fontWeight: 800, margin: '1.5rem 0 1rem', color: 'var(--text-primary)' }}>
        特定商取引法に基づく表記
      </h1>

      <div className="card" style={{ fontSize: '0.9rem', lineHeight: 1.8 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <tbody>
            {[
              ['販売事業者', '合同会社 ブリング'],
              ['運営統括責任者', '河島　亙'],
              ['所在地', '請求があった場合には遅滞なく開示いたします。下記のメールアドレスからお問合せ下さい'],
              ['電話番号', '請求があった場合には遅滞なく開示いたします。下記のメールアドレスからお問合せ下さい'],
              ['メールアドレス', 'elecal2026@gmail.com'],
              ['販売価格', '月額料金はWebサイトに表示されています。詳細につきましてはhttps://ele-cal.comをご参照ください。'],
              ['商品代金以外の必要料金', 'インターネット接続費用およびその他インターネット利用に必要な費用。モバイルデバイスをご利用の場合にはデータ通信料が発生する場合があります。'],
              ['支払方法', 'クレジットカード決済'],
              ['支払時期', '無料トライアル終了後、毎月自動課金'],
              ['サービス提供時期', 'お申し込み後すぐにご利用いただけます'],
              ['キャンセルについて', 'アカウント設定のカスタマーポータルからいつでも解約可能'],
              ['その他の条件', '利用規約をご覧ください'],
            ].map(([label, value]) => (
              <tr key={label} style={{ borderBottom: '1px solid var(--border)' }}>
                <th style={{ padding: '0.75rem 0.5rem', textAlign: 'left', fontWeight: 700, color: 'var(--text-secondary)', width: '35%', verticalAlign: 'top', fontSize: '0.85rem' }}>
                  {label}
                </th>
                <td style={{ padding: '0.75rem 0.5rem', color: 'var(--text-primary)' }}>
                  {value}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
