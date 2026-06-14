export type HousingType = 'general' | 'electric23h' | 'electricMicom'
export type DistributionSystem = 'singlePhase2Wire' | 'singlePhase3Wire' | 'threePhase3Wire'
export type RatedVoltage = 100 | 200

export const CONTRACT_AMPS = [30, 40, 50, 60] as const
export type ContractAmp = typeof CONTRACT_AMPS[number]

export interface CapacityGroup {
  id: string
  distributionSystem: DistributionSystem
  voltage: RatedVoltage
  contractAmp: ContractAmp
  units: number
}

export const COMMON_AMPS = [10, 15, 20, 30, 40, 50, 60, 75, 100, 125, 150, 200] as const

export interface CommonItem {
  id: string
  name: string
  distributionSystem: DistributionSystem
  voltage: RatedVoltage
  amps: number
  quantity: number
}

export interface ApartmentInput {
  housingType: HousingType
  groups: CapacityGroup[]
  commonItems: CommonItem[]
}

export interface SystemSummary {
  key: string
  label: string
  distributionSystem: DistributionSystem
  voltage: RatedVoltage
  dwellingKva: number
  commonKva: number
  totalKva: number
  currentA: number
  breakerA: number
}

export interface GeneralRow {
  units: number
  demandRate: number
  maxLoadKva: number
  currentA: number
  breakerA: number
  cableMm2: number
}

export interface ElectricRow {
  units: number
  demandRate: number
  overlapRate: number
  heaterKva: number
  maxLoadKva: number
  currentA: number
  breakerA: number
  cableMm2: number
}

export type ApartmentTableRow = GeneralRow | ElectricRow

export type ApartmentResult =
  | {
      mode: 'general'
      totalUnits: number
      totalRawKva: number
      demandRate: number
      dwellingLoadKva: number
      commonKva: number
      maxLoadKva: number
      systemSummaries: SystemSummary[]
      standardElectricalApplicable: boolean
      standardRow: GeneralRow
      diffKva: number
    }
  | {
      mode: 'electric'
      housingType: 'electric23h' | 'electricMicom'
      totalUnits: number
      electricRow: ElectricRow | null
      commonKva: number
      maxLoadKva: number
      systemSummaries: SystemSummary[]
    }
  | {
      mode: 'out_of_range'
      totalUnits: number
      totalRawKva: number
      isGeneral: boolean
    }
