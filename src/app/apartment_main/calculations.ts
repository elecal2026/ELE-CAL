import {
  ELECTRIC_23H_TABLE,
  ELECTRIC_MICOM_TABLE,
  GENERAL_TABLE,
} from './data'
import type {
  ApartmentInput,
  ApartmentResult,
  ApartmentTableRow,
  ElectricRow,
  HousingType,
} from './types'
import { validateApartmentInput } from './validation'

const SOURCE_TITLES: Record<HousingType, string> = {
  general: '内線規程 資料 3-6-1（一般集合住宅）',
  electric23h: '内線規程 資料 3-6-2（23時一斉始動型電気温水器）',
  electricMicom: '内線規程 資料 3-6-2（マイコン制御型電気温水器）',
}

export function isElectricRow(row: ApartmentTableRow): row is ElectricRow {
  return 'overlapRate' in row
}

export function getApartmentRow(input: ApartmentInput): ApartmentTableRow | null {
  const table = input.housingType === 'general'
    ? GENERAL_TABLE
    : input.housingType === 'electric23h'
      ? ELECTRIC_23H_TABLE
      : ELECTRIC_MICOM_TABLE

  return table.find(row => row.units === input.units) ?? null
}

export function calculateApartment(input: ApartmentInput): ApartmentResult | null {
  const hasErrors = validateApartmentInput(input).some(issue => issue.level === 'error')
  if (hasErrors) return null

  const row = getApartmentRow(input)
  if (!row) return null

  const isThreePhase = input.distributionSystem === 'threePhase3Wire'

  return {
    input,
    sourceTitle: SOURCE_TITLES[input.housingType],
    row,
    isThreePhase,
    threePhaseCurrentA: isThreePhase
      ? Math.round((row.maxLoadKva * 1000) / (Math.sqrt(3) * 200))
      : null,
  }
}
