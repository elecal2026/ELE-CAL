'use client'

import { useState, useCallback, useMemo } from 'react'
import type { System, LoadEntry } from './types'

import SiteHeader from '@/components/SiteHeader'
import { usePaywall } from '@/components/PaywallProvider'
import LoadEntryRow from './LoadEntryRow'
import ResultPanel from './ResultPanel'
import { validateBreakerInputs } from './validation'

let nextId = 1
function createLoad(): LoadEntry {
  return {
    id: `load-${nextId++}`,
    name: '',
    type: 'general',
    powerKw: '0',
    startMethod: 'direct',
    usageRate: '50',
    wiring: {
      wireTypeId: '',
      specId: '',
      installationMethod: 'ころがし',
      wireCount: '3本以下',
      wireLength: '0',
    },
  }
}

function ChipGroup<T extends string>({
  name,
  options,
  value,
  onChange,
  compact = false,
  disabledValues = [],
}: {
  name: string
  options: { label: string; value: T }[]
  value: T
  onChange: (v: T) => void
  compact?: boolean
  disabledValues?: T[]
}) {
  return (
    <div className="chips-group">
      {options.map((opt) => {
        const isDisabled = disabledValues.includes(opt.value)
        return (
          <label className={`chip-label${isDisabled ? ' disabled' : ''}`} key={opt.value}>
            <input
              type="radio"
              name={name}
              value={opt.value}
              checked={value === opt.value}
              disabled={isDisabled}
              onChange={() => onChange(opt.value)}
            />
            <span className="chip-text" style={compact ? { padding: '0.3rem 0.65rem', fontSize: '0.82rem' } : undefined}>
              {opt.label}
            </span>
          </label>
        )
      })}
    </div>
  )
}

export default function BreakerPage() {
  const { isPaid, requirePaid } = usePaywall()

  // 基本設定
  const [system, setSystem] = useState<System>('three')
  const [voltage, setVoltage] = useState('200')
  const [pf, setPf] = useState('0.8')
  const [margin, setMargin] = useState('1.25')

  // B-1: 三相3線時に100Vが選択されていたら200Vに自動切替
  // 補正は配電方式の選択ハンドラ側で行う（effect内同期setStateを避ける）
  const selectSystem = (s: System) => {
    setSystem(s)
    if (s === 'three' && voltage === '100') {
      setVoltage('200')
    }
  }

  // 三相3線時は100Vをdisabled
  const disabledVoltages = system === 'three' ? ['100'] : []

  // 負荷リスト
  const [loads, setLoads] = useState<LoadEntry[]>([createLoad()])

  const addLoad = useCallback(() => {
    if (!requirePaid()) return
    setLoads(prev => [...prev, createLoad()])
  }, [requirePaid])

  const removeLoad = useCallback((id: string) => {
    setLoads(prev => prev.length > 1 ? prev.filter(l => l.id !== id) : prev)
  }, [])

  const updateLoad = useCallback((id: string, updated: LoadEntry) => {
    setLoads(prev => prev.map(l => l.id === id ? updated : l))
  }, [])

  const V = parseFloat(voltage)

  const pfVal = parseFloat(pf)
  const marginVal = parseFloat(margin)

  // 合計kW計算
  const totalKw = loads.reduce((sum, l) => {
    const kw = parseFloat(l.powerKw) || 0
    if (l.type === 'welder') {
      const rate = parseFloat(l.usageRate) || 50
      return sum + kw * Math.sqrt(rate / 100)
    }
    return sum + kw
  }, 0)

  // バリデーション
  const validationIssues = useMemo(
    () => validateBreakerInputs(system, voltage, loads),
    [system, voltage, loads],
  )

  return (
    <>
      <SiteHeader mode="sub" title="ブレーカー選定" />

      {/* ========== 設定バー ========== */}
      <div className="breaker-settings-bar vd2-settings-bar">
        <div className="breaker-setting-group vd2-setting-group">
          <span className="breaker-setting-label vd2-setting-label">配電方式</span>
          <ChipGroup
            name="system"
            options={[
              { label: '単相2線', value: 'single2' },
              { label: '単相3線', value: 'single3' },
              { label: '三相3線', value: 'three' },
            ]}
            value={system}
            onChange={selectSystem}
            compact
          />
        </div>

        <div className="breaker-setting-group vd2-setting-group">
          <span className="breaker-setting-label vd2-setting-label">定格電圧 (V)</span>
          <ChipGroup
            name="voltage"
            options={[
              { label: '100 V', value: '100' },
              { label: '200 V', value: '200' },
            ]}
            value={voltage}
            onChange={setVoltage}
            compact
            disabledValues={disabledVoltages}
          />
        </div>

        <div className="breaker-setting-group vd2-setting-group">
          <span className="breaker-setting-label vd2-setting-label">力率 cosθ</span>
          <ChipGroup
            name="pf"
            options={[
              { label: '1.0', value: '1.0' },
              { label: '0.9', value: '0.9' },
              { label: '0.8', value: '0.8' },
            ]}
            value={pf}
            onChange={setPf}
            compact
          />
        </div>

        <div className="breaker-setting-group vd2-setting-group">
          <span className="breaker-setting-label vd2-setting-label">余裕率</span>
          <ChipGroup
            name="margin"
            options={[
              { label: '1.0倍', value: '1.0' },
              { label: '1.25倍', value: '1.25' },
              { label: '1.5倍', value: '1.5' },
            ]}
            value={margin}
            onChange={setMargin}
            compact
          />
        </div>
      </div>

      {/* ========== メイン 2カラム ========== */}
      <div className="breaker-main vd2-main">
        {/* ========== 左パネル: 入力 ========== */}
        <div className="breaker-input-col vd2-input-col">
          {/* 負荷リスト */}
            <section className="card vd2-section-card">
              <p className="card-title">
                負荷リスト
                <span className="total-kw-badge">合計 {totalKw.toFixed(2)} kW</span>
              </p>

              <div className="load-list">
                {loads.map((load, i) => (
                  <LoadEntryRow
                    key={load.id}
                    entry={load}
                    index={i}
                    onChange={(updated) => updateLoad(load.id, updated)}
                    onRemove={() => removeLoad(load.id)}
                    warnings={validationIssues.filter(v => v.target === i)}
                  />
                ))}
              </div>

              <button className="add-load-btn" onClick={addLoad}>
                {!isPaid && <span className="paywall-lock" aria-hidden="true">🔒</span>}
                + 負荷を追加
              </button>
            </section>
        </div>

        {/* ========== 右パネル: 結果 ========== */}
        <div className="breaker-result-col vd2-result-col">
          <ResultPanel
            loads={loads}
            system={system}
            voltage={V}
            powerFactor={pfVal}
            margin={marginVal}
            validationIssues={validationIssues}
          />

          <div className="disclaimer">
            本ツールは、「内線規程 第14版 JEAC8001-2022」を参考資料の一つとして計算しております。計算結果は目安としてご利用いただき、最終的なご判断は、実際の条件をご確認のうえお客様にてお願いいたします。
          </div>

          <details className="review-notes" hidden>
            <summary>検討事項（実装検討中）</summary>
            <div className="review-notes-body">
              <ul>
                <li><strong>B-14:</strong> モーターと溶接機が混在する場合の優先順位について — 現在はモーター優先で内線規程テーブルを参照。混在時の最適な選定ロジックを検討。</li>
                <li><strong>B-15:</strong> 複数台モーターの場合の幹線テーブル（3705-3表）引き機能 — 現在は汎用計算にフォールバック。最大モーター＋他の合計による選定が内線規程にある。</li>
                <li><strong>B-16:</strong> 溶接機のkVA換算率（力率0.6固定）の妥当性 — 実際の溶接機はメーカーにより力率が異なるため、入力可能にするか検討。</li>
              </ul>
            </div>
          </details>
        </div>
      </div>
    </>
  )
}
