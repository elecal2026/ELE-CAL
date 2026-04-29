export type LoadType = 'general' | 'motor' | 'welder'
export type WireType = 'CV' | 'CVT' | 'IV' | 'VVF'
export type StartMethod = 'direct' | 'starDelta'
export type System = 'single2' | 'single3' | 'three'

export interface WiringConfig {
  wireType: WireType | ''   // 空文字 = 未選択
  wireSize: string           // 空文字 = 未選択
  wireLength: string
}

export interface LoadEntry {
  id: string
  name: string
  type: LoadType
  powerKw: string
  startMethod: StartMethod
  usageRate: string
  wiring: WiringConfig      // 各行が必ず持つ（未選択は空文字）
}

export interface MotorTableRow {
  kw: number
  fullLoadCurrent: number
  cv: { minWire: string; maxLength: number }
  conduitVV: { minWire: string; maxLength: number }
  insulator: { minWire: string; maxLength: number }
  breakerDirect: number
  breakerStarDelta: number | null
  motorBreakerDirect: number
  motorBreakerStarDelta: number | null
  groundWire: string
}

export interface WelderTableRow {
  maxInputKva: number
  threePhase200: { minWire: string } | null
  threePhase400: { minWire: string } | null
  singlePhase200: { minWire: string } | null
  singlePhase400: { minWire: string } | null
  conduitVV: { minWire: string } | null
  switchCapacity: number
  fuseB: number
  breaker: number
}

export interface WireVerification {
  loadIndex: number
  loadName: string
  wireType: string
  wireSize: string
  wireLength: number
  wireSizeMm2: number
  allowableCurrent: number | null
  isAllowableOk: boolean | null     // ブレーカー定格 ≦ 許容電流
  voltageDrop: number | null        // 電圧降下(V)
  voltageDropRate: number | null    // 電圧降下率(%)
  vdJudge: 'ok' | 'warn' | 'ng' | null
  recommendedSize: string | null    // 推奨電線サイズ（現在が不適切な場合）
}

export interface BreakerResult {
  totalPowerKw: number
  loadCurrent: number
  marginCurrent: number
  selectedBreaker: number | null
  pole: string
  poleDesc: string
  systemName: string
  K: number
  kDisplay: string
  motorTableResult: MotorTableRow | null
  welderTableResult: WelderTableRow | null
}
