import { BREAKER_RATINGS, ELECTRIC_23H_TABLE, ELECTRIC_MICOM_TABLE, GENERAL_TABLE } from './data'
import type {
  ApartmentInput,
  ApartmentResult,
  CapacityGroup,
  CommonItem,
  ContractAmp,
  DistributionSystem,
  RatedVoltage,
  SystemSummary,
} from './types'

const SYSTEM_BREAKER_RATINGS = [15, 20, 30, ...BREAKER_RATINGS] as const

function normalizeVoltage(system: DistributionSystem, voltage: RatedVoltage): RatedVoltage {
  return system === 'singlePhase2Wire' ? voltage : 200
}

function systemKey(system: DistributionSystem, voltage: RatedVoltage): string {
  return `${system}-${normalizeVoltage(system, voltage)}`
}

function systemLabel(system: DistributionSystem, voltage: RatedVoltage): string {
  const normalizedVoltage = normalizeVoltage(system, voltage)
  if (system === 'singlePhase2Wire') return `単相2線・${normalizedVoltage}V`
  if (system === 'singlePhase3Wire') return '単相3線・100/200V'
  return '三相3線・200V'
}

function ampToKva(amp: ContractAmp): number {
  return amp / 10
}

function commonItemToKva(item: CommonItem): number {
  const voltage = normalizeVoltage(item.distributionSystem, item.voltage)
  const factor = item.distributionSystem === 'threePhase3Wire' ? Math.sqrt(3) : 1
  return item.capacities.reduce(
    (sum, capacity) => sum + factor * voltage * capacity.amps * capacity.quantity / 1000,
    0,
  )
}

function groupUnits(group: CapacityGroup): number {
  return group.capacities.reduce((sum, capacity) => sum + capacity.units, 0)
}

function groupRawKva(group: CapacityGroup): number {
  return group.capacities.reduce(
    (sum, capacity) => sum + ampToKva(capacity.contractAmp) * capacity.units,
    0,
  )
}

function kvaToCurrent(
  kva: number,
  system: DistributionSystem,
  voltage: RatedVoltage,
): number {
  const normalizedVoltage = normalizeVoltage(system, voltage)
  const denominator = system === 'threePhase3Wire'
    ? Math.sqrt(3) * normalizedVoltage
    : normalizedVoltage
  return Math.ceil(kva * 1000 / denominator)
}

function selectBreaker(currentA: number): number {
  return (SYSTEM_BREAKER_RATINGS as readonly number[]).find(r => r >= currentA)
    ?? SYSTEM_BREAKER_RATINGS[SYSTEM_BREAKER_RATINGS.length - 1]
}

function buildSystemSummaries({
  groups,
  demandRate,
  commonItems,
  electricDwellingKva,
}: {
  groups: CapacityGroup[]
  demandRate: number
  commonItems: CommonItem[]
  electricDwellingKva?: number
}): SystemSummary[] {
  const summaries = new Map<string, {
    distributionSystem: DistributionSystem
    voltage: RatedVoltage
    dwellingKva: number
    commonKva: number
  }>()

  const add = (
    distributionSystem: DistributionSystem,
    voltage: RatedVoltage,
    dwellingKva: number,
    commonKva: number,
  ) => {
    const normalizedVoltage = normalizeVoltage(distributionSystem, voltage)
    const key = systemKey(distributionSystem, normalizedVoltage)
    const current = summaries.get(key) ?? {
      distributionSystem,
      voltage: normalizedVoltage,
      dwellingKva: 0,
      commonKva: 0,
    }
    current.dwellingKva += dwellingKva
    current.commonKva += commonKva
    summaries.set(key, current)
  }

  if (electricDwellingKva !== undefined) {
    add('singlePhase3Wire', 200, electricDwellingKva, 0)
  } else {
    groups.forEach((group) => {
      const rawKva = groupRawKva(group)
      add(group.distributionSystem, group.voltage, rawKva * demandRate / 100, 0)
    })
  }

  commonItems.forEach((item) => {
    add(item.distributionSystem, item.voltage, 0, commonItemToKva(item))
  })

  return Array.from(summaries.entries()).map(([key, summary]) => {
    const totalKva = summary.dwellingKva + summary.commonKva
    const currentA = kvaToCurrent(totalKva, summary.distributionSystem, summary.voltage)
    return {
      key,
      label: systemLabel(summary.distributionSystem, summary.voltage),
      ...summary,
      totalKva,
      currentA,
      breakerA: selectBreaker(currentA),
    }
  })
}

export function calculateApartment(input: ApartmentInput): ApartmentResult | null {
  const totalUnits = input.groups.reduce((sum, g) => sum + groupUnits(g), 0)
  if (totalUnits === 0) return null

  const commonKva = input.commonItems.reduce((sum, item) => sum + commonItemToKva(item), 0)

  // 全電化：標準表値のみ
  if (input.housingType !== 'general') {
    const maxUnits = 16
    if (totalUnits > maxUnits) {
      return { mode: 'out_of_range', totalUnits, totalRawKva: 0, isGeneral: false }
    }
    const table = input.housingType === 'electric23h' ? ELECTRIC_23H_TABLE : ELECTRIC_MICOM_TABLE
    const electricRow = table.find(r => r.units === totalUnits) ?? null
    return {
      mode: 'electric',
      housingType: input.housingType,
      totalUnits,
      electricRow,
      commonKva,
      maxLoadKva: (electricRow?.maxLoadKva ?? 0) + commonKva,
      systemSummaries: buildSystemSummaries({
        groups: input.groups,
        demandRate: 100,
        commonItems: input.commonItems,
        electricDwellingKva: electricRow?.maxLoadKva,
      }),
    }
  }

  // 一般集合住宅：積み上げ計算
  const totalRawKva = input.groups.reduce((sum, g) => sum + groupRawKva(g), 0)

  if (totalUnits > 40) {
    return { mode: 'out_of_range', totalUnits, totalRawKva, isGeneral: true }
  }

  const standardRow = GENERAL_TABLE.find(r => r.units === totalUnits)
  if (!standardRow) return null

  const demandRate = standardRow.demandRate
  const dwellingLoadKva = totalRawKva * (demandRate / 100)
  const maxLoadKva = dwellingLoadKva + commonKva
  const systemSummaries = buildSystemSummaries({
    groups: input.groups,
    demandRate,
    commonItems: input.commonItems,
  })
  const standardElectricalApplicable = input.groups.every(
    group => group.distributionSystem === 'singlePhase3Wire',
  )

  return {
    mode: 'general',
    totalUnits,
    totalRawKva,
    demandRate,
    dwellingLoadKva,
    commonKva,
    maxLoadKva,
    systemSummaries,
    standardElectricalApplicable,
    standardRow,
    diffKva: dwellingLoadKva - standardRow.maxLoadKva,
  }
}
