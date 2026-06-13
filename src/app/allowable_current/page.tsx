'use client'

import { useState, useMemo } from 'react'
import SiteHeader from '@/components/SiteHeader'
import { usePaywall } from '@/components/PaywallProvider'
import {
  WIRE_TYPES,
  getWireSpecsByType,
  type WireSpec,
  type WireTypeId,
} from '@/data/wire-master'

// ==========================================
// 許容電流データ（電技解釈・JCS 0168 参考値）
// ==========================================
const DATA: Record<string, Record<string, Record<string, number>>> = {
  IV: {
    '気中（単線）': { '1.0': 16, '1.2': 19, '1.6': 27, '2.0': 35, '2.6': 48, '3.2': 62, '4.0': 81, '5.0': 107 },
    '気中（より線）': { '0.9': 17, '1.25': 19, '2': 27, '3.5': 37, '5.5': 49, '8': 61, '14': 88, '22': 115, '38': 162, '60': 217, '100': 298, '150': 395, '200': 469, '250': 556, '325': 650 },
    '管内（3本以下）': { '1.2': 13, '1.6': 19, '2.0': 24, '2.6': 33, '3.2': 43, '1.25': 13, '2': 19, '3.5': 26, '5.5': 34, '8': 42, '14': 61, '22': 80, '38': 113, '60': 152, '100': 208, '150': 276, '200': 328, '250': 389, '325': 455 },
    '管内（4本）': { '1.2': 12, '1.6': 17, '2.0': 22, '2.6': 30, '3.2': 38, '1.25': 12, '2': 17, '3.5': 23, '5.5': 31, '8': 38, '14': 55, '22': 72, '38': 102, '60': 136, '100': 187, '150': 249, '200': 295, '250': 350, '325': 409 },
  },
  HIV: {
    // 気中: HIV = IV気中（単線）× 1.22（7捨8入）。p151計算例の方式をラクダ掲載単線サイズへ適用
    '気中（単線）': { '1.2': 23, '1.6': 33, '2.0': 42, '2.6': 58 },
    // 気中: HIV = IV気中（より線）× 1.22（7捨8入）。p151計算例で確認（docs/根拠/allowable_current.md §5B）
    '気中（より線）': { '1.25': 23, '2': 33, '3.5': 45, '5.5': 59, '8': 74, '14': 107, '22': 140, '38': 197, '60': 264, '100': 363, '150': 482, '200': 572, '250': 678, '325': 793 },
    // 管内: HIV管内 = IV管内 × 1.22（7捨8入）。p151例(2)で管内収納時も1.22を独立に掛ける構造を確認
    '管内（3本以下）': { '1.2': 16, '1.6': 23, '2.0': 29, '2.6': 40, '1.25': 16, '2': 23, '3.5': 31, '5.5': 41, '8': 51, '14': 74, '22': 97, '38': 138, '60': 185, '100': 253, '150': 336, '200': 400, '250': 474, '325': 555 },
    '管内（4本）': { '1.2': 14, '1.6': 20, '2.0': 27, '2.6': 36, '1.25': 14, '2': 20, '3.5': 28, '5.5': 38, '8': 46, '14': 67, '22': 88, '38': 124, '60': 166, '100': 228, '150': 303, '200': 360, '250': 427, '325': 499 },
  },
  // VVF/VVR気中: p880 資料1-3-3（JCS 0168-2:2016）気中暗きょ布設 2心/3心（docs/根拠/allowable_current.md §5C）
  VVF: {
    // 「埋込配線」は原典（p880 資料1-3-3）に該当布設条件列がないため削除（2026-06-07 別エージェント検証でスコープ外確定）
    '気中（2心）': { '1.6': 18, '2.0': 23, '2.6': 32 },
    '気中（3心）': { '1.6': 15, '2.0': 20, '2.6': 27 },
  },
  VVR: {
    '気中（2心）': { '1.6': 18, '2.0': 23, '2.6': 32, '5.5': 33, '8': 42, '14': 59, '22': 77, '38': 110 },
    '気中（3心）': { '1.6': 15, '2.0': 20, '2.6': 27, '5.5': 28, '8': 36, '14': 50, '22': 66, '38': 93 },
  },
  // 資料1-3-3（PDF p881-p882）600V CV ケーブル正本値（JEAC8001-2022）
  // 設計判断D-003: CVD=単心2個より(p882表3)、CVT=単心3個より(p882表3)を採用
  CV: {
    '気中暗渠（単心）': { '2': 31, '3.5': 44, '5.5': 58, '8': 72, '14': 100, '22': 130, '38': 190, '60': 255, '100': 355, '150': 455, '200': 545, '250': 620, '325': 725 },
    '気中暗渠（2心）': { '2': 28, '3.5': 39, '5.5': 52, '8': 65, '14': 91, '22': 120, '38': 170, '60': 225, '100': 310, '150': 400, '200': 485, '250': 560, '325': 660 },
    '気中暗渠（3心）': { '2': 23, '3.5': 33, '5.5': 44, '8': 54, '14': 76, '22': 100, '38': 140, '60': 190, '100': 260, '150': 340, '200': 410, '250': 470, '325': 555 },
    // 管路引入れの単心2〜60mm²は原典の該当欄が「—」
    '管路引入れ（単心）': { '100': 310, '150': 390, '200': 460, '250': 520, '325': 600 },
    '管路引入れ（2心）': { '2': 25, '3.5': 35, '5.5': 45, '8': 55, '14': 75, '22': 98, '38': 130, '60': 170, '100': 225, '150': 285, '200': 330, '250': 370, '325': 425 },
    '管路引入れ（3心）': { '2': 21, '3.5': 29, '5.5': 37, '8': 46, '14': 63, '22': 81, '38': 110, '60': 140, '100': 185, '150': 235, '200': 275, '250': 305, '325': 350 },
    '直埋（単心）': { '2': 38, '3.5': 52, '5.5': 66, '8': 81, '14': 110, '22': 140, '38': 190, '60': 245, '100': 325, '150': 405, '200': 470, '250': 525, '325': 605 },
    '直埋（2心）': { '2': 39, '3.5': 54, '5.5': 69, '8': 85, '14': 115, '22': 150, '38': 205, '60': 260, '100': 345, '150': 435, '200': 505, '250': 570, '325': 650 },
    '直埋（3心）': { '2': 32, '3.5': 45, '5.5': 58, '8': 71, '14': 97, '22': 125, '38': 170, '60': 215, '100': 285, '150': 360, '200': 420, '250': 470, '325': 540 },
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

type InstallationMethod = 'ころがし' | '配管内'
type WireCount = '3本以下' | '4本'

const INSTALLATION_METHODS: InstallationMethod[] = ['ころがし', '配管内']
const WIRE_COUNTS: WireCount[] = ['3本以下', '4本']

function isInsulatedWire(wire: WireTypeId): boolean {
  return wire === 'IV' || wire === 'HIV'
}

function getAmp(
  wire: WireTypeId,
  method: InstallationMethod,
  wireCount: WireCount,
  spec: WireSpec,
): number | undefined {
  let dataCondition: string

  if (isInsulatedWire(wire)) {
    if (method === 'ころがし') {
      dataCondition = spec.sizeUnit === 'mm' ? '気中（単線）' : '気中（より線）'
    } else {
      dataCondition = `管内（${wireCount}）`
    }
  } else if (wire === 'VVF' || wire === 'VVR') {
    if (spec.coreLabel !== '2心' && spec.coreLabel !== '3心') return undefined
    const internalMethod = method === 'ころがし' ? '気中' : '管路引入れ'
    dataCondition = `${internalMethod}（${spec.coreLabel}）`
  } else if (wire === 'CV') {
    if (!spec.coreLabel || spec.coreLabel === '4心') return undefined
    const internalMethod = method === 'ころがし' ? '気中暗渠' : '管路引入れ'
    dataCondition = `${internalMethod}（${spec.coreLabel}）`
  } else {
    dataCondition = method === 'ころがし' ? '気中暗渠' : '管路引入れ'
  }

  return DATA[wire]?.[dataCondition]?.[spec.sizeText]
}

export default function AllowableCurrentPage() {
  const { isPaid, openPaywall } = usePaywall()

  const [wire, setWire] = useState<WireTypeId>('IV')
  const [specId, setSpecId] = useState('')
  const [method, setMethod] = useState<InstallationMethod>('ころがし')
  const [wireCount, setWireCount] = useState<WireCount>('3本以下')

  // ラクダ掲載仕様をすべて選択肢へ表示
  const specs = useMemo(() => getWireSpecsByType(wire), [wire])

  // 選択中の仕様が線種に存在しない場合、最初の仕様に自動切替
  const activeSpec = specs.find((spec) => spec.id === specId) ?? specs[0]

  // 許容電流
  const amp = activeSpec ? getAmp(wire, method, wireCount, activeSpec) : undefined
  const conditionSummary = isInsulatedWire(wire) && method === '配管内'
    ? `${method}・${wireCount}`
    : method

  return (
    <>
      <SiteHeader mode="sub" title="許容電流表" />

      <main className="vd2-main">
        <div className="vd2-input-col">
          <section className="card vd2-section-card">
            <p className="card-title">入力条件</p>

            <div className="form-group">
              <label className="form-label" htmlFor="sel-wire">電線種類</label>
              <select
                className="form-control"
                id="sel-wire"
                value={wire}
                onChange={(e) => setWire(e.target.value as WireTypeId)}
              >
                {WIRE_TYPES.filter((wireType) => wireType.active).map((wireType) => (
                  <option key={wireType.id} value={wireType.id}>{wireType.displayName}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="sel-spec">電線仕様</label>
              <select
                className="form-control"
                id="sel-spec"
                value={activeSpec?.id ?? ''}
                onChange={(e) => setSpecId(e.target.value)}
              >
                {specs.map((spec) => (
                  <option key={spec.id} value={spec.id}>{spec.specDisplay}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">敷設方法</label>
              <div className="chips-group">
                {INSTALLATION_METHODS.map((installationMethod) => {
                  const isActive = method === installationMethod
                  const showLock = !isActive && !isPaid
                  return (
                    <label className="chip-label" key={installationMethod}>
                      <input
                        type="radio"
                        name="installation-method"
                        value={installationMethod}
                        checked={isActive}
                        onChange={() => { if (isPaid) setMethod(installationMethod) }}
                        onClick={(e) => {
                          if (!isPaid && !isActive) { e.preventDefault(); openPaywall() }
                        }}
                      />
                      <span className="chip-text">
                        {showLock && <span aria-hidden="true" style={{ marginRight: '0.25em' }}>🔒</span>}
                        {installationMethod}
                      </span>
                    </label>
                  )
                })}
              </div>
            </div>

            {isInsulatedWire(wire) && method === '配管内' && (
              <div className="form-group">
                <label className="form-label">電流が流れる電線数</label>
                <div className="chips-group">
                  {WIRE_COUNTS.map((count) => {
                    const isActive = wireCount === count
                    const showLock = !isActive && !isPaid
                    return (
                      <label className="chip-label" key={count}>
                        <input
                          type="radio"
                          name="wire-count"
                          value={count}
                          checked={isActive}
                          onChange={() => { if (isPaid) setWireCount(count) }}
                          onClick={(e) => {
                            if (!isPaid && !isActive) { e.preventDefault(); openPaywall() }
                          }}
                        />
                        <span className="chip-text">
                          {showLock && <span aria-hidden="true" style={{ marginRight: '0.25em' }}>🔒</span>}
                          {count}
                        </span>
                      </label>
                    )
                  })}
                </div>
              </div>
            )}
          </section>
        </div>

        <div className="vd2-result-col">
          <section className="result-box">
          <div className="result-label">許容電流</div>
          <div>
            <span className="current-value">{amp !== undefined ? amp : '該当なし'}</span>
            {amp !== undefined && <span className="result-unit">A</span>}
          </div>
          <div className="condition-summary">
            {activeSpec ? `${activeSpec.fullDisplay}　${conditionSummary}` : ''}
          </div>
          {amp === undefined && activeSpec && (
            <div className="validation-warning" style={{ marginTop: '0.75rem' }}>
              選択した電線仕様・敷設方法に対応する許容電流値はありません。
            </div>
          )}
          </section>

          <section className="card mt-2">
            <p className="card-title">この条件の全仕様一覧</p>
            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th className="size-col">電線仕様</th>
                    <th className="amp-col">許容電流 (A)</th>
                  </tr>
                </thead>
                <tbody>
                  {specs.map((spec) => {
                    const specAmp = getAmp(wire, method, wireCount, spec)
                    return (
                      <tr key={spec.id} className={spec.id === activeSpec?.id ? 'highlight' : ''}>
                        <td className="size-col">{spec.specDisplay}</td>
                        <td className="amp-col">{specAmp !== undefined ? `${specAmp} A` : '該当なし'}</td>
                      </tr>
                    )
                  })}
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
                <li><strong>A-6:</strong> IV 14mm²以上を管内4本で使用するケースは実務で稀。注記の追加を検討。</li>
                <li><strong>A-7:</strong> 温度補正未考慮 — 現在のデータは周囲温度30℃基準。高温環境での減少係数表の追加を検討。</li>
              </ul>
            </div>
          </details>
        </div>
      </main>
    </>
  )
}
