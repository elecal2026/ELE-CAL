'use client'

import { useState, useMemo } from 'react'
import SiteHeader from '@/components/SiteHeader'
import { usePaywall } from '@/components/PaywallProvider'

// ==========================================
// 許容電流データ（電技解釈・JCS 0168 参考値）
// ==========================================
const DATA: Record<string, Record<string, Record<string, number>>> = {
  IV: {
    '気中（単線）': { '1.0': 16, '1.2': 20, '1.6': 27, '2.0': 35, '2.6': 48, '3.2': 62 },
    '気中（より線）': { '1.25': 19, '2': 27, '3.5': 37, '5.5': 49, '8': 61, '14': 88, '22': 115, '38': 162, '60': 217, '100': 298, '150': 395, '200': 469, '250': 556, '325': 650 },
    '管内（3本以下）': { '1.25': 13, '2': 19, '3.5': 26, '5.5': 34, '8': 43, '14': 62, '22': 81, '38': 113, '60': 152, '100': 209, '150': 277, '200': 328, '250': 389, '325': 455 },
    '管内（4本）': { '1.25': 12, '2': 17, '3.5': 23, '5.5': 31, '8': 38, '14': 55, '22': 72, '38': 102, '60': 137, '100': 188, '150': 249, '200': 296, '250': 351, '325': 410 },
  },
  HIV: {
    // 気中: HIV = IV気中（より線）× 1.22（7捨8入）。p151計算例で確認（docs/根拠/allowable_current.md §5B）
    '気中（より線）': { '1.25': 23, '2': 33, '3.5': 45, '5.5': 59, '8': 74, '14': 107, '22': 140, '38': 197, '60': 264, '100': 363, '150': 482, '200': 572, '250': 678, '325': 793 },
    // ⚠️管内: 1.22を管内基準に適用してよいか規程の計算例なし。河島さん確認まで暫定値のまま（出典不明）
    '管内（3本以下）': { '1.25': 16, '2': 22, '3.5': 30, '5.5': 40, '8': 50, '14': 72, '22': 94, '38': 132, '60': 177, '100': 244, '150': 323, '200': 384, '250': 454, '325': 531 },
  },
  // VVF/VVR気中: p880 資料1-3-3（JCS 0168-2:2016）気中暗きょ布設 2心/3心（docs/根拠/allowable_current.md §5C）
  VVF: {
    '気中（2心）': { '1.6': 18, '2.0': 23, '2.6': 32 },
    '気中（3心）': { '1.6': 15, '2.0': 20, '2.6': 27 },
    // ⚠️埋込配線: 原典（p880）に該当する布設条件列がない。河島さん確認まで暫定値のまま（出典不明）
    '埋込配線': { '1.6': 15, '2.0': 20, '2.6': 27 },
  },
  VVR: {
    '気中（2心）': { '1.6': 18, '2.0': 23, '2.6': 32, '5.5': 33, '8': 42, '14': 59, '22': 77, '38': 110 },
    '気中（3心）': { '1.6': 15, '2.0': 20, '2.6': 27, '5.5': 28, '8': 36, '14': 50, '22': 66, '38': 93 },
  },
  // 資料1-3-3（PDF p881-p882）600V CV ケーブル正本値（JEAC8001-2022）
  // 設計判断D-003: CVD=単心2個より(p882表3)、CVT=単心3個より(p882表3)を採用
  CV: {
    // 単心(CV) 3条布設 S=2d（気中暗渠）/ S=d（直埋）/ 4孔3条布設（管路引入れ）
    // 14mm²未満は表に記載なし
    '気中暗渠': { '14': 100, '22': 130, '38': 190, '60': 255, '100': 355, '150': 455, '200': 545, '250': 620, '325': 725 },
    // 管路引入れ: 単心CVの4孔3条布設は100mm²以上のみ記載。2〜60mm²の布設条件は根拠確定待ち（保留）
    '管路引入れ': { '2': 25, '3.5': 33, '5.5': 43, '8': 55, '14': 73, '22': 97, '38': 130, '60': 170, '100': 225, '150': 285, '200': 340, '250': 395, '325': 455 },
    '直埋': { '14': 110, '22': 140, '38': 190, '60': 245, '100': 325, '150': 405, '200': 470, '250': 525, '325': 605 },
  },
  CVD: {
    // p882表3 単心2個より（設計判断D-003）。14mm²未満は表に記載なし
    '気中暗渠': { '14': 91, '22': 120, '38': 165, '60': 225, '100': 310, '150': 400, '200': 490, '250': 565, '325': 670 },
    '管路引入れ': { '14': 90, '22': 115, '38': 160, '60': 210, '100': 285, '150': 360, '200': 430, '250': 490, '325': 570 },
    '直埋': { '14': 120, '22': 155, '38': 210, '60': 270, '100': 360, '150': 450, '200': 525, '250': 590, '325': 675 },
  },
  CVT: {
    // p882表3 単心3個より（設計判断D-003）。14mm²未満は表に記載なし
    '気中暗渠': { '14': 86, '22': 110, '38': 155, '60': 210, '100': 290, '150': 380, '200': 465, '250': 535, '325': 635 },
    '管路引入れ': { '14': 81, '22': 105, '38': 145, '60': 185, '100': 250, '150': 320, '200': 380, '250': 430, '325': 500 },
    '直埋': { '14': 100, '22': 130, '38': 180, '60': 230, '100': 305, '150': 380, '200': 445, '250': 500, '325': 570 },
  },
}

const WIRE_OPTIONS = [
  { value: 'IV', label: 'IV（600Vビニル絶縁電線）' },
  { value: 'HIV', label: 'HIV（600V二種ビニル絶縁電線）' },
  { value: 'VVF', label: 'VVF（ビニル絶縁ビニルシースケーブル 平形）' },
  { value: 'VVR', label: 'VVR（ビニル絶縁ビニルシースケーブル 丸形）' },
  { value: 'CV', label: 'CV（架橋ポリエチレン絶縁ビニルシースケーブル 単心）' },
  { value: 'CVD', label: 'CVD（単心2個より）' },
  { value: 'CVT', label: 'CVT（単心3個より）' },
]

function formatSize(sizeKey: string): string {
  const solidSizes = new Set(['1.0', '1.2', '1.6', '2.0', '2.6', '3.2'])
  if (solidSizes.has(sizeKey)) return `${sizeKey} mm`
  return `${sizeKey} mm²`
}

export default function AllowableCurrentPage() {
  const { isPaid, openPaywall } = usePaywall()

  const [wire, setWire] = useState('IV')
  // 契約者は別チップへの変更でこの setter が使われる。未契約者は activeCondition の自動フォールバックのみ
  const [condition, setCondition] = useState('')
  const [size, setSize] = useState('')

  // 線種が変わったら条件リストを更新
  const conditions = useMemo(() => Object.keys(DATA[wire] ?? {}), [wire])

  // 条件が選択肢にない場合、最初の条件に自動切替
  const activeCondition = conditions.includes(condition) ? condition : conditions[0] ?? ''

  // サイズリスト
  const sizeMap = DATA[wire]?.[activeCondition] ?? {}
  const sizes = Object.keys(sizeMap)

  // サイズが選択肢にない場合、最初のサイズに自動切替
  const activeSize = sizes.includes(size) ? size : sizes[0] ?? ''

  // 許容電流
  const amp = sizeMap[activeSize]

  // 線種名
  const wireName = WIRE_OPTIONS.find((w) => w.value === wire)?.label ?? wire

  return (
    <>
      <SiteHeader mode="sub" title="許容電流表" />

      {/* 設定バー */}
      <div className="breaker-settings-bar vd2-settings-bar">
        <div className="breaker-setting-group vd2-setting-group">
          <span className="breaker-setting-label vd2-setting-label">電線種類</span>
          <select
            className="form-control"
            id="sel-wire"
            value={wire}
            onChange={(e) => setWire(e.target.value)}
            style={{ fontSize: '0.85rem', padding: '0.3rem 0.5rem', minWidth: 180 }}
          >
            {WIRE_OPTIONS.map((w) => (
              <option key={w.value} value={w.value}>{w.label}</option>
            ))}
          </select>
        </div>
        <div className="breaker-setting-group vd2-setting-group">
          <span className="breaker-setting-label vd2-setting-label">敷設条件</span>
          <div className="chips-group" style={{ margin: 0 }}>
            {conditions.map((c) => {
              const isActive = activeCondition === c
              const showLock = !isActive && !isPaid
              return (
                <label className="chip-label" key={c}>
                  <input
                    type="radio"
                    name="condition"
                    value={c}
                    checked={isActive}
                    onChange={() => { if (isPaid) setCondition(c) }}
                    onClick={(e) => {
                      if (!isPaid && !isActive) { e.preventDefault(); openPaywall() }
                    }}
                  />
                  <span className="chip-text">
                    {showLock && <span aria-hidden="true" style={{ marginRight: '0.25em' }}>🔒</span>}
                    {c}
                  </span>
                </label>
              )
            })}
          </div>
        </div>
        <div className="breaker-setting-group vd2-setting-group">
          <span className="breaker-setting-label vd2-setting-label">導体サイズ</span>
          <select
            className="form-control"
            id="sel-size"
            value={activeSize}
            onChange={(e) => setSize(e.target.value)}
            style={{ fontSize: '0.85rem', padding: '0.3rem 0.5rem', minWidth: 120 }}
          >
            {sizes.map((s) => (
              <option key={s} value={s}>{formatSize(s)}</option>
            ))}
          </select>
        </div>
      </div>

      {/* 警告 */}
      {(wire === 'HIV' || (wire === 'VVF' && activeCondition === '埋込配線')) && (
        <div style={{ padding: '0.4rem 2rem', background: '#fff', borderBottom: '1px solid var(--border)' }}>
          {wire === 'HIV' && (
            <div className="validation-warning" style={{ margin: 0 }}>※ HIVはより線のみの規格です（単線サイズはありません）</div>
          )}
          {wire === 'VVF' && activeCondition === '埋込配線' && (
            <div className="validation-warning" style={{ margin: 0 }}>※ 埋込配線の許容電流は2心・3心共通の参考値です</div>
          )}
        </div>
      )}

      {/* 結果エリア（全幅） */}
      <main className="main-content">
        <section className="result-box">
          <div className="result-label">許容電流</div>
          <div>
            <span className="current-value">{amp !== undefined ? amp : '—'}</span>
            <span className="result-unit">A</span>
          </div>
          <div className="condition-summary">
            {amp !== undefined ? `${wireName}　${formatSize(activeSize)}　${activeCondition}` : ''}
          </div>
        </section>

        <section className="card mt-2">
          <p className="card-title">この条件の全サイズ一覧</p>
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th className="size-col">サイズ</th>
                  <th className="amp-col">許容電流 (A)</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(sizeMap).map(([s, a]) => (
                  <tr key={s} className={s === activeSize ? 'highlight' : ''}>
                    <td className="size-col">{formatSize(s)}</td>
                    <td className="amp-col">{a} A</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <div className="disclaimer">
          <strong>⚠ 注意事項</strong>
          本データは電気設備技術基準・解釈（電技解釈）およびJCS 0168を参考に作成しています。
          実務においては必ず最新の規格・基準を確認してください。
          本ツールの使用により生じた損害について、作成者は一切の責任を負いません。
        </div>

        <details className="review-notes">
          <summary>検討事項（実装検討中）</summary>
          <div className="review-notes-body">
            <ul>
              <li><strong>A-5:</strong> CV系の名称について — 許容電流表では「CV / CVD / CVT」、配管サイズ計算では「CV / CV-D / CV-T / CV-Q」と表記が異なる。統一を検討。</li>
              <li><strong>A-6:</strong> IV 14mm²以上を管内4本で使用するケースは実務で稀。注記の追加を検討。</li>
              <li><strong>A-7:</strong> 温度補正未考慮 — 現在のデータは周囲温度30℃基準。高温環境での減少係数表の追加を検討。</li>
            </ul>
          </div>
        </details>
      </main>
    </>
  )
}
