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
          <p style={{ color: '#c53030', fontWeight: 600 }}>入力にエラーがあります</p>
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

  return (
    <>
      <section className="card vd2-result-card">
        <p className="card-title">選定結果</p>
        <div className="result-main">
          <span className="result-breaker">
            {result.selectedBreaker !== null ? result.selectedBreaker : '規格超'}
          </span>
          <span className="result-breaker-unit"> A</span>
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

        <div className="tip-box">
          <strong>安全の不等式：</strong>
          負荷電流 (I) ≦ ブレーカー定格 (I<sub>n</sub>) ≦ 電線の許容電流 (I<sub>z</sub>)
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
      {result.wireVerifications.some(v => v.allowableCurrent !== null || v.voltageDrop !== null) && (
        <section className="card vd2-result-card">
          <p className="card-title">配線検証</p>
          {result.wireVerifications.map((v) => (
            <WireVerificationRow
              key={v.loadIndex}
              verification={v}
              breakerRating={result.selectedBreaker}
            />
          ))}
          <div style={{ fontSize: '0.78rem', color: '#718096', marginTop: '0.75rem', lineHeight: 1.6 }}>
            ※ 許容電流: 安全の不等式 I ≦ I<sub>n</sub> ≦ I<sub>z</sub> の判定<br />
            ※ 電圧降下: インピーダンス法 ΔV = K×I×L×Z×0.001（力率反映）<br />
            ※ 判定基準: 2%以下=良好 / 2〜4%=注意 / 4%超=超過
          </div>
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
                  judge = <span style={{ color: '#e53e3e', fontWeight: 700 }}>✕ 不足</span>
                } else if (isSelected) {
                  judge = <span style={{ color: '#1d6fcf', fontWeight: 700 }}>◎ 選定</span>
                } else {
                  judge = <span style={{ color: '#718096' }}>○ 適合</span>
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

      {/* 計算過程 */}
      <section className="card vd2-result-card">
        <p className="card-title">計算過程</p>
        <div style={{ fontSize: '0.85rem', lineHeight: 1.9, color: '#4a5568' }}>
          配電方式: {result.systemInfo.name}<br />
          定格電圧: V = {voltage} V<br />
          合計消費電力: P = {result.totalKw.toFixed(2)} kW = {(result.totalKw * 1000).toFixed(0)} W<br />
          力率: cosθ = {powerFactor}<br />
          <br />
          <strong>【STEP 1】負荷電流の算出</strong><br />
          I = P / (K × V × cosθ)<br />
          I = {(result.totalKw * 1000).toFixed(0)} / ({result.systemInfo.kDisplay} × {voltage} × {powerFactor})<br />
          <strong>I = {result.loadCurrent.toFixed(2)} A</strong><br />
          <br />
          <strong>【STEP 2】余裕率の適用</strong><br />
          I&apos; = {result.loadCurrent.toFixed(2)} × {margin} = <strong>{result.marginCurrent.toFixed(2)} A</strong><br />
          <br />
          <strong>【STEP 3】ブレーカー定格の選定</strong><br />
          {result.motorInfo ? (
            <>内線規程 3705-1表より → <strong>{result.selectedBreaker} A</strong>（{START_METHOD_LABELS[result.primaryStartMethod]}）</>
          ) : result.welderInfo ? (
            <>内線規程 3330-1表より → <strong>{result.selectedBreaker} A</strong></>
          ) : result.selectedBreaker !== null ? (
            <>{result.marginCurrent.toFixed(2)} A 以上の最小規格 → <strong>{result.selectedBreaker} A</strong></>
          ) : (
            <>{result.marginCurrent.toFixed(2)} A は最大規格を超えています。</>
          )}
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
  if (!v.wireType && !v.wireSize) return null

  const VD_BADGE: Record<string, { cls: string; text: string }> = {
    ok: { cls: 'badge-ok', text: '良好' },
    warn: { cls: 'badge-warn', text: '注意' },
    ng: { cls: 'badge-ng', text: '超過' },
  }

  return (
    <div style={{
      padding: '12px',
      marginBottom: '8px',
      background: '#f8fafc',
      border: '1px solid #e0e3e8',
      borderRadius: '8px',
    }}>
      <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '8px', color: '#2d3748' }}>
        {v.loadName}
        <span style={{ fontWeight: 400, fontSize: '0.8rem', color: '#718096', marginLeft: '8px' }}>
          {v.wireType} {v.wireSize}{v.wireLength > 0 ? ` / ${v.wireLength}m` : ''}
        </span>
      </div>

      {/* 許容電流 */}
      {v.allowableCurrent !== null && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '4px', fontSize: '0.85rem' }}>
          <span style={{ color: '#4a5568', minWidth: '80px' }}>許容電流:</span>
          <span style={{ fontWeight: 600 }}>{v.allowableCurrent} A</span>
          {breakerRating !== null && (
            <span style={{ fontSize: '0.8rem', color: '#718096' }}>
              （ブレーカー {breakerRating}A {v.isAllowableOk ? '≦' : '>'} {v.allowableCurrent}A）
            </span>
          )}
          {v.isAllowableOk !== null && (
            <span className={`badge ${v.isAllowableOk ? 'badge-ok' : 'badge-ng'}`}>
              {v.isAllowableOk ? 'OK' : 'NG'}
            </span>
          )}
        </div>
      )}

      {/* 電圧降下 */}
      {v.voltageDrop !== null && v.voltageDropRate !== null && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '4px', fontSize: '0.85rem' }}>
          <span style={{ color: '#4a5568', minWidth: '80px' }}>電圧降下:</span>
          <span style={{ fontWeight: 600 }}>{v.voltageDrop.toFixed(2)} V</span>
          <span style={{ fontSize: '0.8rem', color: '#718096' }}>
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
          background: '#fff5f5', border: '1px solid #feb2b2', borderRadius: '6px',
          fontSize: '0.83rem', color: '#c53030',
        }}>
          💡 推奨: <strong>{v.wireType} {v.recommendedSize}</strong> 以上
        </div>
      )}
    </div>
  )
}
