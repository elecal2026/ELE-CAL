'use client'

import { useMemo, useState } from 'react'

import SiteHeader from '@/components/SiteHeader'
import { usePaywall } from '@/components/PaywallProvider'
import { calculateApartment } from './calculations'
import InputPanel from './InputPanel'
import ResultPanel from './ResultPanel'
import type { ApartmentInput } from './types'
import { validateApartmentInput } from './validation'

const DEFAULT_INPUT: ApartmentInput = {
  housingType: 'general',
  groups: [{
    id: 'housing-1',
    distributionSystem: 'singlePhase3Wire',
    voltage: 200,
    contractAmp: 40,
    units: 10,
  }],
  commonItems: [],
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

        </div>

        <div className="breaker-result-col vd2-result-col">
          <ResultPanel result={result} issues={issues} />
          <div className="disclaimer">
            本ツールは、「内線規程 第14版 JEAC8001-2022」を参考資料の一つとして計算しております。計算結果は目安としてご利用いただき、最終的なご判断は、実際の条件をご確認のうえお客様にてお願いいたします。
          </div>
        </div>
      </div>
    </>
  )
}
