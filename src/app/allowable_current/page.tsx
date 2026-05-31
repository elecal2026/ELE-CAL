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
    '気中（より線）': { '1.25': 23, '2': 32, '3.5': 43, '5.5': 57, '8': 71, '14': 103, '22': 134, '38': 189, '60': 253, '100': 348, '150': 461, '200': 548, '250': 649, '325': 759 },
    '管内（3本以下）': { '1.25': 16, '2': 22, '3.5': 30, '5.5': 40, '8': 50, '14': 72, '22': 94, '38': 132, '60': 177, '100': 244, '150': 323, '200': 384, '250': 454, '325': 531 },
  },
  VVF: {
    '気中（2心）': { '1.6': 19, '2.0': 26, '2.6': 35 },
    '気中（3心）': { '1.6': 15, '2.0': 20, '2.6': 28 },
    '埋込配線': { '1.6': 15, '2.0': 20, '2.6': 27 },
  },
  VVR: {
    '気中（2心）': { '1.6': 19, '2.0': 26, '2.6': 35, '5.5': 42, '8': 53, '14': 73, '22': 95, '38': 130 },
    '気中（3心）': { '1.6': 15, '2.0': 20, '2.6': 28, '5.5': 34, '8': 43, '14': 60, '22': 78, '38': 107 },
  },
  // 資料1-3-3（PDF p881）600V CV ケーブル正本値（JEAC8001-2022）
  CV: {
    // 単心CV 1口1条布設。14mm²未満は表に記載なし
    '気中暗渠': { '14': 100, '22': 130, '38': 175, '60': 220, '100': 295, '150': 370, '200': 440, '250': 510, '325': 590 },
    '管路引入れ': { '2': 25, '3.5': 33, '5.5': 43, '8': 55, '14': 73, '22': 97, '38': 130, '60': 170, '100': 225, '150': 285, '200': 340, '250': 395, '325': 455 },
    '直埋': { '14': 120, '22': 160, '38': 220, '60': 280, '100': 375, '150': 475, '200': 560, '250': 650, '325': 750 },
  },
  CVD: {
    // 2心CV 1条布設
    '気中暗渠': { '2': 38, '3.5': 51, '5.5': 65, '8': 84, '14': 118, '22': 153, '38': 210, '60': 272, '100': 360, '150': 455, '200': 530, '250': 610, '325': 710 },
    '管路引入れ': { '2': 21, '3.5': 28, '5.5': 37, '8': 47, '14': 75, '22': 99, '38': 130, '60': 165, '100': 220, '150': 280, '200': 330, '250': 385, '325': 445 },
    '直埋': { '2': 39, '3.5': 54, '5.5': 69, '8': 85, '14': 130, '22': 180, '38': 245, '60': 305, '100': 400, '150': 510, '200': 600, '250': 690, '325': 800 },
  },
  CVT: {
    // 3心CV 1条布設。14mm²未満は表に記載なし
    '気中暗渠': { '14': 97, '22': 125, '38': 170, '60': 225, '100': 300, '150': 375, '200': 445, '250': 515, '325': 605 },
    '管路引入れ': { '14': 64, '22': 83, '38': 113, '60': 140, '100': 190, '150': 240, '200': 285, '250': 330, '325': 380 },
    '直埋': { '14': 110, '22': 145, '38': 200, '60': 250, '100': 335, '150': 425, '200': 500, '250': 575, '325': 665 },
  },
}

const WIRE_OPTIONS = [
  { value: 'IV', label: 'IV（600Vビニル絶縁電線）' },
  { value: 'HIV', label: 'HIV（600V二種ビニル絶縁電線）' },
  { value: 'VVF', label: 'VVF（ビニル絶縁ビニルシースケーブル 平形）' },
  { value: 'VVR', label: 'VVR（ビニル絶縁ビニルシースケーブル 丸形）' },
  { value: 'CV', label: 'CV（架橋ポリエチレン絶縁ビニルシースケーブル 単心）' },
  { value: 'CVD', label: 'CV-D（CVの2心）' },
  { value: 'CVT', label: 'CV-T（CVの3心）' },
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

      <main className="main-content">
        <section className="card">
          <p className="card-title">条件選択</p>

          <div className="form-group">
            <label className="form-label" htmlFor="sel-wire">電線種類</label>
            <select
              className="form-control"
              id="sel-wire"
              value={wire}
              onChange={(e) => setWire(e.target.value)}
            >
              {WIRE_OPTIONS.map((w) => (
                <option key={w.value} value={w.value}>{w.label}</option>
              ))}
            </select>
          </div>
          {wire === 'HIV' && (
            <div className="validation-warning" style={{ marginTop: '-0.5rem', marginBottom: '0.75rem' }}>※ HIVはより線のみの規格です（単線サイズはありません）</div>
          )}

          <div className="form-group">
            <label className="form-label">敷設条件</label>
            <div className="chips-group">
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
                      onChange={() => {
                        // 契約者のみ通常のラジオ動作で値を更新
                        if (isPaid) setCondition(c)
                      }}
                      onClick={(e) => {
                        // 未契約者は別チップへの変更を抑止し、課金導線を開く
                        if (!isPaid && !isActive) {
                          e.preventDefault()
                          openPaywall()
                        }
                      }}
                    />
                    <span className="chip-text">
                      {showLock && (
                        <span aria-hidden="true" style={{ marginRight: '0.25em' }}>🔒</span>
                      )}
                      {c}
                    </span>
                  </label>
                )
              })}
            </div>
          </div>
          {wire === 'VVF' && activeCondition === '埋込配線' && (
            <div className="validation-warning" style={{ marginTop: '-0.5rem', marginBottom: '0.75rem' }}>※ 埋込配線の許容電流は2心・3心共通の参考値です</div>
          )}

          <div className="form-group">
            <label className="form-label" htmlFor="sel-size">導体サイズ（公称断面積）</label>
            <select
              className="form-control"
              id="sel-size"
              value={activeSize}
              onChange={(e) => setSize(e.target.value)}
            >
              {sizes.map((s) => (
                <option key={s} value={s}>{formatSize(s)}</option>
              ))}
            </select>
          </div>
        </section>

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
