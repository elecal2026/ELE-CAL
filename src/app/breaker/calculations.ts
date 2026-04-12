import type { LoadEntry, System, StartMethod, MotorTableRow, WelderTableRow, WireVerification } from './types'
import {
  BREAKER_RATINGS, MOTOR_TABLE_SINGLE, WELDER_TABLE,
  ALLOWABLE_CURRENT, ALLOWABLE_CURRENT_SIZES,
  RX_DATA, COPPER_CONDUCTIVITY,
  WIRE_SIZE_TO_MM2, WIRE_SIZE_TO_KEY,
} from './constants'

/**
 * 溶接機の使用率を考慮した等価電力を計算
 * 連続等価電流 I = I₀√a (a = 使用率)
 * 電力もkW × √a で換算
 */
function welderEquivalentKw(powerKw: number, usageRate: number): number {
  return powerKw * Math.sqrt(usageRate / 100)
}

/**
 * 負荷リストから合計消費電力(kW)を算出
 * 溶接機は使用率を考慮した等価電力
 */
export function calcTotalPowerKw(loads: LoadEntry[]): number {
  return loads.reduce((sum, load) => {
    const kw = parseFloat(load.powerKw) || 0
    if (load.type === 'welder') {
      const rate = parseFloat(load.usageRate) || 50
      return sum + welderEquivalentKw(kw, rate)
    }
    return sum + kw
  }, 0)
}

/**
 * kW → 電流(A)変換
 * I = P / (K × V × cosθ)
 * K = 1(単相), √3(三相)
 */
export function calcLoadCurrent(
  powerKw: number,
  system: System,
  voltage: number,
  powerFactor: number
): number {
  const P = powerKw * 1000 // kW → W
  const K = system === 'three' ? Math.sqrt(3) : 1
  return P / (K * voltage * powerFactor)
}

/**
 * 3705-1表: 電動機1台の場合のテーブル引き
 * 入力kWに最も近い（以上の）行を返す
 */
export function lookupMotorSingle(kw: number): MotorTableRow | null {
  return MOTOR_TABLE_SINGLE.find(row => row.kw >= kw) ?? null
}

/**
 * 3330-1表: 溶接機のテーブル引き
 * kWからkVA概算: kVA ≈ kW / 力率 (溶接機は力率0.5~0.7程度)
 * 入力kVAに最も近い（以上の）行を返す
 */
export function lookupWelder(kva: number): WelderTableRow | null {
  return WELDER_TABLE.find(row => row.maxInputKva >= kva) ?? null
}

/**
 * ブレーカー定格を選定
 * BREAKER_RATINGSから、計算電流以上の最小値を選ぶ
 */
export function selectBreakerRating(current: number): number | null {
  return BREAKER_RATINGS.find(r => r >= current) ?? null
}

/**
 * 電動機の場合のブレーカー選定
 * 内線規程テーブルから直接引く
 */
export function selectMotorBreaker(
  kw: number,
  startMethod: StartMethod
): { breaker: number; motorBreaker: number } | null {
  const row = lookupMotorSingle(kw)
  if (!row) return null

  const breaker = startMethod === 'starDelta' && row.breakerStarDelta
    ? row.breakerStarDelta
    : row.breakerDirect
  const motorBreaker = startMethod === 'starDelta' && row.motorBreakerStarDelta
    ? row.motorBreakerStarDelta
    : row.motorBreakerDirect

  return { breaker, motorBreaker }
}

/**
 * 極数・素子数の推奨
 */
export function recommendPole(system: System, voltage: number): { pole: string; desc: string } {
  if (system === 'single2') {
    return { pole: '2P1E', desc: '単相2線：2極1素子（電圧線1本を監視）' }
  }
  if (system === 'single3') {
    if (voltage >= 200) {
      return { pole: '2P2E', desc: '単相3線・200V：2極2素子（両方の電圧線を監視）' }
    }
    return { pole: '2P1E', desc: '単相3線・100V：2極1素子（電圧線1本を監視）' }
  }
  return { pole: '3P3E', desc: '三相3線：3極3素子（3本すべてを監視）' }
}

/**
 * 配電方式のK値と表示名
 */
export function getSystemInfo(system: System): { K: number; kDisplay: string; name: string } {
  if (system === 'three') {
    return { K: Math.sqrt(3), kDisplay: '√3 ≈ 1.732', name: '三相3線式' }
  }
  if (system === 'single3') {
    return { K: 1, kDisplay: '1', name: '単相3線式' }
  }
  return { K: 1, kDisplay: '1', name: '単相2線式' }
}

/**
 * 電動機テーブルから配線種類に応じた電線情報を取得
 */
export function getMotorWireInfo(
  row: MotorTableRow,
  wiringType: 'cv' | 'conduitVV' | 'insulator'
): { minWire: string; maxLength: number } {
  return row[wiringType]
}

// ========================================
// 電線検証関連
// ========================================

/**
 * WIRE_SIZES文字列 → 断面積(mm²)に変換
 */
export function getWireSizeMm2(sizeStr: string): number | null {
  return WIRE_SIZE_TO_MM2[sizeStr] ?? null
}

/**
 * WIRE_SIZES文字列 → 許容電流テーブルのキーに変換
 */
function toAllowableKey(sizeStr: string): string | null {
  return WIRE_SIZE_TO_KEY[sizeStr] ?? null
}

/**
 * 許容電流を取得
 */
export function getAllowableCurrent(wireType: string, wireSizeStr: string): number | null {
  const key = toAllowableKey(wireSizeStr)
  if (!key) return null
  const table = ALLOWABLE_CURRENT[wireType]
  if (!table) return null
  return table[key] ?? null
}

/**
 * インピーダンスZ(Ω/km)を取得
 * 8mm²以上でR/Xデータがある場合: Z = R·cosθ + X·sinθ
 * それ未満: R = 1000/(conductivity × A), X≈0 → Z = R·cosθ
 */
function getImpedanceZ(wireSizeMm2: number, powerFactor: number, freq: string = '60'): number {
  // R/Xデータからの引き当て（サイズキー）
  const sizeKey = String(wireSizeMm2)
  const rxEntry = RX_DATA[sizeKey]?.[freq]

  if (rxEntry) {
    const sinTheta = Math.sqrt(1 - powerFactor * powerFactor)
    return rxEntry.R * powerFactor + rxEntry.X * sinTheta
  }

  // R/Xデータなし → 銅の抵抗率から算出、X無視
  const R = 1000 / (COPPER_CONDUCTIVITY * wireSizeMm2) // Ω/km
  return R * powerFactor
}

/**
 * 電圧降下を計算（インピーダンス法）
 * ΔV = K × I × L × Z × 0.001
 * K: 2(単相2線), 1(単相3線), √3(三相3線)
 */
export function calcVoltageDrop(
  system: System,
  current: number,
  lengthM: number,
  wireSizeMm2: number,
  powerFactor: number
): number {
  let K: number
  if (system === 'single2') K = 2
  else if (system === 'single3') K = 1
  else K = Math.sqrt(3)

  const Z = getImpedanceZ(wireSizeMm2, powerFactor)
  return K * current * lengthM * Z * 0.001
}

/**
 * 電圧降下率の判定
 */
function judgeVd(rate: number): 'ok' | 'warn' | 'ng' {
  if (rate <= 2) return 'ok'
  if (rate <= 4) return 'warn'
  return 'ng'
}

/**
 * 推奨電線サイズを返す
 * ブレーカー定格以上の許容電流 かつ 電圧降下4%以内 を満たす最小サイズ
 */
export function recommendWireSize(
  wireType: string,
  breakerRating: number,
  system: System,
  current: number,
  lengthM: number,
  voltage: number,
  powerFactor: number
): string | null {
  const sizes = ALLOWABLE_CURRENT_SIZES[wireType]
  const table = ALLOWABLE_CURRENT[wireType]
  if (!sizes || !table) return null

  for (const sizeKey of sizes) {
    const amp = table[sizeKey]
    if (amp === undefined || amp < breakerRating) continue

    // 電圧降下もチェック（長さが指定されている場合のみ）
    if (lengthM > 0) {
      const mm2 = parseFloat(sizeKey)
      if (isNaN(mm2) || mm2 <= 0) continue
      const vd = calcVoltageDrop(system, current, lengthM, mm2, powerFactor)
      const rate = (vd / voltage) * 100
      if (rate > 4) continue
    }

    // WIRE_SIZES表示形式に変換
    const mm2 = parseFloat(sizeKey)
    if (mm2 < 5.5) {
      // 丸線表記のサイズは対応が難しいので mm² 表記で返す
      return `${sizeKey}mm²`
    }
    return `${sizeKey}mm²`
  }

  return null // 適合するサイズなし
}

/**
 * 全負荷の配線を検証
 */
export function verifyWiring(
  loads: LoadEntry[],
  system: System,
  voltage: number,
  powerFactor: number,
  breakerRating: number | null,
  loadCurrent: number
): WireVerification[] {
  return loads.map((load, index) => {
    const { wireType, wireSize, wireLength } = load.wiring

    // 基本情報
    const lengthM = parseFloat(wireLength) || 0
    const wireSizeMm2 = wireSize ? getWireSizeMm2(wireSize) : null

    // 未入力の場合
    if (!wireType || !wireSize) {
      return {
        loadIndex: index,
        loadName: load.name || `負荷${index + 1}`,
        wireType,
        wireSize,
        wireLength: lengthM,
        wireSizeMm2: wireSizeMm2 ?? 0,
        allowableCurrent: null,
        isAllowableOk: null,
        voltageDrop: null,
        voltageDropRate: null,
        vdJudge: null,
        recommendedSize: null,
      }
    }

    // ① 許容電流
    const allowableCurrent = getAllowableCurrent(wireType, wireSize)
    const isAllowableOk = allowableCurrent !== null && breakerRating !== null
      ? breakerRating <= allowableCurrent
      : null

    // ② 電圧降下（長さが入力されている場合のみ）
    let voltageDrop: number | null = null
    let voltageDropRate: number | null = null
    let vdJudge: 'ok' | 'warn' | 'ng' | null = null

    // 各負荷の個別電流を計算
    const loadKw = parseFloat(load.powerKw) || 0
    const individualCurrent = loadKw > 0
      ? calcLoadCurrent(loadKw, system, voltage, powerFactor)
      : 0

    if (lengthM > 0 && wireSizeMm2 && individualCurrent > 0) {
      voltageDrop = calcVoltageDrop(system, individualCurrent, lengthM, wireSizeMm2, powerFactor)
      voltageDropRate = (voltageDrop / voltage) * 100
      vdJudge = judgeVd(voltageDropRate)
    }

    // ③ 推奨サイズ（許容電流NGまたは電圧降下NGの場合）
    let recommendedSize: string | null = null
    const needsRecommendation =
      (isAllowableOk === false) ||
      (vdJudge === 'ng')

    if (needsRecommendation && breakerRating !== null) {
      recommendedSize = recommendWireSize(
        wireType, breakerRating, system, individualCurrent, lengthM, voltage, powerFactor
      )
    }

    return {
      loadIndex: index,
      loadName: load.name || `負荷${index + 1}`,
      wireType,
      wireSize,
      wireLength: lengthM,
      wireSizeMm2: wireSizeMm2 ?? 0,
      allowableCurrent,
      isAllowableOk,
      voltageDrop,
      voltageDropRate,
      vdJudge,
      recommendedSize,
    }
  })
}

/**
 * メイン計算: 全負荷の情報を総合してブレーカーを選定
 */
export function calculateAll(
  loads: LoadEntry[],
  system: System,
  voltage: number,
  powerFactor: number,
  margin: number
): {
  totalKw: number
  loadCurrent: number
  marginCurrent: number
  selectedBreaker: number | null
  pole: string
  poleDesc: string
  systemInfo: ReturnType<typeof getSystemInfo>
  motorInfo: MotorTableRow | null
  welderInfo: WelderTableRow | null
  hasMotor: boolean
  hasWelder: boolean
  primaryStartMethod: StartMethod
  wireVerifications: WireVerification[]
} {
  const totalKw = calcTotalPowerKw(loads)
  const loadCurrent = calcLoadCurrent(totalKw, system, voltage, powerFactor)
  const marginCurrent = loadCurrent * margin
  const systemInfo = getSystemInfo(system)
  const { pole, desc: poleDesc } = recommendPole(system, voltage)

  const hasMotor = loads.some(l => l.type === 'motor' && parseFloat(l.powerKw) > 0)
  const hasWelder = loads.some(l => l.type === 'welder' && parseFloat(l.powerKw) > 0)

  // モーターの始動方式（複数あれば最初のものを使用）
  const motorLoad = loads.find(l => l.type === 'motor')
  const primaryStartMethod: StartMethod = motorLoad?.startMethod ?? 'direct'

  // テーブル引き
  let motorInfo: MotorTableRow | null = null
  let welderInfo: WelderTableRow | null = null
  let selectedBreaker: number | null = null

  if (hasMotor && system === 'three' && voltage === 200) {
    // 電動機の場合: 内線規程テーブルから選定
    const motorTotalKw = loads
      .filter(l => l.type === 'motor')
      .reduce((sum, l) => sum + (parseFloat(l.powerKw) || 0), 0)

    if (loads.filter(l => l.type === 'motor').length === 1) {
      // 1台の場合: 3705-1表
      motorInfo = lookupMotorSingle(motorTotalKw)
      if (motorInfo) {
        const result = selectMotorBreaker(motorTotalKw, primaryStartMethod)
        selectedBreaker = result?.breaker ?? selectBreakerRating(marginCurrent)
      }
    } else {
      // 複数台: 電流計算ベースで選定
      selectedBreaker = selectBreakerRating(marginCurrent)
    }
  } else if (hasWelder) {
    // 溶接機: kVA概算でテーブル引き（力率0.6想定）
    const welderKw = loads
      .filter(l => l.type === 'welder')
      .reduce((sum, l) => sum + (parseFloat(l.powerKw) || 0), 0)
    const kva = welderKw / 0.6
    welderInfo = lookupWelder(kva)
    selectedBreaker = welderInfo?.breaker ?? selectBreakerRating(marginCurrent)
  } else {
    // 一般負荷: 電流計算ベース
    selectedBreaker = selectBreakerRating(marginCurrent)
  }

  // 配線検証
  const wireVerifications = verifyWiring(
    loads, system, voltage, powerFactor, selectedBreaker, loadCurrent
  )

  return {
    totalKw,
    loadCurrent,
    marginCurrent,
    selectedBreaker,
    pole,
    poleDesc,
    systemInfo,
    motorInfo,
    welderInfo,
    hasMotor,
    hasWelder,
    primaryStartMethod,
    wireVerifications,
  }
}
