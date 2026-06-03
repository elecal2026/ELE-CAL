import { BREAKER_RATINGS, ELECTRIC_23H_TABLE, ELECTRIC_MICOM_TABLE, GENERAL_TABLE } from './data'
import type { ApartmentInput, ApartmentResult, ContractAmp } from './types'

function ampToKva(amp: ContractAmp): number {
  return amp / 10
}

function selectBreaker(currentA: number): number {
  return (BREAKER_RATINGS as readonly number[]).find(r => r >= currentA)
    ?? BREAKER_RATINGS[BREAKER_RATINGS.length - 1]
}

export function calculateApartment(input: ApartmentInput): ApartmentResult | null {
  const totalUnits = input.groups.reduce((sum, g) => sum + g.units, 0)
  if (totalUnits === 0) return null

  const isThreePhase = input.distributionSystem === 'threePhase3Wire'

  // 全電化：標準表値のみ
  if (input.housingType !== 'general') {
    const maxUnits = 16
    if (totalUnits > maxUnits) {
      return { mode: 'out_of_range', totalUnits, totalRawKva: 0, isGeneral: false }
    }
    const table = input.housingType === 'electric23h' ? ELECTRIC_23H_TABLE : ELECTRIC_MICOM_TABLE
    const electricRow = table.find(r => r.units === totalUnits) ?? null
    return { mode: 'electric', housingType: input.housingType, totalUnits, electricRow }
  }

  // 一般集合住宅：積み上げ計算
  const totalRawKva = input.groups.reduce((sum, g) => sum + ampToKva(g.contractAmp) * g.units, 0)

  if (totalUnits > 40) {
    return { mode: 'out_of_range', totalUnits, totalRawKva, isGeneral: true }
  }

  const standardRow = GENERAL_TABLE.find(r => r.units === totalUnits)
  if (!standardRow) return null

  const demandRate = standardRow.demandRate
  const dwellingLoadKva = totalRawKva * (demandRate / 100)
  const maxLoadKva = dwellingLoadKva + input.commonKva
  const currentA = Math.ceil(maxLoadKva * 1000 / 200)
  const breakerA = selectBreaker(currentA)
  const threePhaseCurrentA = isThreePhase
    ? Math.round(maxLoadKva * 1000 / (Math.sqrt(3) * 200))
    : null

  return {
    mode: 'general',
    totalUnits,
    totalRawKva,
    demandRate,
    dwellingLoadKva,
    commonKva: input.commonKva,
    maxLoadKva,
    currentA,
    breakerA,
    isThreePhase,
    threePhaseCurrentA,
    standardRow,
    diffKva: maxLoadKva - standardRow.maxLoadKva,
  }
}
