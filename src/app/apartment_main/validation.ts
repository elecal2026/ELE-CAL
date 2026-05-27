import { HOUSING_TYPE_MAX_UNITS } from './data'
import type { ApartmentInput } from './types'

export interface ValidationIssue {
  id: string
  level: 'error' | 'warning'
  message: string
}

export function validateApartmentInput(input: ApartmentInput): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  const maxUnits = HOUSING_TYPE_MAX_UNITS[input.housingType]

  if (!Number.isInteger(input.units)) {
    issues.push({
      id: 'AM-1',
      level: 'error',
      message: '戸数は整数で入力してください。',
    })
  }

  if (input.units <= 0) {
    issues.push({
      id: 'AM-2',
      level: 'error',
      message: '戸数は1以上で入力してください。',
    })
  }

  if (input.units > maxUnits) {
    const rangeText = input.housingType === 'general'
      ? '一般集合住宅は40戸まで'
      : '全電化集合住宅は16戸まで'

    issues.push({
      id: 'AM-3',
      level: 'error',
      message: `内線規程の対応範囲外です（${rangeText}）。設計者の個別判断が必要です。`,
    })
  }

  if (input.distributionSystem === 'threePhase3Wire') {
    issues.push({
      id: 'AM-4',
      level: 'warning',
      message: '三相3線式は電流のみ算出します。配線用遮断器・CVTケーブルは集合住宅向け資料に値がないため、別途確認してください。',
    })
  }

  return issues
}
