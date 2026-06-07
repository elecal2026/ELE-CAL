import type { MotorTableRow, WelderTableRow } from './types'

// ブレーカー定格一覧 (A)
export const BREAKER_RATINGS = [5, 10, 15, 20, 30, 40, 50, 60, 75, 100, 125, 150, 175, 200, 225, 250, 300, 350, 400]

// 電線サイズ選択肢
export const WIRE_SIZES = [
  '1.6mm', '2.0mm', '2.6mm',
  '5.5mm²', '8mm²', '14mm²', '22mm²', '38mm²',
  '60mm²', '100mm²', '150mm²', '200mm²',
]

// ========================================
// 3705-1表: 200V三相誘導電動機1台の場合
// (内線規程 JEAC8001-2022 3705-1表＋分岐回路表 / PDF p796-797)
// ▼2026-06-05 正本照合(docs/根拠/breaker.md・原本p796/p797・全文OCR):
//   cv/conduitVV/insulator のこう長・最小電線、groundWire(接地線)を正本値へ修正。
//   接地線は原本OCRの列(1.6/1.6/1.6/2.0/2.0/5.5/8/8/8/14/14/22/22)で正本一致を確認。
//   breakerDirect/breakerStarDelta(じか入れ/SD遮断器A)は2026-06-05に紙面p715(PDF p797)を
//      目視確認し、breaker.md準拠値で【確定】。照合レポート(2026-05-29)の旧値は誤りと判明。
//   0.2/0.4/0.75kW の遮断器は同表で15A・接地線1.6mm(確定値)。
// ========================================
export const MOTOR_TABLE_SINGLE: MotorTableRow[] = [
  {
    kw: 0.2, fullLoadCurrent: 1.8,
    cv: { minWire: '2mm²', maxLength: 144 },
    conduitVV: { minWire: '1.6mm', maxLength: 144 },
    insulator: { minWire: '1.6mm', maxLength: 144 },
    breakerDirect: 15, breakerStarDelta: null, // ⚠️要紙確認(15A準用)
    groundWire: '1.6mm',
  },
  {
    kw: 0.4, fullLoadCurrent: 3.2,
    cv: { minWire: '2mm²', maxLength: 81 },
    conduitVV: { minWire: '1.6mm', maxLength: 81 },
    insulator: { minWire: '1.6mm', maxLength: 81 },
    breakerDirect: 15, breakerStarDelta: null, // ⚠️要紙確認(15A準用)
    groundWire: '1.6mm',
  },
  {
    kw: 0.75, fullLoadCurrent: 4.6,
    cv: { minWire: '2mm²', maxLength: 56 },
    conduitVV: { minWire: '1.6mm', maxLength: 56 },
    insulator: { minWire: '1.6mm', maxLength: 56 },
    breakerDirect: 15, breakerStarDelta: null, // ⚠️要紙確認
    groundWire: '1.6mm',
  },
  {
    kw: 1.5, fullLoadCurrent: 8,
    cv: { minWire: '2mm²', maxLength: 32 },
    conduitVV: { minWire: '1.6mm', maxLength: 32 },
    insulator: { minWire: '1.6mm', maxLength: 32 },
    breakerDirect: 30, breakerStarDelta: null, // ✅紙面p715確認済(2026-06-05)
    groundWire: '1.6mm',
  },
  {
    kw: 2.2, fullLoadCurrent: 11.1,
    cv: { minWire: '2mm²', maxLength: 23 },
    conduitVV: { minWire: '1.6mm', maxLength: 23 },
    insulator: { minWire: '1.6mm', maxLength: 23 },
    breakerDirect: 40, breakerStarDelta: null, // ✅紙面p715確認済(2026-06-05)
    groundWire: '2.0mm',
  },
  {
    kw: 3.7, fullLoadCurrent: 16.8,
    cv: { minWire: '2mm²', maxLength: 15 },
    conduitVV: { minWire: '2.0mm', maxLength: 24 },
    insulator: { minWire: '1.6mm', maxLength: 15 },
    breakerDirect: 60, breakerStarDelta: null, // ✅紙面p715確認済(2026-06-05)
    groundWire: '2.0mm',
  },
  {
    kw: 5.5, fullLoadCurrent: 24.6,
    cv: { minWire: '3.5mm²', maxLength: 18 },
    conduitVV: { minWire: '5.5mm²', maxLength: 29 },
    insulator: { minWire: '2.0mm', maxLength: 16 },
    breakerDirect: 75, breakerStarDelta: 60, // ✅紙面p715確認済(2026-06-05)
    groundWire: '5.5mm²',
  },
  {
    kw: 7.5, fullLoadCurrent: 34,
    cv: { minWire: '5.5mm²', maxLength: 21 },
    conduitVV: { minWire: '14mm²', maxLength: 53 },
    insulator: { minWire: '8mm²', maxLength: 30 },
    breakerDirect: 125, breakerStarDelta: 75, // ✅紙面p715確認済(2026-06-05)
    groundWire: '8mm²',
  },
  {
    kw: 11, fullLoadCurrent: 48,
    cv: { minWire: '14mm²', maxLength: 38 },
    conduitVV: { minWire: '14mm²', maxLength: 38 },
    insulator: { minWire: '8mm²', maxLength: 22 },
    breakerDirect: 125, breakerStarDelta: 125, // ✅紙面p715確認済(2026-06-05)
    groundWire: '8mm²',
  },
  {
    kw: 15, fullLoadCurrent: 64,
    cv: { minWire: '14mm²', maxLength: 28 },
    conduitVV: { minWire: '22mm²', maxLength: 44 },
    insulator: { minWire: '14mm²', maxLength: 28 },
    breakerDirect: 125, breakerStarDelta: 150, // ✅紙面p715確認済(2026-06-05)
    groundWire: '8mm²',
  },
  {
    kw: 18.5, fullLoadCurrent: 79,
    cv: { minWire: '22mm²', maxLength: 36 },
    conduitVV: { minWire: '38mm²', maxLength: 62 },
    insulator: { minWire: '14mm²', maxLength: 23 },
    breakerDirect: 150, breakerStarDelta: 175, // ✅紙面p715確認済(2026-06-05)
    groundWire: '14mm²',
  },
  {
    kw: 22, fullLoadCurrent: 92,
    cv: { minWire: '22mm²', maxLength: 31 },
    conduitVV: { minWire: '38mm²', maxLength: 53 },
    insulator: { minWire: '22mm²', maxLength: 31 },
    breakerDirect: 175, breakerStarDelta: 200, // ✅紙面p715確認済(2026-06-05)
    groundWire: '14mm²',
  },
  {
    kw: 30, fullLoadCurrent: 124,
    cv: { minWire: '38mm²', maxLength: 40 },
    conduitVV: { minWire: '60mm²', maxLength: 63 },
    insulator: { minWire: '38mm²', maxLength: 39 },
    breakerDirect: 225, breakerStarDelta: 300, // ✅紙面p715確認済(2026-06-05)
    groundWire: '22mm²',
  },
  {
    kw: 37, fullLoadCurrent: 152,
    cv: { minWire: '60mm²', maxLength: 51 },
    conduitVV: { minWire: '100mm²', maxLength: 85 },
    insulator: { minWire: '60mm²', maxLength: 51 },
    breakerDirect: 300, breakerStarDelta: 350, // ✅紙面p715確認済(2026-06-05)
    groundWire: '22mm²',
  },
]

// ========================================
// 3705-3表: 200V三相誘導電動機数台の幹線の太さ
// (内線規程 JEAC8001-2022 / PDF p800)
// ▼2026-06-05 正本照合(docs/根拠/breaker.md・原本p800)で
//   cv/conduitVV/insulator のこう長・最小電線を全行修正。
// ========================================
export const MOTOR_TABLE_TRUNK: {
  kwTotal: number
  maxCurrent: number
  cv: { minWire: string; maxLength: number }
  conduitVV: { minWire: string; maxLength: number }
  insulator: { minWire: string; maxLength: number }
}[] = [
  { kwTotal: 3, maxCurrent: 15, cv: { minWire: '2mm²', maxLength: 17 }, conduitVV: { minWire: '1.6mm', maxLength: 17 }, insulator: { minWire: '1.6mm', maxLength: 17 } },
  { kwTotal: 4.5, maxCurrent: 20, cv: { minWire: '2mm²', maxLength: 13 }, conduitVV: { minWire: '5.5mm²', maxLength: 35 }, insulator: { minWire: '1.6mm', maxLength: 13 } },
  { kwTotal: 6.3, maxCurrent: 30, cv: { minWire: '5.5mm²', maxLength: 24 }, conduitVV: { minWire: '8mm²', maxLength: 34 }, insulator: { minWire: '5.5mm²', maxLength: 19 } },
  { kwTotal: 8.2, maxCurrent: 40, cv: { minWire: '8mm²', maxLength: 26 }, conduitVV: { minWire: '14mm²', maxLength: 45 }, insulator: { minWire: '8mm²', maxLength: 26 } },
  { kwTotal: 12, maxCurrent: 50, cv: { minWire: '14mm²', maxLength: 36 }, conduitVV: { minWire: '22mm²', maxLength: 57 }, insulator: { minWire: '14mm²', maxLength: 36 } },
  { kwTotal: 15.7, maxCurrent: 75, cv: { minWire: '14mm²', maxLength: 24 }, conduitVV: { minWire: '38mm²', maxLength: 66 }, insulator: { minWire: '14mm²', maxLength: 24 } },
  { kwTotal: 19.5, maxCurrent: 90, cv: { minWire: '22mm²', maxLength: 31 }, conduitVV: { minWire: '38mm²', maxLength: 55 }, insulator: { minWire: '22mm²', maxLength: 31 } },
  { kwTotal: 23.2, maxCurrent: 100, cv: { minWire: '22mm²', maxLength: 28 }, conduitVV: { minWire: '38mm²', maxLength: 49 }, insulator: { minWire: '22mm²', maxLength: 28 } },
  { kwTotal: 30, maxCurrent: 125, cv: { minWire: '38mm²', maxLength: 39 }, conduitVV: { minWire: '60mm²', maxLength: 62 }, insulator: { minWire: '38mm²', maxLength: 38 } },
  { kwTotal: 37.5, maxCurrent: 150, cv: { minWire: '60mm²', maxLength: 52 }, conduitVV: { minWire: '100mm²', maxLength: 86 }, insulator: { minWire: '60mm²', maxLength: 52 } },
  { kwTotal: 45, maxCurrent: 175, cv: { minWire: '60mm²', maxLength: 44 }, conduitVV: { minWire: '100mm²', maxLength: 74 }, insulator: { minWire: '60mm²', maxLength: 44 } },
  { kwTotal: 52.5, maxCurrent: 200, cv: { minWire: '100mm²', maxLength: 65 }, conduitVV: { minWire: '150mm²', maxLength: 97 }, insulator: { minWire: '100mm²', maxLength: 65 } },
  { kwTotal: 63.7, maxCurrent: 250, cv: { minWire: '100mm²', maxLength: 52 }, conduitVV: { minWire: '200mm²', maxLength: 104 }, insulator: { minWire: '100mm²', maxLength: 52 } },
  { kwTotal: 75, maxCurrent: 300, cv: { minWire: '150mm²', maxLength: 65 }, conduitVV: { minWire: '250mm²', maxLength: 108 }, insulator: { minWire: '150mm²', maxLength: 65 } },
  { kwTotal: 86.2, maxCurrent: 350, cv: { minWire: '200mm²', maxLength: 74 }, conduitVV: { minWire: '325mm²', maxLength: 120 }, insulator: { minWire: '150mm²', maxLength: 55 } },
]

// ========================================
// 3705-3表右側: 配線用遮断器の容量（じか入れ/スターデルタ）
// (内線規程 p.711 より)
// 行=遮断器容量(A), 列=電動機中最大のもの(kW) でのじか入れ/SD
// ========================================
export const MOTOR_BREAKER_TRUNK: {
  breakerA: number
  directMaxKw: number[]   // じか入れ始動で使える電動機kWリスト
  starDeltaMaxKw: number[] // スターデルタで使える電動機kWリスト
}[] = [
  { breakerA: 30, directMaxKw: [1.5, 2.2], starDeltaMaxKw: [] },
  { breakerA: 40, directMaxKw: [1.5, 2.2, 3.7], starDeltaMaxKw: [5.5, 7.5] },
  { breakerA: 50, directMaxKw: [1.5, 2.2, 3.7, 5.5], starDeltaMaxKw: [5.5, 7.5] },
  { breakerA: 60, directMaxKw: [1.5, 2.2, 3.7, 5.5], starDeltaMaxKw: [5.5, 7.5, 11] },
  { breakerA: 75, directMaxKw: [1.5, 2.2, 3.7, 5.5, 7.5], starDeltaMaxKw: [5.5, 7.5, 11] },
  { breakerA: 100, directMaxKw: [3.7, 5.5, 7.5, 11], starDeltaMaxKw: [7.5, 11, 15, 18.5] },
  { breakerA: 125, directMaxKw: [5.5, 7.5, 11, 15], starDeltaMaxKw: [11, 15, 18.5, 22] },
  { breakerA: 150, directMaxKw: [7.5, 11, 15, 18.5], starDeltaMaxKw: [15, 18.5, 22, 30] },
  { breakerA: 175, directMaxKw: [11, 15, 18.5, 22], starDeltaMaxKw: [18.5, 22, 30, 37] },
  { breakerA: 200, directMaxKw: [15, 18.5, 22, 30], starDeltaMaxKw: [22, 30, 37, 45] },
  { breakerA: 225, directMaxKw: [18.5, 22, 30], starDeltaMaxKw: [30, 37, 45, 55] },
  { breakerA: 250, directMaxKw: [22, 30, 37], starDeltaMaxKw: [37, 45, 55] },
  { breakerA: 300, directMaxKw: [30, 37, 45], starDeltaMaxKw: [37, 45, 55] },
  { breakerA: 350, directMaxKw: [37, 45, 55], starDeltaMaxKw: [45, 55] },
  { breakerA: 400, directMaxKw: [45, 55], starDeltaMaxKw: [55] },
]

// ========================================
// 3330-1表: 溶接機の電線及び開閉器、過電流遮断器の定格
// (内線規程 p.483 より)
// ========================================
export const WELDER_TABLE: WelderTableRow[] = [
  { maxInputKva: 3, threePhase200: { minWire: '1.6mm' }, threePhase400: null, singlePhase200: { minWire: '1.6mm' }, singlePhase400: null, conduitVV: { minWire: '1.6mm' }, switchCapacity: 15, fuseB: 15, breaker: 20 },
  { maxInputKva: 5, threePhase200: { minWire: '1.6mm' }, threePhase400: null, singlePhase200: { minWire: '1.6mm' }, singlePhase400: null, conduitVV: { minWire: '1.6mm' }, switchCapacity: 15, fuseB: 15, breaker: 20 },
  { maxInputKva: 6, threePhase200: { minWire: '2.0mm' }, threePhase400: null, singlePhase200: { minWire: '2.0mm' }, singlePhase400: null, conduitVV: { minWire: '5.5mm²' }, switchCapacity: 30, fuseB: 30, breaker: 30 },
  { maxInputKva: 8, threePhase200: { minWire: '2.6mm' }, threePhase400: null, singlePhase200: { minWire: '5.5mm²' }, singlePhase400: null, conduitVV: { minWire: '5.5mm²' }, switchCapacity: 30, fuseB: 30, breaker: 30 },
  { maxInputKva: 10, threePhase200: { minWire: '5.5mm²' }, threePhase400: null, singlePhase200: { minWire: '8mm²' }, singlePhase400: null, conduitVV: { minWire: '8mm²' }, switchCapacity: 60, fuseB: 40, breaker: 40 },
  { maxInputKva: 12, threePhase200: { minWire: '5.5mm²' }, threePhase400: null, singlePhase200: { minWire: '8mm²' }, singlePhase400: null, conduitVV: { minWire: '8mm²' }, switchCapacity: 60, fuseB: 40, breaker: 40 },
  { maxInputKva: 15, threePhase200: { minWire: '8mm²' }, threePhase400: null, singlePhase200: { minWire: '14mm²' }, singlePhase400: null, conduitVV: { minWire: '14mm²' }, switchCapacity: 60, fuseB: 60, breaker: 60 },
  { maxInputKva: 20, threePhase200: { minWire: '14mm²' }, threePhase400: null, singlePhase200: { minWire: '14mm²' }, singlePhase400: null, conduitVV: { minWire: '14mm²' }, switchCapacity: 60, fuseB: 60, breaker: 60 },
  { maxInputKva: 30, threePhase200: { minWire: '22mm²' }, threePhase400: { minWire: '14mm²' }, singlePhase200: null, singlePhase400: null, conduitVV: { minWire: '22mm²' }, switchCapacity: 100, fuseB: 75, breaker: 75 },
  { maxInputKva: 40, threePhase200: { minWire: '38mm²' }, threePhase400: { minWire: '22mm²' }, singlePhase200: null, singlePhase400: null, conduitVV: { minWire: '38mm²' }, switchCapacity: 100, fuseB: 100, breaker: 100 },
  { maxInputKva: 50, threePhase200: { minWire: '60mm²' }, threePhase400: { minWire: '38mm²' }, singlePhase200: null, singlePhase400: null, conduitVV: { minWire: '60mm²' }, switchCapacity: 200, fuseB: 125, breaker: 125 },
  { maxInputKva: 60, threePhase200: { minWire: '60mm²' }, threePhase400: { minWire: '38mm²' }, singlePhase200: null, singlePhase400: null, conduitVV: { minWire: '60mm²' }, switchCapacity: 200, fuseB: 125, breaker: 125 },
  { maxInputKva: 70, threePhase200: { minWire: '60mm²' }, threePhase400: { minWire: '38mm²' }, singlePhase200: null, singlePhase400: null, conduitVV: { minWire: '60mm²' }, switchCapacity: 200, fuseB: 150, breaker: 150 },
  { maxInputKva: 80, threePhase200: { minWire: '60mm²' }, threePhase400: { minWire: '60mm²' }, singlePhase200: null, singlePhase400: null, conduitVV: { minWire: '60mm²' }, switchCapacity: 200, fuseB: 150, breaker: 150 },
  { maxInputKva: 100, threePhase200: { minWire: '100mm²' }, threePhase400: { minWire: '60mm²' }, singlePhase200: null, singlePhase400: null, conduitVV: { minWire: '100mm²' }, switchCapacity: 200, fuseB: 200, breaker: 175 },
  { maxInputKva: 120, threePhase200: { minWire: '100mm²' }, threePhase400: { minWire: '100mm²' }, singlePhase200: null, singlePhase400: null, conduitVV: { minWire: '150mm²' }, switchCapacity: 300, fuseB: 250, breaker: 225 },
]

// ========================================
// 3605-11表: 10kVAを超える容量に対する需要率
// (内線規程 p.691 より)
// ========================================
export const DEMAND_FACTOR: { label: string; rate: number }[] = [
  { label: '住宅・寮・アパート・旅館・ホテル・病院・倉庫', rate: 0.5 },
  { label: '学校・事務所・銀行', rate: 0.7 },
]

// ========================================
// 許容電流テーブル（電技解釈・JCS 0168 参考値）
// allowable_current/page.tsx の DATA から抜粋
// wireType → { sizeKey → 許容電流(A) }
// デフォルト敷設条件: CV→気中暗渠, CVT→気中暗渠, IV→管内（3本以下）
// ========================================
export const ALLOWABLE_CURRENT: Record<string, Record<string, number>> = {
  // p881 単心(CV) 3条布設 S=2d 気中暗渠（JEAC8001-2022）。14mm²未満は表に記載なし
  CV: {
    '14': 100, '22': 130, '38': 190, '60': 255,
    '100': 355, '150': 455, '200': 545, '250': 620, '325': 725,
  },
  // p882表3 単心3個より 気中暗渠（設計判断D-003）。14mm²未満は表に記載なし
  CVT: {
    '14': 86, '22': 110, '38': 155, '60': 210,
    '100': 290, '150': 380, '200': 465, '250': 535, '325': 635,
  },
  IV: {
    '1.25': 13, '2': 19, '3.5': 26, '5.5': 34, '8': 43, '14': 62,
    '22': 81, '38': 113, '60': 152, '100': 209, '150': 277, '200': 328, '250': 389, '325': 455,
  },
  // VVF: 気中配線・2心の場合（JIS C 3342 / 内線規程 参考値）
  VVF: {
    '1.6': 19, '2.0': 26, '2.6': 35,
  },
}

// 許容電流テーブルで使えるサイズキーの順序リスト（小→大）
export const ALLOWABLE_CURRENT_SIZES: Record<string, string[]> = {
  CV: ['14', '22', '38', '60', '100', '150', '200', '250', '325'],
  CVT: ['14', '22', '38', '60', '100', '150', '200', '250', '325'],
  IV: ['1.25', '2', '3.5', '5.5', '8', '14', '22', '38', '60', '100', '150', '200', '250', '325'],
  VVF: ['1.6', '2.0', '2.6'],
}

// ========================================
// R・Xデータ（JCS 103A 参考値、600V CV系ケーブル）
// voltage_drop/page.tsx から再利用
// sizeKey → freqKey → { R(Ω/km), X(Ω/km) }
// ========================================
export const RX_DATA: Record<string, Record<string, { R: number; X: number }>> = {
  '8':   { '50': { R: 3.01,   X: 0.114  }, '60': { R: 3.01,   X: 0.137  } },
  '14':  { '50': { R: 1.71,   X: 0.107  }, '60': { R: 1.71,   X: 0.128  } },
  '22':  { '50': { R: 1.08,   X: 0.103  }, '60': { R: 1.08,   X: 0.123  } },
  '38':  { '50': { R: 0.626,  X: 0.0955 }, '60': { R: 0.627,  X: 0.115  } },
  '60':  { '50': { R: 0.397,  X: 0.0913 }, '60': { R: 0.397,  X: 0.11   } },
  '100': { '50': { R: 0.239,  X: 0.0881 }, '60': { R: 0.24,   X: 0.106  } },
  '150': { '50': { R: 0.159,  X: 0.0846 }, '60': { R: 0.16,   X: 0.102  } },
  '200': { '50': { R: 0.121,  X: 0.0859 }, '60': { R: 0.122,  X: 0.103  } },
  '250': { '50': { R: 0.0981, X: 0.0836 }, '60': { R: 0.0995, X: 0.1    } },
  '325': { '50': { R: 0.0764, X: 0.0816 }, '60': { R: 0.0783, X: 0.098  } },
}

// 銅の導電率 (m/(Ω·mm²)) — R/Xデータがないサイズ用
export const COPPER_CONDUCTIVITY = 56

// WIRE_SIZES の文字列 → 数値(mm²)マッピング
// 'Xmm' 形式は丸線直径なので断面積に変換
export const WIRE_SIZE_TO_MM2: Record<string, number> = {
  '1.6mm': Math.PI * (1.6 / 2) ** 2,   // ≈ 2.011
  '2.0mm': Math.PI * (2.0 / 2) ** 2,   // ≈ 3.142
  '2.6mm': Math.PI * (2.6 / 2) ** 2,   // ≈ 5.309
  '5.5mm²': 5.5,
  '8mm²': 8,
  '14mm²': 14,
  '22mm²': 22,
  '38mm²': 38,
  '60mm²': 60,
  '100mm²': 100,
  '150mm²': 150,
  '200mm²': 200,
}

// WIRE_SIZES の文字列 → 許容電流テーブルのキー変換
export const WIRE_SIZE_TO_KEY: Record<string, string> = {
  '1.6mm': '1.6',
  '2.0mm': '2.0',
  '2.6mm': '2.6',
  '5.5mm²': '5.5',
  '8mm²': '8',
  '14mm²': '14',
  '22mm²': '22',
  '38mm²': '38',
  '60mm²': '60',
  '100mm²': '100',
  '150mm²': '150',
  '200mm²': '200',
}

// 負荷種類のラベル
export const LOAD_TYPE_LABELS = {
  general: '一般負荷（照明等）',
  motor: 'モーター（クーラー等）',
  welder: '溶接機',
} as const

export const START_METHOD_LABELS = {
  direct: 'じか入れ',
  starDelta: 'スターデルタ',
} as const
