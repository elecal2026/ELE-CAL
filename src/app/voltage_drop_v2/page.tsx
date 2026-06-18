'use client'

import { useState, useMemo, useCallback } from 'react'
import SiteHeader from '@/components/SiteHeader'
import { usePaywall } from '@/components/PaywallProvider'
import {
  WIRE_TYPES,
  getWireSpecById,
  getWireSpecsByType,
  type WireTypeId,
} from '@/data/wire-master'

// ==========================================
// 定数
// ==========================================
const T_CR = [75, 100, 125, 150, 200, 225, 300]
const B_CR = [15, 16, 20, 30, 40, 50, 75]
const NM = ['①','②','③','④','⑤','⑥','⑦','⑧','⑨','⑩','⑪','⑫','⑬','⑭','⑮','⑯','⑰','⑱','⑲','⑳']

const VOLTAGE_PRESETS = [100, 200]

interface StdRule {
  min: number; max: number; label: string
  branch: number | null; trunk: number | null; total: number | null
}

const STD: Record<string, StdRule[]> = {
  transformer: [
    { min: 0, max: 60, label: '60m以下', branch: 2, trunk: 3, total: null },
    { min: 60, max: 120, label: '60m〜120m', branch: null, trunk: null, total: 5 },
    { min: 120, max: 200, label: '120m〜200m', branch: null, trunk: null, total: 6 },
    { min: 200, max: Infinity, label: '200m以上', branch: null, trunk: null, total: 7 },
  ],
  utility: [
    { min: 0, max: 60, label: '60m以下', branch: 2, trunk: 2, total: null },
    { min: 60, max: 120, label: '60m〜120m', branch: null, trunk: null, total: 4 },
    { min: 120, max: 200, label: '120m〜200m', branch: null, trunk: null, total: 5 },
    { min: 200, max: Infinity, label: '200m以上', branch: null, trunk: null, total: 6 },
  ],
}

// ==========================================
// 型
// ==========================================
interface SectionData {
  wireTypeId: WireTypeId | ''
  specId: string
  current: number | null
  sections: (number | null)[]
}

interface BranchData extends SectionData {
  id: string
  label: string
  parentId: string
}

interface SecResult {
  drops: number[]
  totalDrop: number
  totalDist: number
  pct: number
}

interface PathSeg {
  id: string; label: string
  totalDrop: number; totalDist: number; pct: number
}

interface FullPath {
  segs: PathSeg[]; dist: number; dv: number
}

// ==========================================
// 計算関数（純粋関数）
// ==========================================
function getCoefficient(method: string, baseVoltage: number): number {
  if (method === '3phase3wire') return 30.8
  return baseVoltage === 100 ? 17.8 : 35.6
}

function getConductorArea(specId: string): number | null {
  const spec = getWireSpecById(specId)
  if (!spec) return null
  return spec.sizeUnit === 'mm²'
    ? spec.sizeValue
    : Math.PI * (spec.sizeValue / 2) ** 2
}

function calcDrop(method: string, baseVoltage: number, I: number | null, L: number | null, A: number | null): number {
  if (!I || !L || !A || A <= 0) return 0
  return getCoefficient(method, baseVoltage) * I * L / 1000 / A
}

function getSecResult(method: string, data: SectionData, baseVoltage: number): SecResult {
  const conductorArea = getConductorArea(data.specId)
  const drops = data.sections.map(d => calcDrop(method, baseVoltage, data.current, d, conductorArea))
  const totalDrop = drops.reduce((a, b) => a + b, 0)
  const totalDist = data.sections.reduce<number>((a, b) => a + (b || 0), 0)
  const pct = baseVoltage > 0 ? totalDrop / baseVoltage * 100 : 0
  return { drops, totalDrop, totalDist, pct }
}

function getPaths(method: string, trunk: SectionData, branches: BranchData[], baseVoltage: number): FullPath[] {
  const tr = getSecResult(method, trunk, baseVoltage)
  const trSeg: PathSeg = { id: 'trunk', label: '幹線', totalDrop: tr.totalDrop, totalDist: tr.totalDist, pct: tr.pct }

  if (branches.length === 0) {
    return [{ segs: [trSeg], dist: tr.totalDist, dv: tr.totalDrop }]
  }

  const pids = new Set(branches.map(b => b.parentId))
  let leaves = branches.filter(b => !pids.has(b.id))
  if (leaves.length === 0) leaves = [branches[branches.length - 1]]

  const paths: FullPath[] = []
  for (const leaf of leaves) {
    const chain: BranchData[] = []
    let c: BranchData | undefined = leaf
    while (c) {
      chain.unshift(c)
      if (c.parentId === 'trunk') break
      c = branches.find(b => b.id === c!.parentId)
    }
    const segs: PathSeg[] = [trSeg]
    let dist = tr.totalDist, dv = tr.totalDrop
    for (const br of chain) {
      const r = getSecResult(method, br, baseVoltage)
      segs.push({ id: br.id, label: br.label, totalDrop: r.totalDrop, totalDist: r.totalDist, pct: r.pct })
      dist += r.totalDist
      dv += r.totalDrop
    }
    paths.push({ segs, dist, dv })
  }
  return paths.length > 0 ? paths : [{ segs: [trSeg], dist: tr.totalDist, dv: tr.totalDrop }]
}

// ==========================================
// チップ選択（値 + その他）
// ==========================================
function ValueChips({ label, options, value, onChange }: {
  label: string; options: number[]; value: number | null; onChange: (v: number | null) => void
}) {
  const isCustom = value !== null && !options.includes(value)
  const [customOpen, setCustomOpen] = useState(isCustom)
  const [customText, setCustomText] = useState(isCustom && value ? String(value) : '')

  return (
    <div className="vd2-param-row">
      <div className="vd2-param-label">{label}</div>
      <div className="vd2-chip-group">
        {options.map((v) => (
          <button key={v} type="button" className={`vd2-chip${value === v ? ' active' : ''}`}
            onClick={() => { setCustomOpen(false); onChange(v) }}>
            {v}
          </button>
        ))}
        <button type="button" className={`vd2-chip${customOpen || isCustom ? ' active' : ''}`}
          onClick={() => setCustomOpen(true)}>
          その他
        </button>
        {(customOpen || isCustom) && (
          <input type="number" className="vd2-chip-custom" placeholder="数値" step="any"
            value={customText}
            onChange={(e) => { setCustomText(e.target.value); const n = parseFloat(e.target.value); if (n > 0) onChange(n) }}
            autoFocus
          />
        )}
      </div>
    </div>
  )
}

// ==========================================
// セクションカード（幹線 / 分岐共用）
// ==========================================
function SectionCard({
  data, label, isBranch, currents, method, baseVoltage,
  allBranches, warnings,
  onUpdate, onDelete, onUpdateParent,
}: {
  data: SectionData
  label: string
  isBranch: boolean
  currents: number[]
  method: string
  baseVoltage: number
  allBranches?: BranchData[]
  warnings?: string[]
  onUpdate: (field: string, value: unknown) => void
  onDelete?: () => void
  onUpdateParent?: (parentId: string) => void
}) {
  const { isPaid, requirePaid } = usePaywall()
  const res = getSecResult(method, data, baseVoltage)
  const availableSpecs = data.wireTypeId ? getWireSpecsByType(data.wireTypeId) : []
  const hasData = !!(data.specId && data.current)

  const handleWireTypeChange = (wireTypeId: WireTypeId | '') => {
    onUpdate('wireTypeId', wireTypeId)
    onUpdate('specId', wireTypeId ? getWireSpecsByType(wireTypeId)[0]?.id ?? '' : '')
  }

  return (
    <div className="vd2-section-card">
      <div className="vd2-section-header">
        <div className="vd2-section-title">
          {label} <span className={`vd2-badge${isBranch ? ' branch' : ''}`}>{isBranch ? '分岐' : '幹線'}</span>
        </div>
        {isBranch && onDelete && (
          <button type="button" className="vd2-btn-delete-section" onClick={onDelete}>削除</button>
        )}
      </div>

      {/* 接続元（分岐のみ） */}
      {isBranch && onUpdateParent && allBranches && (
        <div className="vd2-param-row">
          <div className="vd2-param-label">接続元</div>
          <div className="vd2-chip-group">
            <button type="button"
              className={`vd2-chip${(data as BranchData).parentId === 'trunk' ? ' active' : ''}`}
              onClick={() => onUpdateParent('trunk')}>
              幹線から
            </button>
            {allBranches.filter(b => b.id !== (data as BranchData).id).map(b => (
              <button key={b.id} type="button"
                className={`vd2-chip${(data as BranchData).parentId === b.id ? ' active' : ''}`}
                onClick={() => onUpdateParent(b.id)}>
                {b.label}の先
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="tool-responsive-grid tool-form-block">
        <div className="tool-form-field">
          <label className="tool-form-label">電線種類</label>
          <select
            className="form-control form-control-sm"
            value={data.wireTypeId}
            onChange={(e) => handleWireTypeChange(e.target.value as WireTypeId | '')}
          >
            <option value="">— 未選択 —</option>
            {WIRE_TYPES.filter((wireType) => wireType.active).map((wireType) => (
              <option key={wireType.id} value={wireType.id}>{wireType.displayName}</option>
            ))}
          </select>
        </div>
        <div className="tool-form-field">
          <label className="tool-form-label">電線仕様</label>
          <select
            className="form-control form-control-sm"
            value={data.specId}
            onChange={(e) => onUpdate('specId', e.target.value)}
            disabled={!data.wireTypeId}
          >
            <option value="">— 未選択 —</option>
            {availableSpecs.map((spec) => (
              <option key={spec.id} value={spec.id}>{spec.specDisplay}</option>
            ))}
          </select>
        </div>
      </div>
      <ValueChips label="電流 (A)" options={currents} value={data.current}
        onChange={(v) => onUpdate('current', v)} />

      {/* 部分入力エラー */}
      {((data.specId && data.current == null) || (!data.specId && data.current != null)) && (
        <div className="validation-error" style={{ marginBottom: '8px' }}>
          {!data.specId ? '電線仕様を選択してください' : '電流を入力してください'}
        </div>
      )}

      {/* 距離テーブル */}
      <div className="vd2-section-table">
        <div className="vd2-table-header">
          <span style={{ textAlign: 'center' }}>#</span>
          <span>距離 (m)</span>
          <span style={{ textAlign: 'right' }}>降下</span>
          <span></span>
        </div>
        {data.sections.map((dist, i) => (
          <div key={i} className="vd2-section-row">
            <span className="vd2-row-num">{NM[i] || String(i + 1)}</span>
            <input
              type="number" className="vd2-distance-input" placeholder="距離" step="0.1"
              value={dist !== null ? dist : ''}
              onChange={(e) => {
                const ns = [...data.sections]
                ns[i] = e.target.value !== '' ? parseFloat(e.target.value) : null
                onUpdate('sections', ns)
              }}
            />
            <span className="vd2-drop-display">
              {hasData && res.drops[i] > 0
                ? <>▼ {res.drops[i].toFixed(2)}V <span className="pct">({(baseVoltage > 0 ? res.drops[i] / baseVoltage * 100 : 0).toFixed(2)}%)</span></>
                : <span style={{ color: 'var(--text-faint)' }}>—</span>
              }
            </span>
            <button type="button" className="vd2-btn-delete-row"
              disabled={data.sections.length <= 1}
              onClick={() => { onUpdate('sections', data.sections.filter((_, j) => j !== i)) }}>
              ×
            </button>
          </div>
        ))}
        {/* 距離にnull混在の警告 */}
        {data.sections.length > 1 && data.sections.some(d => d == null) && data.sections.some(d => d != null) && (
          <div className="validation-warning" style={{ marginTop: '4px' }}>未入力の区間があります</div>
        )}
        <button type="button" className="vd2-btn-add-row"
          onClick={() => {
            if (!requirePaid()) return
            onUpdate('sections', [...data.sections, null])
          }}>
          {!isPaid && <span className="paywall-lock" aria-hidden="true">🔒</span>}
          + 区間を追加
        </button>
        <div className="vd2-subtotal">
          {hasData && res.totalDist > 0
            ? <>
              <span className="vd2-subtotal-label">小計</span>
              <span className="vd2-subtotal-val">{res.totalDrop.toFixed(2)}V</span>
              <span className="vd2-subtotal-pct">({res.pct.toFixed(2)}%)</span>
              <span className="vd2-subtotal-dist">/ {res.totalDist.toFixed(1)}m</span>
            </>
            : <>
              <span className="vd2-subtotal-label">小計</span>
              <span style={{ color: 'var(--text-faint)' }}>— 入力待ち</span>
            </>
          }
        </div>
      </div>

      {/* 警告メッセージ */}
      {warnings && warnings.length > 0 && (
        <div style={{ marginTop: '8px' }}>
          {warnings.map((w, i) => (
            <div key={i} className="validation-warning">{w}</div>
          ))}
        </div>
      )}
    </div>
  )
}

// ==========================================
// ツリービュー
// ==========================================
function TreeNode({ label, dist, dv, pct, depth, isLast }: {
  label: string; dist: number; dv: number; pct: number; depth: number; isLast?: boolean
}) {
  return (
    <div className="vd2-tree-node" style={depth > 0 ? { paddingLeft: `${depth * 20}px` } : undefined}>
      <span className="name">
        {depth > 0 && <span className="vd2-tree-connector">{isLast ? '└' : '├'}</span>}
        {label}
      </span>
      <span className="dist">{dist.toFixed(1)}m</span>
      <span className="volt">▼{dv.toFixed(2)}V</span>
      <span className="pct">({pct.toFixed(2)}%)</span>
    </div>
  )
}

function BranchTree({ parentId, depth, method, baseVoltage, allBranches }: {
  parentId: string; depth: number
  method: string; baseVoltage: number; allBranches: BranchData[]
}) {
  const children = allBranches.filter(b => b.parentId === parentId)
  return (
    <>
      {children.map((br, i) => {
        const r = getSecResult(method, br, baseVoltage)
        return (
          <div key={br.id}>
            <TreeNode label={br.label} dist={r.totalDist} dv={r.totalDrop} pct={r.pct}
              depth={depth} isLast={i === children.length - 1} />
            <BranchTree parentId={br.id} depth={depth + 1}
              method={method} baseVoltage={baseVoltage} allBranches={allBranches} />
          </div>
        )
      })}
    </>
  )
}

// ==========================================
// 基準判定テーブル
// ==========================================
function StdTable({ supplyType, totalDist, totalPct, trunkPct, branchPct }: {
  supplyType: string
  totalDist: number | null
  totalPct: number | null
  trunkPct: number | null
  branchPct: number | null
}) {
  const stds = STD[supplyType as keyof typeof STD] || STD.transformer

  let activeIdx = -1
  if (totalDist != null && totalDist > 0) {
    activeIdx = stds.findIndex(s => totalDist > s.min && totalDist <= s.max)
    if (totalDist <= 60) activeIdx = 0
  }

  const isActive = activeIdx >= 0 && totalPct != null

  let overallOk: boolean | null = null
  if (isActive) {
    const s = stds[activeIdx]
    if (s.total != null) {
      overallOk = totalPct! <= s.total
    } else {
      overallOk = (trunkPct != null && s.trunk != null && trunkPct <= s.trunk) &&
        (branchPct != null && s.branch != null && branchPct <= s.branch)
    }
  }

  return (
    <>
      <table className="vd2-std-table">
        <thead>
          <tr><th>亘長</th><th>分岐</th><th>幹線</th><th>合計</th></tr>
        </thead>
        <tbody>
          {stds.map((s, i) => {
            const isRow = i === activeIdx
            return (
              <tr key={i} className={isRow ? 'active-row' : 'greyed'}>
                <td>{s.label}</td>
                <td>
                  {s.branch != null ? (
                    <>
                      {s.branch}%以下
                      {isRow && branchPct != null && (
                        <span className={`vd2-actual-val ${branchPct <= s.branch ? 'ok' : 'ng'}`}>
                          {branchPct.toFixed(2)}% {branchPct <= s.branch ? '✅' : '❌'}
                        </span>
                      )}
                    </>
                  ) : 'ー'}
                </td>
                <td>
                  {s.trunk != null ? (
                    <>
                      {s.trunk}%以下
                      {isRow && trunkPct != null && (
                        <span className={`vd2-actual-val ${trunkPct <= s.trunk ? 'ok' : 'ng'}`}>
                          {trunkPct.toFixed(2)}% {trunkPct <= s.trunk ? '✅' : '❌'}
                        </span>
                      )}
                    </>
                  ) : 'ー'}
                </td>
                <td>
                  {s.total != null ? (
                    <>
                      {s.total}%以下
                      {isRow && totalPct != null && (
                        <span className={`vd2-actual-val ${totalPct <= s.total ? 'ok' : 'ng'}`}>
                          {totalPct.toFixed(2)}% {totalPct <= s.total ? '✅' : '❌'}
                        </span>
                      )}
                    </>
                  ) : 'ー'}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
      {overallOk !== null && (
        <div style={{ textAlign: 'center', marginTop: '14px' }}>
          <span className={`vd2-judgment ${overallOk ? 'ok' : 'ng'}`}>
            {overallOk ? '✅ 基準適合' : '❌ 基準超過'}
          </span>
        </div>
      )}
    </>
  )
}

export default function VoltageDropV2Page() {
  const { isPaid, requirePaid } = usePaywall()

  // 設定
  const [method, setMethod] = useState('1phase3wire')
  const [supplyType, setSupplyType] = useState('transformer')
  const [baseVoltage, setBaseVoltage] = useState(200)

  // V-1: 三相3線 × 100V → 200Vに自動切替
  // 補正は方式・供給元の選択ハンドラ側で行う（effect内同期setStateを避ける）
  const selectMethod = (m: string) => {
    setMethod(m)
    if (m === '3phase3wire' && baseVoltage === 100) {
      setBaseVoltage(200)
    }
  }
  const selectSupplyType = (s: string) => {
    setSupplyType(s)
  }

  // 無効な電圧プリセットを計算
  const disabledVoltages = useMemo(() => {
    const disabled = new Set<number>()
    if (method === '3phase3wire') disabled.add(100)
    return disabled
  }, [method])

  // 幹線・分岐
  const [trunk, setTrunk] = useState<SectionData>({
    wireTypeId: '',
    specId: '',
    current: null,
    sections: [null],
  })
  const [branches, setBranches] = useState<BranchData[]>([])
  const [nextId, setNextId] = useState(1)

  // --- ハンドラ ---
  const updateTrunk = useCallback((field: string, value: unknown) => {
    setTrunk(prev => ({ ...prev, [field]: value }))
  }, [])

  const updateBranch = useCallback((id: string, field: string, value: unknown) => {
    setBranches(prev => prev.map(b => b.id === id ? { ...b, [field]: value } : b))
  }, [])

  const addBranch = useCallback(() => {
    if (!requirePaid()) return
    const n = nextId
    const lb = NM[n - 1] || String(n)
    const pid = branches.length > 0 ? branches[branches.length - 1].id : 'trunk'
    setBranches(prev => [...prev, {
      id: `branch-${n}`, label: `分岐${lb}`, parentId: pid,
      wireTypeId: '', specId: '', current: null, sections: [null],
    }])
    setNextId(prev => prev + 1)
  }, [nextId, branches, requirePaid])

  const deleteBranch = useCallback((id: string) => {
    setBranches(prev => {
      const target = prev.find(b => b.id === id)
      if (!target) return prev
      return prev
        .filter(b => b.id !== id)
        .map(b => b.parentId === id ? { ...b, parentId: target.parentId } : b)
    })
  }, [])

  // --- 計算 ---
  const trunkResult = useMemo(() => getSecResult(method, trunk, baseVoltage), [method, trunk, baseVoltage])

  const paths = useMemo(
    () => getPaths(method, trunk, branches, baseVoltage),
    [method, trunk, branches, baseVoltage]
  )

  const worstPath = useMemo(() => {
    if (paths.length === 0) return null
    return paths.reduce((w, p) => p.dv > w.dv ? p : w, paths[0])
  }, [paths])

  const worstPct = worstPath && baseVoltage > 0 ? worstPath.dv / baseVoltage * 100 : 0

  const branchDv = useMemo(() => {
    if (!worstPath) return 0
    return worstPath.segs.filter(s => s.id !== 'trunk').reduce((sum, s) => sum + s.totalDrop, 0)
  }, [worstPath])

  const branchPct = baseVoltage > 0 ? branchDv / baseVoltage * 100 : 0

  const branchWarnings = (() => {
    const map: Map<string, string[]> = new Map()
    const trunkSpec = getWireSpecById(trunk.specId)
    const trunkArea = getConductorArea(trunk.specId)
    for (const br of branches) {
      const w: string[] = []
      if (br.current && trunk.current && br.current > trunk.current) {
        w.push(`分岐の電流（${br.current}A）が幹線の電流（${trunk.current}A）を超えています。`)
      }
      const branchSpec = getWireSpecById(br.specId)
      const branchArea = getConductorArea(br.specId)
      if (branchSpec && trunkSpec && branchArea && trunkArea && branchArea > trunkArea) {
        w.push(`分岐の電線仕様（${branchSpec.fullDisplay}）の導体断面積が幹線（${trunkSpec.fullDisplay}）より大きくなっています。`)
      }
      if (w.length > 0) map.set(br.id, w)
    }
    return map
  })()

  // E: バリデーション — 分岐の部分入力チェック
  const hasValidationError = useMemo(() => {
    for (const br of branches) {
      if ((br.specId && br.current == null) || (!br.specId && br.current != null)) {
        return true
      }
    }
    // 幹線の部分入力
    if ((trunk.specId && trunk.current == null) || (!trunk.specId && trunk.current != null)) {
      return true
    }
    return false
  }, [trunk, branches])

  const hasResult = !!(trunk.specId && trunk.current && trunkResult.totalDist > 0 && !hasValidationError)

  return (
    <>
      <SiteHeader mode="sub" title="電圧降下計算" />

      {/* 設定バー */}
      <div className="vd2-settings-bar">
        <div className="vd2-setting-group">
          <span className="vd2-setting-label">方式</span>
          <div className="vd2-chip-group">
            <button type="button" className={`vd2-chip${method === '1phase3wire' ? ' active' : ''}`}
              onClick={() => selectMethod('1phase3wire')}>単相3線</button>
            <button type="button" className={`vd2-chip${method === '3phase3wire' ? ' active' : ''}`}
              onClick={() => selectMethod('3phase3wire')}>三相3線</button>
          </div>
        </div>
        <div className="vd2-setting-group">
          <span className="vd2-setting-label">基準電圧</span>
          <div className="vd2-chip-group">
            {VOLTAGE_PRESETS.map(v => {
              const isDisabled = disabledVoltages.has(v)
              return (
                <button key={v} type="button"
                  className={`vd2-chip${baseVoltage === v ? ' active' : ''}${isDisabled ? ' disabled' : ''}`}
                  disabled={isDisabled}
                  onClick={() => setBaseVoltage(v)}>
                  {v}V
                </button>
              )
            })}
          </div>
        </div>
        <div className="vd2-setting-group">
          <span className="vd2-setting-label">供給元</span>
          <div className="vd2-chip-group">
            <button type="button" className={`vd2-chip${supplyType === 'transformer' ? ' active' : ''}`}
              onClick={() => selectSupplyType('transformer')}>自家変圧器</button>
            <button type="button" className={`vd2-chip${supplyType === 'utility' ? ' active' : ''}`}
              onClick={() => selectSupplyType('utility')}>電気事業者（低圧）</button>
          </div>
        </div>
      </div>

      {/* メイン 2カラム */}
      <div className="vd2-main">
        <div className="vd2-input-col">
          {/* 幹線 */}
          <SectionCard
            data={trunk} label="幹線" isBranch={false}
            currents={T_CR}
            method={method} baseVoltage={baseVoltage}
            onUpdate={updateTrunk}
          />

          {/* 分岐 */}
          {branches.map(br => (
            <SectionCard key={br.id}
              data={br} label={br.label} isBranch={true}
              currents={B_CR}
              method={method} baseVoltage={baseVoltage}
              allBranches={branches}
              warnings={branchWarnings.get(br.id)}
              onUpdate={(field, value) => updateBranch(br.id, field, value)}
              onDelete={() => deleteBranch(br.id)}
              onUpdateParent={(pid) => updateBranch(br.id, 'parentId', pid)}
            />
          ))}

          <button type="button" className="vd2-btn-add-branch" onClick={addBranch}>
            {!isPaid && <span className="paywall-lock" aria-hidden="true">🔒</span>}
            <span style={{ fontSize: '18px' }}>+</span> 分岐を追加
          </button>
        </div>

        <div className="vd2-result-col">
          {/* 計算結果サマリー */}
          <div className="vd2-result-card">
            <h3>計算結果サマリー</h3>
            {hasValidationError ? (
              <div className="vd2-empty-state">
                <div className="validation-error" style={{ textAlign: 'left' }}>
                  入力にエラーがあります。電線仕様と電流は両方入力してください。
                </div>
              </div>
            ) : !hasResult ? (
              <div className="vd2-empty-state">
                幹線の電線仕様・電流・距離を入力すると<br />結果が表示されます
              </div>
            ) : (
              <>
                <div>
                  <TreeNode label="幹線" dist={trunkResult.totalDist} dv={trunkResult.totalDrop}
                    pct={trunkResult.pct} depth={0} />
                  <BranchTree parentId="trunk" depth={1}
                    method={method} baseVoltage={baseVoltage} allBranches={branches} />
                </div>

                {worstPath && (
                  <div className="vd2-worst-path">
                    <div className="vd2-path-label">最遠端経路</div>
                    <div className="vd2-path-route">{worstPath.segs.map(s => s.label).join(' → ')}</div>
                    <div className="vd2-totals">
                      <span className="t-dist">{worstPath.dist.toFixed(1)}m</span>
                      <span className="t-volt">▼ {worstPath.dv.toFixed(2)}V</span>
                      <span className="t-pct">({worstPct.toFixed(2)}%)</span>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* 基準判定 */}
          <div className="vd2-result-card">
            <h3>基準判定</h3>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '12px' }}>
              供給元：{supplyType === 'transformer' ? '自家変圧器' : '電気事業者（低圧）'}
            </div>
            <StdTable
              supplyType={supplyType}
              totalDist={hasResult && worstPath ? worstPath.dist : null}
              totalPct={hasResult ? worstPct : null}
              trunkPct={hasResult ? trunkResult.pct : null}
              branchPct={hasResult ? branchPct : null}
            />
          </div>

          <div className="disclaimer">
            本ツールは、「内線規程 第14版 JEAC8001-2022」を参考資料の一つとして計算しております。計算結果は目安としてご利用いただき、最終的なご判断は、実際の条件をご確認のうえお客様にてお願いいたします。
          </div>

          <details className="review-notes" hidden>
            <summary>検討事項（実装検討中）</summary>
            <div className="review-notes-body">
              <ul>
                <li><strong>V-11:</strong> 単相2線式の追加 — 現在は単相3線・三相3線のみ。住宅の引込線等で使われる単相2線（COEFF定数の追加が必要）の対応を検討。</li>
              </ul>
            </div>
          </details>
        </div>
      </div>
    </>
  )
}
