'use client'

import { useState, useMemo } from 'react'
import SiteHeader from '@/components/SiteHeader'
import { usePaywall } from '@/components/PaywallProvider'
import {
  INSTALLATION_METHODS,
  WIRE_COUNTS,
  getAllowableCurrentForSpec,
  getConditionSummary,
  isInsulatedWire,
  type InstallationMethod,
  type WireCount,
} from '@/data/allowable-current'
import {
  WIRE_TYPES,
  getWireSpecsByType,
  type WireTypeId,
} from '@/data/wire-master'

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
  const amp = activeSpec ? getAllowableCurrentForSpec(wire, method, wireCount, activeSpec) : undefined
  const conditionSummary = getConditionSummary(method, wireCount, wire)

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
                    const specAmp = getAllowableCurrentForSpec(wire, method, wireCount, spec)
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

          <details className="review-notes" hidden>
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
