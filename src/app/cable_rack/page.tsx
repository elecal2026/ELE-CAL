'use client'

import { useState, useMemo, useCallback } from 'react'
import SiteHeader from '@/components/SiteHeader'
import { usePaywall } from '@/components/PaywallProvider'
import { getCablePhysicalData } from '@/data/cable-physical'
import {
  WIRE_TYPES,
  getWireSpecsByType,
  type WireSpec,
  type WireTypeId,
} from '@/data/wire-master'

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
  return spec ? getCablePhysicalData(spec) : undefined
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
        <div className="tool-form-field">
          <label className="tool-form-label">電線種類</label>
          <select
            className="form-control" value={row.wireTypeId}
            onChange={e => handleTypeChange(e.target.value as CableRow['wireTypeId'])}
          >
            {WIRE_TYPES.filter(wireType => wireType.active).map(wireType => (
              <option key={wireType.id} value={wireType.id}>{wireType.displayName}</option>
            ))}
          </select>
        </div>

        {!isCustom ? (
          <div className="tool-form-field">
            <label className="tool-form-label">電線仕様</label>
            <select
              className="form-control" value={activeSpec?.id ?? ''}
              onChange={e => onChange({ ...row, specId: e.target.value })}
            >
              {specs.map(spec => (
                <option key={spec.id} value={spec.id}>{spec.specDisplay}</option>
              ))}
            </select>
          </div>
        ) : (
          <div className="tool-form-field">
            <label className="tool-form-label">外径</label>
            <div className="tool-control-with-unit">
              <input
                type="number" className="form-control" value={row.customOd}
                placeholder="例: 25" min="1" step="0.5"
                onChange={e => onChange({ ...row, customOd: e.target.value })}
              />
              <span className="tool-control-unit">mm</span>
            </div>
          </div>
        )}
      </div>

      <div className="wire-row-bottom">
        {isCustom && (
          <div className="tool-form-field">
            <label className="tool-form-label">質量</label>
            <div className="tool-control-with-unit">
              <input
                type="number" className="form-control" value={row.customMass}
                placeholder="例: 1.5" min="0.01" step="0.01"
                onChange={e => onChange({ ...row, customMass: e.target.value })}
              />
              <span className="tool-control-unit">kg/m</span>
            </div>
          </div>
        )}

        <div className="tool-form-field">
          <label className="tool-form-label">本数</label>
          <div className="qty-control">
            <button type="button" onClick={() => { if (row.qty > 1) onChange({ ...row, qty: row.qty - 1 }) }}>−</button>
            <input
              type="number" value={row.qty} min={1} max={99}
              onChange={e => onChange({ ...row, qty: Math.max(1, Math.min(99, parseInt(e.target.value) || 1)) })}
            />
            <button type="button" onClick={() => onChange({ ...row, qty: row.qty + 1 })}>＋</button>
          </div>
        </div>

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
    const totalMass = cableMassPerM
    const boltSize = recommendedWidth !== null
      ? (recommendedWidth > 600 ? 'M12以上（呼び径12mm以上）' : 'M9以上（呼び径9mm以上）')
      : '—'
    const hInterval = material === 'steel' ? '2m以下' : '1.5m以下'

    return { occupyWidth, requiredWidth, recommendedWidth, cableMassPerM, totalMass, boltSize, hInterval, minBendRadius: minBendRadius || null, maxBendFactor, missingDataCount }
  }, [rows, rackWidthUsage, material])

  const hasMissingData = calc.missingDataCount > 0

  return (
    <>
      <SiteHeader mode="sub" title="ラックサイズ選定" />

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
              ※ 数値が小さいほど余裕を大きく見込みます。
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

          <div className="tool-responsive-grid">
            <div className="form-group">
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
            <div className="form-group">
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
        </section>
        </div>

        <div className="vd2-result-col">
        {/* 計算結果 */}
        {(
          <>
            <div className="total-area-box">
              <div>
                <div className="label" style={{ fontSize: '0.78rem' }}>推奨ラック幅</div>
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
                  別の電線仕様を選択してください。
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
                    <span className="label">概算荷重</span>
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
          本ツールは、「内線規程 第14版 JEAC8001-2022」および「公共建築工事標準仕様書（電気設備工事編）令和7年版」を参考資料の一つとして計算しております。計算結果は目安としてご利用いただき、最終的なご判断は、実際の条件をご確認のうえお客様にてお願いいたします。
        </div>
        </div>
      </main>
    </>
  )
}
