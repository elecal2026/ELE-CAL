import type { WireSpec } from '@/data/wire-master'

export interface CablePhysicalData {
  od: number
  mass: number
}

// Representative finished outer diameter and mass values used by tools that
// need cable dimensions. Unsupported common-master specifications stay
// selectable and are handled as not applicable by each tool.
const CABLE_PHYSICAL_TABLE: Record<string, CablePhysicalData> = {
  'CV|1|2': { od: 10, mass: 0.09 },
  'CV|1|3.5': { od: 10, mass: 0.11 },
  'CV|1|5.5': { od: 12, mass: 0.14 },
  'CV|1|8': { od: 13, mass: 0.18 },
  'CV|1|14': { od: 16, mass: 0.26 },
  'CV|1|22': { od: 18, mass: 0.37 },
  'CV|1|38': { od: 20, mass: 0.60 },
  'CV|1|60': { od: 23, mass: 0.90 },
  'CV|1|100': { od: 28, mass: 1.45 },
  'CV|1|150': { od: 33, mass: 2.10 },
  'CV|1|200': { od: 37, mass: 2.73 },
  'CV|1|250': { od: 41, mass: 3.40 },
  'CV|1|325': { od: 46, mass: 4.40 },
  'CV|2|2': { od: 19, mass: 0.29 },
  'CV|2|3.5': { od: 21, mass: 0.37 },
  'CV|2|5.5': { od: 24, mass: 0.50 },
  'CV|2|8': { od: 27, mass: 0.66 },
  'CV|2|14': { od: 32, mass: 0.98 },
  'CV|2|22': { od: 38, mass: 1.45 },
  'CV|2|38': { od: 47, mass: 2.29 },
  'CV|2|60': { od: 56, mass: 3.40 },
  'CV|2|100': { od: 71, mass: 5.48 },
  'CV|3|2': { od: 22, mass: 0.38 },
  'CV|3|3.5': { od: 24, mass: 0.49 },
  'CV|3|5.5': { od: 27, mass: 0.67 },
  'CV|3|8': { od: 31, mass: 0.90 },
  'CV|3|14': { od: 37, mass: 1.34 },
  'CV|3|22': { od: 44, mass: 1.99 },
  'CV|3|38': { od: 54, mass: 3.13 },
  'CV|3|60': { od: 64, mass: 4.65 },
  'CV|3|100': { od: 81, mass: 7.44 },
  'CVT|3|8': { od: 28, mass: 0.76 },
  'CVT|3|14': { od: 33, mass: 1.10 },
  'CVT|3|22': { od: 39, mass: 1.61 },
  'CVT|3|38': { od: 47, mass: 2.54 },
  'CVT|3|60': { od: 56, mass: 3.74 },
  'CVT|3|100': { od: 72, mass: 5.99 },
  'CVT|3|150': { od: 85, mass: 8.74 },
  'CVT|3|200': { od: 96, mass: 11.44 },
  'CVT|3|250': { od: 106, mass: 14.13 },
  'CVT|3|325': { od: 120, mass: 18.32 },
  'VVF|2|1.6': { od: 11, mass: 0.14 },
  'VVF|2|2.0': { od: 13, mass: 0.17 },
  'VVF|2|2.6': { od: 16, mass: 0.24 },
  'VVF|3|1.6': { od: 13, mass: 0.19 },
  'VVF|3|2.0': { od: 15, mass: 0.24 },
  'VVF|3|2.6': { od: 18, mass: 0.33 },
}

function getCableTableKey(spec: WireSpec): string | undefined {
  if (spec.wireTypeId === 'CV') {
    const core = spec.coreLabel === '単心' ? '1' : spec.coreLabel?.replace('心', '')
    if (core !== '1' && core !== '2' && core !== '3') return undefined
    return `CV|${core}|${spec.sizeText}`
  }

  if (spec.wireTypeId === 'CVT') {
    return `CVT|3|${spec.sizeText}`
  }

  if (spec.wireTypeId === 'VVF' && !spec.variantLabel) {
    const core = spec.coreLabel?.replace('心', '')
    if (core !== '2' && core !== '3') return undefined
    return `VVF|${core}|${spec.sizeText}`
  }

  return undefined
}

export function getCablePhysicalData(spec: WireSpec): CablePhysicalData | undefined {
  const key = getCableTableKey(spec)
  return key ? CABLE_PHYSICAL_TABLE[key] : undefined
}
