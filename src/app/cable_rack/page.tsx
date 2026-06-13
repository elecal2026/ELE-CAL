'use client'

import { useState, useMemo, useCallback } from 'react'
import SiteHeader from '@/components/SiteHeader'
import { usePaywall } from '@/components/PaywallProvider'
import {
  WIRE_TYPES,
  getWireSpecsByType,
  type WireSpec,
  type WireTypeId,
} from '@/data/wire-master'

// ==========================================
// ケーブル外径・質量 代表値テーブル
// キー: [種別]|[芯数]|[サイズ]
// 出典: 内線規程 JEAC8001-2022 資料0-1「各種電線構造表」p835〜860
//       メーカーカタログ代表値で補完
// ==========================================
const CABLE_TABLE: Record<string, { od: number; mass: number }> = {
  // CV 単心 (1C)
  'CV|1|2':    { od: 10,  mass: 0.09 },
  'CV|1|3.5':  { od: 10,  mass: 0.11 },
  'CV|1|5.5':  { od: 12,  mass: 0.14 },
  'CV|1|8':    { od: 13,  mass: 0.18 },
  'CV|1|14':   { od: 16,  mass: 0.26 },
  'CV|1|22':   { od: 18,  mass: 0.37 },
  'CV|1|38':   { od: 20,  mass: 0.60 },
  'CV|1|60':   { od: 23,  mass: 0.90 },
  'CV|1|100':  { od: 28,  mass: 1.45 },
  'CV|1|150':  { od: 33,  mass: 2.10 },
  'CV|1|200':  { od: 37,  mass: 2.73 },
  'CV|1|250':  { od: 41,  mass: 3.40 },
  'CV|1|325':  { od: 46,  mass: 4.40 },
  // CV 2心 (2C)
  'CV|2|2':    { od: 19,  mass: 0.29 },
  'CV|2|3.5':  { od: 21,  mass: 0.37 },
  'CV|2|5.5':  { od: 24,  mass: 0.50 },
  'CV|2|8':    { od: 27,  mass: 0.66 },
  'CV|2|14':   { od: 32,  mass: 0.98 },
  'CV|2|22':   { od: 38,  mass: 1.45 },
  'CV|2|38':   { od: 47,  mass: 2.29 },
  'CV|2|60':   { od: 56,  mass: 3.40 },
  'CV|2|100':  { od: 71,  mass: 5.48 },
  // CV 3心 (3C)
  'CV|3|2':    { od: 22,  mass: 0.38 },
  'CV|3|3.5':  { od: 24,  mass: 0.49 },
  'CV|3|5.5':  { od: 27,  mass: 0.67 },
  'CV|3|8':    { od: 31,  mass: 0.90 },
  'CV|3|14':   { od: 37,  mass: 1.34 },
  'CV|3|22':   { od: 44,  mass: 1.99 },
  'CV|3|38':   { od: 54,  mass: 3.13 },
  'CV|3|60':   { od: 64,  mass: 4.65 },
  'CV|3|100':  { od: 81,  mass: 7.44 },
  // CVT（トリプレックス型 3心より合わせ）
  'CVT|3|8':   { od: 28,  mass: 0.76 },
  'CVT|3|14':  { od: 33,  mass: 1.10 },
  'CVT|3|22':  { od: 39,  mass: 1.61 },
  'CVT|3|38':  { od: 47,  mass: 2.54 },
  'CVT|3|60':  { od: 56,  mass: 3.74 },
  'CVT|3|100': { od: 72,  mass: 5.99 },
  'CVT|3|150': { od: 85,  mass: 8.74 },
  'CVT|3|200': { od: 96,  mass: 11.44 },
  'CVT|3|250': { od: 106, mass: 14.13 },
  'CVT|3|325': { od: 120, mass: 18.32 },
  // VVF フラットケーブル（幅寸法を外径として扱う）
  'VVF|2|1.6': { od: 11,  mass: 0.14 },
  'VVF|2|2.0': { od: 13,  mass: 0.17 },
  'VVF|2|2.6': { od: 16,  mass: 0.24 },
  'VVF|3|1.6': { od: 13,  mass: 0.19 },
  'VVF|3|2.0': { od: 15,  mass: 0.24 },
  'VVF|3|2.6': { od: 18,  mass: 0.33 },
}

const RACK_WIDTHS = [200, 300, 400, 500, 600, 800, 1000]

const RACK_WIDTH_USAGE_RATES = [100, 95, 90, 85, 80, 75, 70]

interface CableRow {
  id: number
  wireTypeId: WireTypeId | 'custom'
  specId: string
  qty: number
  customOd: string
  customMass: string
}

function getCableTableKey(spec: WireSpec): string | undefined {
  if (spec.wireTypeId === 'CV') {
    const core = spec.coreLabel === '単心' ? '1' : spec.coreLabel?.replace('心', '')
    if (core !== '1' && core !== '2' && core !== '3') return undefined
    return `CV|${core}|${spec.sizeText}`
  }

  if (spec.wireTypeId === 'CVT') {
    return `CVT|3|${spec.sizeText}`
  }

  if (spec.wireTypeId === 'VVF' && !spec.variantLabel) {
    const core = spec.coreLabel?.replace('心', '')
    if (core !== '2' && core !== '3') return undefined
    return `VVF|${core}|${spec.sizeText}`
  }

  return undefined
}

function getSelectedSpec(row: CableRow): WireSpec | undefined {
  if (row.wireTypeId === 'custom') return undefined
  const specs = getWireSpecsByType(row.wireTypeId)
  return specs.find(spec => spec.id === row.specId) ?? specs[0]
}

function getCableData(row: CableRow): { od: number; mass: number } | undefined {
  if (row.wireTypeId === 'custom') {
    const od = parseFloat(row.customOd)
    const mass = parseFloat(row.customMass)
    return Number.isFinite(od) && od > 0 && Number.isFinite(mass) && mass > 0
      ? { od, mass }
      : undefined
  }

  const spec = getSelectedSpec(row)
  const key = spec ? getCableTableKey(spec) : undefined
  return key ? CABLE_TABLE[key] : undefined
}

// 最小曲げ半径係数（公共建築工事標準仕様書 2.10.4）
// 低圧単心（CV 1C）: ×8、多心・CVT・VVF: ×6
function getBendFactor(row: CableRow): number {
  const spec = getSelectedSpec(row)
  return spec?.wireTypeId === 'CV' && spec.coreLabel === '単心' ? 8 : 6
}

function makeInitialRow(id: number): CableRow {
  return { id, wireTypeId: 'CV', specId: 'CV-S-22-3', qty: 1, customOd: '', customMass: '' }
}

// ==========================================
// ケーブル行コンポーネント
// ==========================================
function CableRowItem({
  row, canRemove, onChange, onRemove,
}: {
  row: CableRow
  canRemove: boolean
  onChange: (r: CableRow) => void
  onRemove: () => void
}) {
  const isCustom = row.wireTypeId === 'custom'
  const specs = row.wireTypeId === 'custom' ? [] : getWireSpecsByType(row.wireTypeId)
  const activeSpec = getSelectedSpec(row)
  const cableData = getCableData(row)

  const handleTypeChange = (wireTypeId: CableRow['wireTypeId']) => {
    if (wireTypeId === 'custom') {
      onChange({ ...row, wireTypeId: 'custom', specId: '' })
      return
    }
    const firstSpec = getWireSpecsByType(wireTypeId)[0]
    onChange({ ...row, wireTypeId, specId: firstSpec?.id ?? '' })
  }

  return (
    <div className="wire-row">
      <div className="wire-row-grid">
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label" style={{ fontSize: '0.78rem' }}>電線種類</label>
          <select
            className="form-control" value={row.wireTypeId}
            onChange={e => handleTypeChange(e.target.value as CableRow['wireTypeId'])}
            style={{ fontSize: '0.9rem', padding: '0.5rem 2rem 0.5rem 0.6rem' }}
          >
            {WIRE_TYPES.filter(wireType => wireType.active).map(wireType => (
              <option key={wireType.id} value={wireType.id}>{wireType.displayName}</option>
            ))}
            <option value="custom">手入力</option>
          </select>
        </div>

        {!isCustom ? (
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ fontSize: '0.78rem' }}>電線仕様</label>
            <select
              className="form-control" value={activeSpec?.id ?? ''}
              onChange={e => onChange({ ...row, specId: e.target.value })}
              style={{ fontSize: '0.9rem', padding: '0.5rem 2rem 0.5rem 0.6rem' }}
            >
              {specs.map(spec => (
                <option key={spec.id} value={spec.id}>{spec.specDisplay}</option>
              ))}
            </select>
          </div>
        ) : (
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ fontSize: '0.78rem' }}>外径 (mm)</label>
            <input
              type="number" className="form-control" value={row.customOd}
              placeholder="例: 25" min="1" step="0.5"
              onChange={e => onChange({ ...row, customOd: e.target.value })}
              style={{ fontSize: '0.9rem', padding: '0.5rem 0.6rem' }}
            />
          </div>
        )}
      </div>

      <div className="wire-row-bottom">
        {isCustom && (
          <div className="form-group">
            <label className="form-label" style={{ fontSize: '0.78rem' }}>質量 (kg/m)</label>
            <input
              type="number" className="form-control" value={row.customMass}
              placeholder="例: 1.5" min="0.01" step="0.01"
              onChange={e => onChange({ ...row, customMass: e.target.value })}
              style={{ fontSize: '0.9rem', padding: '0.5rem 0.6rem' }}
            />
          </div>
        )}

        <div className="form-group">
          <label className="form-label" style={{ fontSize: '0.78rem' }}>本数</label>
          <div className="qty-control">
            <button type="button" onClick={() => { if (row.qty > 1) onChange({ ...row, qty: row.qty - 1 }) }}>−</button>
            <input
              type="number" value={row.qty} min={1} max={99}
              onChange={e => onChange({ ...row, qty: Math.max(1, Math.min(99, parseInt(e.target.value) || 1)) })}
            />
            <button type="button" onClick={() => onChange({ ...row, qty: row.qty + 1 })}>＋</button>
          </div>
        </div>

        {!isCustom && (
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', alignSelf: 'flex-end', paddingBottom: '4px', whiteSpace: 'nowrap' }}>
            {cableData ? `φ${cableData.od}mm / ${cableData.mass} kg/m` : '外径・質量: 該当なし'}
          </div>
        )}

        {canRemove && (
          <button className="btn-remove" onClick={onRemove}>削除</button>
        )}
      </div>
    </div>
  )
}

// ==========================================
// メインページ
// ==========================================
export default function CableRackPage() {
  const { isPaid, requirePaid } = usePaywall()
  const [rows, setRows] = useState<CableRow[]>([makeInitialRow(0)])
  const [nextId, setNextId] = useState(1)

  const [material, setMaterial] = useState<'steel' | 'aluminum' | 'other'>('steel')
  const [direction, setDirection] = useState<'horizontal' | 'vertical'>('horizontal')
  const [outdoor, setOutdoor] = useState(false)
  const [hasCover, setHasCover] = useState(false)
  const [rackWidthUsage, setRackWidthUsage] = useState(90)
  const [rackMassInput, setRackMassInput] = useState('')
  const [coverMassInput, setCoverMassInput] = useState('')

  const addRow = useCallback(() => {
    if (!requirePaid()) return
    setRows(prev => [...prev, makeInitialRow(nextId)])
    setNextId(n => n + 1)
  }, [nextId, requirePaid])

  const updateRow = useCallback((id: number, r: CableRow) => {
    setRows(prev => prev.map(x => x.id === id ? r : x))
  }, [])

  const removeRow = useCallback((id: number) => {
    setRows(prev => prev.filter(x => x.id !== id))
  }, [])

  const calc = useMemo(() => {
    let occupyWidth = 0
    let cableMassPerM = 0
    let minBendRadius = 0
    let maxBendFactor = 6
    let missingDataCount = 0

    for (const row of rows) {
      const cableData = getCableData(row)
      if (!cableData) {
        missingDataCount += 1
        continue
      }
      occupyWidth += cableData.od * row.qty
      cableMassPerM += cableData.mass * row.qty
      const bendFactor = getBendFactor(row)
      const bendRadius = cableData.od * bendFactor
      if (bendRadius > minBendRadius) {
        minBendRadius = bendRadius
        maxBendFactor = bendFactor
      }
    }

    const requiredWidth = occupyWidth / (rackWidthUsage / 100)
    const recommendedWidth = RACK_WIDTHS.find(w => occupyWidth / w * 100 <= rackWidthUsage + 1e-9) ?? null
    const rackMassVal = parseFloat(rackMassInput) || 0
    const coverMassVal = parseFloat(coverMassInput) || 0
    const totalMass = cableMassPerM + rackMassVal + coverMassVal
    const boltSize = recommendedWidth !== null
      ? (recommendedWidth > 600 ? 'M12以上（呼び径12mm以上）' : 'M9以上（呼び径9mm以上）')
      : '—'
    const hInterval = material === 'steel' ? '2m以下' : '1.5m以下'

    return { occupyWidth, requiredWidth, recommendedWidth, cableMassPerM, totalMass, boltSize, hInterval, minBendRadius: minBendRadius || null, maxBendFactor, missingDataCount }
  }, [rows, rackWidthUsage, material, rackMassInput, coverMassInput])

  const hasMissingData = calc.missingDataCount > 0

  return (
    <>
      <SiteHeader mode="sub" title="ラック選定" />

      <main className="vd2-main">
        <div className="vd2-input-col">
        {/* ケーブル入力 */}
        <section className="card">
          <p className="card-title">ケーブルの入力</p>
          {rows.map(row => (
            <CableRowItem
              key={row.id} row={row}
              canRemove={rows.length > 1}
              onChange={r => updateRow(row.id, r)}
              onRemove={() => removeRow(row.id)}
            />
          ))}
          <button className="btn-add" onClick={addRow}>
            {!isPaid && <span className="paywall-lock" aria-hidden="true">🔒</span>}
            ＋ ケーブルを追加
          </button>
        </section>

        {/* ラック設定 */}
        <section className="card">
          <p className="card-title">ラック設定</p>

          <div className="form-group">
            <label className="form-label">ラック幅使用率</label>
            <div className="chips-group">
              {RACK_WIDTH_USAGE_RATES.map(rate => (
                <label className="chip-label" key={rate}>
                  <input type="radio" name="rackWidthUsage" checked={rackWidthUsage === rate} onChange={() => setRackWidthUsage(rate)} />
                  <span className="chip-text" style={{ padding: '0.4rem 0.75rem', fontSize: '0.85rem' }}>{rate}%</span>
                </label>
              ))}
            </div>
            <p className="text-sm text-muted mt-1">
              ※ 規程による指定値ではありません。施工時の並べやすさ・配線余裕を考慮して設定するELE-CAL独自設定です。数値が小さいほど余裕を大きく見込みます。
            </p>
          </div>

          <div className="form-group">
            <label className="form-label">ラック材質</label>
            <div className="chips-group">
              {[{ val: 'steel', label: '鋼製' }, { val: 'aluminum', label: 'アルミ' }, { val: 'other', label: 'その他' }].map(m => (
                <label className="chip-label" key={m.val}>
                  <input type="radio" name="material" checked={material === m.val} onChange={() => setMaterial(m.val as typeof material)} />
                  <span className="chip-text" style={{ padding: '0.4rem 0.75rem', fontSize: '0.85rem' }}>{m.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">敷設方向</label>
            <div className="chips-group">
              {[{ val: 'horizontal', label: '水平' }, { val: 'vertical', label: '垂直' }].map(d => (
                <label className="chip-label" key={d.val}>
                  <input type="radio" name="direction" checked={direction === d.val} onChange={() => setDirection(d.val as typeof direction)} />
                  <span className="chip-text" style={{ padding: '0.4rem 0.75rem', fontSize: '0.85rem' }}>{d.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <div className="form-group" style={{ flex: 1, minWidth: 120 }}>
              <label className="form-label">設置場所</label>
              <div className="chips-group">
                {[{ val: false, label: '屋内' }, { val: true, label: '屋外' }].map(o => (
                  <label className="chip-label" key={String(o.val)}>
                    <input type="radio" name="outdoor" checked={outdoor === o.val} onChange={() => setOutdoor(o.val)} />
                    <span className="chip-text" style={{ padding: '0.4rem 0.75rem', fontSize: '0.85rem' }}>{o.label}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="form-group" style={{ flex: 1, minWidth: 120 }}>
              <label className="form-label">カバー</label>
              <div className="chips-group">
                {[{ val: false, label: 'なし' }, { val: true, label: 'あり' }].map(c => (
                  <label className="chip-label" key={String(c.val)}>
                    <input type="radio" name="hasCover" checked={hasCover === c.val} onChange={() => setHasCover(c.val)} />
                    <span className="chip-text" style={{ padding: '0.4rem 0.75rem', fontSize: '0.85rem' }}>{c.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <details style={{ marginTop: '0.5rem' }}>
            <summary style={{ fontSize: '0.82rem', color: 'var(--text-muted)', cursor: 'pointer', userSelect: 'none' }}>
              追加荷重の入力（任意）— ラック本体・カバーの質量
            </summary>
            <div style={{ paddingTop: '0.75rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <div className="form-group" style={{ flex: 1, minWidth: 120 }}>
                <label className="form-label" style={{ fontSize: '0.78rem' }}>ラック本体 (kg/m)</label>
                <input
                  type="number" className="form-control" value={rackMassInput}
                  placeholder="例: 5.0" min="0" step="0.1"
                  onChange={e => setRackMassInput(e.target.value)}
                  style={{ fontSize: '0.9rem', padding: '0.5rem 0.6rem' }}
                />
              </div>
              {hasCover && (
                <div className="form-group" style={{ flex: 1, minWidth: 120 }}>
                  <label className="form-label" style={{ fontSize: '0.78rem' }}>カバー (kg/m)</label>
                  <input
                    type="number" className="form-control" value={coverMassInput}
                    placeholder="例: 2.0" min="0" step="0.1"
                    onChange={e => setCoverMassInput(e.target.value)}
                    style={{ fontSize: '0.9rem', padding: '0.5rem 0.6rem' }}
                  />
                </div>
              )}
            </div>
          </details>
        </section>
        </div>

        <div className="vd2-result-col">
        {/* 計算結果 */}
        {(
          <>
            <div className="total-area-box">
              <div>
                <div className="label" style={{ fontSize: '0.78rem' }}>推奨ラック幅</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  {hasMissingData
                    ? `外径・質量データがない電線仕様が${calc.missingDataCount}件あります。`
                    : `占有幅 ${calc.occupyWidth.toFixed(0)}mm ÷ 使用率${rackWidthUsage}% = 必要幅 ${calc.requiredWidth.toFixed(0)}mm`}
                </div>
              </div>
              <div>
                {hasMissingData ? (
                  <span style={{ color: 'var(--accent)', fontSize: '1rem', fontWeight: 700 }}>該当なし</span>
                ) : calc.recommendedWidth !== null ? (
                  <>
                    <span className="value">{calc.recommendedWidth}</span>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginLeft: '4px' }}>mm</span>
                  </>
                ) : (
                  <span style={{ color: 'var(--accent)', fontSize: '1rem', fontWeight: 700 }}>
                    1000mm超 — 分割を検討
                  </span>
                )}
              </div>
            </div>

            {hasMissingData ? (
              <section className="card">
                <p className="card-title">選定結果</p>
                <div className="validation-warning">
                  選択した電線仕様の外径・質量データが不足しているため、ラック幅・概算荷重は該当なしです。
                  別の電線仕様を選択するか、手入力で外径・質量を指定してください。
                </div>
              </section>
            ) : (
              <section className="card">
              <p className="card-title">選定結果</p>

              <div className="form-group">
                <label className="form-label" style={{ fontSize: '0.78rem' }}>ラック幅候補</label>
                <div className="table-wrapper">
                  <table className="pipe-table">
                    <thead>
                      <tr>
                        <th>ラック幅 (mm)</th>
                        <th style={{ textAlign: 'center' }}>判定</th>
                        <th style={{ textAlign: 'center' }}>実占有率 (%)</th>
                        <th style={{ textAlign: 'center' }}>空き幅 (mm)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {RACK_WIDTHS.map(w => {
                        const actualUsageRate = calc.occupyWidth / w * 100
                        const ok = actualUsageRate <= rackWidthUsage + 1e-9
                        const isRecommend = w === calc.recommendedWidth
                        return (
                          <tr key={w} style={isRecommend ? { background: 'rgba(var(--seg-active-rgb),0.06)' } : {}}>
                            <td className="pipe-name" style={isRecommend ? { fontWeight: 700, color: 'var(--seg-active)' } : {}}>
                              {w}{isRecommend ? ' ← 推奨' : ''}
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              <span className={`badge ${ok ? 'badge-ok' : 'badge-ng'}`}>{ok ? 'OK' : 'NG'}</span>
                            </td>
                            <td style={{ textAlign: 'center', fontSize: '0.85rem', color: ok ? 'var(--text-secondary)' : 'var(--danger)' }}>
                              {actualUsageRate.toFixed(1)}
                            </td>
                            <td style={{ textAlign: 'center', fontSize: '0.85rem', color: w >= calc.occupyWidth ? 'var(--text-secondary)' : 'var(--danger)' }}>
                              {(w - calc.occupyWidth).toFixed(0)}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="form-group mt-2">
                <label className="form-label" style={{ fontSize: '0.78rem' }}>
                  施工基準（公共建築工事標準仕様書 電気設備工事編 令和7年版 2.10.1 / 2.10.4）
                </label>
                <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)' }}>
                  <div className="result-row" style={{ padding: '0.6rem 0.75rem' }}>
                    <span className="label">水平支持間隔</span>
                    <span className="value">{calc.hInterval}</span>
                  </div>
                  {direction === 'vertical' && (
                    <div className="result-row" style={{ padding: '0.6rem 0.75rem' }}>
                      <span className="label">垂直支持間隔</span>
                      <span className="value">3m以下</span>
                    </div>
                  )}
                  <div className="result-row" style={{ padding: '0.6rem 0.75rem' }}>
                    <span className="label">つりボルト径（目安）</span>
                    <span className="value">{calc.boltSize}</span>
                  </div>
                  {calc.minBendRadius !== null && (
                    <div className="result-row" style={{ padding: '0.6rem 0.75rem' }}>
                      <span className="label">最小曲げ半径（最大値）</span>
                      <span className="value">{calc.minBendRadius.toFixed(0)} mm（外径×{calc.maxBendFactor}）</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="form-group mt-2">
                <label className="form-label" style={{ fontSize: '0.78rem' }}>概算荷重</label>
                <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)' }}>
                  <div className="result-row" style={{ padding: '0.6rem 0.75rem' }}>
                    <span className="label">ケーブル重量</span>
                    <span className="value">{calc.cableMassPerM.toFixed(2)} kg/m</span>
                  </div>
                  <div className="result-row" style={{ padding: '0.6rem 0.75rem' }}>
                    <span className="label">概算荷重（追加荷重込み）</span>
                    <span className="value">{calc.totalMass.toFixed(2)} kg/m</span>
                  </div>
                </div>
                <p className="text-sm text-muted mt-1">
                  ラック許容荷重はメーカーカタログで最終確認してください。
                </p>
              </div>

              {(outdoor || hasCover || material === 'aluminum' || direction === 'vertical') && (
                <div className="validation-warning mt-2">
                  <strong>施工注意事項（公共建築工事標準仕様書 2.10.1）</strong>
                  {outdoor && <div>・屋外カバーは飛散防止のため止め金具・バンドで確実に取り付けること</div>}
                  {material === 'aluminum' && <div>・アルミラックは支持物との異種金属接触腐食を起こさないよう取り付けること</div>}
                  {hasCover && <div>・本体相互間・自在継手・エキスパンション継手はボンディングを施し電気的に接続すること</div>}
                  {direction === 'vertical' && <div>・垂直敷設は特定の子げたに荷重が集中しないよう固定すること（2.10.4）</div>}
                </div>
              )}
              <p className="text-sm text-muted mt-1">
                電力ケーブルは原則として積重ね不可。1段並べで選定してください（2.10.4）。
              </p>
              </section>
            )}
          </>
        )}

        <div className="disclaimer">
          <strong>⚠ 注意事項</strong>
          本ツールは、内線規程及び公共建築工事標準仕様書（電気設備工事編）令和7年版等を参考に、ケーブルラック幅・概算荷重・支持間隔の目安を算出する簡易ツールです。
          ラック幅使用率は規程による指定値ではなく、施工時の並べやすさ・配線余裕を考慮するためのELE-CAL独自設定です。
          ケーブル外径・質量は内線規程 JEAC8001-2022 資料0-1を参考にした代表値です。メーカー・型番・シース仕様により差があります。
          ラック本体・支持金具・アンカーの許容荷重は、使用メーカーのカタログ及び設計図書で最終確認してください。
          本ツールの計算結果で生じた損害について、作成者は一切の責任を負いません。
        </div>
        </div>
      </main>
    </>
  )
}
