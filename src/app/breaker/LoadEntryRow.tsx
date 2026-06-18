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
  const loadTypeId = `${entry.id}-type`
  const powerId = `${entry.id}-power`
  const startMethodId = `${entry.id}-start-method`
  const usageRateId = `${entry.id}-usage-rate`
  const wireTypeId = `${entry.id}-wire-type`
  const specId = `${entry.id}-wire-spec`
  const installationMethodId = `${entry.id}-installation-method`
  const wireCountId = `${entry.id}-wire-count`
  const wireLengthId = `${entry.id}-wire-length`

  return (
    <div className="load-entry-row">
      {/* メイン行: 負荷種類・kW・始動方式・削除 */}
      <div className="load-entry-main breaker-load-main">
        <span className="load-entry-number breaker-load-number">{index + 1}</span>

        <div className="tool-form-field breaker-load-type-field">
          <label className="tool-form-label" htmlFor={loadTypeId}>負荷種類</label>
          <select
            id={loadTypeId}
            className="load-type-select"
            value={entry.type}
            onChange={(e) => update({ type: e.target.value as LoadType })}
          >
            {(Object.entries(LOAD_TYPE_LABELS) as [LoadType, string][]).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>

        <div className="tool-form-field breaker-load-power-field">
          <label className="tool-form-label" htmlFor={powerId}>消費電力</label>
          <div className="tool-control-with-unit">
            <input
              id={powerId}
              type="number"
              className="form-control form-control-sm"
              placeholder="例: 5.5"
              min="0"
              step="0.1"
              value={entry.powerKw}
              onChange={(e) => update({ powerKw: e.target.value })}
            />
            <span className="tool-control-unit">kW</span>
          </div>
        </div>

        {entry.type === 'motor' && (
          <div className="tool-form-field breaker-load-extra-field">
            <label className="tool-form-label" htmlFor={startMethodId}>始動方式</label>
            <select
              id={startMethodId}
              className="form-control form-control-sm"
              value={entry.startMethod}
              onChange={(e) => update({ startMethod: e.target.value as StartMethod })}
            >
              {(Object.entries(START_METHOD_LABELS) as [StartMethod, string][]).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
        )}

        {entry.type === 'welder' && (
          <div className="tool-form-field breaker-load-extra-field">
            <label className="tool-form-label" htmlFor={usageRateId}>使用率</label>
            <div className="tool-control-with-unit">
              <input
                id={usageRateId}
                type="number"
                className="form-control form-control-sm"
                placeholder="例: 50"
                min="0"
                max="100"
                step="5"
                value={entry.usageRate}
                onChange={(e) => update({ usageRate: e.target.value })}
              />
              <span className="tool-control-unit">%</span>
            </div>
          </div>
        )}

        <button className="load-remove-btn breaker-load-remove" onClick={onRemove} title="削除">
          ×
        </button>
      </div>

      {/* 配線設定（常時表示） */}
      <div className="breaker-load-wiring-grid">
        {/* 電線種類 */}
        <div className="tool-form-field">
          <label className="tool-form-label" htmlFor={wireTypeId}>電線種類</label>
          <select
            id={wireTypeId}
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
        <div className="tool-form-field">
          <label className="tool-form-label" htmlFor={specId}>電線仕様</label>
          <select
            id={specId}
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
        <div className="tool-form-field">
          <label className="tool-form-label" htmlFor={installationMethodId}>敷設方法</label>
          <select
            id={installationMethodId}
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
          <div className="tool-form-field">
            <label className="tool-form-label" htmlFor={wireCountId}>電流が流れる電線数</label>
            <select
              id={wireCountId}
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
        <div className="tool-form-field">
          <label className="tool-form-label" htmlFor={wireLengthId}>長さ</label>
          <div className="tool-control-with-unit">
            <input
              id={wireLengthId}
              type="number"
              className="form-control form-control-sm"
              placeholder="例: 20"
              min="0"
              step="1"
              value={entry.wiring.wireLength}
              onChange={(e) => updateWiring({ wireLength: e.target.value })}
            />
            <span className="tool-control-unit">m</span>
          </div>
        </div>
      </div>

      {/* バリデーションメッセージ */}
      {errorIssues.length > 0 && (
        <div className="breaker-load-messages">
          {errorIssues.map((issue) => (
            <div key={issue.id} className="validation-error">{issue.message}</div>
          ))}
        </div>
      )}
      {warningIssues.length > 0 && (
        <div className="breaker-load-messages">
          {warningIssues.map((issue) => (
            <div key={issue.id} className="validation-warning">{issue.message}</div>
          ))}
        </div>
      )}
    </div>
  )
}
