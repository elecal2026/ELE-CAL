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
              ['販売事業者', '（事業者名を記入）'],
              ['運営統括責任者', '（氏名を記入）'],
              ['所在地', '（住所を記入）'],
              ['電話番号', '（電話番号を記入）'],
              ['メールアドレス', '（メールアドレスを記入）'],
              ['販売URL', '（サービスURLを記入）'],
              ['販売価格', '月額 ¥---（税込）'],
              ['商品代金以外の必要料金', 'なし'],
              ['支払方法', 'クレジットカード（Stripe経由）'],
              ['支払時期', '無料トライアル終了後、毎月自動課金'],
              ['サービス提供時期', 'お申し込み後すぐにご利用いただけます'],
              ['返品・キャンセル', 'サービスの性質上、返品はお受けしておりません。解約はいつでも可能で、解約後は当月末まで利用できます。'],
              ['解約方法', 'アカウント設定のカスタマーポータルからいつでも解約可能'],
              ['動作環境', 'モダンブラウザ（Chrome, Safari, Edge, Firefox最新版）'],
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
