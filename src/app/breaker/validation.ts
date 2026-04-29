import type { System, LoadEntry } from './types'

export interface ValidationIssue {
  id: string
  level: 'error' | 'warning'
  target: 'global' | number  // number = load index
  message: string
}

/**
 * ブレーカー選定ツールのバリデーション
 */
export function validateBreakerInputs(
  system: System,
  voltage: string,
  loads: LoadEntry[],
): ValidationIssue[] {
  const issues: ValidationIssue[] = []

  // B-1: 三相3線 × 100V
  if (system === 'three' && voltage === '100') {
    issues.push({
      id: 'B-1',
      level: 'error',
      target: 'global',
      message: '三相3線式では100Vは使用できません。200Vに切り替えてください。',
    })
  }

  loads.forEach((load, i) => {
    const kw = parseFloat(load.powerKw) || 0

    // B-2/B-3: モーター × 三相200V以外
    if (load.type === 'motor' && (system !== 'three' || voltage !== '200')) {
      issues.push({
        id: 'B-2',
        level: 'warning',
        target: i,
        message: `負荷${i + 1}: モーター負荷は三相200V以外では内線規程テーブルを参照できません。汎用計算で選定されます。`,
      })
    }

    // B-4: スターデルタ × 小容量モーター
    if (load.type === 'motor' && load.startMethod === 'starDelta' && kw > 0 && kw < 3.7) {
      issues.push({
        id: 'B-4',
        level: 'warning',
        target: i,
        message: `負荷${i + 1}: スターデルタ始動は一般的に3.7kW以上で使用されます（現在 ${kw}kW）。`,
      })
    }

    // B-5: 溶接機 × 単相2線100V
    if (load.type === 'welder' && system === 'single2' && voltage === '100') {
      issues.push({
        id: 'B-5',
        level: 'warning',
        target: i,
        message: `負荷${i + 1}: 溶接機 × 単相2線100Vは特殊な構成です。設定を確認してください。`,
      })
    }

    // B-6: IV × 60mm²以上
    if (load.wiring.wireType === 'IV' && ['60mm²', '100mm²', '150mm²', '200mm²'].includes(load.wiring.wireSize)) {
      issues.push({
        id: 'B-6',
        level: 'warning',
        target: i,
        message: `負荷${i + 1}: IV ${load.wiring.wireSize}は一般的ではありません。CVまたはCVTを検討してください。`,
      })
    }

    // B-9 / B-10 / B-11 / B-12: 配線情報の不完全チェック
    const { wireType, wireSize, wireLength } = load.wiring
    const hasAny = wireType !== '' || wireSize !== '' || wireLength !== ''
    if (hasAny) {
      const missing: string[] = []
      if (wireType === '') missing.push('電線種類')
      if (wireSize === '') missing.push('太さ')
      if (wireLength === '') missing.push('長さ')
      if (missing.length > 0) {
        issues.push({
          id: 'B-10',
          level: 'error',
          target: i,
          message: `負荷${i + 1}: 配線情報が不完全です（${missing.join('・')}を入力してください）。`,
        })
      }
    }
  })

  return issues
}

/**
 * 電線種類に応じた利用可能な電線サイズを返す
 * B-7/B-8: CV/CVTではmm表記サイズを除外
 */
export function getAvailableWireSizes(wireType: string): string[] {
  const ALL_SIZES = [
    '1.6mm', '2.0mm', '2.6mm',
    '5.5mm²', '8mm²', '14mm²', '22mm²', '38mm²',
    '60mm²', '100mm²', '150mm²', '200mm²',
  ]

  if (wireType === 'CV' || wireType === 'CVT') {
    // CV/CVTはmm²サイズのみ（単線サイズは存在しない）
    return ALL_SIZES.filter(s => s.includes('mm²'))
  }

  if (wireType === 'VVF') {
    // VVFは1.6mm〜2.6mmのみ
    return ALL_SIZES.filter(s => ['1.6mm', '2.0mm', '2.6mm'].includes(s))
  }

  return ALL_SIZES
}
