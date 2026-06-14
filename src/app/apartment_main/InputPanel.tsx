import {
  COMMON_AMPS,
  CONTRACT_AMPS,
  type ApartmentInput,
  type CapacityGroup,
  type CommonItem,
  type ContractAmp,
  type DistributionSystem,
  type HousingType,
  type RatedVoltage,
} from './types'
import type { ValidationIssue } from './validation'

function ChipGroup<T extends string>({
  name,
  options,
  value,
  onChange,
  paywallValues,
  onPaywall,
}: {
  name: string
  options: { label: string; value: T }[]
  value: T
  onChange: (value: T) => void
  paywallValues?: T[]
  onPaywall?: () => boolean
}) {
  return (
    <div className="chips-group">
      {options.map((opt) => {
        const isActive = value === opt.value
        const isPaywalled = !isActive && (paywallValues?.includes(opt.value) ?? false)
        return (
          <label className="chip-label" key={opt.value}>
            <input
              type="radio"
              name={name}
              value={opt.value}
              checked={isActive}
              onChange={() => {
                if (!isPaywalled) onChange(opt.value)
              }}
              onClick={(e) => {
                if (isPaywalled) {
                  e.preventDefault()
                  const allowed = onPaywall?.() ?? false
                  if (allowed) onChange(opt.value)
                }
              }}
            />
            <span className="chip-text">
              {isPaywalled && <span aria-hidden="true" style={{ marginRight: '0.25em' }}>🔒</span>}
              {opt.label}
            </span>
          </label>
        )
      })}
    </div>
  )
}

function QuantityControl({
  value,
  unit,
  onChange,
}: {
  value: number
  unit: string
  onChange: (value: number) => void
}) {
  return (
    <div className="apartment-quantity-row">
      <div className="qty-control">
        <button type="button" aria-label={`${unit}を減らす`} onClick={() => onChange(Math.max(0, value - 1))}>−</button>
        <input
          type="number"
          min={0}
          step={1}
          value={value}
          onChange={(e) => onChange(Math.max(0, Number.parseInt(e.target.value, 10) || 0))}
        />
        <button type="button" aria-label={`${unit}を増やす`} onClick={() => onChange(value + 1)}>＋</button>
      </div>
      <span className="apartment-quantity-unit">{unit}</span>
    </div>
  )
}

function voltageOptions(system: DistributionSystem): { value: RatedVoltage; label: string }[] {
  if (system === 'singlePhase2Wire') {
    return [
      { value: 100, label: '100V' },
      { value: 200, label: '200V' },
    ]
  }
  if (system === 'singlePhase3Wire') return [{ value: 200, label: '100/200V' }]
  return [{ value: 200, label: '200V' }]
}

function normalizeVoltage(system: DistributionSystem, voltage: RatedVoltage): RatedVoltage {
  return voltageOptions(system).some(option => option.value === voltage)
    ? voltage
    : voltageOptions(system)[0].value
}

function HousingCard({
  group,
  disabled,
  onChange,
  onDelete,
}: {
  group: CapacityGroup
  disabled: boolean
  onChange: (group: CapacityGroup) => void
  onDelete: () => void
}) {
  const updateSystem = (distributionSystem: DistributionSystem) => {
    onChange({
      ...group,
      distributionSystem,
      voltage: normalizeVoltage(distributionSystem, group.voltage),
    })
  }

  return (
    <article className="apartment-entry-card">
      <div className="apartment-entry-card-header">
        <strong>住戸条件</strong>
        <button type="button" className="btn-remove" onClick={onDelete}>削除</button>
      </div>

      <div className="apartment-card-fields">
        <div className="form-group">
          <label className="form-label">配電方式</label>
          <select
            className="form-control"
            value={group.distributionSystem}
            disabled={disabled}
            onChange={(e) => updateSystem(e.target.value as DistributionSystem)}
          >
            <option value="singlePhase2Wire">単相2線</option>
            <option value="singlePhase3Wire">単相3線</option>
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">定格電圧</label>
          <select
            className="form-control"
            value={group.voltage}
            disabled={disabled || voltageOptions(group.distributionSystem).length === 1}
            onChange={(e) => onChange({ ...group, voltage: Number(e.target.value) as RatedVoltage })}
          >
            {voltageOptions(group.distributionSystem).map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">住戸契約容量</label>
          <select
            className="form-control"
            value={group.contractAmp}
            disabled={disabled}
            onChange={(e) => onChange({ ...group, contractAmp: Number(e.target.value) as ContractAmp })}
          >
            {CONTRACT_AMPS.map(amp => <option key={amp} value={amp}>{amp}A</option>)}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">戸数</label>
          <QuantityControl value={group.units} unit="戸" onChange={(units) => onChange({ ...group, units })} />
        </div>
      </div>

      {disabled && (
        <p className="apartment-card-note">
          全電化は戸数のみを使用し、配電方式・契約容量は標準表の前提で計算します。
        </p>
      )}
    </article>
  )
}

function CommonCard({
  item,
  onChange,
  onDelete,
}: {
  item: CommonItem
  onChange: (item: CommonItem) => void
  onDelete: () => void
}) {
  const updateSystem = (distributionSystem: DistributionSystem) => {
    onChange({
      ...item,
      distributionSystem,
      voltage: normalizeVoltage(distributionSystem, item.voltage),
    })
  }

  return (
    <article className="apartment-entry-card">
      <div className="apartment-entry-card-header">
        <strong>{item.name.trim() || '共用部負荷'}</strong>
        <button type="button" className="btn-remove" onClick={onDelete}>削除</button>
      </div>

      <div className="form-group">
        <label className="form-label">名称（任意）</label>
        <input
          className="form-control"
          type="text"
          value={item.name}
          placeholder="例：給水ポンプ"
          onChange={(e) => onChange({ ...item, name: e.target.value })}
        />
      </div>

      <div className="apartment-card-fields">
        <div className="form-group">
          <label className="form-label">配電方式</label>
          <select
            className="form-control"
            value={item.distributionSystem}
            onChange={(e) => updateSystem(e.target.value as DistributionSystem)}
          >
            <option value="singlePhase2Wire">単相2線</option>
            <option value="singlePhase3Wire">単相3線</option>
            <option value="threePhase3Wire">三相3線</option>
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">定格電圧</label>
          <select
            className="form-control"
            value={item.voltage}
            disabled={voltageOptions(item.distributionSystem).length === 1}
            onChange={(e) => onChange({ ...item, voltage: Number(e.target.value) as RatedVoltage })}
          >
            {voltageOptions(item.distributionSystem).map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">負荷電流</label>
          <select
            className="form-control"
            value={item.amps}
            onChange={(e) => onChange({ ...item, amps: Number(e.target.value) })}
          >
            {COMMON_AMPS.map(amp => <option key={amp} value={amp}>{amp}A</option>)}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">数量</label>
          <QuantityControl value={item.quantity} unit="台" onChange={(quantity) => onChange({ ...item, quantity })} />
        </div>
      </div>
    </article>
  )
}

export default function InputPanel({
  input,
  issues,
  isPaid,
  onChange,
  onRequirePaid,
}: {
  input: ApartmentInput
  issues: ValidationIssue[]
  isPaid: boolean
  onChange: (input: ApartmentInput) => void
  onRequirePaid: () => boolean
}) {
  const isElectric = input.housingType !== 'general'
  const totalUnits = input.groups.reduce((sum, group) => sum + group.units, 0)
  const errors = issues.filter(issue => issue.level === 'error')

  const updateGroup = (updated: CapacityGroup) => {
    onChange({ ...input, groups: input.groups.map(group => group.id === updated.id ? updated : group) })
  }

  const addGroup = () => {
    if (!onRequirePaid()) return
    onChange({
      ...input,
      groups: [...input.groups, {
        id: `housing-${Date.now()}`,
        distributionSystem: 'singlePhase3Wire',
        voltage: 200,
        contractAmp: 40,
        units: 1,
      }],
    })
  }

  const updateCommonItem = (updated: CommonItem) => {
    onChange({
      ...input,
      commonItems: input.commonItems.map(item => item.id === updated.id ? updated : item),
    })
  }

  const addCommonItem = () => {
    if (!onRequirePaid()) return
    onChange({
      ...input,
      commonItems: [...input.commonItems, {
        id: `common-${Date.now()}`,
        name: '',
        distributionSystem: 'singlePhase2Wire',
        voltage: 100,
        amps: 10,
        quantity: 1,
      }],
    })
  }

  const paywallHousingTypes: HousingType[] = isPaid ? [] : ['electric23h', 'electricMicom']

  return (
    <>
      <section className="card vd2-section-card">
        <p className="card-title">基本条件</p>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">住宅タイプ</label>
          <ChipGroup
            name="housing-type"
            value={input.housingType}
            onChange={(housingType) => onChange({ ...input, housingType })}
            paywallValues={paywallHousingTypes}
            onPaywall={onRequirePaid}
            options={[
              { label: '一般', value: 'general' },
              { label: '全電化 23時', value: 'electric23h' },
              { label: '全電化 マイコン', value: 'electricMicom' },
            ]}
          />
        </div>
      </section>

      <section className="card vd2-section-card">
        <div className="apartment-section-heading">
          <div>
            <p className="card-title">住宅用</p>
            <p className="apartment-section-description">
              配電方式・電圧・住戸契約容量が同じ住戸を、戸数ごとにまとめて入力します。
            </p>
          </div>
          <span className="apartment-count-badge">合計 {totalUnits} 戸</span>
        </div>

        <div className="apartment-entry-grid">
          {input.groups.map(group => (
            <HousingCard
              key={group.id}
              group={group}
              disabled={isElectric}
              onChange={updateGroup}
              onDelete={() => onChange({
                ...input,
                groups: input.groups.filter(item => item.id !== group.id),
              })}
            />
          ))}
        </div>

        <button className="btn-add" type="button" onClick={addGroup}>
          {!isPaid && <span className="paywall-lock" aria-hidden="true">🔒</span>}
          ＋ 住宅用条件を追加
        </button>
      </section>

      <section className="card vd2-section-card">
        <div className="apartment-section-heading">
          <div>
            <p className="card-title">共用部</p>
            <p className="apartment-section-description">
              共用灯・ポンプ・エレベーターなど、別途確認した負荷電流を入力します。
            </p>
          </div>
          <span className="apartment-count-badge">登録 {input.commonItems.length} 件</span>
        </div>

        {input.commonItems.length > 0 ? (
          <div className="apartment-entry-grid">
            {input.commonItems.map(item => (
              <CommonCard
                key={item.id}
                item={item}
                onChange={updateCommonItem}
                onDelete={() => onChange({
                  ...input,
                  commonItems: input.commonItems.filter(current => current.id !== item.id),
                })}
              />
            ))}
          </div>
        ) : (
          <p className="apartment-empty-note">共用部負荷がない場合は、追加せずに計算できます。</p>
        )}

        <button className="btn-add" type="button" onClick={addCommonItem}>
          {!isPaid && <span className="paywall-lock" aria-hidden="true">🔒</span>}
          ＋ 共用部負荷を追加
        </button>

        <div className="validation-warning">
          共用部負荷には住宅用の需要率を掛けず、入力した負荷を住戸需要負荷へ加算します。
        </div>
      </section>

      {errors.length > 0 && (
        <div style={{ marginTop: '0.75rem' }}>
          {errors.map(issue => <div key={issue.id} className="validation-error">{issue.message}</div>)}
        </div>
      )}
    </>
  )
}
