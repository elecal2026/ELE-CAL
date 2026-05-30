import { HOUSING_TYPE_LABELS, HOUSING_TYPE_MAX_UNITS } from './data'
import type { ApartmentInput, DistributionSystem, HousingType } from './types'
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
              {isPaywalled && (
                <span aria-hidden="true" style={{ marginRight: '0.25em' }}>🔒</span>
              )}
              {opt.label}
            </span>
          </label>
        )
      })}
    </div>
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
  const maxUnits = HOUSING_TYPE_MAX_UNITS[input.housingType]
  const errors = issues.filter(issue => issue.level === 'error')

  const setUnits = (units: number) => {
    onChange({ ...input, units })
  }

  const setHousingType = (housingType: HousingType) => {
    const nextMax = HOUSING_TYPE_MAX_UNITS[housingType]
    onChange({
      ...input,
      housingType,
      units: Math.min(input.units, nextMax),
    })
  }

  const setDistributionSystem = (distributionSystem: DistributionSystem) => {
    onChange({ ...input, distributionSystem })
  }

  const paywallHousingTypes: HousingType[] = isPaid ? [] : ['electric23h', 'electricMicom']

  return (
    <section className="card vd2-section-card">
      <p className="card-title">入力条件</p>

      <div style={{
        padding: '0.75rem 0.9rem',
        marginBottom: '1rem',
        background: 'var(--accent-bg)',
        border: '1.5px solid var(--accent-border)',
        borderRadius: '8px',
        color: 'var(--accent-dark)',
        fontSize: '0.84rem',
        fontWeight: 700,
        lineHeight: 1.6,
      }}>
        住戸面積100m²基準（内線規程 資料 3-6-1 / 3-6-2 準拠）
      </div>

      <div className="form-group">
        <label className="form-label" htmlFor="apartment-units">
          戸数
          <span style={{ marginLeft: '0.5rem', color: 'var(--text-muted)', fontSize: '0.78rem', fontWeight: 500 }}>
            {HOUSING_TYPE_LABELS[input.housingType]}は1〜{maxUnits}戸
          </span>
        </label>
        <div className="qty-control" style={{ maxWidth: '180px' }}>
          <button
            type="button"
            aria-label="戸数を減らす"
            onClick={() => setUnits(Math.max(1, input.units - 1))}
          >
            -
          </button>
          <input
            id="apartment-units"
            type="number"
            min={1}
            max={maxUnits}
            step={1}
            value={input.units}
            onChange={(e) => setUnits(Number.parseInt(e.target.value, 10) || 0)}
          />
          <button
            type="button"
            aria-label="戸数を増やす"
            onClick={() => setUnits(Math.min(maxUnits, input.units + 1))}
          >
            +
          </button>
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">住宅タイプ</label>
        <ChipGroup
          name="housing-type"
          value={input.housingType}
          onChange={setHousingType}
          paywallValues={paywallHousingTypes}
          onPaywall={onRequirePaid}
          options={[
            { label: '一般', value: 'general' },
            { label: '全電化 23時', value: 'electric23h' },
            { label: '全電化 マイコン', value: 'electricMicom' },
          ]}
        />
      </div>

      <div className="form-group">
        <label className="form-label">配電方式</label>
        <ChipGroup
          name="distribution-system"
          value={input.distributionSystem}
          onChange={setDistributionSystem}
          options={[
            { label: '単相3線', value: 'singlePhase3Wire' },
            { label: '三相3線', value: 'threePhase3Wire' },
          ]}
        />
      </div>

      {errors.length > 0 && (
        <div style={{ marginTop: '0.75rem' }}>
          {errors.map(issue => (
            <div key={issue.id} className="validation-error">{issue.message}</div>
          ))}
        </div>
      )}
    </section>
  )
}
