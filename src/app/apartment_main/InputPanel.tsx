import {
  COMMON_AMPS,
  COMMON_THREE_PHASE_AMPS,
  CONTRACT_AMPS,
  type ApartmentInput,
  type CapacityGroup,
  type CommonAmp,
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
      <input
        type="number"
        className="form-control apartment-quantity-input"
        min={0}
        step={1}
        value={value}
        aria-label={`${unit}数`}
        onChange={(e) => onChange(Math.max(0, Number.parseInt(e.target.value, 10) || 0))}
      />
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

function systemLabel(system: DistributionSystem, voltage: RatedVoltage): string {
  const normalizedVoltage = normalizeVoltage(system, voltage)
  if (system === 'singlePhase2Wire') return `単相2線・${normalizedVoltage}V`
  if (system === 'singlePhase3Wire') return '単相3線・100/200V'
  return '三相3線・200V'
}

function commonAmpOptions(system: DistributionSystem): readonly CommonAmp[] {
  return system === 'threePhase3Wire' ? COMMON_THREE_PHASE_AMPS : COMMON_AMPS
}

function HousingCard({
  group,
  disabled,
  isPaid,
  onChange,
  onDelete,
  onRequirePaid,
}: {
  group: CapacityGroup
  disabled: boolean
  isPaid: boolean
  onChange: (group: CapacityGroup) => void
  onDelete: () => void
  onRequirePaid: () => boolean
}) {
  const updateSystem = (distributionSystem: DistributionSystem) => {
    onChange({
      ...group,
      distributionSystem,
      voltage: normalizeVoltage(distributionSystem, group.voltage),
    })
  }

  const updateCapacity = (
    capacityId: string,
    patch: Partial<CapacityGroup['capacities'][number]>,
  ) => {
    onChange({
      ...group,
      capacities: group.capacities.map(capacity => (
        capacity.id === capacityId ? { ...capacity, ...patch } : capacity
      )),
    })
  }

  const addCapacity = () => {
    if (!onRequirePaid()) return
    onChange({
      ...group,
      capacities: [...group.capacities, {
        id: `housing-capacity-${Date.now()}-${group.capacities.length}`,
        contractAmp: 40,
        units: 1,
      }],
    })
  }

  const deleteCapacity = (capacityId: string) => {
    onChange({
      ...group,
      capacities: group.capacities.filter(capacity => capacity.id !== capacityId),
    })
  }

  return (
    <article className="apartment-entry-card">
      <div className="apartment-entry-card-header">
        <strong>{systemLabel(group.distributionSystem, group.voltage)}</strong>
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
      </div>

      {group.capacities.map((capacity, index) => (
        <div className="apartment-card-fields apartment-capacity-row" key={capacity.id}>
          <div className="form-group">
            <label className="form-label">各戸容量（A）</label>
            <select
              className="form-control"
              value={capacity.contractAmp}
              disabled={disabled}
              onChange={(e) => updateCapacity(capacity.id, { contractAmp: Number(e.target.value) as ContractAmp })}
            >
              {CONTRACT_AMPS.map(amp => <option key={amp} value={amp}>{amp}A</option>)}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">戸数</label>
            <QuantityControl
              value={capacity.units}
              unit="戸"
              onChange={(units) => updateCapacity(capacity.id, { units })}
            />
          </div>

          <div className="form-group apartment-capacity-actions">
            <label className="form-label">&nbsp;</label>
            <div className="apartment-capacity-action-buttons">
              {group.capacities.length > 1 && (
                <button
                  type="button"
                  className="btn-remove apartment-icon-button"
                  aria-label={`${index + 1}行目の容量を削除`}
                  disabled={disabled}
                  onClick={() => deleteCapacity(capacity.id)}
                >
                  <span className="apartment-action-icon" aria-hidden="true">🗑</span>
                  <span className="apartment-action-label">削除</span>
                </button>
              )}
              {index === group.capacities.length - 1 && (
                <button
                  className="btn-add apartment-icon-button"
                  type="button"
                  disabled={disabled}
                  onClick={addCapacity}
                >
                  {!isPaid && <span className="paywall-lock" aria-hidden="true">🔒</span>}
                  <span className="apartment-action-icon" aria-hidden="true">＋</span>
                  <span className="apartment-action-label">別の容量を追加</span>
                </button>
              )}
            </div>
          </div>
        </div>
      ))}

      {disabled && (
        <p className="apartment-card-note">
          全電化は戸数のみを使用し、配電方式・各戸容量は標準表の前提で計算します。
        </p>
      )}
    </article>
  )
}

function CommonCard({
  item,
  isPaid,
  onChange,
  onDelete,
  onRequirePaid,
}: {
  item: CommonItem
  isPaid: boolean
  onChange: (item: CommonItem) => void
  onDelete: () => void
  onRequirePaid: () => boolean
}) {
  const updateSystem = (distributionSystem: DistributionSystem) => {
    const options = commonAmpOptions(distributionSystem)
    onChange({
      ...item,
      distributionSystem,
      voltage: normalizeVoltage(distributionSystem, item.voltage),
      capacities: item.capacities.map(capacity => (
        options.some(amp => amp === capacity.amps)
          ? capacity
          : { ...capacity, amps: options[0] }
      )),
    })
  }

  const updateCapacity = (
    capacityId: string,
    patch: Partial<CommonItem['capacities'][number]>,
  ) => {
    onChange({
      ...item,
      capacities: item.capacities.map(capacity => (
        capacity.id === capacityId ? { ...capacity, ...patch } : capacity
      )),
    })
  }

  const addCapacity = () => {
    if (!onRequirePaid()) return
    onChange({
      ...item,
      capacities: [...item.capacities, {
        id: `common-capacity-${Date.now()}-${item.capacities.length}`,
        amps: commonAmpOptions(item.distributionSystem)[0],
        quantity: 1,
      }],
    })
  }

  const deleteCapacity = (capacityId: string) => {
    onChange({
      ...item,
      capacities: item.capacities.filter(capacity => capacity.id !== capacityId),
    })
  }

  return (
    <article className="apartment-entry-card">
      <div className="apartment-entry-card-header">
        <strong>{systemLabel(item.distributionSystem, item.voltage)}</strong>
        <button type="button" className="btn-remove" onClick={onDelete}>削除</button>
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
      </div>

      {item.capacities.map((capacity, index) => (
        <div className="apartment-card-fields apartment-capacity-row" key={capacity.id}>
          <div className="form-group">
            <label className="form-label">容量（A）</label>
            <select
              className="form-control"
              value={capacity.amps}
              onChange={(e) => updateCapacity(capacity.id, { amps: Number(e.target.value) as CommonAmp })}
            >
              {commonAmpOptions(item.distributionSystem).map(amp => (
                <option key={amp} value={amp}>{amp}A</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">数量</label>
            <QuantityControl
              value={capacity.quantity}
              unit="個"
              onChange={(quantity) => updateCapacity(capacity.id, { quantity })}
            />
          </div>

          <div className="form-group apartment-capacity-actions">
            <label className="form-label">&nbsp;</label>
            <div className="apartment-capacity-action-buttons">
              {item.capacities.length > 1 && (
                <button
                  type="button"
                  className="btn-remove apartment-icon-button"
                  aria-label={`${index + 1}行目の容量を削除`}
                  onClick={() => deleteCapacity(capacity.id)}
                >
                  <span className="apartment-action-icon" aria-hidden="true">🗑</span>
                  <span className="apartment-action-label">削除</span>
                </button>
              )}
              {index === item.capacities.length - 1 && (
                <button className="btn-add apartment-icon-button" type="button" onClick={addCapacity}>
                  {!isPaid && <span className="paywall-lock" aria-hidden="true">🔒</span>}
                  <span className="apartment-action-icon" aria-hidden="true">＋</span>
                  <span className="apartment-action-label">別の容量を追加</span>
                </button>
              )}
            </div>
          </div>
        </div>
      ))}
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
  const totalUnits = input.groups.reduce(
    (sum, group) => sum + group.capacities.reduce((groupSum, capacity) => groupSum + capacity.units, 0),
    0,
  )
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
        capacities: [{
          id: `housing-capacity-${Date.now()}`,
          contractAmp: 40,
          units: 1,
        }],
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
        distributionSystem: 'singlePhase2Wire',
        voltage: 100,
        capacities: [{
          id: `common-capacity-${Date.now()}`,
          amps: 10,
          quantity: 1,
        }],
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
              配電方式・電圧ごとに、各戸容量（A）と戸数をまとめて入力します。
            </p>
          </div>
          <span className="apartment-count-badge">合計 {totalUnits} 戸</span>
        </div>

        <div className="apartment-entry-list">
          {input.groups.map(group => (
            <HousingCard
              key={group.id}
              group={group}
              disabled={isElectric}
              isPaid={isPaid}
              onChange={updateGroup}
              onRequirePaid={onRequirePaid}
              onDelete={() => onChange({
                ...input,
                groups: input.groups.filter(item => item.id !== group.id),
              })}
            />
          ))}
        </div>

        <button className="btn-add apartment-section-add" type="button" onClick={addGroup}>
          {!isPaid && <span className="paywall-lock" aria-hidden="true">🔒</span>}
          ＋ 別の配電方式を追加
        </button>
      </section>

      <section className="card vd2-section-card">
        <div className="apartment-section-heading">
          <div>
            <p className="card-title">共用部</p>
            <p className="apartment-section-description">
              共用灯・ポンプ・エレベーターなど、別途確認した容量を配電方式ごとに入力します。
            </p>
          </div>
          <span className="apartment-count-badge">配電方式 {input.commonItems.length} 件</span>
        </div>

        {input.commonItems.length > 0 ? (
          <div className="apartment-entry-list">
            {input.commonItems.map(item => (
              <CommonCard
                key={item.id}
                item={item}
                isPaid={isPaid}
                onChange={updateCommonItem}
                onRequirePaid={onRequirePaid}
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

        <button className="btn-add apartment-section-add" type="button" onClick={addCommonItem}>
          {!isPaid && <span className="paywall-lock" aria-hidden="true">🔒</span>}
          ＋ 共用部の配電方式を追加
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
