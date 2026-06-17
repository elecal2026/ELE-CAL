import type { ApartmentInput } from './types'

export interface ValidationIssue {
  id: string
  level: 'error' | 'warning'
  message: string
}

export function validateApartmentInput(input: ApartmentInput): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  const totalUnits = input.groups.reduce(
    (sum, group) => sum + group.capacities.reduce((groupSum, capacity) => groupSum + capacity.units, 0),
    0,
  )

  if (totalUnits === 0) {
    issues.push({
      id: 'AM-1',
      level: 'error',
      message: '各戸容量（A）を1戸以上入力してください。',
    })
  }

  const maxUnits = input.housingType === 'general' ? 40 : 16
  if (totalUnits > maxUnits) {
    const rangeText = input.housingType === 'general'
      ? '一般集合住宅は40戸まで'
      : '全電化集合住宅は16戸まで'
    issues.push({
      id: 'AM-2',
      level: 'error',
      message: `内線規程の対応範囲外です（${rangeText}）。需要率以降の計算を表示しません。`,
    })
  }

  if (input.housingType !== 'general') {
    issues.push({
      id: 'AM-3',
      level: 'warning',
      message: '全電化集合住宅は内線規程資料3-6-2の標準表値を参考表示します。各戸容量（A）からの積み上げ計算は行いません。',
    })
  }

  if (
    input.housingType === 'general'
    && input.groups.some(group => group.distributionSystem !== 'singlePhase3Wire')
  ) {
    issues.push({
      id: 'AM-4',
      level: 'warning',
      message: '単相2線の住戸を含むため、同戸数の標準表にある単相3線式電流・遮断器・CVT値は直接適用できません。',
    })
  }

  return issues
}
