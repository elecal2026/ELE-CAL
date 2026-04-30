'use client'

import Link from 'next/link'
import { useState, useMemo, useCallback, useEffect } from 'react'
import SiteHeader from '@/components/SiteHeader'
import { usePaywall } from '@/components/PaywallProvider'

// ==========================================
// 電線断面積テーブル（仕上り断面積 mm²）
// ==========================================
const WIRE_AREA: Record<string, number> = {
  'IV|1.6㎜': 8.1, 'IV|2.0㎜': 10.2, 'IV|2.6㎜': 16.7, 'IV|3.2㎜': 24.7,
  'IV|1.25': 7.1, 'IV|2': 9.1, 'IV|3.5': 12.6, 'IV|5.5': 19.7,
  'IV|8': 28.3, 'IV|14': 45.4, 'IV|22': 66.5, 'IV|38': 103.9,
  'IV|60': 154.0, 'IV|100': 227.0, 'IV|150': 346.4, 'IV|200': 415.5,
  'IV|250': 531.0, 'IV|325': 660.6,
  'VVF|1.6㎜|2C': 58.3, 'VVF|1.6㎜|3C': 80.6, 'VVF|1.6㎜|4C': 99.2,
  'VVF|2.0㎜|2C': 69.3, 'VVF|2.0㎜|3C': 92.4, 'VVF|2.0㎜|4C': 115.5,
  'VVF|2.6㎜|2C': 95.0, 'VVF|2.6㎜|3C': 129.2,
  'CV|2|1C': 32.2, 'CV|2|2C': 86.6, 'CV|2|3C': 95.1, 'CV|2|4C': 113.1,
  'CV|3.5|1C': 38.5, 'CV|3.5|2C': 103.9, 'CV|3.5|3C': 122.8, 'CV|3.5|4C': 143.2,
  'CV|5.5|1C': 50.3, 'CV|5.5|2C': 143.2, 'CV|5.5|3C': 165.2, 'CV|5.5|4C': 201.1,
  'CV|8|1C': 58.1, 'CV|8|2C': 176.8, 'CV|8|3C': 201.1, 'CV|8|4C': 227.0,
  'CV|14|1C': 69.4, 'CV|14|2C': 213.9, 'CV|14|3C': 240.6, 'CV|14|4C': 283.6,
  'CV|22|1C': 95.1, 'CV|22|2C': 298.7, 'CV|22|3C': 346.4, 'CV|22|4C': 415.5,
  'CV|38|1C': 132.8, 'CV|38|2C': 452.4, 'CV|38|3C': 490.9, 'CV|38|4C': 615.8,
  'CV|60|1C': 188.7, 'CV|60|2C': 660.6, 'CV|60|3C': 754.8, 'CV|60|4C': 962.2,
  'CV|100|1C': 283.6, 'CV|100|2C': 1075.3, 'CV|100|3C': 1256.7, 'CV|100|4C': 1520.6,
  'CV|150|1C': 380.2, 'CV|150|2C': 1452.3, 'CV|150|3C': 1662.0, 'CV|150|4C': 2042.9,
  'CV|200|1C': 531.0, 'CV|200|2C': 1963.5, 'CV|200|3C': 2290.3, 'CV|200|4C': 2827.5,
  'CV|250|1C': 615.8, 'CV|250|2C': 2290.3, 'CV|250|3C': 2642.1, 'CV|250|4C': 3318.4,
  'CV|325|1C': 754.8, 'CV|325|2C': 2827.5, 'CV|325|3C': 3318.4, 'CV|325|4C': 4071.6,
  'CV-D|14': 283.6, 'CV-D|22': 380.2, 'CV-D|38': 531.0, 'CV-D|60': 754.8,
  'CV-D|100': 1134.2, 'CV-D|150': 1520.6, 'CV-D|200': 2042.9, 'CV-D|250': 2375.9, 'CV-D|325': 2922.5,
  'CV-T|8': 283.6, 'CV-T|14': 346.4, 'CV-T|22': 452.4, 'CV-T|38': 615.8,
  'CV-T|60': 855.3, 'CV-T|100': 1320.3, 'CV-T|150': 1735.0, 'CV-T|200': 2375.9,
  'CV-T|250': 2827.5, 'CV-T|325': 3421.2,
  'CV-Q|14': 415.5, 'CV-Q|22': 572.6, 'CV-Q|38': 754.8, 'CV-Q|60': 1075.3,
  'CV-Q|100': 1662.0, 'CV-Q|150': 2206.2, 'CV-Q|200': 2922.5, 'CV-Q|250': 3525.7, 'CV-Q|325': 4300.9,
  '6kV CVT|22': 1385.5, '6kV CVT|38': 1662.0, '6kV CVT|60': 1963.5,
  '6kV CVT|100': 2551.8, '6kV CVT|150': 3318.4, '6kV CVT|200': 4071.6,
  '6kV CVT|250': 4536.5, '6kV CVT|325': 5674.6,
}

const WIRE_TYPES = ['IV', 'VVF', 'CV', 'CV-D', 'CV-T', 'CV-Q', '6kV CVT'] as const

const WIRE_OPTIONS: Record<string, { sizes: string[]; cores: string[] | null }> = {
  'IV':       { sizes: ['1.6㎜', '2.0㎜', '2.6㎜', '3.2㎜', '1.25', '2', '3.5', '5.5', '8', '14', '22', '38', '60', '100', '150', '200', '250', '325'], cores: null },
  'VVF':      { sizes: ['1.6㎜', '2.0㎜', '2.6㎜'], cores: ['2C', '3C', '4C'] },
  'CV':       { sizes: ['2', '3.5', '5.5', '8', '14', '22', '38', '60', '100', '150', '200', '250', '325'], cores: ['1C', '2C', '3C', '4C'] },
  'CV-D':     { sizes: ['14', '22', '38', '60', '100', '150', '200', '250', '325'], cores: null },
  'CV-T':     { sizes: ['8', '14', '22', '38', '60', '100', '150', '200', '250', '325'], cores: null },
  'CV-Q':     { sizes: ['14', '22', '38', '60', '100', '150', '200', '250', '325'], cores: null },
  '6kV CVT':  { sizes: ['22', '38', '60', '100', '150', '200', '250', '325'], cores: null },
}

interface PipeEntry { min: number; max: number; size: number }

const PIPE_RANGE: Record<string, Record<string, PipeEntry[]>> = {
  'CP（厚鋼電線管）': {
    '32': [{ min: 0, max: 63.6, size: 19 }, { min: 63.6, max: 123.9, size: 25 }, { min: 123.9, max: 205.6, size: 31 }, { min: 205.6, max: 306.1, size: 39 }, { min: 306.1, max: 569.5, size: 51 }, { min: 569.5, max: 889.8, size: 63 }, { min: 889.8, max: 1310.1, size: 75 }],
    '48': [{ min: 0, max: 95.3, size: 19 }, { min: 95.3, max: 185.8, size: 25 }, { min: 185.8, max: 308.4, size: 31 }, { min: 308.4, max: 459.2, size: 39 }, { min: 459.2, max: 854.2, size: 51 }, { min: 854.2, max: 1334.7, size: 63 }, { min: 1334.7, max: 1965.2, size: 75 }],
  },
  'EP（薄鋼電線管）': {
    '32': [{ min: 0, max: 70.1, size: 19 }, { min: 70.1, max: 133.0, size: 25 }, { min: 133.0, max: 211.4, size: 31 }, { min: 211.4, max: 313.2, size: 39 }, { min: 313.2, max: 579.1, size: 51 }, { min: 579.1, max: 913.9, size: 63 }, { min: 913.9, max: 1324.7, size: 75 }],
    '48': [{ min: 0, max: 105.2, size: 19 }, { min: 105.2, max: 199.4, size: 25 }, { min: 199.4, max: 317.1, size: 31 }, { min: 317.1, max: 469.8, size: 39 }, { min: 469.8, max: 868.6, size: 51 }, { min: 868.6, max: 1370.8, size: 63 }, { min: 1370.8, max: 1987.1, size: 75 }],
  },
  'GP / PE（ねじなし・PF管相当）': {
    '32': [{ min: 0, max: 67.6, size: 16 }, { min: 67.6, max: 120.5, size: 22 }, { min: 120.5, max: 201.3, size: 28 }, { min: 201.3, max: 342.2, size: 36 }, { min: 342.2, max: 460.4, size: 42 }, { min: 460.4, max: 732.9, size: 54 }, { min: 732.9, max: 1217.5, size: 70 }, { min: 1217.5, max: 1702.3, size: 82 }, { min: 1702.3, max: 2206.6, size: 92 }, { min: 2206.6, max: 2845.3, size: 104 }],
    '48': [{ min: 0, max: 101.4, size: 16 }, { min: 101.4, max: 180.8, size: 22 }, { min: 180.8, max: 302.0, size: 28 }, { min: 302.0, max: 513.4, size: 36 }, { min: 513.4, max: 690.6, size: 42 }, { min: 690.6, max: 1099.3, size: 54 }, { min: 1099.3, max: 1826.2, size: 70 }, { min: 1826.2, max: 2553.5, size: 82 }, { min: 2553.5, max: 3309.9, size: 92 }, { min: 3309.9, max: 4267.9, size: 104 }],
  },
  'VE（硬質塩化ビニル電線管）': {
    '32': [{ min: 0, max: 49.3, size: 14 }, { min: 49.3, max: 81.4, size: 16 }, { min: 81.4, max: 121.7, size: 22 }, { min: 121.7, max: 197.1, size: 28 }, { min: 197.1, max: 307.9, size: 36 }, { min: 307.9, max: 402.1, size: 42 }, { min: 402.1, max: 653.7, size: 54 }, { min: 653.7, max: 1128.2, size: 70 }, { min: 1128.2, max: 1490.1, size: 82 }],
    '48': [{ min: 0, max: 73.9, size: 14 }, { min: 73.9, max: 122.2, size: 16 }, { min: 122.2, max: 182.5, size: 22 }, { min: 182.5, max: 295.6, size: 28 }, { min: 295.6, max: 461.9, size: 36 }, { min: 461.9, max: 603.2, size: 42 }, { min: 603.2, max: 980.6, size: 54 }, { min: 980.6, max: 1692.3, size: 70 }, { min: 1692.3, max: 2235.2, size: 82 }],
  },
  'CD / PF-S（CD管・PF管単層）': {
    '32': [{ min: 0, max: 49.3, size: 14 }, { min: 49.3, max: 64.4, size: 16 }, { min: 64.4, max: 121.7, size: 22 }, { min: 121.7, max: 197.1, size: 28 }, { min: 197.1, max: 325.7, size: 36 }, { min: 325.7, max: 443.4, size: 42 }],
    '48': [{ min: 0, max: 73.9, size: 14 }, { min: 73.9, max: 96.5, size: 16 }, { min: 96.5, max: 182.5, size: 22 }, { min: 182.5, max: 295.6, size: 28 }, { min: 295.6, max: 488.6, size: 36 }, { min: 488.6, max: 665.0, size: 42 }],
  },
  'PF-D（PF管複層）': {
    '32': [{ min: 0, max: 49.3, size: 14 }, { min: 49.3, max: 64.4, size: 16 }, { min: 64.4, max: 121.7, size: 22 }, { min: 121.7, max: 197.1, size: 28 }, { min: 197.1, max: 325.7, size: 36 }, { min: 325.7, max: 443.4, size: 42 }],
    '48': [{ min: 0, max: 73.9, size: 14 }, { min: 73.9, max: 96.5, size: 16 }, { min: 96.5, max: 182.5, size: 22 }, { min: 182.5, max: 295.6, size: 28 }, { min: 295.6, max: 488.6, size: 36 }, { min: 488.6, max: 665.0, size: 42 }],
  },
  'FEP（波付硬質合成樹脂管）': {
    '32': [{ min: 0, max: 110.8, size: 20 }, { min: 110.8, max: 242.6, size: 30 }, { min: 242.6, max: 490.9, size: 50 }, { min: 490.9, max: 962.2, size: 65 }, { min: 962.2, max: 1963.5, size: 80 }, { min: 1963.5, max: 3318.4, size: 100 }, { min: 3318.4, max: 4618.2, size: 125 }, { min: 4618.2, max: 5430.9, size: 150 }, { min: 5430.9, max: 10053.1, size: 200 }],
    '48': [{ min: 0, max: 166.3, size: 20 }, { min: 166.3, max: 363.9, size: 30 }, { min: 363.9, max: 736.3, size: 50 }, { min: 736.3, max: 1443.3, size: 65 }, { min: 1443.3, max: 2945.3, size: 80 }, { min: 2945.3, max: 4977.6, size: 100 }, { min: 4977.6, max: 6927.2, size: 125 }, { min: 6927.2, max: 8146.4, size: 150 }, { min: 8146.4, max: 15079.7, size: 200 }],
  },
}

const PIPE_NAMES = Object.keys(PIPE_RANGE)

const METAL_PIPES = new Set(['CP（厚鋼電線管）', 'EP（薄鋼電線管）', 'GP / PE（ねじなし・PF管相当）'])
const CD_PIPES = new Set(['CD / PF-S（CD管・PF管単層）'])
const IV_CORR20 = new Set(['1.6㎜', '2.0㎜', '1.25', '2', '3.5'])
const IV_CORR12 = new Set(['2.6㎜', '3.2㎜', '5.5', '8'])

// ==========================================
// 型定義
// ==========================================
interface WireRow {
  id: number
  wireType: string
  size: string
  core: string
  qty: number
}

function makeInitialRow(id: number): WireRow {
  const wireType = 'IV'
  return { id, wireType, size: WIRE_OPTIONS[wireType].sizes[0], core: '', qty: 1 }
}

// ==========================================
// 計算関数（純粋関数）
// ==========================================
function getArea(wireType: string, size: string, core: string, qty: number, pipeName: string): number {
  let key: string
  if (wireType === 'IV') {
    key = `IV|${size}`
  } else if (wireType === 'VVF') {
    key = `VVF|${size}|${core}`
  } else if (wireType === 'CV') {
    key = `CV|${size}|${core}`
  } else {
    key = `${wireType}|${size}`
  }

  const baseArea = WIRE_AREA[key]
  if (baseArea === undefined) return 0

  let corrFactor = 1.0
  if (wireType === 'IV' && qty >= 2) {
    if (METAL_PIPES.has(pipeName)) {
      if (IV_CORR20.has(size)) corrFactor = 2.0
      else if (IV_CORR12.has(size)) corrFactor = 1.2
    } else if (CD_PIPES.has(pipeName)) {
      if (IV_CORR20.has(size)) corrFactor = 1.3
    }
  }
  return baseArea * corrFactor * qty
}

function findPipeSize(rangeArr: PipeEntry[], totalArea: number): number | null {
  if (totalArea === 0) return rangeArr[0].size
  for (const entry of rangeArr) {
    if (totalArea > entry.min && totalArea <= entry.max) return entry.size
  }
  return null
}

// ==========================================
// 電線行コンポーネント
// ==========================================
function WireRowItem({
  row,
  canRemove,
  onChange,
  onRemove,
  warning,
}: {
  row: WireRow
  canRemove: boolean
  onChange: (updated: WireRow) => void
  onRemove: () => void
  warning?: string
}) {
  const opt = WIRE_OPTIONS[row.wireType]
  const hasCores = opt.cores !== null

  const availableCores = useMemo(() => {
    if (!hasCores) return null
    if (row.wireType === 'VVF' && row.size === '2.6㎜') {
      return opt.cores!.filter(c => c !== '4C')
    }
    return opt.cores
  }, [row.wireType, row.size, hasCores, opt.cores])

  const handleTypeChange = (newType: string) => {
    const newOpt = WIRE_OPTIONS[newType]
    onChange({
      ...row,
      wireType: newType,
      size: newOpt.sizes[0],
      core: newOpt.cores ? newOpt.cores[0] : '',
    })
  }

  return (
    <div className="wire-row">
      <div className="wire-row-grid">
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label" style={{ fontSize: '0.78rem' }}>線種</label>
          <select
            className="form-control"
            value={row.wireType}
            onChange={(e) => handleTypeChange(e.target.value)}
            style={{ fontSize: '0.9rem', padding: '0.5rem 2rem 0.5rem 0.6rem' }}
          >
            {WIRE_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label" style={{ fontSize: '0.78rem' }}>太さ</label>
          <select
            className="form-control"
            value={row.size}
            onChange={(e) => {
              const newSize = e.target.value
              let newCore = row.core
              if (row.wireType === 'VVF' && newSize === '2.6㎜' && row.core === '4C') {
                newCore = '3C'
              }
              onChange({ ...row, size: newSize, core: newCore })
            }}
            style={{ fontSize: '0.9rem', padding: '0.5rem 2rem 0.5rem 0.6rem' }}
          >
            {opt.sizes.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="wire-row-bottom">
        {hasCores && availableCores && (
          <div className="form-group">
            <label className="form-label" style={{ fontSize: '0.78rem' }}>芯数</label>
            <div className="chips-group">
              {availableCores.map((c) => (
                <label className="chip-label" key={c} style={{ marginBottom: 0 }}>
                  <input
                    type="radio"
                    name={`core-${row.id}`}
                    value={c}
                    checked={row.core === c}
                    onChange={() => onChange({ ...row, core: c })}
                  />
                  <span className="chip-text" style={{ padding: '0.4rem 0.6rem', fontSize: '0.8rem' }}>{c}</span>
                </label>
              ))}
            </div>
          </div>
        )}
        <div className="form-group">
          <label className="form-label" style={{ fontSize: '0.78rem' }}>本数</label>
          <div className="qty-control">
            <button
              type="button"
              onClick={() => { if (row.qty > 1) onChange({ ...row, qty: row.qty - 1 }) }}
            >−</button>
            <input
              type="number"
              value={row.qty}
              min={1}
              max={99}
              onChange={(e) => {
                const v = parseInt(e.target.value) || 1
                onChange({ ...row, qty: Math.max(1, Math.min(99, v)) })
              }}
            />
            <button
              type="button"
              onClick={() => onChange({ ...row, qty: row.qty + 1 })}
            >＋</button>
          </div>
        </div>
        {canRemove && (
          <button className="btn-remove" onClick={onRemove}>削除</button>
        )}
      </div>
      {warning && (
        <div className="validation-error" style={{ margin: '4px 0 0' }}>{warning}</div>
      )}
    </div>
  )
}

// ==========================================
// メインページ
// ==========================================
export default function PipeSizePage() {
  const { isPaid, requirePaid } = usePaywall()
  const [rows, setRows] = useState<WireRow[]>(() => [makeInitialRow(0)])
  const [nextId, setNextId] = useState(1)
  const [checkedPipes, setCheckedPipes] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(PIPE_NAMES.map((name) => [name, true]))
  )

  // 行の追加
  const addRow = useCallback(() => {
    if (!requirePaid()) return
    setRows((prev) => [...prev, makeInitialRow(nextId)])
    setNextId((prev) => prev + 1)
  }, [nextId, requirePaid])

  // 行の更新
  const updateRow = useCallback((id: number, updated: WireRow) => {
    setRows((prev) => prev.map((r) => (r.id === id ? updated : r)))
  }, [])

  // 行の削除
  const removeRow = useCallback((id: number) => {
    setRows((prev) => prev.filter((r) => r.id !== id))
  }, [])

  // 配管チェック切替
  const togglePipe = useCallback((name: string) => {
    setCheckedPipes((prev) => ({ ...prev, [name]: !prev[name] }))
  }, [])

  // IV線が含まれるか
  const hasIV = rows.some((r) => r.wireType === 'IV')

  // 6kV CVTが含まれるか
  const has6kVCVT = rows.some(r => r.wireType === '6kV CVT')
  const disabledPipes6kV = useMemo(() => new Set(['CD / PF-S（CD管・PF管単層）', 'PF-D（PF管複層）']), [])

  // VVFが含まれるか
  const hasVVF = rows.some(r => r.wireType === 'VVF')

  // 6kV CVT追加時にCD/PF管を自動的にオフにする
  useEffect(() => {
    if (has6kVCVT) {
      setCheckedPipes(prev => {
        const next = { ...prev }
        let changed = false
        for (const name of disabledPipes6kV) {
          if (next[name]) {
            next[name] = false
            changed = true
          }
        }
        return changed ? next : prev
      })
    }
  }, [has6kVCVT, disabledPipes6kV])

  // 行ごとの警告（断面積データなし）
  const rowWarnings = useMemo(() => {
    const warnings: Map<number, string> = new Map()
    for (const row of rows) {
      if (!row.wireType) continue
      const key = row.wireType === 'IV' ? `IV|${row.size}`
        : row.wireType === 'VVF' ? `VVF|${row.size}|${row.core}`
        : row.wireType === 'CV' ? `CV|${row.size}|${row.core}`
        : `${row.wireType}|${row.size}`
      if (WIRE_AREA[key] === undefined) {
        warnings.set(row.id, `${row.wireType} ${row.size}${row.core ? ' ' + row.core : ''} の断面積データがありません`)
      }
    }
    return warnings
  }, [rows])

  // 選択中の配管
  const selectedPipes = useMemo(
    () => PIPE_NAMES.filter((name) => checkedPipes[name]),
    [checkedPipes]
  )

  // 計算結果
  const pipeResults = useMemo(() => {
    if (selectedPipes.length === 0) return null

    const results: { pipeName: string; totalArea: number; size32: number | null; size48: number | null }[] = []

    for (const pipeName of selectedPipes) {
      let totalArea = 0
      for (const row of rows) {
        totalArea += getArea(row.wireType, row.size, row.core, row.qty, pipeName)
      }
      const ranges = PIPE_RANGE[pipeName]
      const size32 = findPipeSize(ranges['32'], totalArea)
      const size48 = findPipeSize(ranges['48'], totalArea)
      results.push({ pipeName, totalArea, size32, size48 })
    }

    return results
  }, [rows, selectedPipes])

  // 代表の総断面積（最初の配管種別の値）
  const reprTotal = pipeResults && pipeResults.length > 0 ? pipeResults[0].totalArea : 0

  return (
    <>
      <SiteHeader mode="sub" title="配管サイズ計算" />

      <main className="main-content">
        <section className="card">
          <p className="card-title">電線・ケーブルの入力</p>

          <div>
            {rows.map((row) => (
              <WireRowItem
                key={row.id}
                row={row}
                canRemove={rows.length > 1}
                onChange={(updated) => updateRow(row.id, updated)}
                onRemove={() => removeRow(row.id)}
                warning={rowWarnings.get(row.id)}
              />
            ))}
          </div>

          <button className="btn-add" onClick={addRow}>
            {!isPaid && <span className="paywall-lock" aria-hidden="true">🔒</span>}
            ＋ 電線を追加
          </button>

          <div className="form-group">
            <label className="form-label">配管種別（複数選択可）</label>
            <div className="chips-group" style={{ marginTop: '0.25rem' }}>
              {PIPE_NAMES.map((name) => {
                const isPipeDisabled = has6kVCVT && disabledPipes6kV.has(name)
                return (
                  <label className={`chip-label${isPipeDisabled ? ' disabled' : ''}`} key={name}>
                    <input
                      type="checkbox"
                      checked={checkedPipes[name]}
                      onChange={() => togglePipe(name)}
                      disabled={isPipeDisabled}
                    />
                    <span className="chip-text">{name.split('（')[0]}</span>
                  </label>
                )
              })}
            </div>
            {hasVVF && selectedPipes.some(p => METAL_PIPES.has(p)) && (
              <div className="validation-warning">VVFケーブルを金属管（CP/EP/GP）に入れることは一般的ではありません。通常はIVを使用します。</div>
            )}
            {has6kVCVT && selectedPipes.some(p => disabledPipes6kV.has(p)) && (
              <div className="validation-warning">6kV CVTケーブルはCD管・PF管には通常入線しません。</div>
            )}
            {selectedPipes.length === 0 && (
              <div className="validation-error" style={{ marginTop: '0.75rem' }}>配管種別を1つ以上選択してください</div>
            )}
          </div>

          {hasIV && (
            <div className="corr-note">
              ⚠ IV線を2本以上収める場合、金属管（CP/EP/GP）では断面積に補正係数（×2.0 または ×1.2）が適用されます。
              CD管では ×1.3 が適用されます（内線規程による）。
            </div>
          )}
        </section>

        {pipeResults && pipeResults.length > 0 && (
          <>
            <div className="total-area-box" style={{ display: 'flex' }}>
              <span className="label">総断面積（補正後）</span>
              <span>
                <span className="value">{reprTotal.toFixed(1)}</span>
                <span style={{ color: '#718096', fontSize: '0.85rem' }}> mm²</span>
              </span>
            </div>

            <section className="card">
              <p className="card-title">配管サイズ選定結果</p>
              <div className="table-wrapper">
                <table className="pipe-table">
                  <thead>
                    <tr>
                      <th>配管種別</th>
                      <th style={{ textAlign: 'center' }}>断面積<br /><small>(mm²)</small></th>
                      <th style={{ textAlign: 'center' }}>32%基準<br /><small>（推奨）</small></th>
                      <th style={{ textAlign: 'center' }}>48%基準<br /><small>（緩和）</small></th>
                    </tr>
                  </thead>
                  <tbody>
                    {pipeResults.map(({ pipeName, totalArea, size32, size48 }) => (
                      <tr key={pipeName}>
                        <td className="pipe-name">{pipeName}</td>
                        <td style={{ textAlign: 'center', fontSize: '0.82rem', color: '#4a5568' }}>{totalArea.toFixed(1)}</td>
                        {size32 !== null
                          ? <td className="size-val">{size32}</td>
                          : <td className="no-size">対応なし</td>
                        }
                        {size48 !== null
                          ? <td className="size-val">{size48}</td>
                          : <td className="no-size">対応なし</td>
                        }
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-sm text-muted mt-1">
                ※ 32%：一般施工基準（内線規程3110-5）　48%：緩和条件（屈曲少・引換容易な場合）
              </p>
            </section>
          </>
        )}

        <div className="disclaimer">
          <strong>⚠ 注意事項</strong>
          断面積データはJCS規格等を参考にした代表値です。
          本ツールの計算結果で生じた損害について、作成者は一切の責任を負いません。
        </div>

        <details className="review-notes">
          <summary>検討事項（実装検討中）</summary>
          <div className="review-notes-body">
            <ul>
              <li><strong>P-8:</strong> IV補正係数の適用範囲 — IV 14mm²以上の金属管補正、8mm²超のCD管補正が現在未適用。内線規程の解釈として正しいか要確認。</li>
              <li><strong>P-9:</strong> IV + 他線種混在時の補正 — IV1本でも管内に他の電線と同居する場合の扱いについて確認が必要。</li>
              <li><strong>P-10:</strong> 本数の上限 — 最大99本まで入力可能。実務で同一サイズ99本を1管に通すことはないが、上限設定の要否を検討。</li>
              <li><strong>P-11:</strong> CV 1C × 複数本入力時 — 単心ケーブル3本を三相で通す場合、CVT相当として扱うべきケースがある。</li>
            </ul>
          </div>
        </details>
      </main>
    </>
  )
}
