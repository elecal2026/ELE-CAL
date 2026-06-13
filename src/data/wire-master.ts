import wireMasterJson from './wire-master.json'

export type WireTypeId = 'IV' | 'HIV' | 'VVF' | 'VVR' | 'CV' | 'CVD' | 'CVT'
export type WireSizeUnit = 'mm' | 'mm²'
export type WireCoreLabel = '単心' | '2心' | '3心' | '4心' | null

export interface WireType {
  id: WireTypeId
  displayName: string
  sortOrder: number
  active: boolean
}

export interface WireSpec {
  id: string
  wireTypeId: WireTypeId
  sizeValue: number
  sizeText: string
  sizeUnit: WireSizeUnit
  coreLabel: WireCoreLabel
  variantLabel: string | null
  specDisplay: string
  fullDisplay: string
  sourceScope: 'rakuda'
}

export interface WireMaster {
  version: string
  source: string
  wireTypes: WireType[]
  specs: WireSpec[]
}

export const WIRE_MASTER = wireMasterJson as unknown as WireMaster
export const WIRE_TYPES = WIRE_MASTER.wireTypes
export const WIRE_SPECS = WIRE_MASTER.specs

export function getWireSpecsByType(wireTypeId: WireTypeId): WireSpec[] {
  return WIRE_SPECS.filter((spec) => spec.wireTypeId === wireTypeId)
}

export function getWireSpecById(specId: string): WireSpec | undefined {
  return WIRE_SPECS.find((spec) => spec.id === specId)
}
