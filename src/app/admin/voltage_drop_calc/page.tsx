'use client'

import Link from 'next/link'
import { useState, useMemo, useCallback } from 'react'

// ==========================================
// 定数
// ==========================================
const COEFF: Record<string, number> = {
  '1phase3wire': 35.6,
  '3phase3wire': 30.8,
}

const T_SZ = [22, 38, 60, 100, 150, 200, 250, 325]
const T_CR = [75, 100, 125, 150, 200, 225, 300]
const B_SZ = [1.25, 2, 3.5, 5.5, 8, 14, 22, 38]
const B_CR = [15, 16, 20, 30, 40, 50, 75]
const NM = ['①','②','③','④','⑤','⑥','⑦','⑧','⑨','⑩','⑪','⑫','⑬','⑭','⑮','⑯','⑰','⑱','⑲','⑳']

const VOLTAGE_PRESETS = [100, 200, 400]

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
  wireSize: number | null
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
function calcDrop(method: string, I: number | null, L: number | null, A: number | null): number {
  if (!I || !L || !A || A <= 0) return 0
  return COEFF[method] * I * L / 1000 / A
}

function getSecResult(method: string, data: SectionData, baseVoltage: number): SecResult {
  const drops = data.sections.map(d => calcDrop(method, data.current, d, data.wireSize))
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
  data, label, isBranch, sizes, currents, method, baseVoltage,
  allBranches,
  onUpdate, onDelete, onUpdateParent,
}: {
  data: SectionData
  label: string
  isBranch: boolean
  sizes: number[]
  currents: number[]
  method: string
  baseVoltage: number
  allBranches?: BranchData[]
  onUpdate: (field: string, value: unknown) => void
  onDelete?: () => void
  onUpdateParent?: (parentId: string) => void
}) {
  const res = getSecResult(method, data, baseVoltage)
  const hasData = !!(data.wireSize && data.current)

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

      <ValueChips label="太さ (mm²)" options={sizes} value={data.wireSize}
        onChange={(v) => onUpdate('wireSize', v)} />
      <ValueChips label="電流 (A)" options={currents} value={data.current}
        onChange={(v) => onUpdate('current', v)} />

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
                ? <>{`▼ ${res.drops[i].toFixed(2)}V `}<span className="pct">({(baseVoltage > 0 ? res.drops[i] / baseVoltage * 100 : 0).toFixed(2)}%)</span></>
                : <span style={{ color: '#9ba3af' }}>—</span>
              }
            </span>
            <button type="button" className="vd2-btn-delete-row"
              disabled={data.sections.length <= 1}
              onClick={() => { onUpdate('sections', data.sections.filter((_, j) => j !== i)) }}>
              ×
            </button>
          </div>
        ))}
        <button type="button" className="vd2-btn-add-row"
          onClick={() => onUpdate('sections', [...data.sections, null])}>
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
              <span style={{ color: '#9ba3af' }}>— 入力待ち</span>
            </>
          }
        </div>
      </div>
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

// ==========================================
// メインページ
// ==========================================
export default function VoltageDropCalcPage() {
  // 設定
  const [method, setMethod] = useState('1phase3wire')
  const [supplyType, setSupplyType] = useState('transformer')
  const [baseVoltage, setBaseVoltage] = useState(200)
  const [customVoltageOpen, setCustomVoltageOpen] = useState(false)
  const [customVoltageText, setCustomVoltageText] = useState('')

  // 幹線・分岐
  const [trunk, setTrunk] = useState<SectionData>({ wireSize: null, current: null, sections: [null] })
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
    const n = nextId
    const lb = NM[n - 1] || String(n)
    const pid = branches.length > 0 ? branches[branches.length - 1].id : 'trunk'
    setBranches(prev => [...prev, {
      id: `branch-${n}`, label: `分岐${lb}`, parentId: pid,
      wireSize: null, current: null, sections: [null],
    }])
    setNextId(prev => prev + 1)
  }, [nextId, branches])

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
  const hasResult = !!(trunk.wireSize && trunk.current && trunkResult.totalDist > 0)

  const isCustomVoltage = customVoltageOpen || !VOLTAGE_PRESETS.includes(baseVoltage)

  return (
    <>
      <header className="app-header">
        <Link className="back-link" href="/admin" aria-label="管理ツールへ戻る">←</Link>
        <span className="header-icon">📉</span>
        <h1>電圧降下計算</h1>
      </header>

      {/* 設定バー */}
      <div className="vd2-settings-bar">
        <div className="vd2-setting-group">
          <span className="vd2-setting-label">方式</span>
          <div className="vd2-chip-group">
            <button type="button" className={`vd2-chip${method === '1phase3wire' ? ' active' : ''}`}
              onClick={() => setMethod('1phase3wire')}>単相3線</button>
            <button type="button" className={`vd2-chip${method === '3phase3wire' ? ' active' : ''}`}
              onClick={() => setMethod('3phase3wire')}>三相3線</button>
          </div>
        </div>
        <div className="vd2-setting-group">
          <span className="vd2-setting-label">供給元</span>
          <div className="vd2-chip-group">
            <button type="button" className={`vd2-chip${supplyType === 'transformer' ? ' active' : ''}`}
              onClick={() => setSupplyType('transformer')}>自家変圧器</button>
            <button type="button" className={`vd2-chip${supplyType === 'utility' ? ' active' : ''}`}
              onClick={() => setSupplyType('utility')}>電気事業者</button>
          </div>
        </div>
        <div className="vd2-setting-group">
          <span className="vd2-setting-label">基準電圧</span>
          <div className="vd2-chip-group">
            {VOLTAGE_PRESETS.map(v => (
              <button key={v} type="button"
                className={`vd2-chip${baseVoltage === v && !customVoltageOpen ? ' active' : ''}`}
                onClick={() => { setCustomVoltageOpen(false); setBaseVoltage(v) }}>
                {v}V
              </button>
            ))}
            <button type="button" className={`vd2-chip${isCustomVoltage ? ' active' : ''}`}
              onClick={() => setCustomVoltageOpen(true)}>
              その他
            </button>
          </div>
          {isCustomVoltage && (
            <input type="number" className="vd2-chip-custom" placeholder="V" min="1"
              value={customVoltageText}
              onChange={(e) => {
                setCustomVoltageText(e.target.value)
                const v = parseFloat(e.target.value)
                if (v > 0) setBaseVoltage(v)
              }}
              autoFocus
            />
          )}
        </div>
      </div>

      {/* メイン 2カラム */}
      <div className="vd2-main">
        <div className="vd2-input-col">
          {/* 幹線 */}
          <SectionCard
            data={trunk} label="幹線" isBranch={false}
            sizes={T_SZ} currents={T_CR}
            method={method} baseVoltage={baseVoltage}
            onUpdate={updateTrunk}
          />

          {/* 分岐 */}
          {branches.map(br => (
            <SectionCard key={br.id}
              data={br} label={br.label} isBranch={true}
              sizes={B_SZ} currents={B_CR}
              method={method} baseVoltage={baseVoltage}
              allBranches={branches}
              onUpdate={(field, value) => updateBranch(br.id, field, value)}
              onDelete={() => deleteBranch(br.id)}
              onUpdateParent={(pid) => updateBranch(br.id, 'parentId', pid)}
            />
          ))}

          <button type="button" className="vd2-btn-add-branch" onClick={addBranch}>
            <span style={{ fontSize: '18px' }}>+</span> 分岐を追加
          </button>
        </div>

        <div className="vd2-result-col">
          {/* 計算結果サマリー */}
          <div className="vd2-result-card">
            <h3>計算結果サマリー</h3>
            {!hasResult ? (
              <div className="vd2-empty-state">
                幹線の太さ・電流・距離を入力すると<br />結果が表示されます
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
            <div style={{ fontSize: '12px', color: '#636b78', marginBottom: '12px' }}>
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
        </div>
      </div>
    </>
  )
}
