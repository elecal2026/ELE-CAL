import type { LoadEntry, WiringConfig, LoadType, StartMethod } from './types'
import { LOAD_TYPE_LABELS, START_METHOD_LABELS } from './constants'
import { type ValidationIssue } from './validation'
import {
  INSTALLATION_METHODS,
  WIRE_COUNTS,
  isInsulatedWire,
  type InstallationMethod,
  type WireCount,
} from '@/data/allowable-current'
import { WIRE_TYPES, getWireSpecsByType, type WireTypeId } from '@/data/wire-master'

interface LoadEntryRowProps {
  entry: LoadEntry
  index: number
  onChange: (updated: LoadEntry) => void
  onRemove: () => void
  warnings: ValidationIssue[]
}

export default function LoadEntryRow({
  entry,
  index,
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

  const selectedWireType = entry.wiring.wireTypeId || undefined
  const availableSpecs = selectedWireType ? getWireSpecsByType(selectedWireType) : []
  const showWireCount = selectedWireType
    ? isInsulatedWire(selectedWireType) && entry.wiring.installationMethod === '配管内'
    : false

  const handleWireTypeChange = (newType: WireTypeId | '') => {
    updateWiring({
      wireTypeId: newType,
      specId: newType ? getWireSpecsByType(newType)[0]?.id ?? '' : '',
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
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border)',
        borderRadius: '8px',
        flexWrap: 'wrap',
      }}>
        {/* 電線種類 */}
        <div className="load-field-row" style={{ marginBottom: 0, minWidth: '120px', flex: 1 }}>
          <label className="load-field-label">電線種類</label>
          <select
            className="form-control form-control-sm"
            value={entry.wiring.wireTypeId}
            onChange={(e) => handleWireTypeChange(e.target.value as WireTypeId | '')}
          >
            <option value="">— 未選択 —</option>
            {WIRE_TYPES.filter((wireType) => wireType.active).map((wireType) => (
              <option key={wireType.id} value={wireType.id}>{wireType.displayName}</option>
            ))}
          </select>
        </div>

        {/* 電線仕様 */}
        <div className="load-field-row" style={{ marginBottom: 0, minWidth: '150px', flex: 1.4 }}>
          <label className="load-field-label">電線仕様</label>
          <select
            className="form-control form-control-sm"
            value={entry.wiring.specId}
            onChange={(e) => updateWiring({ specId: e.target.value })}
            disabled={!selectedWireType}
          >
            <option value="">— 未選択 —</option>
            {availableSpecs.map((spec) => (
              <option key={spec.id} value={spec.id}>{spec.specDisplay}</option>
            ))}
          </select>
        </div>

        {/* 敷設方法 */}
        <div className="load-field-row" style={{ marginBottom: 0, minWidth: '110px', flex: 1 }}>
          <label className="load-field-label">敷設方法</label>
          <select
            className="form-control form-control-sm"
            value={entry.wiring.installationMethod}
            onChange={(e) => updateWiring({ installationMethod: e.target.value as InstallationMethod })}
          >
            {INSTALLATION_METHODS.map((method) => (
              <option key={method} value={method}>{method}</option>
            ))}
          </select>
        </div>

        {showWireCount && (
          <div className="load-field-row" style={{ marginBottom: 0, minWidth: '150px', flex: 1 }}>
            <label className="load-field-label">電流が流れる電線数</label>
            <select
              className="form-control form-control-sm"
              value={entry.wiring.wireCount}
              onChange={(e) => updateWiring({ wireCount: e.target.value as WireCount })}
            >
              {WIRE_COUNTS.map((count) => (
                <option key={count} value={count}>{count}</option>
              ))}
            </select>
          </div>
        )}

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
