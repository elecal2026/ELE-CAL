export type HousingType = 'general' | 'electric23h' | 'electricMicom'
export type DistributionSystem = 'singlePhase3Wire' | 'threePhase3Wire'

export const CONTRACT_AMPS = [30, 40, 50, 60] as const
export type ContractAmp = typeof CONTRACT_AMPS[number]

export interface CapacityGroup {
  contractAmp: ContractAmp
  units: number
}

export interface ApartmentInput {
  housingType: HousingType
  distributionSystem: DistributionSystem
  groups: CapacityGroup[]
  commonKva: number
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
      currentA: number
      breakerA: number
      isThreePhase: boolean
      threePhaseCurrentA: number | null
      standardRow: GeneralRow
      diffKva: number
    }
  | {
      mode: 'electric'
      housingType: 'electric23h' | 'electricMicom'
      totalUnits: number
      electricRow: ElectricRow | null
    }
  | {
      mode: 'out_of_range'
      totalUnits: number
      totalRawKva: number
      isGeneral: boolean
    }
