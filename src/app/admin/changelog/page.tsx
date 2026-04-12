import Link from 'next/link'

/* ─── 変更修正履歴データ ─── */
interface ChangeEntry {
  date: string
  title: string
  description: string
  details?: string[]  // トグル内に表示する詳細リスト（任意）
}

/*
 * ── データの並び順ルール ──
 * 同じ日付内: 作業順（上から古い→新しい）で記述する
 * 日付グループの表示: groupByDate() が日付の降順（新しい日付が上）にソートする
 * → 新しい日付のエントリを配列の末尾に追加していけばOK
 */
const CHANGELOG: ChangeEntry[] = [
  // ── 2026-03-18 ──
  {
    date: '2026-03-18',
    title: '競合ツール「ポケ電」の内容確認',
    description:
      '競合の電気工事向けツール「ポケ電」の機能・画面構成を調査。比較用ページ: https://tool-compare-beta.vercel.app/',
  },
  // ── 2026-03-19 ──
  {
    date: '2026-03-19',
    title: '電圧降下計算をボタン1つに統合、旧版を管理ツールへ移動',
    description:
      'トップページに2つ並んでいた電圧降下計算ボタンを1つに統合。旧版（インピーダンス法・JCS 103A参考）は管理ツール内にアーカイブとして残し、メインページはシンプルな構成に整理した。',
  },
  {
    date: '2026-03-19',
    title: '管理ツールセクションを新設',
    description:
      '開発中に作成した仮ページや計算過程の確認用ページをまとめる「管理ツール」セクションをトップページに追加。通常利用のメインページと開発用ページを分離し、整理した。',
  },
  {
    date: '2026-03-19',
    title: '各ツール詳細情報ページを作成',
    description:
      '管理ツール内に「各ツール詳細情報」ページを新設。許容電流表・電圧降下計算・配管サイズ計算・ブレーカー選定の4ツールについて、計算式・入力値・出力値・アラート条件などをタブ切り替えで閲覧できるドキュメントページ。',
  },
  {
    date: '2026-03-19',
    title: 'ブレーカー選定：各負荷ごとの電線入力に変更',
    description:
      '従来はデフォルトの電線種類を一括で選択する方式だったが、各負荷ごとに電線種類（CV / CVT / IV）・太さ・長さを個別に入力できるよう変更。負荷ごとに異なる配線条件を正確に反映できるようになった。',
  },
  {
    date: '2026-03-19',
    title: '配線検証の表示画面を追加',
    description:
      'ブレーカー選定の結果画面に「配線検証」セクションを追加。各負荷ごとに許容電流チェック（ブレーカー定格 ≦ 電線の許容電流）と電圧降下チェック（インピーダンス法）の結果を表示し、OK/注意/NG バッジで判定結果を可視化。推奨電線サイズの提案も行う。',
  },
  // ── 2026-03-20 ──
  {
    date: '2026-03-20',
    title: '全ツール共通：UIデザイン刷新・グローバルスタイル整備',
    description:
      '全ページ共通のCSS変数・コンポーネントスタイルを globals.css に集約。カード・テーブル・ヘッダー・フッター・バリデーション表示を統一デザインに改修。',
    details: [
      'CSS変数によるカラーパレット・フォント定義',
      'ヘッダー / フッター / カード / テーブル共通スタイル',
      'バリデーション表示（error / warning）の統一スタイル',
      'chips-group / chip-label / badge 共通コンポーネント',
      'レスポンシブ対応（モバイル幅の余白・フォント調整）',
    ],
  },
  {
    date: '2026-03-20',
    title: '許容電流表：mm/mm² 単位表示の修正・注意文言追加',
    description:
      '導体サイズの単位表示を改善。単線サイズ（1.0〜3.2）は「mm」、より線サイズは「mm²」と正しく表示するよう修正。',
    details: [
      'formatSize() 関数追加で mm / mm² を自動判別表示',
      'HIV選択時「より線のみの規格」の注意文言を表示',
      'VVF × 埋込配線で「2心・3心共通の参考値」の注意文言を表示',
      'テーブルヘッダーの「サイズ (mm²)」→「サイズ」に簡略化',
      '検討事項トグルセクション追加',
    ],
  },
  {
    date: '2026-03-20',
    title: '電圧降下計算：バリデーション強化・警告表示追加',
    description:
      '入力不備を検出してリアルタイムで警告を表示する機能を追加。不完全な入力による計算ミスを防止。',
    details: [
      '太さ/電流の片方のみ入力時にエラー表示',
      '距離テーブルに未入力区間がある場合の警告',
      '電線太さに対する目安許容電流超過チェック（V-4）',
      '電圧降下率が基準超過時の警告表示',
    ],
  },
  {
    date: '2026-03-20',
    title: '配管サイズ計算：VVF 2.6mm 4芯制限・バリデーション追加',
    description:
      'VVF 2.6mm 選択時に4芯を選択肢から除外する制限を追加。配管種別未選択時のエラー表示も追加。',
    details: [
      'VVF 2.6mm → 4C選択不可（自動で3Cに切り替え）',
      '配管種別が1つも選択されていない場合のエラー表示',
      '電線の仕上り断面積が0になる組み合わせの警告',
    ],
  },
  {
    date: '2026-03-20',
    title: 'ブレーカー選定：バリデーション・配線検証の大幅強化',
    description:
      '入力バリデーション（validation.ts）の新設、配線検証ロジック（許容電流・電圧降下・推奨電線）の追加、定数データ（constants.ts）の分離など大規模改修。',
    details: [
      '三相3線 × 100V の禁止チェック（B-1）',
      'モーター × 非三相200V の警告（B-2）',
      'スターデルタ × 3.7kW未満の警告（B-4）',
      '溶接機 × 単相2線100Vの警告（B-5）',
      'IV × 60mm²以上の使用警告（B-6）',
      'CV/CVTでmm表記サイズを除外（B-7/B-8）',
      '配線情報の不完全入力チェック（B-9〜B-12）',
      '許容電流チェック: In ≦ Iz の判定',
      '電圧降下チェック: インピーダンス法（R/Xデータ: JCS 103A）',
      '推奨電線サイズ提案（NGの場合に最小適合サイズを提示）',
      '定数データ（MOTOR_TABLE / WELDER_TABLE / R/X DATA）をconstants.tsに分離',
    ],
  },
  // ── 2026-04-13 ──
  {
    date: '2026-04-13',
    title: 'アカウント移行実施',
    description:
      'GitHubアカウントの移行を実施。Clerk・Neon・Vercelの環境変数を事業用アカウントに切り替え、デプロイ確認完了。',
  },
  // ── 新しい日付のエントリはここに追加 ──
]

/* ─── テキスト中のURLをリンクに変換 ─── */
function renderWithLinks(text: string) {
  const urlRegex = /(https?:\/\/[^\s、。）]+)/g
  const parts = text.split(urlRegex)
  return parts.map((part, i) =>
    urlRegex.test(part) ? (
      <a
        key={i}
        href={part}
        target="_blank"
        rel="noopener noreferrer"
        style={{ color: 'var(--accent)', wordBreak: 'break-all' }}
      >
        {part}
      </a>
    ) : (
      part
    )
  )
}

/* ─── 日付ごとにグループ化（日付は降順、カード内は作業順を維持） ─── */
function groupByDate(entries: ChangeEntry[]): { date: string; items: ChangeEntry[] }[] {
  const map = new Map<string, ChangeEntry[]>()
  for (const entry of entries) {
    if (!map.has(entry.date)) map.set(entry.date, [])
    map.get(entry.date)!.push(entry)
  }
  return Array.from(map.entries())
    .map(([date, items]) => ({ date, items }))
    .sort((a, b) => b.date.localeCompare(a.date)) // 新しい日付が上
}

/* ─── ページコンポーネント ─── */
export default function ChangelogPage() {
  const groups = groupByDate(CHANGELOG)

  return (
    <>
      {/* ヘッダー */}
      <header className="top-header">
        <Link
          href="/admin"
          className="back-link"
          style={{ position: 'absolute', top: '0.75rem', left: '0.75rem', fontSize: '1.2rem', textDecoration: 'none' }}
          aria-label="管理ツールへ戻る"
        >
          ←
        </Link>
        <span className="logo-icon">📝</span>
        <h1>変更修正履歴</h1>
        <p className="subtitle">各ツールの変更・修正ログ</p>
      </header>

      {/* 履歴一覧（日付ごとのカード） */}
      <div style={{ maxWidth: '700px', margin: '0 auto', padding: '1.5rem 1rem 2rem' }}>
        {groups.map((group) => (
          <div
            key={group.date}
            style={{
              background: 'var(--bg-card)',
              border: '1px solid #e2e8f0',
              borderRadius: '14px',
              padding: '1.3rem 1.5rem',
              marginBottom: '1.2rem',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            }}
          >
            {/* 日付ヘッダー */}
            <div
              style={{
                display: 'inline-block',
                fontSize: '0.78rem',
                fontWeight: 700,
                color: 'var(--accent)',
                background: 'var(--accent-light)',
                padding: '0.2rem 0.7rem',
                borderRadius: '6px',
                letterSpacing: '0.04em',
                marginBottom: '1rem',
              }}
            >
              {group.date}
            </div>

            {/* エントリ一覧 */}
            {group.items.map((entry, i) => (
              <div key={i}>
                {/* 区切り線（2件目以降） */}
                {i > 0 && (
                  <hr
                    style={{
                      border: 'none',
                      borderTop: '1px solid #e2e8f0',
                      margin: '0.9rem 0',
                    }}
                  />
                )}

                {/* タイトル */}
                <div
                  style={{
                    fontSize: '0.95rem',
                    fontWeight: 700,
                    color: 'var(--text-primary)',
                    marginBottom: '0.4rem',
                    lineHeight: 1.4,
                  }}
                >
                  {entry.title}
                </div>

                {/* 詳細 */}
                <div
                  style={{
                    fontSize: '0.83rem',
                    color: 'var(--text-muted)',
                    lineHeight: 1.75,
                  }}
                >
                  {renderWithLinks(entry.description)}
                </div>

                {/* トグル開閉の詳細リスト */}
                {entry.details && entry.details.length > 0 && (
                  <details
                    style={{
                      marginTop: '0.5rem',
                      fontSize: '0.8rem',
                      color: 'var(--text-muted)',
                    }}
                  >
                    <summary
                      style={{
                        cursor: 'pointer',
                        fontWeight: 600,
                        color: 'var(--accent)',
                        fontSize: '0.78rem',
                        userSelect: 'none',
                        padding: '0.2rem 0',
                      }}
                    >
                      詳細を表示（{entry.details.length}件）
                    </summary>
                    <ul
                      style={{
                        margin: '0.4rem 0 0',
                        paddingLeft: '1.3rem',
                        lineHeight: 1.8,
                        listStyleType: 'disc',
                      }}
                    >
                      {entry.details.map((d, di) => (
                        <li key={di}>{d}</li>
                      ))}
                    </ul>
                  </details>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* フッター */}
      <footer className="top-footer">
        <p>変更修正履歴は開発・メンテナンスの記録用です。</p>
      </footer>
    </>
  )
}
