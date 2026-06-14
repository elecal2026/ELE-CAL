import type { ApartmentResult, SystemSummary } from './types'
import type { ValidationIssue } from './validation'

const MAX_MASTER_CVT_SIZE_MM2 = 325

function formatCvtSize(cableMm2: number): string {
  return cableMm2 <= MAX_MASTER_CVT_SIZE_MM2 ? `${cableMm2} mm²` : '該当なし'
}

function RefRow({ label, value, highlight = false }: {
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

function DiffBadge({ diffKva }: { diffKva: number }) {
  const abs = Math.abs(diffKva)
  if (abs < 0.5) {
    return <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>標準表値と近い値です</span>
  }
  const isOver = diffKva > 0
  return (
    <span style={{ fontSize: '0.82rem', fontWeight: 600, color: isOver ? 'var(--danger)' : 'var(--text-muted)' }}>
      {isOver ? '▲' : '▼'} {isOver ? '+' : ''}{diffKva.toFixed(1)} kVA（標準表値{isOver ? 'を上回ります' : 'を下回ります'}）
    </span>
  )
}

function SystemSummaryCards({ summaries }: { summaries: SystemSummary[] }) {
  if (summaries.length === 0) return null

  return (
    <section className="card vd2-section-card" style={{ marginTop: '0.75rem' }}>
      <p className="card-title">系統別内訳</p>
      <p className="apartment-section-description" style={{ marginBottom: '0.75rem' }}>
        異なる配電方式の電流は合算せず、系統ごとに表示します。
      </p>
      <div className="apartment-result-grid">
        {summaries.map(summary => (
          <div className="apartment-system-result" key={summary.key}>
            <strong>{summary.label}</strong>
            <div className="ref-table-result">
              {summary.dwellingKva > 0 && <RefRow label="住宅用需要負荷" value={`${summary.dwellingKva.toFixed(1)} kVA`} />}
              {summary.commonKva > 0 && <RefRow label="共用部加算" value={`${summary.commonKva.toFixed(1)} kVA`} />}
              <RefRow label="系統合計" value={`${summary.totalKva.toFixed(1)} kVA`} />
              <RefRow label="計算電流" value={`${summary.currentA} A`} highlight />
              <RefRow label="主開閉器候補" value={`${summary.breakerA} A`} />
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

function GeneralResultPanel({ result, warnings }: {
  result: Extract<ApartmentResult, { mode: 'general' }>
  warnings: ValidationIssue[]
}) {
  const { standardRow, diffKva } = result

  return (
    <>
      {warnings.map(w => (
        <div key={w.id} className="validation-warning" style={{ marginBottom: '0.5rem' }}>{w.message}</div>
      ))}

      <section className="card vd2-result-card">
        <p className="card-title">入力容量からの計算値</p>

        <div className="result-main">
          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '0.2rem' }}>
            想定最大負荷
          </div>
          <span className="result-breaker">{result.maxLoadKva.toFixed(1)}</span>
          <span className="result-breaker-unit"> kVA</span>
          <div className="result-sub">
            <div className="result-badge">
              <span className="rb-label">合計</span>
              <span className="rb-val">{result.totalUnits}</span> 戸
            </div>
          <div className="result-badge">
            <span className="rb-label">需要率</span>
            <span className="rb-val">{result.demandRate}</span> %
          </div>
        </div>
      </div>

      <div className="ref-table-result">
        <RefRow label="住宅用需要負荷" value={`${result.dwellingLoadKva.toFixed(1)} kVA`} />
        <RefRow label="共用部加算" value={`${result.commonKva.toFixed(1)} kVA`} />
        <RefRow label="建物全体の合計容量" value={`${result.maxLoadKva.toFixed(1)} kVA`} highlight />
      </div>
    </section>

      <SystemSummaryCards summaries={result.systemSummaries} />

      <section className="card vd2-section-card" style={{ marginTop: '0.75rem' }}>
        <p className="card-title" style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
          参考：同戸数の住宅用標準表値
        </p>
        <div className="ref-table-result">
          <RefRow label={`${standardRow.units}戸 想定最大負荷`} value={`${standardRow.maxLoadKva.toFixed(1)} kVA`} />
          <RefRow label="単相3線式 電流" value={result.standardElectricalApplicable ? `${standardRow.currentA} A` : '該当なし'} />
          <RefRow label="配線用遮断器" value={result.standardElectricalApplicable ? `${standardRow.breakerA} A` : '該当なし'} />
          <RefRow label="CVT最小太さ" value={result.standardElectricalApplicable ? formatCvtSize(standardRow.cableMm2) : '該当なし'} />
        </div>
        {!result.standardElectricalApplicable && (
          <p className="apartment-card-note">
            住宅用に単相2線が含まれるため、単相3線100/200Vを前提とする標準表の電流・遮断器・CVT値は該当なしです。
          </p>
        )}
        <div style={{ marginTop: '0.5rem' }}>
          <DiffBadge diffKva={diffKva} />
        </div>
      </section>

      <details className="review-notes" style={{ marginTop: '0.75rem' }}>
        <summary>計算根拠を表示</summary>
        <div className="review-notes-body">
          <ul>
            <li>住戸合計容量（需要率前）: {result.totalRawKva.toFixed(1)} kVA</li>
            <li>換算方式: 契約A ÷ 10 = kVA（例: 40A = 4.0kVA）</li>
            <li>需要率 {result.demandRate}% 適用後: {result.dwellingLoadKva.toFixed(1)} kVA</li>
            <li>共用部加算: {result.commonKva.toFixed(1)} kVA（需要率は適用しない）</li>
            <li>想定最大負荷: {result.maxLoadKva.toFixed(1)} kVA</li>
            <li>電流と主開閉器候補は、異なる配電方式を合算せず系統別に算出</li>
          </ul>
          <p style={{ marginTop: '0.5rem', fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
            需要率は内線規程資料3-6-1の表値を使用。換算方式（A÷10=kVA）は同表が住戸面積100m²・4kVA/戸を前提とすることに基づく目安値です。主開閉器候補はCVT・電圧降下・許容電流等の確認前の候補値です。
          </p>
        </div>
      </details>
    </>
  )
}

function ElectricResultPanel({ result }: {
  result: Extract<ApartmentResult, { mode: 'electric' }>
}) {
  const { electricRow, housingType, totalUnits } = result
  const sourceTitle = housingType === 'electric23h'
    ? '内線規程 資料3-6-2（23時一斉始動型）'
    : '内線規程 資料3-6-2（マイコン制御型）'

  if (!electricRow) {
    return (
      <section className="card vd2-result-card">
        <p className="card-title">標準表値（全電化）</p>
        <p style={{ color: 'var(--danger)', fontWeight: 700 }}>範囲外</p>
        <p style={{ fontSize: '0.85rem', marginTop: '0.4rem' }}>
          全電化集合住宅は16戸まで対応しています。
        </p>
      </section>
    )
  }

  return (
    <>
      <section className="card vd2-result-card">
        <p className="card-title">標準表値（全電化）</p>
        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
          {sourceTitle} / {totalUnits}戸
        </p>

        <div className="result-main">
          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '0.2rem' }}>
            想定最大負荷
          </div>
          <span className="result-breaker">{electricRow.maxLoadKva.toFixed(1)}</span>
          <span className="result-breaker-unit"> kVA</span>
          <div className="result-sub">
            <div className="result-badge">
              <span className="rb-label">需要率</span>
              <span className="rb-val">{electricRow.demandRate}</span> %
            </div>
            <div className="result-badge">
              <span className="rb-label">重畳率</span>
              <span className="rb-val">{electricRow.overlapRate}</span>
            </div>
          </div>
        </div>

        <div className="ref-table-result">
          <RefRow label="電気温水器の想定負荷" value={`${electricRow.heaterKva.toFixed(1)} kVA`} />
          <RefRow label="単相3線式 電流" value={`${electricRow.currentA} A`} highlight />
          <RefRow label="配線用遮断器" value={`${electricRow.breakerA} A`} />
          <RefRow label="CVT最小太さ" value={formatCvtSize(electricRow.cableMm2)} />
          {result.commonKva > 0 && (
            <>
              <RefRow label="共用部加算" value={`${result.commonKva.toFixed(1)} kVA`} />
              <RefRow label="建物全体の合計容量" value={`${result.maxLoadKva.toFixed(1)} kVA`} />
            </>
          )}
        </div>
        {electricRow.cableMm2 > MAX_MASTER_CVT_SIZE_MM2 && (
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
            CVT最小太さは現在の選択範囲外のため、該当なしと表示しています。
          </p>
        )}
      </section>
      <SystemSummaryCards summaries={result.systemSummaries} />
    </>
  )
}

export default function ResultPanel({
  result,
  issues,
}: {
  result: ApartmentResult | null
  issues: ValidationIssue[]
}) {
  const warnings = issues.filter(i => i.level === 'warning')

  if (!result) {
    return (
      <div className="result-panel-empty">
        <p>左パネルで住戸契約容量を入力すると結果が表示されます。</p>
      </div>
    )
  }

  if (result.mode === 'out_of_range') {
    return (
      <section className="card vd2-result-card">
        <p className="card-title">計算結果</p>
        {result.isGeneral && result.totalRawKva > 0 && (
          <div className="ref-table-result" style={{ marginBottom: '0.75rem' }}>
            <RefRow label="住戸合計容量（需要率前）" value={`${result.totalRawKva.toFixed(1)} kVA`} />
            <RefRow label="合計戸数" value={`${result.totalUnits} 戸`} />
          </div>
        )}
        <div className="validation-error">
          内線規程表の対応範囲（{result.isGeneral ? '一般：40戸まで' : '全電化：16戸まで'}）を超えています。需要率以降の計算は表示しません。
        </div>
      </section>
    )
  }

  if (result.mode === 'electric') {
    return (
      <>
        {warnings.filter(w => w.id === 'AM-3').map(w => (
          <div key={w.id} className="validation-warning" style={{ marginBottom: '0.5rem' }}>{w.message}</div>
        ))}
        <ElectricResultPanel result={result} />
        <div className="disclaimer" style={{ marginTop: '1rem' }}>
          <strong>注意事項</strong>
          本ツールの計算結果は内線規程資料の参考値です。実務では最新の規格・基準を必ずご確認ください。
        </div>
      </>
    )
  }

  return (
    <>
      <GeneralResultPanel
        result={result}
        warnings={warnings.filter(w => w.id === 'AM-4')}
      />
      <div className="disclaimer" style={{ marginTop: '1rem' }}>
        <strong>注意事項</strong>
        本ツールの計算結果は参考値です。実務では電圧降下・許容電流・布設条件・電力会社協議など別途確認してください。
      </div>
    </>
  )
}
