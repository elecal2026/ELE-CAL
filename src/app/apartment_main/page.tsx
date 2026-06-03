'use client'

import { useMemo, useState } from 'react'

import SiteHeader from '@/components/SiteHeader'
import { usePaywall } from '@/components/PaywallProvider'
import { calculateApartment } from './calculations'
import InputPanel from './InputPanel'
import ResultPanel from './ResultPanel'
import { CONTRACT_AMPS } from './types'
import type { ApartmentInput } from './types'
import { validateApartmentInput } from './validation'

const DEFAULT_INPUT: ApartmentInput = {
  housingType: 'general',
  distributionSystem: 'singlePhase3Wire',
  groups: CONTRACT_AMPS.map(amp => ({
    contractAmp: amp,
    units: amp === 40 ? 10 : 0,
  })),
  commonKva: 0,
}

export default function ApartmentMainPage() {
  const { isPaid, requirePaid } = usePaywall()
  const [input, setInput] = useState<ApartmentInput>(DEFAULT_INPUT)

  const issues = useMemo(() => validateApartmentInput(input), [input])
  const result = useMemo(() => calculateApartment(input), [input])

  return (
    <>
      <SiteHeader mode="sub" title="集合住宅幹線設計" />

      <div className="breaker-main vd2-main">
        <div className="breaker-input-col vd2-input-col">
          <InputPanel
            input={input}
            issues={issues}
            isPaid={isPaid}
            onChange={setInput}
            onRequirePaid={requirePaid}
          />

          <div className="formula-box" style={{ marginTop: '1.5rem', marginBottom: 0 }}>
            <div className="formula">内線規程 資料 3-6-1 / 3-6-2</div>
            <div>
              一般集合住宅は住戸契約容量の積み上げ計算値と同戸数の標準表値を比較表示します。
              住戸面積補正や戸数範囲外への外挿は行いません。
            </div>
          </div>
        </div>

        <div className="breaker-result-col vd2-result-col">
          <ResultPanel result={result} issues={issues} />
        </div>
      </div>
    </>
  )
}
