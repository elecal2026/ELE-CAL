import { HOUSING_TYPE_LABELS } from './data'
import { isElectricRow } from './calculations'
import type { ApartmentResult } from './types'
import type { ValidationIssue } from './validation'

function ResultRow({
  label,
  value,
  highlight = false,
}: {
  label: string
  value: string
  highlight?: boolean
}) {
  return (
    <div className="ref-row">
      <span className="ref-label">{label}</span>
      <span className={`ref-value${highlight ? ' highlight-value' : ''}`}>{value}</span>
    </div>
  )
}

export default function ResultPanel({
  result,
  issues,
}: {
  result: ApartmentResult | null
  issues: ValidationIssue[]
}) {
  const errors = issues.filter(issue => issue.level === 'error')
  const warnings = issues.filter(issue => issue.level === 'warning')

  if (errors.length > 0) {
    return (
      <div>
        <div className="result-panel-empty">
          <p style={{ color: 'var(--danger)', fontWeight: 700 }}>入力にエラーがあります</p>
          <p style={{ fontSize: '0.85rem', marginTop: '0.5rem' }}>内線規程の対応範囲内で入力してください。</p>
        </div>
        {errors.map(issue => (
          <div key={issue.id} className="validation-error" style={{ textAlign: 'left' }}>{issue.message}</div>
        ))}
      </div>
    )
  }

  if (!result) {
    return (
      <div className="result-panel-empty">
        <p>左パネルで条件を入力すると結果が表示されます。</p>
      </div>
    )
  }

  const row = result.row
  const electric = isElectricRow(row)

  return (
    <>
      {warnings.length > 0 && (
        <div style={{ marginBottom: '0.75rem' }}>
          {warnings.map(issue => (
            <div key={issue.id} className="validation-warning">{issue.message}</div>
          ))}
        </div>
      )}

      <section className="card vd2-result-card">
        <p className="card-title">幹線設計結果</p>

        <div className="result-main">
          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '0.2rem' }}>
            想定最大負荷
          </div>
          <span className="result-breaker">{row.maxLoadKva.toFixed(1)}</span>
          <span className="result-breaker-unit"> kVA</span>
          <div className="result-sub">
            <div className="result-badge">
              <span className="rb-label">戸数</span>
              <span className="rb-val">{row.units}</span> 戸
            </div>
            <div className="result-badge">
              <span className="rb-label">需要率</span>
              <span className="rb-val">{row.demandRate}</span> %
            </div>
            {electric && (
              <div className="result-badge">
                <span className="rb-label">重畳率</span>
                <span className="rb-val">{row.overlapRate}</span>
              </div>
            )}
          </div>
        </div>

        <div className="ref-table-result">
          {electric && (
            <ResultRow label="電気温水器の想定負荷" value={`${row.heaterKva.toFixed(1)} kVA`} />
          )}

          {result.isThreePhase ? (
            <>
              <ResultRow
                label="三相3線式 電流"
                value={`${result.threePhaseCurrentA} A`}
                highlight
              />
              <ResultRow label="三相用 配線用遮断器" value="要別途確認" />
              <ResultRow label="三相用 CVTケーブル" value="要別途確認" />
            </>
          ) : (
            <>
              <ResultRow label="単相3線式 電流" value={`${row.currentA} A`} highlight />
              <ResultRow label="配線用遮断器の定格電流" value={`${row.breakerA} A`} />
              <ResultRow label="CVTケーブル最小太さ" value={`${row.cableMm2} mm²`} />
            </>
          )}
        </div>
      </section>

      <details className="review-notes" style={{ marginTop: '1rem' }}>
        <summary>計算根拠を表示</summary>
        <div className="review-notes-body">
          <p>
            入力: {row.units}戸 / {HOUSING_TYPE_LABELS[result.input.housingType]} / {result.isThreePhase ? '三相3線' : '単相3線'}
          </p>
          <p>
            出典: {result.sourceTitle} 戸数{row.units}
          </p>
          <ul>
            <li>想定最大負荷: {row.maxLoadKva.toFixed(1)} kVA</li>
            <li>需要率: {row.demandRate}%</li>
            {electric && <li>重畳率 k: {row.overlapRate}</li>}
            {electric && <li>電気温水器の想定負荷: {row.heaterKva.toFixed(1)} kVA</li>}
            {!result.isThreePhase && <li>単相3線式電流: {row.currentA} A</li>}
            {!result.isThreePhase && <li>配線用遮断器の定格電流: {row.breakerA} A</li>}
            {!result.isThreePhase && <li>CVTケーブル最小太さ: {row.cableMm2} mm²</li>}
          </ul>

          {result.isThreePhase && (
            <p>
              三相3線式電流: I = {row.maxLoadKva.toFixed(1)} × 1000 / (√3 × 200) = {result.threePhaseCurrentA} A。
              力率は1.0で算出しています。実機ではcosθを考慮してください。
            </p>
          )}

          <p>
            前提: 住戸面積100m²基準。CVTケーブル最小太さは基底温度40℃の許容電流値に基づく表値です。
            本ツールは内線規程表に明示された値の範囲のみを扱い、独自補正や外挿は行いません。
          </p>
        </div>
      </details>
    </>
  )
}
