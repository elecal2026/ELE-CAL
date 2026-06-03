import { CONTRACT_AMPS } from './types'
import type { ApartmentInput, ContractAmp, DistributionSystem, HousingType } from './types'
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
  const totalUnits = input.groups.reduce((sum, g) => sum + g.units, 0)
  const errors = issues.filter(i => i.level === 'error')

  const setHousingType = (housingType: HousingType) => {
    onChange({ ...input, housingType })
  }

  const setDistributionSystem = (distributionSystem: DistributionSystem) => {
    onChange({ ...input, distributionSystem })
  }

  const setGroupUnits = (amp: ContractAmp, units: number) => {
    const next = input.groups.map(g =>
      g.contractAmp === amp ? { ...g, units: Math.max(0, units) } : g
    )
    onChange({ ...input, groups: next })
  }

  const setCommonKva = (value: number) => {
    onChange({ ...input, commonKva: Math.max(0, value) })
  }

  const paywallHousingTypes: HousingType[] = isPaid ? [] : ['electric23h', 'electricMicom']

  return (
    <section className="card vd2-section-card">
      <p className="card-title">入力条件</p>

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

      <div className="form-group">
        <label className="form-label">
          住戸契約容量
          {isElectric && (
            <span style={{ marginLeft: '0.5rem', color: 'var(--text-muted)', fontSize: '0.78rem', fontWeight: 400 }}>
              （全電化は標準表値のみ参照）
            </span>
          )}
        </label>
        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '0 0 0.6rem', lineHeight: 1.4 }}>
          各住戸の契約Aを容量ごとに戸数で入力してください
        </p>

        <div
          style={{
            opacity: isElectric ? 0.4 : 1,
            pointerEvents: isElectric ? 'none' : undefined,
            transition: 'opacity 0.2s',
          }}
        >
          {CONTRACT_AMPS.map(amp => {
            const group = input.groups.find(g => g.contractAmp === amp)!
            return (
              <div
                key={amp}
                style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}
              >
                <span style={{ width: '3.5rem', textAlign: 'right', fontWeight: 700, color: 'var(--text-primary)', fontSize: '1rem' }}>
                  {amp}A
                </span>
                <div className="qty-control" style={{ maxWidth: '160px' }}>
                  <button
                    type="button"
                    aria-label={`${amp}Aを減らす`}
                    onClick={() => setGroupUnits(amp, group.units - 1)}
                  >
                    −
                  </button>
                  <input
                    type="number"
                    min={0}
                    max={40}
                    step={1}
                    value={group.units}
                    onChange={(e) => setGroupUnits(amp, Number.parseInt(e.target.value, 10) || 0)}
                  />
                  <button
                    type="button"
                    aria-label={`${amp}Aを増やす`}
                    onClick={() => setGroupUnits(amp, group.units + 1)}
                  >
                    ＋
                  </button>
                </div>
                <span style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>戸</span>
                {group.units > 0 && (
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    = {(amp / 10 * group.units).toFixed(1)} kVA
                  </span>
                )}
              </div>
            )
          })}

          <div style={{
            marginTop: '0.75rem',
            padding: '0.5rem 0.75rem',
            background: 'var(--bg-secondary)',
            borderRadius: '6px',
            fontSize: '0.88rem',
            display: 'flex',
            gap: '1.5rem',
          }}>
            <span>
              合計 <strong style={{ color: 'var(--text-primary)', fontSize: '1rem' }}>{totalUnits}</strong> 戸
            </span>
            {totalUnits > 0 && (
              <span style={{ color: 'var(--text-muted)' }}>
                住戸合計 {input.groups.reduce((sum, g) => sum + (g.contractAmp / 10) * g.units, 0).toFixed(1)} kVA（需要率前）
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="form-group">
        <label className="form-label" htmlFor="common-kva">
          共用部・その他加算負荷
          <span style={{ marginLeft: '0.5rem', color: 'var(--text-muted)', fontSize: '0.78rem', fontWeight: 400 }}>
            任意
          </span>
        </label>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <input
            id="common-kva"
            type="number"
            min={0}
            step={0.1}
            value={input.commonKva || ''}
            placeholder="0"
            onChange={(e) => setCommonKva(Number.parseFloat(e.target.value) || 0)}
            style={{ width: '90px', padding: '0.4rem 0.6rem', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '0.95rem' }}
          />
          <span style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>kVA</span>
        </div>
        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.25rem', lineHeight: 1.4 }}>
          共用灯・ポンプ・エレベーターなど別途算定済みの値を加算
        </p>
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
