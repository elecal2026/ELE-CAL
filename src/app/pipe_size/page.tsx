'use client'

import { useCallback, useMemo, useState } from 'react'
import SiteHeader from '@/components/SiteHeader'
import { usePaywall } from '@/components/PaywallProvider'
import { getCablePhysicalData } from '@/data/cable-physical'
import {
  WIRE_TYPES,
  getWireSpecsByType,
  type WireSpec,
  type WireTypeId,
} from '@/data/wire-master'

interface PipeSizeEntry {
  size: number
  capacity32: number
  capacity48: number
}

interface PipeDefinition {
  name: string
  shortName: string
  correctionType: 'metalOrVe' | 'pfCd' | 'none'
  insulatedWireMode: boolean
  sizes: PipeSizeEntry[]
}

const PIPE_DEFINITIONS: PipeDefinition[] = [
  {
    name: '厚鋼電線管',
    shortName: '厚鋼',
    correctionType: 'metalOrVe',
    insulatedWireMode: true,
    sizes: [
      [16, 67.6, 101.4], [22, 120.5, 180.8], [28, 201.3, 302.0], [36, 342.2, 513.4],
      [42, 460.4, 690.6], [54, 732.9, 1099.3], [70, 1217.5, 1826.2], [82, 1702.3, 2553.5],
      [92, 2206.6, 3309.9], [104, 2845.3, 4267.9],
    ].map(([size, capacity32, capacity48]) => ({ size, capacity32, capacity48 })),
  },
  {
    name: '薄鋼電線管',
    shortName: '薄鋼',
    correctionType: 'metalOrVe',
    insulatedWireMode: true,
    sizes: [
      [19, 63.6, 95.3], [25, 123.9, 185.8], [31, 205.6, 308.4], [39, 306.1, 459.2],
      [51, 569.5, 854.2], [63, 889.8, 1334.7], [75, 1310.1, 1965.2],
    ].map(([size, capacity32, capacity48]) => ({ size, capacity32, capacity48 })),
  },
  {
    name: 'ねじなし電線管',
    shortName: 'ねじなし',
    correctionType: 'metalOrVe',
    insulatedWireMode: true,
    sizes: [
      [19, 70.1, 105.2], [25, 133.0, 199.4], [31, 211.4, 317.1], [39, 313.2, 469.8],
      [51, 579.1, 868.6], [63, 913.9, 1370.8], [75, 1324.7, 1987.1],
    ].map(([size, capacity32, capacity48]) => ({ size, capacity32, capacity48 })),
  },
  {
    name: 'VE（硬質塩化ビニル電線管）',
    shortName: 'VE',
    correctionType: 'metalOrVe',
    insulatedWireMode: true,
    sizes: [
      [14, 49.3, 73.9], [16, 81.4, 122.2], [22, 121.7, 182.5], [28, 197.1, 295.6],
      [36, 307.9, 461.9], [42, 402.1, 603.2], [54, 653.7, 980.6], [70, 1128.2, 1692.3],
      [82, 1490.1, 2235.2],
    ].map(([size, capacity32, capacity48]) => ({ size, capacity32, capacity48 })),
  },
  {
    name: 'PF管・CD管',
    shortName: 'PF・CD',
    correctionType: 'pfCd',
    insulatedWireMode: true,
    sizes: [
      [14, 49.3, 73.9], [16, 64.4, 96.5], [22, 121.7, 182.5], [28, 197.1, 295.6],
      [36, 325.7, 488.6], [42, 443.4, 665.0],
    ].map(([size, capacity32, capacity48]) => ({ size, capacity32, capacity48 })),
  },
  {
    name: 'FEP（波付硬質合成樹脂管）',
    shortName: 'FEP',
    correctionType: 'none',
    insulatedWireMode: false,
    sizes: [
      [20, 110.8, 166.3], [30, 242.6, 363.9], [50, 490.9, 736.3], [65, 962.2, 1443.3],
      [80, 1963.5, 2945.3], [100, 3318.4, 4977.6], [125, 4618.2, 6927.2],
      [150, 5430.9, 8146.4], [200, 10053.1, 15079.7],
    ].map(([size, capacity32, capacity48]) => ({ size, capacity32, capacity48 })),
  },
]

const INSULATED_WIRE_TYPES: WireTypeId[] = ['IV', 'HIV']
const CABLE_WIRE_TYPES: WireTypeId[] = ['VVF', 'VVR', 'CV', 'CVD', 'CVT']
const ALL_WIRE_TYPES: WireTypeId[] = [...INSULATED_WIRE_TYPES, ...CABLE_WIRE_TYPES]

const IV_AREA_BY_SPEC_ID: Record<string, number> = {
  'IV-D-1_6': 8,
  'IV-D-2_0': 10,
  'IV-D-2_6': 20,
  'IV-D-3_2': 28,
  'IV-S-5_5': 20,
  'IV-S-8': 28,
  'IV-S-14': 45,
  'IV-S-22': 66,
  'IV-S-38': 104,
  'IV-S-60': 154,
  'IV-S-100': 227,
  'IV-S-150': 346,
  'IV-S-200': 415,
  'IV-S-250': 531,
}

const IV_CORR20 = new Set(['IV-D-1_6', 'IV-D-2_0'])
const IV_CORR12 = new Set(['IV-D-2_6', 'IV-D-3_2', 'IV-S-5_5', 'IV-S-8'])

interface InsulatedWireRow {
  id: number
  wireTypeId: WireTypeId
  specId: string
  qty: number
}

function firstSpecId(wireTypeId: WireTypeId): string {
  return getWireSpecsByType(wireTypeId)[0]?.id ?? ''
}

function makeInitialInsulatedRow(id: number): InsulatedWireRow {
  return { id, wireTypeId: 'IV', specId: 'IV-D-1_6', qty: 1 }
}

function getSelectedSpec(wireTypeId: WireTypeId, specId: string): WireSpec | undefined {
  const specs = getWireSpecsByType(wireTypeId)
  return specs.find((spec) => spec.id === specId) ?? specs[0]
}

function getCorrectionFactor(specId: string, pipe: PipeDefinition, totalQty: number): number {
  if (totalQty < 2) return 1
  if (pipe.correctionType === 'metalOrVe') {
    if (IV_CORR20.has(specId)) return 2
    if (IV_CORR12.has(specId)) return 1.2
  }
  if (pipe.correctionType === 'pfCd' && IV_CORR20.has(specId)) return 1.3
  return 1
}

function findPipeByArea(pipe: PipeDefinition, totalArea: number, ratio: '32' | '48'): PipeSizeEntry | undefined {
  const key = ratio === '32' ? 'capacity32' : 'capacity48'
  return pipe.sizes.find((entry) => totalArea <= entry[key])
}

function getInnerDiameter(entry: PipeSizeEntry): number {
  return Math.sqrt((entry.capacity32 / 0.32) * 4 / Math.PI)
}

function findPipeByInnerDiameter(pipe: PipeDefinition, requiredInnerDiameter: number): PipeSizeEntry | undefined {
  return pipe.sizes.find((entry) => getInnerDiameter(entry) >= requiredInnerDiameter)
}

function WireTypeAndSpecSelect({
  wireTypeId,
  specId,
  allowedTypes,
  onChange,
}: {
  wireTypeId: WireTypeId
  specId: string
  allowedTypes: WireTypeId[]
  onChange: (wireTypeId: WireTypeId, specId: string) => void
}) {
  const specs = getWireSpecsByType(wireTypeId)

  return (
    <div className="wire-row-grid">
      <div className="form-group" style={{ marginBottom: 0 }}>
        <label className="form-label" style={{ fontSize: '0.78rem' }}>電線種類</label>
        <select
          className="form-control"
          value={wireTypeId}
          onChange={(event) => {
            const nextType = event.target.value as WireTypeId
            onChange(nextType, firstSpecId(nextType))
          }}
        >
          {WIRE_TYPES.filter((type) => allowedTypes.includes(type.id)).map((type) => (
            <option key={type.id} value={type.id}>{type.displayName}</option>
          ))}
        </select>
      </div>
      <div className="form-group" style={{ marginBottom: 0 }}>
        <label className="form-label" style={{ fontSize: '0.78rem' }}>電線仕様</label>
        <select
          className="form-control"
          value={specId}
          onChange={(event) => onChange(wireTypeId, event.target.value)}
        >
          {specs.map((spec) => (
            <option key={spec.id} value={spec.id}>{spec.specDisplay}</option>
          ))}
        </select>
      </div>
    </div>
  )
}

function QuantityControl({ qty, onChange }: { qty: number; onChange: (qty: number) => void }) {
  return (
    <div className="qty-control">
      <button type="button" onClick={() => onChange(Math.max(1, qty - 1))}>−</button>
      <input
        type="number"
        min={1}
        max={99}
        value={qty}
        onChange={(event) => onChange(Math.max(1, Math.min(99, parseInt(event.target.value) || 1)))}
      />
      <button type="button" onClick={() => onChange(Math.min(99, qty + 1))}>＋</button>
    </div>
  )
}

export default function PipeSizePage() {
  const { isPaid, requirePaid } = usePaywall()
  const [rows, setRows] = useState<InsulatedWireRow[]>(() => [makeInitialInsulatedRow(0)])
  const [nextId, setNextId] = useState(1)
  const [checkedPipes, setCheckedPipes] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(PIPE_DEFINITIONS.map((pipe) => [pipe.name, false]))
  )

  const isCableMode = CABLE_WIRE_TYPES.includes(rows[0].wireTypeId)
  const availablePipes = useMemo(
    () => PIPE_DEFINITIONS.filter((pipe) => isCableMode || pipe.insulatedWireMode),
    [isCableMode]
  )
  const selectedPipes = useMemo(
    () => availablePipes.filter((pipe) => checkedPipes[pipe.name]),
    [availablePipes, checkedPipes]
  )

  const addRow = useCallback(() => {
    if (!requirePaid()) return
    setRows((current) => [...current, makeInitialInsulatedRow(nextId)])
    setNextId((current) => current + 1)
  }, [nextId, requirePaid])

  const totalQty = rows.reduce((sum, row) => sum + row.qty, 0)
  const missingInsulatedSpecs = rows
    .map((row) => getSelectedSpec(row.wireTypeId, row.specId))
    .filter((spec): spec is WireSpec => Boolean(spec))
    .filter((spec) => !isCableMode && IV_AREA_BY_SPEC_ID[spec.id] === undefined)

  const insulatedResults = useMemo(() => {
    if (isCableMode || selectedPipes.length === 0 || missingInsulatedSpecs.length > 0) return null
    return selectedPipes.map((pipe) => {
      const totalArea = rows.reduce((sum, row) => {
        const area = IV_AREA_BY_SPEC_ID[row.specId]
        return sum + area * getCorrectionFactor(row.specId, pipe, totalQty) * row.qty
      }, 0)
      return {
        pipe,
        totalArea,
        size32: findPipeByArea(pipe, totalArea, '32'),
        size48: findPipeByArea(pipe, totalArea, '48'),
      }
    })
  }, [isCableMode, missingInsulatedSpecs.length, rows, selectedPipes, totalQty])

  const cableSpec = isCableMode ? getSelectedSpec(rows[0].wireTypeId, rows[0].specId) : undefined
  const cableData = cableSpec ? getCablePhysicalData(cableSpec) : undefined
  const requiredInnerDiameter = cableData ? cableData.od * 1.5 : null
  const cableResults = useMemo(() => {
    if (!isCableMode || requiredInnerDiameter === null || selectedPipes.length === 0) return null
    return selectedPipes.map((pipe) => ({
      pipe,
      selectedSize: findPipeByInnerDiameter(pipe, requiredInnerDiameter),
    }))
  }, [isCableMode, requiredInnerDiameter, selectedPipes])

  return (
    <>
      <SiteHeader mode="sub" title="配管サイズ計算" />

      <main className="vd2-main">
        <div className="vd2-input-col">
          <section className="card vd2-section-card">
            <p className="card-title">{isCableMode ? 'ケーブルの入力' : '電線の入力'}</p>

            {rows.map((row) => (
              <div className="wire-row" key={row.id}>
                <WireTypeAndSpecSelect
                  wireTypeId={row.wireTypeId}
                  specId={row.specId}
                  allowedTypes={ALL_WIRE_TYPES}
                  onChange={(wireTypeId, specId) => setRows((current) => {
                    const updated = { ...row, wireTypeId, specId, qty: 1 }
                    return CABLE_WIRE_TYPES.includes(wireTypeId)
                      ? [updated]
                      : current.map((item) => item.id === row.id ? updated : item)
                  })}
                />
                {!isCableMode && (
                    <div className="wire-row-bottom">
                      <div className="form-group">
                        <label className="form-label" style={{ fontSize: '0.78rem' }}>本数</label>
                        <QuantityControl
                          qty={row.qty}
                          onChange={(qty) => setRows((current) =>
                            current.map((item) => item.id === row.id ? { ...item, qty } : item)
                          )}
                        />
                      </div>
                      {rows.length > 1 && (
                        <button
                          className="btn-remove"
                          type="button"
                          onClick={() => setRows((current) => current.filter((item) => item.id !== row.id))}
                        >
                          削除
                        </button>
                      )}
                    </div>
                )}
              </div>
            ))}
            {!isCableMode && (
                <button className="btn-add" type="button" onClick={addRow}>
                  {!isPaid && <span className="paywall-lock" aria-hidden="true">🔒</span>}
                  ＋ 電線を追加
                </button>
            )}

            <p className="text-sm text-muted" style={{ marginBottom: '1rem' }}>
              {isCableMode
                ? 'ケーブル1本の仕上り外径から、必要な防護管内径を選定します。'
                : '絶縁電線の被覆を含む断面積から、32%・48%基準で配管サイズを選定します。'}
            </p>

            <div className="form-group">
              <label className="form-label">配管種別（複数選択可）</label>
              <div className="chips-group" style={{ marginTop: '0.25rem' }}>
                {availablePipes.map((pipe) => (
                  <label className="chip-label" key={pipe.name}>
                    <input
                      type="checkbox"
                      checked={Boolean(checkedPipes[pipe.name])}
                      onChange={() => setCheckedPipes((current) => ({
                        ...current,
                        [pipe.name]: !current[pipe.name],
                      }))}
                    />
                    <span className="chip-text">{pipe.shortName}</span>
                  </label>
                ))}
              </div>
              {selectedPipes.length === 0 && (
                <div className="validation-error" style={{ marginTop: '0.75rem' }}>
                  配管種別を1つ以上選択してください
                </div>
              )}
            </div>
          </section>
        </div>

        <div className="vd2-result-col">
          <section className="card">
            <p className="card-title">配管サイズ選定結果</p>

            {selectedPipes.length === 0 ? (
              <p className="text-sm text-muted">配管種別を選択すると結果を表示します。</p>
            ) : !isCableMode && missingInsulatedSpecs.length > 0 ? (
              <div>
                <div className="current-value" style={{ fontSize: '2rem' }}>該当なし</div>
                <p className="condition-summary">
                  選択した電線仕様には、絶縁電線の占積計算データがないものが含まれています。
                </p>
                <ul className="text-sm text-muted mt-1">
                  {missingInsulatedSpecs.map((spec) => <li key={spec.id}>{spec.fullDisplay}</li>)}
                </ul>
              </div>
            ) : isCableMode && (!cableData || !cableSpec) ? (
              <div>
                <div className="current-value" style={{ fontSize: '2rem' }}>該当なし</div>
                <p className="condition-summary">
                  選択したケーブル仕様の仕上り外径データがありません。
                </p>
              </div>
            ) : !isCableMode && insulatedResults ? (
              <>
                <div className="table-wrapper">
                  <table className="pipe-table">
                    <thead>
                      <tr>
                        <th>配管種別</th>
                        <th style={{ textAlign: 'center' }}>補正後断面積</th>
                        <th style={{ textAlign: 'center' }}>32%基準</th>
                        <th style={{ textAlign: 'center' }}>48%基準</th>
                      </tr>
                    </thead>
                    <tbody>
                      {insulatedResults.map((result) => (
                        <tr key={result.pipe.name}>
                          <td className="pipe-name">{result.pipe.name}</td>
                          <td style={{ textAlign: 'center' }}>{result.totalArea.toFixed(1)} mm²</td>
                          <td className={result.size32 ? 'size-val' : 'no-size'}>{result.size32?.size ?? '該当なし'}</td>
                          <td className={result.size48 ? 'size-val' : 'no-size'}>{result.size48?.size ?? '該当なし'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="text-sm text-muted mt-1">
                  48%基準は、屈曲が少なく電線の引き入れ・引き替えが容易な場合に限ります。
                </p>
              </>
            ) : isCableMode && cableData && cableSpec && requiredInnerDiameter !== null && cableResults ? (
              <>
                <div className="total-area-box">
                  <span className="label">{cableSpec.fullDisplay}</span>
                  <span>
                    <span className="value">{requiredInnerDiameter.toFixed(1)}</span>
                    <span className="text-sm text-muted"> mm以上</span>
                  </span>
                </div>
                <p className="text-sm text-muted" style={{ marginBottom: '0.75rem' }}>
                  仕上り外径 {cableData.od.toFixed(1)} mm × 1.5
                </p>
                <div className="table-wrapper">
                  <table className="pipe-table">
                    <thead>
                      <tr>
                        <th>配管種別</th>
                        <th style={{ textAlign: 'center' }}>選定サイズ</th>
                        <th style={{ textAlign: 'center' }}>内径目安</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cableResults.map((result) => (
                        <tr key={result.pipe.name}>
                          <td className="pipe-name">{result.pipe.name}</td>
                          <td className={result.selectedSize ? 'size-val' : 'no-size'}>
                            {result.selectedSize?.size ?? '該当なし'}
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            {result.selectedSize ? `${getInnerDiameter(result.selectedSize).toFixed(1)} mm` : '該当なし'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            ) : null}
          </section>

          <div className="disclaimer">
            本ツールは、「内線規程 第14版 JEAC8001-2022」を参考資料の一つとして計算しております。計算結果は目安としてご利用いただき、最終的なご判断は、実際の条件をご確認のうえお客様にてお願いいたします。
          </div>
        </div>
      </main>
    </>
  )
}
