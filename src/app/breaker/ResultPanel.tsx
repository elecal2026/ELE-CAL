import type { LoadEntry, System, StartMethod, MotorTableRow, WelderTableRow, WireVerification } from './types'
import { BREAKER_RATINGS, START_METHOD_LABELS } from './constants'
import { useMemo } from 'react'
import { calculateAll } from './calculations'
import type { ValidationIssue } from './validation'

interface ResultPanelProps {
  loads: LoadEntry[]
  system: System
  voltage: number
  powerFactor: number
  margin: number
  validationIssues: ValidationIssue[]
}

function calcSelectedBreakerKva(selectedBreaker: number | null, system: System, voltage: number): number | null {
  if (selectedBreaker === null) return null
  const K = system === 'three' ? Math.sqrt(3) : 1
  return (K * voltage * selectedBreaker) / 1000
}

export default function ResultPanel({
  loads,
  system,
  voltage,
  powerFactor,
  margin,
  validationIssues,
}: ResultPanelProps) {
  const hasLoads = loads.some(l => parseFloat(l.powerKw) > 0)
  const hasErrors = validationIssues.some(v => v.level === 'error')
  const globalWarnings = validationIssues.filter(v => v.target === 'global')

  const result = useMemo(() => {
    if (!hasLoads || hasErrors) return null
    return calculateAll(loads, system, voltage, powerFactor, margin)
  }, [loads, system, voltage, powerFactor, margin, hasLoads, hasErrors])

  // エラーがある場合はエラー表示
  if (hasErrors) {
    return (
      <div>
        {globalWarnings.length > 0 && globalWarnings.map((w) => (
          <div key={w.id} className="validation-error" style={{ marginBottom: '8px' }}>{w.message}</div>
        ))}
        <div className="result-panel-empty">
          <p style={{ color: 'var(--danger)', fontWeight: 600 }}>入力にエラーがあります</p>
          <p style={{ fontSize: '0.85rem', marginTop: '0.5rem' }}>左パネルのエラー表示を確認し、修正してください。</p>
          {validationIssues.filter(v => v.level === 'error').map((v) => (
            <div key={`${v.id}-${v.target}`} className="validation-error" style={{ textAlign: 'left', marginTop: '6px' }}>{v.message}</div>
          ))}
        </div>
      </div>
    )
  }

  if (!result) {
    return (
      <div className="result-panel-empty">
        <p>左パネルで負荷を追加すると、ここに選定結果が表示されます。</p>
      </div>
    )
  }

  const selectedBreakerKva = calcSelectedBreakerKva(result.selectedBreaker, system, voltage)

  return (
    <>
      <section className="card vd2-result-card">
        <p className="card-title">選定結果</p>
        <div className="result-main">
          <span className="result-breaker">
            {result.selectedBreaker !== null ? result.selectedBreaker : '規格超'}
          </span>
          <span className="result-breaker-unit"> A</span>
          {selectedBreakerKva !== null && (
            <div style={{ marginTop: '0.15rem', fontSize: '1rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
              （{selectedBreakerKva.toFixed(2)} kVA）
            </div>
          )}
          <div className="result-sub">
            <div className="result-badge">
              <span className="rb-label">合計電力</span>
              <span className="rb-val">{result.totalKw.toFixed(2)}</span> kW
            </div>
            <div className="result-badge">
              <span className="rb-label">負荷電流</span>
              <span className="rb-val">{result.loadCurrent.toFixed(2)}</span> A
            </div>
            <div className="result-badge">
              <span className="rb-label">余裕込み</span>
              <span className="rb-val">{result.marginCurrent.toFixed(2)}</span> A
            </div>
          </div>
        </div>

        <div className="pole-recommend">
          <div className="pole-title">推奨 極数・素子数</div>
          <div className="pole-value">{result.pole}</div>
          <div className="pole-desc">{result.poleDesc}</div>
        </div>
      </section>

      {/* 内線規程テーブル参照結果 */}
      {result.motorInfo && (
        <section className="card vd2-result-card">
          <p className="card-title">内線規程 3705-1表（電動機）</p>
          <MotorTableResult
            row={result.motorInfo}
            startMethod={result.primaryStartMethod}
          />
        </section>
      )}

      {result.welderInfo && (
        <section className="card vd2-result-card">
          <p className="card-title">内線規程 3330-1表（溶接機）</p>
          <WelderTableResult row={result.welderInfo} />
        </section>
      )}

      {/* 配線検証 */}
      {result.wireVerifications.some(v => v.wireType && v.wireSpecDisplay) && (
        <section className="card vd2-result-card">
          <p className="card-title">配線検証</p>
          {result.wireVerifications.map((v) => (
            <WireVerificationRow
              key={v.loadIndex}
              verification={v}
              breakerRating={result.selectedBreaker}
            />
          ))}
        </section>
      )}

      {/* ブレーカー規格一覧 */}
      <section className="card vd2-result-card">
        <p className="card-title">ブレーカー規格一覧</p>
        <div className="table-wrapper">
          <table className="breaker-table">
            <thead>
              <tr>
                <th>定格電流 (A)</th>
                <th>判定</th>
              </tr>
            </thead>
            <tbody>
              {BREAKER_RATINGS.map((rating) => {
                const isSelected = rating === result.selectedBreaker
                let judge: React.ReactNode
                if (rating < result.marginCurrent) {
                  judge = <span style={{ color: 'var(--danger)', fontWeight: 700 }}>✕ 不足</span>
                } else if (isSelected) {
                  judge = <span style={{ color: 'var(--seg-active)', fontWeight: 700 }}>◎ 選定</span>
                } else {
                  judge = <span style={{ color: 'var(--text-muted)' }}>○ 適合</span>
                }
                return (
                  <tr key={rating} className={isSelected ? 'highlight' : ''}>
                    <td>{rating} A</td>
                    <td>{judge}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>
    </>
  )
}

function MotorTableResult({ row, startMethod }: { row: MotorTableRow; startMethod: StartMethod }) {
  const breaker = startMethod === 'starDelta' && row.breakerStarDelta
    ? row.breakerStarDelta
    : row.breakerDirect

  return (
    <div className="ref-table-result">
      <div className="ref-row">
        <span className="ref-label">定格出力</span>
        <span className="ref-value">{row.kw} kW</span>
      </div>
      <div className="ref-row">
        <span className="ref-label">全負荷電流</span>
        <span className="ref-value">{row.fullLoadCurrent} A</span>
      </div>
      <div className="ref-row">
        <span className="ref-label">始動方式</span>
        <span className="ref-value">{START_METHOD_LABELS[startMethod]}</span>
      </div>
      <div className="ref-row">
        <span className="ref-label">配線用遮断器</span>
        <span className="ref-value highlight-value">{breaker} A</span>
      </div>
      <div className="ref-divider" />
      <p className="ref-subtitle">配線種類別 最小電線・最大こう長</p>
      <div className="ref-row">
        <span className="ref-label">CVケーブル</span>
        <span className="ref-value">{row.cv.minWire} / {row.cv.maxLength}m</span>
      </div>
      <div className="ref-row">
        <span className="ref-label">電線管・VV</span>
        <span className="ref-value">{row.conduitVV.minWire} / {row.conduitVV.maxLength}m</span>
      </div>
      <div className="ref-row">
        <span className="ref-label">がいし引き</span>
        <span className="ref-value">{row.insulator.minWire} / {row.insulator.maxLength}m</span>
      </div>
      <div className="ref-row">
        <span className="ref-label">接地線</span>
        <span className="ref-value">{row.groundWire}</span>
      </div>
    </div>
  )
}

function WelderTableResult({ row }: { row: WelderTableRow }) {
  return (
    <div className="ref-table-result">
      <div className="ref-row">
        <span className="ref-label">最大入力</span>
        <span className="ref-value">{row.maxInputKva} kVA</span>
      </div>
      <div className="ref-row">
        <span className="ref-label">配線用遮断器</span>
        <span className="ref-value highlight-value">{row.breaker} A</span>
      </div>
      <div className="ref-row">
        <span className="ref-label">開閉器容量</span>
        <span className="ref-value">{row.switchCapacity} A</span>
      </div>
      <div className="ref-row">
        <span className="ref-label">B種ヒューズ</span>
        <span className="ref-value">{row.fuseB} A</span>
      </div>
      <div className="ref-divider" />
      <p className="ref-subtitle">一次配線の最小太さ</p>
      {row.threePhase200 && (
        <div className="ref-row">
          <span className="ref-label">三相200V</span>
          <span className="ref-value">{row.threePhase200.minWire}</span>
        </div>
      )}
      {row.threePhase400 && (
        <div className="ref-row">
          <span className="ref-label">三相400V</span>
          <span className="ref-value">{row.threePhase400.minWire}</span>
        </div>
      )}
      {row.singlePhase200 && (
        <div className="ref-row">
          <span className="ref-label">単相200V</span>
          <span className="ref-value">{row.singlePhase200.minWire}</span>
        </div>
      )}
      {row.conduitVV && (
        <div className="ref-row">
          <span className="ref-label">電線管・VV</span>
          <span className="ref-value">{row.conduitVV.minWire}</span>
        </div>
      )}
    </div>
  )
}

function WireVerificationRow({
  verification: v,
  breakerRating,
}: {
  verification: WireVerification
  breakerRating: number | null
}) {
  // 電線情報が未入力の場合はスキップ
  if (!v.wireType || !v.wireSpecDisplay) return null

  const VD_BADGE: Record<string, { cls: string; text: string }> = {
    ok: { cls: 'badge-ok', text: '良好' },
    warn: { cls: 'badge-warn', text: '注意' },
    ng: { cls: 'badge-ng', text: '超過' },
  }

  return (
    <div style={{
      padding: '12px',
      marginBottom: '8px',
      background: 'var(--bg-secondary)',
      border: '1px solid var(--border)',
      borderRadius: '8px',
    }}>
      <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '8px', color: 'var(--text-primary)' }}>
        {v.loadName}
        <span style={{ fontWeight: 400, fontSize: '0.8rem', color: 'var(--text-muted)', marginLeft: '8px' }}>
          {v.wireType} {v.wireSpecDisplay} / {v.conditionSummary}{v.wireLength > 0 ? ` / ${v.wireLength}m` : ''}
        </span>
      </div>

      {/* 許容電流 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '4px', fontSize: '0.85rem' }}>
        <span style={{ color: 'var(--text-secondary)', minWidth: '80px' }}>許容電流:</span>
        <span style={{ fontWeight: 600 }}>{v.allowableCurrent !== null ? `${v.allowableCurrent} A` : '該当なし'}</span>
        {v.allowableCurrent !== null && (
          <>
            {breakerRating !== null && (
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              （ブレーカー {breakerRating}A {v.isAllowableOk ? '≦' : '>'} {v.allowableCurrent}A）
            </span>
            )}
            {v.isAllowableOk !== null && (
              <span className={`badge ${v.isAllowableOk ? 'badge-ok' : 'badge-ng'}`}>
                {v.isAllowableOk ? 'OK' : 'NG'}
              </span>
            )}
          </>
        )}
      </div>

      {/* 電圧降下 */}
      {v.voltageDrop !== null && v.voltageDropRate !== null && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '4px', fontSize: '0.85rem' }}>
          <span style={{ color: 'var(--text-secondary)', minWidth: '80px' }}>電圧降下:</span>
          <span style={{ fontWeight: 600 }}>{v.voltageDrop.toFixed(2)} V</span>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            （{v.voltageDropRate.toFixed(2)}%）
          </span>
          {v.vdJudge && (
            <span className={`badge ${VD_BADGE[v.vdJudge].cls}`}>
              {VD_BADGE[v.vdJudge].text}
            </span>
          )}
        </div>
      )}

      {/* 推奨サイズ */}
      {v.recommendedSize && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.5rem',
          marginTop: '6px', padding: '6px 10px',
          background: 'var(--accent-bg)', border: '1px solid var(--accent-border)', borderRadius: '6px',
          fontSize: '0.83rem', color: 'var(--danger)',
        }}>
          💡 推奨: <strong>{v.wireType} {v.recommendedSize}</strong> 以上
        </div>
      )}
    </div>
  )
}
