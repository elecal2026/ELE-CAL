'use client'

import Link from 'next/link'
import { useState } from 'react'

const TABS = [
  { id: 'allowable', icon: '📋', label: '許容電流表' },
  { id: 'vdrop', icon: '🔌', label: '電圧降下計算' },
  { id: 'pipe', icon: '🔧', label: '配管サイズ計算' },
  { id: 'breaker', icon: '⚡', label: 'ブレーカー選定' },
] as const

type TabId = (typeof TABS)[number]['id']

export default function ToolSpecsPage() {
  const [tab, setTab] = useState<TabId>('allowable')

  return (
    <>
      <header className="app-header">
        <Link className="back-link" href="/admin" aria-label="管理ツールへ戻る">←</Link>
        <span className="header-icon">📖</span>
        <h1>各ツール詳細情報</h1>
      </header>

      <main className="main-content" style={{ maxWidth: '900px' }}>
        {/* タブ */}
        <div style={{
          display: 'flex', gap: '4px', overflowX: 'auto',
          padding: '0.5rem 0', marginBottom: '1rem',
        }}>
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                flex: '1 0 auto',
                padding: '0.6rem 1rem',
                border: tab === t.id ? '2px solid var(--accent, #1d6fcf)' : '1px solid #d0d5dd',
                borderRadius: '8px',
                background: tab === t.id ? '#e8f1fb' : '#fff',
                color: tab === t.id ? 'var(--accent, #1d6fcf)' : '#4a5568',
                fontWeight: tab === t.id ? 700 : 500,
                fontSize: '0.85rem',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s',
              }}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* コンテンツ */}
        {tab === 'allowable' && <AllowableCurrentSpec />}
        {tab === 'vdrop' && <VoltageDropSpec />}
        {tab === 'pipe' && <PipeSizeSpec />}
        {tab === 'breaker' && <BreakerSpec />}
      </main>
    </>
  )
}

/* ======================================== */
/* 共通スタイルヘルパー                      */
/* ======================================== */
const sectionStyle: React.CSSProperties = {
  marginBottom: '1.5rem',
}
const h2Style: React.CSSProperties = {
  fontSize: '1.05rem', fontWeight: 700, color: '#1a202c',
  borderBottom: '2px solid var(--accent, #1d6fcf)', paddingBottom: '0.4rem', marginBottom: '0.8rem',
}
const h3Style: React.CSSProperties = {
  fontSize: '0.93rem', fontWeight: 700, color: '#2d3748', marginTop: '1rem', marginBottom: '0.5rem',
}
const tableStyle: React.CSSProperties = {
  width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', marginBottom: '0.75rem',
}
const thStyle: React.CSSProperties = {
  background: '#f7fafc', padding: '6px 10px', border: '1px solid #e2e8f0',
  textAlign: 'left', fontWeight: 600, whiteSpace: 'nowrap',
}
const tdStyle: React.CSSProperties = {
  padding: '6px 10px', border: '1px solid #e2e8f0', verticalAlign: 'top',
}
const codeStyle: React.CSSProperties = {
  display: 'block', background: '#f7fafc', border: '1px solid #e2e8f0', borderRadius: '6px',
  padding: '10px 14px', fontSize: '0.82rem', lineHeight: 1.7, whiteSpace: 'pre-wrap',
  fontFamily: 'monospace', overflowX: 'auto', marginBottom: '0.75rem',
}
const ulStyle: React.CSSProperties = {
  paddingLeft: '1.3rem', marginBottom: '0.75rem', lineHeight: 1.8, fontSize: '0.88rem',
}
const badgeEx = (cls: string, text: string) => (
  <span className={`badge ${cls}`} style={{ marginLeft: '4px', fontSize: '0.75rem' }}>{text}</span>
)

/* ======================================== */
/* ① 許容電流表                             */
/* ======================================== */
function AllowableCurrentSpec() {
  return (
    <div>
      <div style={sectionStyle}>
        <h2 style={h2Style}>📋 許容電流表</h2>
        <p style={{ fontSize: '0.88rem', color: '#4a5568', marginBottom: '0.75rem' }}>
          電線の種類・敷設条件・導体サイズから許容電流をテーブル引きするツール。
        </p>

        <h3 style={h3Style}>できること</h3>
        <ul style={ulStyle}>
          <li>電線の種類・敷設条件・サイズから許容電流（A）を参照</li>
          <li>同条件の全サイズ一覧テーブルを表示</li>
        </ul>
      </div>

      <div style={sectionStyle}>
        <h3 style={h3Style}>入力値</h3>
        <table style={tableStyle}>
          <thead>
            <tr><th style={thStyle}>項目</th><th style={thStyle}>入力方式</th><th style={thStyle}>選択肢</th></tr>
          </thead>
          <tbody>
            <tr>
              <td style={tdStyle}>電線種類</td>
              <td style={tdStyle}>セレクト</td>
              <td style={tdStyle}>
                IV（600Vビニル絶縁電線）<br />
                HIV（600V二種ビニル絶縁電線）<br />
                VVF（ビニル絶縁ビニルシースケーブル 平形）<br />
                VVR（ビニル絶縁ビニルシースケーブル 丸形）<br />
                CV（架橋ポリエチレン絶縁ビニルシースケーブル 単心）<br />
                CVD（CVの2心）<br />
                CVT（CVの3心）
              </td>
            </tr>
            <tr>
              <td style={tdStyle}>敷設条件</td>
              <td style={tdStyle}>ラジオチップ</td>
              <td style={tdStyle}>電線種類により変動（下表参照）</td>
            </tr>
            <tr>
              <td style={tdStyle}>導体サイズ</td>
              <td style={tdStyle}>セレクト</td>
              <td style={tdStyle}>電線種類・敷設条件により変動（1.0〜325 mm²）</td>
            </tr>
          </tbody>
        </table>

        <h3 style={h3Style}>敷設条件の選択肢（電線種類別）</h3>
        <table style={tableStyle}>
          <thead>
            <tr><th style={thStyle}>電線種類</th><th style={thStyle}>敷設条件</th></tr>
          </thead>
          <tbody>
            <tr><td style={tdStyle}>IV</td><td style={tdStyle}>気中（単線）/ 気中（より線）/ 管内（3本以下）/ 管内（4本）</td></tr>
            <tr><td style={tdStyle}>HIV</td><td style={tdStyle}>気中（より線）/ 管内（3本以下）</td></tr>
            <tr><td style={tdStyle}>VVF</td><td style={tdStyle}>気中（2心）/ 気中（3心）/ 埋込配線</td></tr>
            <tr><td style={tdStyle}>VVR</td><td style={tdStyle}>気中（2心）/ 気中（3心）</td></tr>
            <tr><td style={tdStyle}>CV / CVD / CVT</td><td style={tdStyle}>気中暗渠 / 管路引入れ / 直埋</td></tr>
          </tbody>
        </table>
      </div>

      <div style={sectionStyle}>
        <h3 style={h3Style}>計算式・過程</h3>
        <div style={codeStyle}>
{`計算なし（テーブル引きのみ）

データ出典: 電気設備技術基準・解釈（電技解釈）および JCS 0168 参考値

処理: DATA[電線種類][敷設条件][導体サイズ] → 許容電流(A)`}
        </div>
      </div>

      <div style={sectionStyle}>
        <h3 style={h3Style}>出力値</h3>
        <table style={tableStyle}>
          <thead>
            <tr><th style={thStyle}>出力</th><th style={thStyle}>形式</th><th style={thStyle}>説明</th></tr>
          </thead>
          <tbody>
            <tr><td style={tdStyle}>許容電流</td><td style={tdStyle}>大きな数値 + &quot;A&quot;</td><td style={tdStyle}>選択した条件での許容電流</td></tr>
            <tr><td style={tdStyle}>条件サマリー</td><td style={tdStyle}>テキスト</td><td style={tdStyle}>例:「IV 2.0mm² 管内（3本以下）」</td></tr>
            <tr><td style={tdStyle}>全サイズ一覧</td><td style={tdStyle}>テーブル</td><td style={tdStyle}>同条件の全サイズと許容電流。選択中をハイライト</td></tr>
          </tbody>
        </table>
      </div>

      <div style={sectionStyle}>
        <h3 style={h3Style}>アラート・バッジ</h3>
        <table style={tableStyle}>
          <thead>
            <tr><th style={thStyle}>条件</th><th style={thStyle}>表示</th></tr>
          </thead>
          <tbody>
            <tr><td style={tdStyle}>HIV選択時</td><td style={tdStyle}>「HIVはより線のみの規格です」警告</td></tr>
            <tr><td style={tdStyle}>VVF × 埋込配線</td><td style={tdStyle}>「2心・3心共通の参考値です」警告</td></tr>
          </tbody>
        </table>
      </div>

      <div style={sectionStyle}>
        <h3 style={h3Style}>単位表示ルール</h3>
        <table style={tableStyle}>
          <thead>
            <tr><th style={thStyle}>サイズ</th><th style={thStyle}>表示単位</th><th style={thStyle}>例</th></tr>
          </thead>
          <tbody>
            <tr><td style={tdStyle}>単線サイズ（1.0〜3.2）</td><td style={tdStyle}>mm</td><td style={tdStyle}>1.6 mm, 2.0 mm</td></tr>
            <tr><td style={tdStyle}>より線サイズ（1.25〜325）</td><td style={tdStyle}>mm²</td><td style={tdStyle}>5.5 mm², 22 mm²</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}

/* ======================================== */
/* ② 電圧降下計算                           */
/* ======================================== */
function VoltageDropSpec() {
  return (
    <div>
      <div style={sectionStyle}>
        <h2 style={h2Style}>🔌 電圧降下計算</h2>
        <p style={{ fontSize: '0.88rem', color: '#4a5568', marginBottom: '0.75rem' }}>
          幹線・分岐回路の電圧降下を計算し、内線規程の基準と比較判定するツール。
        </p>

        <h3 style={h3Style}>できること</h3>
        <ul style={ulStyle}>
          <li>幹線の電圧降下を区間ごとに計算</li>
          <li>分岐回路の電圧降下を計算（複数分岐対応）</li>
          <li>幹線＋分岐の合計降下率を算出</li>
          <li>最遠端経路（最大降下率のルート）を特定</li>
          <li>内線規程の基準と比較判定（供給元・こう長ごと）</li>
        </ul>
      </div>

      <div style={sectionStyle}>
        <h3 style={h3Style}>入力値（設定バー）</h3>
        <table style={tableStyle}>
          <thead>
            <tr><th style={thStyle}>項目</th><th style={thStyle}>入力方式</th><th style={thStyle}>選択肢</th><th style={thStyle}>デフォルト</th></tr>
          </thead>
          <tbody>
            <tr><td style={tdStyle}>配電方式</td><td style={tdStyle}>ラジオチップ</td><td style={tdStyle}>単相3線 / 三相3線</td><td style={tdStyle}>単相3線</td></tr>
            <tr><td style={tdStyle}>供給元</td><td style={tdStyle}>ラジオチップ</td><td style={tdStyle}>自家変圧器 / 電気事業者</td><td style={tdStyle}>自家変圧器</td></tr>
            <tr><td style={tdStyle}>基準電圧</td><td style={tdStyle}>ラジオチップ + カスタム</td><td style={tdStyle}>100V / 200V / 400V / カスタム入力</td><td style={tdStyle}>200V</td></tr>
          </tbody>
        </table>

        <h3 style={h3Style}>入力値（幹線セクション）</h3>
        <table style={tableStyle}>
          <thead>
            <tr><th style={thStyle}>項目</th><th style={thStyle}>入力方式</th><th style={thStyle}>選択肢</th></tr>
          </thead>
          <tbody>
            <tr><td style={tdStyle}>太さ</td><td style={tdStyle}>プリセット + カスタム</td><td style={tdStyle}>22, 38, 60, 100, 150, 200, 250, 325 mm²</td></tr>
            <tr><td style={tdStyle}>電流</td><td style={tdStyle}>プリセット + カスタム</td><td style={tdStyle}>75, 100, 125, 150, 200, 225, 300 A</td></tr>
            <tr><td style={tdStyle}>距離</td><td style={tdStyle}>数値入力（複数区間）</td><td style={tdStyle}>m単位。区間追加・削除可能</td></tr>
          </tbody>
        </table>

        <h3 style={h3Style}>入力値（分岐セクション）</h3>
        <p style={{ fontSize: '0.85rem', color: '#4a5568', marginBottom: '0.5rem' }}>
          0個以上追加可能。各分岐に以下の入力:
        </p>
        <table style={tableStyle}>
          <thead>
            <tr><th style={thStyle}>項目</th><th style={thStyle}>入力方式</th><th style={thStyle}>選択肢</th></tr>
          </thead>
          <tbody>
            <tr><td style={tdStyle}>接続元</td><td style={tdStyle}>ラジオ</td><td style={tdStyle}>幹線から / 他の分岐から</td></tr>
            <tr><td style={tdStyle}>太さ</td><td style={tdStyle}>プリセット + カスタム</td><td style={tdStyle}>幹線と同様</td></tr>
            <tr><td style={tdStyle}>電流</td><td style={tdStyle}>プリセット + カスタム</td><td style={tdStyle}>幹線と同様</td></tr>
            <tr><td style={tdStyle}>距離</td><td style={tdStyle}>数値入力（複数区間）</td><td style={tdStyle}>m単位。区間追加・削除可能</td></tr>
          </tbody>
        </table>
      </div>

      <div style={sectionStyle}>
        <h3 style={h3Style}>計算式・過程</h3>
        <div style={codeStyle}>
{`簡易係数法:

  単相3線: coeff = 17.8
  三相3線: coeff = 30.8

  各区間の電圧降下:
    ΔV(V) = coeff × I(A) × L(m) / (1000 × A(mm²))

  電圧降下率:
    率(%) = ΔV / 基準電圧 × 100

  合計:
    幹線合計 = 各区間ΔVの合計
    分岐合計 = 接続元までの幹線ΔV + 分岐区間ΔVの合計
    最遠端   = 全経路中の最大降下率`}
        </div>
      </div>

      <div style={sectionStyle}>
        <h3 style={h3Style}>出力値</h3>
        <table style={tableStyle}>
          <thead>
            <tr><th style={thStyle}>出力</th><th style={thStyle}>形式</th><th style={thStyle}>説明</th></tr>
          </thead>
          <tbody>
            <tr><td style={tdStyle}>ツリー表示</td><td style={tdStyle}>構造図</td><td style={tdStyle}>幹線→分岐の階層。各ノードに距離(m)・降下(V)・降下率(%)</td></tr>
            <tr><td style={tdStyle}>最遠端経路</td><td style={tdStyle}>テキスト</td><td style={tdStyle}>最大降下率のルートと合計値</td></tr>
            <tr><td style={tdStyle}>基準判定テーブル</td><td style={tdStyle}>テーブル</td><td style={tdStyle}>こう長ごとの幹線・分岐・合計の基準と判定</td></tr>
          </tbody>
        </table>
      </div>

      <div style={sectionStyle}>
        <h3 style={h3Style}>アラート・バッジ</h3>

        <p style={{ fontSize: '0.88rem', fontWeight: 600, marginBottom: '0.4rem' }}>判定基準（自家変圧器）</p>
        <table style={tableStyle}>
          <thead>
            <tr><th style={thStyle}>こう長</th><th style={thStyle}>分岐限度</th><th style={thStyle}>幹線限度</th><th style={thStyle}>合計限度</th></tr>
          </thead>
          <tbody>
            <tr><td style={tdStyle}>60m以下</td><td style={tdStyle}>2%</td><td style={tdStyle}>3%</td><td style={tdStyle}>—</td></tr>
            <tr><td style={tdStyle}>60〜120m</td><td style={tdStyle}>—</td><td style={tdStyle}>—</td><td style={tdStyle}>5%</td></tr>
            <tr><td style={tdStyle}>120〜200m</td><td style={tdStyle}>—</td><td style={tdStyle}>—</td><td style={tdStyle}>6%</td></tr>
            <tr><td style={tdStyle}>200m超</td><td style={tdStyle}>—</td><td style={tdStyle}>—</td><td style={tdStyle}>7%</td></tr>
          </tbody>
        </table>

        <p style={{ fontSize: '0.88rem', fontWeight: 600, marginBottom: '0.4rem' }}>判定基準（電気事業者）</p>
        <table style={tableStyle}>
          <thead>
            <tr><th style={thStyle}>こう長</th><th style={thStyle}>分岐限度</th><th style={thStyle}>幹線限度</th><th style={thStyle}>合計限度</th></tr>
          </thead>
          <tbody>
            <tr><td style={tdStyle}>60m以下</td><td style={tdStyle}>2%</td><td style={tdStyle}>2%</td><td style={tdStyle}>—</td></tr>
            <tr><td style={tdStyle}>60〜120m</td><td style={tdStyle}>—</td><td style={tdStyle}>—</td><td style={tdStyle}>4%</td></tr>
            <tr><td style={tdStyle}>120〜200m</td><td style={tdStyle}>—</td><td style={tdStyle}>—</td><td style={tdStyle}>5%</td></tr>
            <tr><td style={tdStyle}>200m超</td><td style={tdStyle}>—</td><td style={tdStyle}>—</td><td style={tdStyle}>6%</td></tr>
          </tbody>
        </table>

        <p style={{ fontSize: '0.88rem', marginTop: '0.5rem' }}>
          全基準クリア → {badgeEx('badge-ok', '基準適合')}<br />
          いずれか超過 → {badgeEx('badge-ng', '基準超過')}
        </p>
      </div>

      <div style={sectionStyle}>
        <h3 style={h3Style}>入力バリデーション</h3>
        <table style={tableStyle}>
          <thead>
            <tr><th style={thStyle}>ID</th><th style={thStyle}>条件</th><th style={thStyle}>レベル</th><th style={thStyle}>メッセージ</th></tr>
          </thead>
          <tbody>
            <tr><td style={tdStyle}>V-1</td><td style={tdStyle}>太さ/電流の片方のみ入力</td><td style={tdStyle}>エラー</td><td style={tdStyle}>「太さを入力してください」/「電流を入力してください」</td></tr>
            <tr><td style={tdStyle}>V-2</td><td style={tdStyle}>距離テーブルに未入力区間混在</td><td style={tdStyle}>警告</td><td style={tdStyle}>「未入力の区間があります」</td></tr>
            <tr><td style={tdStyle}>V-3</td><td style={tdStyle}>電圧降下率が基準超過</td><td style={tdStyle}>警告</td><td style={tdStyle}>降下率に応じた基準超過の警告表示</td></tr>
            <tr><td style={tdStyle}>V-4</td><td style={tdStyle}>電流が電線太さの目安許容電流を超過</td><td style={tdStyle}>警告</td><td style={tdStyle}>「目安の許容電流(○A)を超えています」</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}

/* ======================================== */
/* ③ 配管サイズ計算                         */
/* ======================================== */
function PipeSizeSpec() {
  return (
    <div>
      <div style={sectionStyle}>
        <h2 style={h2Style}>🔧 配管サイズ計算</h2>
        <p style={{ fontSize: '0.88rem', color: '#4a5568', marginBottom: '0.75rem' }}>
          電線の種類・サイズ・本数から必要な配管サイズを32%/48%基準で算出するツール。
        </p>

        <h3 style={h3Style}>できること</h3>
        <ul style={ulStyle}>
          <li>電線の種類・サイズ・心数・本数から総断面積（補正後）を算出</li>
          <li>32%基準（一般施工）と48%基準（緩和条件）の配管サイズを選定</li>
          <li>7種類の配管に対応（複数同時選択可）</li>
          <li>IV線の補正係数を自動適用</li>
        </ul>
      </div>

      <div style={sectionStyle}>
        <h3 style={h3Style}>入力値（電線リスト）</h3>
        <p style={{ fontSize: '0.85rem', color: '#4a5568', marginBottom: '0.5rem' }}>
          複数行追加可能。各行に以下の入力:
        </p>
        <table style={tableStyle}>
          <thead>
            <tr><th style={thStyle}>項目</th><th style={thStyle}>入力方式</th><th style={thStyle}>選択肢</th></tr>
          </thead>
          <tbody>
            <tr><td style={tdStyle}>電線種類</td><td style={tdStyle}>セレクト</td><td style={tdStyle}>IV / VVF / CV / CV-D / CV-T / CV-Q / 6kV CVT</td></tr>
            <tr><td style={tdStyle}>サイズ</td><td style={tdStyle}>セレクト</td><td style={tdStyle}>電線種類により変動（下表参照）</td></tr>
            <tr><td style={tdStyle}>心数</td><td style={tdStyle}>ラジオチップ</td><td style={tdStyle}>VVF: 2C/3C/4C、CV: 1C/2C/3C/4C（該当時のみ）</td></tr>
            <tr><td style={tdStyle}>本数</td><td style={tdStyle}>スピナー（＋/－）</td><td style={tdStyle}>1以上の整数</td></tr>
          </tbody>
        </table>

        <h3 style={h3Style}>電線サイズの選択肢（電線種類別）</h3>
        <table style={tableStyle}>
          <thead>
            <tr><th style={thStyle}>電線種類</th><th style={thStyle}>サイズ</th></tr>
          </thead>
          <tbody>
            <tr><td style={tdStyle}>IV</td><td style={tdStyle}>1.6mm, 2.0mm, 2.6mm, 3.2mm, 1.25, 2, 3.5, 5.5, 8, 14, 22, 38, 60, 100, 150, 200, 250, 325 mm²</td></tr>
            <tr><td style={tdStyle}>VVF</td><td style={tdStyle}>1.6mm, 2.0mm, 2.6mm（＋心数選択）</td></tr>
            <tr><td style={tdStyle}>CV</td><td style={tdStyle}>2〜325 mm²（＋心数選択）</td></tr>
            <tr><td style={tdStyle}>CV-D</td><td style={tdStyle}>14〜325 mm²</td></tr>
            <tr><td style={tdStyle}>CV-T</td><td style={tdStyle}>8〜325 mm²</td></tr>
            <tr><td style={tdStyle}>CV-Q</td><td style={tdStyle}>14〜325 mm²</td></tr>
            <tr><td style={tdStyle}>6kV CVT</td><td style={tdStyle}>22〜325 mm²</td></tr>
          </tbody>
        </table>

        <h3 style={h3Style}>入力値（配管種別）</h3>
        <table style={tableStyle}>
          <thead>
            <tr><th style={thStyle}>配管種別</th><th style={thStyle}>正式名称</th></tr>
          </thead>
          <tbody>
            <tr><td style={tdStyle}>CP</td><td style={tdStyle}>厚鋼電線管</td></tr>
            <tr><td style={tdStyle}>EP</td><td style={tdStyle}>薄鋼電線管</td></tr>
            <tr><td style={tdStyle}>GP / PE</td><td style={tdStyle}>ねじなし・PF管相当</td></tr>
            <tr><td style={tdStyle}>VE</td><td style={tdStyle}>硬質塩化ビニル電線管</td></tr>
            <tr><td style={tdStyle}>CD / PF-S</td><td style={tdStyle}>CD管・PF管単層</td></tr>
            <tr><td style={tdStyle}>PF-D</td><td style={tdStyle}>PF管複層</td></tr>
            <tr><td style={tdStyle}>FEP</td><td style={tdStyle}>波付硬質合成樹脂管</td></tr>
          </tbody>
        </table>
      </div>

      <div style={sectionStyle}>
        <h3 style={h3Style}>計算式・過程</h3>
        <div style={codeStyle}>
{`【STEP 1】各電線の断面積を取得
  基本断面積 = JCS規格代表値テーブルから引き当て
  キー: [電線種類]|[サイズ]|[心数]

【STEP 2】補正係数の適用（IV線 2本以上の場合）
  金属管（CP/EP/GP）:
    1.6〜2mm   → ×2.0
    2.6〜8mm   → ×1.2
  CD管:
    全サイズ   → ×1.3

【STEP 3】有効断面積の合計
  有効断面積 = Σ(基本断面積 × 補正係数 × 本数)

【STEP 4】配管サイズの選定
  32%基準: 有効断面積 ≦ 配管内断面積 × 0.32 を満たす最小サイズ
  48%基準: 有効断面積 ≦ 配管内断面積 × 0.48 を満たす最小サイズ

出典: 内線規程 3110-5、JCS規格代表値`}
        </div>
      </div>

      <div style={sectionStyle}>
        <h3 style={h3Style}>出力値</h3>
        <table style={tableStyle}>
          <thead>
            <tr><th style={thStyle}>出力</th><th style={thStyle}>形式</th><th style={thStyle}>説明</th></tr>
          </thead>
          <tbody>
            <tr><td style={tdStyle}>総断面積（補正後）</td><td style={tdStyle}>数値 + &quot;mm²&quot;</td><td style={tdStyle}>全電線の有効断面積合計</td></tr>
            <tr><td style={tdStyle}>配管サイズ選定結果</td><td style={tdStyle}>テーブル</td><td style={tdStyle}>配管種別ごとに32%基準/48%基準のサイズを表示</td></tr>
          </tbody>
        </table>
      </div>

      <div style={sectionStyle}>
        <h3 style={h3Style}>アラート・バッジ</h3>
        <table style={tableStyle}>
          <thead>
            <tr><th style={thStyle}>条件</th><th style={thStyle}>表示</th></tr>
          </thead>
          <tbody>
            <tr><td style={tdStyle}>IV線2本以上</td><td style={tdStyle}>補正係数適用の警告メッセージ</td></tr>
            <tr><td style={tdStyle}>適合サイズなし</td><td style={tdStyle}>「対応なし」と表示</td></tr>
          </tbody>
        </table>
        <p style={{ fontSize: '0.82rem', color: '#718096', marginTop: '0.4rem' }}>
          ※ 32%：一般施工基準（内線規程3110-5）　48%：緩和条件（屈曲少・引換容易な場合）
        </p>
      </div>

      <div style={sectionStyle}>
        <h3 style={h3Style}>入力制限・バリデーション</h3>
        <table style={tableStyle}>
          <thead>
            <tr><th style={thStyle}>条件</th><th style={thStyle}>動作</th></tr>
          </thead>
          <tbody>
            <tr><td style={tdStyle}>VVF 2.6mm 選択時</td><td style={tdStyle}>4芯を選択肢から除外（自動で3Cに切り替え）</td></tr>
            <tr><td style={tdStyle}>配管種別が未選択</td><td style={tdStyle}>エラー表示「配管種別を1つ以上選択してください」</td></tr>
            <tr><td style={tdStyle}>断面積が0になる組合せ</td><td style={tdStyle}>警告表示「仕上り断面積が取得できません」</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}

/* ======================================== */
/* ④ ブレーカー選定                         */
/* ======================================== */
function BreakerSpec() {
  return (
    <div>
      <div style={sectionStyle}>
        <h2 style={h2Style}>⚡ ブレーカー選定</h2>
        <p style={{ fontSize: '0.88rem', color: '#4a5568', marginBottom: '0.75rem' }}>
          負荷リストからブレーカー定格を選定し、配線の適否を検証するツール。
        </p>

        <h3 style={h3Style}>できること</h3>
        <ul style={ulStyle}>
          <li>一般負荷：kWから電流計算 → ブレーカー定格を選定</li>
          <li>電動機（1台・三相200V）：内線規程3705-1表からテーブル引き</li>
          <li>溶接機：内線規程3330-1表からテーブル引き</li>
          <li>極数・素子数の推奨（2P1E / 2P2E / 3P3E）</li>
          <li>配線検証①：許容電流チェック（安全の不等式 I ≦ In ≦ Iz）</li>
          <li>配線検証②：電圧降下チェック（インピーダンス法・力率反映）</li>
          <li>配線検証③：推奨電線サイズの提案（NGの場合）</li>
        </ul>
      </div>

      <div style={sectionStyle}>
        <h3 style={h3Style}>入力値（設定バー）</h3>
        <table style={tableStyle}>
          <thead>
            <tr><th style={thStyle}>項目</th><th style={thStyle}>入力方式</th><th style={thStyle}>選択肢</th><th style={thStyle}>デフォルト</th></tr>
          </thead>
          <tbody>
            <tr><td style={tdStyle}>配電方式</td><td style={tdStyle}>ラジオチップ</td><td style={tdStyle}>単相2線 / 単相3線 / 三相3線</td><td style={tdStyle}>三相3線</td></tr>
            <tr><td style={tdStyle}>定格電圧</td><td style={tdStyle}>ラジオチップ</td><td style={tdStyle}>100V / 200V</td><td style={tdStyle}>200V</td></tr>
            <tr><td style={tdStyle}>力率 cosθ</td><td style={tdStyle}>ラジオチップ</td><td style={tdStyle}>1.0 / 0.9 / 0.8</td><td style={tdStyle}>0.8</td></tr>
            <tr><td style={tdStyle}>余裕率</td><td style={tdStyle}>ラジオチップ</td><td style={tdStyle}>1.0倍 / 1.25倍 / 1.5倍</td><td style={tdStyle}>1.25倍</td></tr>
          </tbody>
        </table>

        <h3 style={h3Style}>入力値（負荷リスト）</h3>
        <p style={{ fontSize: '0.85rem', color: '#4a5568', marginBottom: '0.5rem' }}>
          複数行追加可能。各行に以下の入力:
        </p>
        <table style={tableStyle}>
          <thead>
            <tr><th style={thStyle}>項目</th><th style={thStyle}>入力方式</th><th style={thStyle}>選択肢・備考</th></tr>
          </thead>
          <tbody>
            <tr><td style={tdStyle}>負荷種類</td><td style={tdStyle}>セレクト</td><td style={tdStyle}>一般負荷（照明等）/ モーター（クーラー等）/ 溶接機</td></tr>
            <tr><td style={tdStyle}>消費電力</td><td style={tdStyle}>数値入力</td><td style={tdStyle}>kW</td></tr>
            <tr><td style={tdStyle}>始動方式</td><td style={tdStyle}>セレクト</td><td style={tdStyle}>じか入れ / スターデルタ（モーター時のみ表示）</td></tr>
            <tr><td style={tdStyle}>使用率</td><td style={tdStyle}>数値入力</td><td style={tdStyle}>0〜100%、デフォルト50%（溶接機時のみ表示）</td></tr>
            <tr><td style={tdStyle}>電線種類</td><td style={tdStyle}>セレクト</td><td style={tdStyle}>CV / CVT / IV / 未選択</td></tr>
            <tr><td style={tdStyle}>電線太さ</td><td style={tdStyle}>セレクト</td><td style={tdStyle}>1.6mm, 2.0mm, 2.6mm, 5.5mm², 8mm²〜200mm²</td></tr>
            <tr><td style={tdStyle}>電線長さ</td><td style={tdStyle}>数値入力</td><td style={tdStyle}>m単位</td></tr>
          </tbody>
        </table>
      </div>

      <div style={sectionStyle}>
        <h3 style={h3Style}>計算式・過程</h3>

        <p style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.3rem' }}>A. ブレーカー選定</p>
        <div style={codeStyle}>
{`【一般負荷の場合】
  STEP 1: 負荷電流の算出
    I = P(W) / (K × V × cosθ)
    K = 1（単相2線・単相3線）/ √3 ≈ 1.732（三相3線）

  STEP 2: 余裕率の適用
    I' = I × 余裕率

  STEP 3: ブレーカー定格の選定
    I' 以上の最小規格を選択
    規格一覧: 5, 10, 15, 20, 30, 40, 50, 60, 75, 100,
             125, 150, 175, 200, 225, 250, 300, 350, 400 A

【電動機（三相200V・1台）の場合】
  内線規程 3705-1表から kW で直接テーブル引き
  始動方式（じか入れ/スターデルタ）で定格が異なる

【溶接機の場合】
  等価電力: kW_eq = kW × √(使用率 / 100)
  kVA概算:  kVA = kW / 0.6（力率0.6想定）
  内線規程 3330-1表から kVA でテーブル引き`}
        </div>

        <p style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.3rem' }}>B. 極数・素子数の推奨</p>
        <div style={codeStyle}>
{`単相2線         → 2P1E（2極1素子：電圧線1本を監視）
単相3線・100V   → 2P1E（2極1素子：電圧線1本を監視）
単相3線・200V   → 2P2E（2極2素子：両電圧線を監視）
三相3線         → 3P3E（3極3素子：3本すべてを監視）`}
        </div>

        <p style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.3rem' }}>C. 配線検証①：許容電流チェック</p>
        <div style={codeStyle}>
{`許容電流テーブルから引き当て:
  CV  → 気中暗渠の許容電流
  CVT → 気中暗渠の許容電流
  IV  → 管内（3本以下）の許容電流

判定:
  ブレーカー定格(In) ≦ 許容電流(Iz) → OK
  ブレーカー定格(In) >  許容電流(Iz) → NG

出典: 電技解釈・JCS 0168`}
        </div>

        <p style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.3rem' }}>D. 配線検証②：電圧降下チェック</p>
        <div style={codeStyle}>
{`インピーダンス法（力率反映）:

  Z = R·cosθ + X·√(1−cosθ²)   (Ω/km)
  ΔV = K × I × L × Z × 0.001  (V)
  降下率 = ΔV / V × 100        (%)

  K: 2（単相2線）/ 1（単相3線）/ √3（三相3線）
  I: 各負荷の個別電流（負荷のkWから算出）

  R/Xデータ（8mm²以上）: JCS 103A 参考値（60Hz）
    8mm²:   R=3.01,  X=0.137
    14mm²:  R=1.71,  X=0.128
    22mm²:  R=1.08,  X=0.123
    38mm²:  R=0.627, X=0.115
    60mm²:  R=0.397, X=0.11
    100mm²: R=0.24,  X=0.106
    150mm²: R=0.16,  X=0.102
    200mm²: R=0.122, X=0.103
    250mm²: R=0.0995,X=0.1
    325mm²: R=0.0783,X=0.098

  8mm²未満: R = 1000 / (56 × A_mm²)、X ≈ 0
    → Z ≈ R × cosθ`}
        </div>

        <p style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.3rem' }}>E. 配線検証③：推奨電線サイズ</p>
        <div style={codeStyle}>
{`許容電流NGまたは電圧降下NG時に提案:

条件:
  許容電流 ≧ ブレーカー定格
  かつ 電圧降下率 ≦ 4%（長さ指定時）

を同時に満たす最小の電線サイズを提示`}
        </div>
      </div>

      <div style={sectionStyle}>
        <h3 style={h3Style}>出力値</h3>
        <table style={tableStyle}>
          <thead>
            <tr><th style={thStyle}>出力</th><th style={thStyle}>形式</th><th style={thStyle}>説明</th></tr>
          </thead>
          <tbody>
            <tr><td style={tdStyle}>選定結果</td><td style={tdStyle}>大きな数値 + &quot;A&quot;</td><td style={tdStyle}>ブレーカー定格（規格超の場合「規格超」）</td></tr>
            <tr><td style={tdStyle}>合計電力</td><td style={tdStyle}>バッジ</td><td style={tdStyle}>kW（溶接機は使用率考慮後の等価電力）</td></tr>
            <tr><td style={tdStyle}>負荷電流</td><td style={tdStyle}>バッジ</td><td style={tdStyle}>I = P/(K×V×cosθ) の結果（A）</td></tr>
            <tr><td style={tdStyle}>余裕込み電流</td><td style={tdStyle}>バッジ</td><td style={tdStyle}>I × 余裕率（A）</td></tr>
            <tr><td style={tdStyle}>推奨極数・素子数</td><td style={tdStyle}>テキスト</td><td style={tdStyle}>2P1E / 2P2E / 3P3E + 説明文</td></tr>
            <tr><td style={tdStyle}>電動機テーブル結果</td><td style={tdStyle}>カード</td><td style={tdStyle}>該当時のみ。定格出力・全負荷電流・始動方式・ブレーカー・配線種類別最小電線/最大こう長・接地線</td></tr>
            <tr><td style={tdStyle}>溶接機テーブル結果</td><td style={tdStyle}>カード</td><td style={tdStyle}>該当時のみ。最大入力kVA・ブレーカー・開閉器・ヒューズ・一次配線最小太さ</td></tr>
            <tr><td style={tdStyle}>配線検証</td><td style={tdStyle}>カード（負荷ごと）</td><td style={tdStyle}>許容電流(A)+判定、電圧降下(V)+降下率(%)+判定、推奨サイズ</td></tr>
            <tr><td style={tdStyle}>ブレーカー規格一覧</td><td style={tdStyle}>テーブル</td><td style={tdStyle}>5〜400Aの全定格に対する適否判定</td></tr>
            <tr><td style={tdStyle}>計算過程</td><td style={tdStyle}>テキスト</td><td style={tdStyle}>STEP 1〜3の数式展開</td></tr>
          </tbody>
        </table>
      </div>

      <div style={sectionStyle}>
        <h3 style={h3Style}>アラート・バッジ</h3>
        <table style={tableStyle}>
          <thead>
            <tr><th style={thStyle}>判定</th><th style={thStyle}>条件</th><th style={thStyle}>表示</th></tr>
          </thead>
          <tbody>
            <tr>
              <td style={tdStyle}>許容電流 OK</td>
              <td style={tdStyle}>ブレーカー定格 ≦ 許容電流</td>
              <td style={tdStyle}>{badgeEx('badge-ok', 'OK')}</td>
            </tr>
            <tr>
              <td style={tdStyle}>許容電流 NG</td>
              <td style={tdStyle}>ブレーカー定格 &gt; 許容電流</td>
              <td style={tdStyle}>{badgeEx('badge-ng', 'NG')}</td>
            </tr>
            <tr>
              <td style={tdStyle}>電圧降下 良好</td>
              <td style={tdStyle}>降下率 ≦ 2%</td>
              <td style={tdStyle}>{badgeEx('badge-ok', '良好')}</td>
            </tr>
            <tr>
              <td style={tdStyle}>電圧降下 注意</td>
              <td style={tdStyle}>2% &lt; 降下率 ≦ 4%</td>
              <td style={tdStyle}>{badgeEx('badge-warn', '注意')}</td>
            </tr>
            <tr>
              <td style={tdStyle}>電圧降下 超過</td>
              <td style={tdStyle}>降下率 &gt; 4%</td>
              <td style={tdStyle}>{badgeEx('badge-ng', '超過')}</td>
            </tr>
            <tr>
              <td style={tdStyle}>推奨サイズ</td>
              <td style={tdStyle}>許容電流NG or 電圧降下NG</td>
              <td style={tdStyle}>赤枠で「推奨: [電線種類] [サイズ] 以上」</td>
            </tr>
            <tr>
              <td style={tdStyle}>ブレーカー不足</td>
              <td style={tdStyle}>定格 &lt; 余裕込み電流</td>
              <td style={tdStyle}>赤「✕ 不足」</td>
            </tr>
            <tr>
              <td style={tdStyle}>ブレーカー選定</td>
              <td style={tdStyle}>余裕込み電流以上の最小定格</td>
              <td style={tdStyle}>青「◎ 選定」（行ハイライト）</td>
            </tr>
            <tr>
              <td style={tdStyle}>ブレーカー適合</td>
              <td style={tdStyle}>選定より大きい定格</td>
              <td style={tdStyle}>グレー「○ 適合」</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div style={sectionStyle}>
        <h3 style={h3Style}>入力バリデーション</h3>
        <table style={tableStyle}>
          <thead>
            <tr><th style={thStyle}>ID</th><th style={thStyle}>条件</th><th style={thStyle}>レベル</th><th style={thStyle}>メッセージ</th></tr>
          </thead>
          <tbody>
            <tr><td style={tdStyle}>B-1</td><td style={tdStyle}>三相3線 × 100V</td><td style={tdStyle}>エラー</td><td style={tdStyle}>「三相3線式では100Vは使用できません」</td></tr>
            <tr><td style={tdStyle}>B-2</td><td style={tdStyle}>モーター × 三相200V以外</td><td style={tdStyle}>警告</td><td style={tdStyle}>「内線規程テーブル参照不可。汎用計算で選定」</td></tr>
            <tr><td style={tdStyle}>B-4</td><td style={tdStyle}>スターデルタ × 3.7kW未満</td><td style={tdStyle}>警告</td><td style={tdStyle}>「一般的に3.7kW以上で使用」</td></tr>
            <tr><td style={tdStyle}>B-5</td><td style={tdStyle}>溶接機 × 単相2線100V</td><td style={tdStyle}>警告</td><td style={tdStyle}>「特殊な構成です。設定を確認してください」</td></tr>
            <tr><td style={tdStyle}>B-6</td><td style={tdStyle}>IV × 60mm²以上</td><td style={tdStyle}>警告</td><td style={tdStyle}>「一般的ではありません。CVまたはCVTを検討」</td></tr>
            <tr><td style={tdStyle}>B-7/B-8</td><td style={tdStyle}>CV/CVT選択時</td><td style={tdStyle}>制限</td><td style={tdStyle}>mm表記サイズ（1.6mm等）を選択肢から除外</td></tr>
            <tr><td style={tdStyle}>B-10</td><td style={tdStyle}>配線情報が不完全</td><td style={tdStyle}>エラー</td><td style={tdStyle}>「電線種類・太さ・長さを入力してください」</td></tr>
          </tbody>
        </table>
      </div>

      <div style={sectionStyle}>
        <h3 style={h3Style}>配線検証で使用するデータソース</h3>
        <table style={tableStyle}>
          <thead>
            <tr><th style={thStyle}>検証項目</th><th style={thStyle}>データソース</th><th style={thStyle}>参照条件</th></tr>
          </thead>
          <tbody>
            <tr><td style={tdStyle}>許容電流</td><td style={tdStyle}>電技解釈・JCS 0168</td><td style={tdStyle}>CV/CVT→気中暗渠、IV→管内3本以下</td></tr>
            <tr><td style={tdStyle}>電圧降下 R/X</td><td style={tdStyle}>JCS 103A（60Hz）</td><td style={tdStyle}>8mm²以上: テーブル引き、8mm²未満: R=1000/(56×A)</td></tr>
            <tr><td style={tdStyle}>電動機テーブル</td><td style={tdStyle}>内線規程 3705-1表</td><td style={tdStyle}>三相200V・1台、じか入れ/スターデルタ</td></tr>
            <tr><td style={tdStyle}>溶接機テーブル</td><td style={tdStyle}>内線規程 3330-1表</td><td style={tdStyle}>kVA概算 = kW/0.6</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}
