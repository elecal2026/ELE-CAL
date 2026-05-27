export type HousingType = 'general' | 'electric23h' | 'electricMicom'

export type DistributionSystem = 'singlePhase3Wire' | 'threePhase3Wire'

export interface ApartmentInput {
  units: number
  housingType: HousingType
  distributionSystem: DistributionSystem
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

export interface ApartmentResult {
  input: ApartmentInput
  sourceTitle: string
  row: ApartmentTableRow
  threePhaseCurrentA: number | null
  isThreePhase: boolean
}
