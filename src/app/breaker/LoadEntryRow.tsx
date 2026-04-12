import { useMemo } from 'react'
import type { LoadEntry, WiringConfig, LoadType, StartMethod, WireType, System } from './types'
import { LOAD_TYPE_LABELS, START_METHOD_LABELS } from './constants'
import { getAvailableWireSizes, type ValidationIssue } from './validation'

interface LoadEntryRowProps {
  entry: LoadEntry
  index: number
  system: System
  voltage: string
  onChange: (updated: LoadEntry) => void
  onRemove: () => void
  warnings: ValidationIssue[]
}

export default function LoadEntryRow({
  entry,
  index,
  system,
  voltage,
  onChange,
  onRemove,
  warnings,
}: LoadEntryRowProps) {

  const update = (partial: Partial<LoadEntry>) => {
    onChange({ ...entry, ...partial })
  }

  const updateWiring = (partial: Partial<WiringConfig>) => {
    update({ wiring: { ...entry.wiring, ...partial } })
  }

  // B-7/B-8: 電線種類に応じた利用可能サイズ
  const availableSizes = useMemo(
    () => getAvailableWireSizes(entry.wiring.wireType),
    [entry.wiring.wireType],
  )

  // 電線種類変更時にサイズが利用不可ならリセット
  const handleWireTypeChange = (newType: WireType | '') => {
    const newSizes = getAvailableWireSizes(newType)
    const currentSize = entry.wiring.wireSize
    const sizeStillValid = currentSize === '' || newSizes.includes(currentSize)
    updateWiring({
      wireType: newType,
      wireSize: sizeStillValid ? currentSize : '',
    })
  }

  const errorIssues = warnings.filter(w => w.level === 'error')
  const warningIssues = warnings.filter(w => w.level === 'warning')

  return (
    <div className="load-entry-row">
      {/* メイン行: 負荷種類・kW・始動方式・削除 */}
      <div className="load-entry-main" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '12px 12px 8px' }}>
        <span className="load-entry-number">{index + 1}</span>

        <select
          className="load-type-select"
          style={{ width: 'auto', flex: 1 }}
          value={entry.type}
          onChange={(e) => update({ type: e.target.value as LoadType })}
        >
          {(Object.entries(LOAD_TYPE_LABELS) as [LoadType, string][]).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>

        <div className="load-field-input" style={{ width: '120px' }}>
          <input
            type="number"
            className="form-control form-control-sm"
            placeholder="0.0"
            min="0"
            step="0.1"
            value={entry.powerKw}
            onChange={(e) => update({ powerKw: e.target.value })}
          />
          <span className="load-field-unit">kW</span>
        </div>

        {entry.type === 'motor' && (
          <select
            className="form-control form-control-sm"
            style={{ width: '120px' }}
            value={entry.startMethod}
            onChange={(e) => update({ startMethod: e.target.value as StartMethod })}
          >
            {(Object.entries(START_METHOD_LABELS) as [StartMethod, string][]).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        )}

        {entry.type === 'welder' && (
          <div className="load-field-input" style={{ width: '100px' }}>
            <input
              type="number"
              className="form-control form-control-sm"
              placeholder="50"
              min="0"
              max="100"
              step="5"
              value={entry.usageRate}
              onChange={(e) => update({ usageRate: e.target.value })}
            />
            <span className="load-field-unit">%</span>
          </div>
        )}

        <button className="load-remove-btn" onClick={onRemove} title="削除">
          ×
        </button>
      </div>

      {/* 配線設定（常時表示） */}
      <div style={{
        display: 'flex',
        gap: '0.75rem',
        margin: '0 12px 12px 48px',
        padding: '10px 12px',
        background: '#f8fafc',
        border: '1px solid #e0e3e8',
        borderRadius: '8px',
        flexWrap: 'wrap',
      }}>
        {/* 電線種類 */}
        <div className="load-field-row" style={{ marginBottom: 0, minWidth: '120px', flex: 1 }}>
          <label className="load-field-label">電線種類</label>
          <select
            className="form-control form-control-sm"
            value={entry.wiring.wireType}
            onChange={(e) => handleWireTypeChange(e.target.value as WireType | '')}
          >
            <option value="">— 未選択 —</option>
            <option value="CV">CV</option>
            <option value="CVT">CVT</option>
            <option value="IV">IV</option>
          </select>
        </div>

        {/* 電線太さ */}
        <div className="load-field-row" style={{ marginBottom: 0, minWidth: '120px', flex: 1 }}>
          <label className="load-field-label">太さ</label>
          <select
            className="form-control form-control-sm"
            value={entry.wiring.wireSize}
            onChange={(e) => updateWiring({ wireSize: e.target.value })}
          >
            <option value="">— 未選択 —</option>
            {availableSizes.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        {/* 長さ */}
        <div className="load-field-row" style={{ marginBottom: 0, minWidth: '100px', flex: 1 }}>
          <label className="load-field-label">長さ（m）</label>
          <div className="load-field-input">
            <input
              type="number"
              className="form-control form-control-sm"
              placeholder="0"
              min="0"
              step="1"
              value={entry.wiring.wireLength}
              onChange={(e) => updateWiring({ wireLength: e.target.value })}
            />
          </div>
        </div>
      </div>

      {/* バリデーションメッセージ */}
      {errorIssues.length > 0 && (
        <div style={{ margin: '0 12px 8px 48px' }}>
          {errorIssues.map((issue) => (
            <div key={issue.id} className="validation-error">{issue.message}</div>
          ))}
        </div>
      )}
      {warningIssues.length > 0 && (
        <div style={{ margin: '0 12px 8px 48px' }}>
          {warningIssues.map((issue) => (
            <div key={issue.id} className="validation-warning">{issue.message}</div>
          ))}
        </div>
      )}
    </div>
  )
}
