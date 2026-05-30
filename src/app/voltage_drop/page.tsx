'use client'

import Link from 'next/link'
import { useState, useMemo } from 'react'

// ==========================================
// R・Xデータ（JCS 103A 参考値）
// ==========================================
const RX_DATA: Record<string, Record<string, { R: number; X: number }>> = {
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

const SIZE_OPTIONS = ['8', '14', '22', '38', '60', '100', '150', '200', '250', '325']

const SYSTEM_OPTIONS = [
  { value: '2',     label: '単相2線（K=2）' },
  { value: '1',     label: '単相3線（K=1）' },
  { value: '1.732', label: '三相3線（K=1.732）' },
]

const FREQ_OPTIONS = [
  { value: '50', label: '50 Hz' },
  { value: '60', label: '60 Hz' },
]

const PF_OPTIONS = [
  { value: '1.0', label: '1.0' },
  { value: '0.9', label: '0.9' },
  { value: '0.8', label: '0.8' },
]

const VOLTAGE_OPTIONS = [
  { value: '100', label: '100 V' },
  { value: '200', label: '200 V' },
  { value: '210', label: '210 V' },
  { value: '220', label: '220 V' },
]

// 判定テーブルの基準
const JUDGE_ROWS = [
  { label: '60m以下', lowVoltage: '4%以内', transformer: '5%以内', limit: 4 },
  { label: '〜120m',  lowVoltage: '4%以内', transformer: '5%以内', limit: 4 },
  { label: '〜200m',  lowVoltage: '5%以内', transformer: '6%以内', limit: 5 },
  { label: '200m超',  lowVoltage: '6%以内', transformer: '7%以内', limit: 6 },
]

/** ラジオボタン群の共通コンポーネント */
function ChipGroup({
  name,
  options,
  value,
  onChange,
}: {
  name: string
  options: { value: string; label: string }[]
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div className="chips-group">
      {options.map((o) => (
        <label className="chip-label" key={o.value}>
          <input
            type="radio"
            name={name}
            value={o.value}
            checked={value === o.value}
            onChange={() => onChange(o.value)}
          />
          <span className="chip-text">{o.label}</span>
        </label>
      ))}
    </div>
  )
}

/** 判定バッジを返す */
function JudgeBadge({ rate, limit, hasResult }: { rate: number; limit: number; hasResult: boolean }) {
  if (!hasResult) return <span className="badge">—</span>
  if (rate <= limit) return <span className="badge badge-ok">OK</span>
  return <span className="badge badge-ng">NG</span>
}

export default function VoltageDropPage() {
  const [freq, setFreq] = useState('60')
  const [system, setSystem] = useState('1')
  const [size, setSize] = useState('22')
  const [pf, setPf] = useState('1.0')
  const [current, setCurrent] = useState('')
  const [length, setLength] = useState('')
  const [voltage, setVoltage] = useState('200')

  // R・X・Z 算出
  const rxz = useMemo(() => {
    const data = RX_DATA[size]?.[freq]
    if (!data) return null
    const pfNum = parseFloat(pf)
    const z = data.R * pfNum + data.X * Math.sqrt(1 - pfNum * pfNum)
    return { r: data.R, x: data.X, z }
  }, [size, freq, pf])

  // 計算結果
  const result = useMemo(() => {
    if (!rxz) return null
    const I = parseFloat(current)
    const L = parseFloat(length)
    const Ku = parseFloat(system)
    const Vnom = parseFloat(voltage)
    if (isNaN(I) || isNaN(L) || I <= 0 || L <= 0) return null

    const Vd = Ku * I * L * rxz.z * 0.001
    const rate = (Vd / Vnom) * 100

    let badgeClass = 'badge-ok'
    let badgeText = '良好'
    if (rate > 6) { badgeClass = 'badge-ng'; badgeText = '超過' }
    else if (rate > 4) { badgeClass = 'badge-warn'; badgeText = '注意' }

    const pfNum = parseFloat(pf)
    let sysName = '単相3線式'
    if (Ku === 2) sysName = '単相2線式'
    else if (Ku > 1.7) sysName = '三相3線式'

    const steps = [
      `配電方式: ${sysName} → K = ${Ku}`,
      `周波数: ${freq} Hz　ケーブルサイズ: ${size} sq`,
      `R = ${rxz.r} Ω/km　X = ${rxz.x} Ω/km　cosθ = ${pfNum}`,
      `Z = R·cosθ + X·√(1−cosθ²) = ${rxz.r}×${pfNum} + ${rxz.x}×√(1−${pfNum}²) = ${rxz.z.toFixed(4)} Ω/km`,
      `電流: I = ${I} A　亘長: L = ${L} m`,
      `ΔV = ${Ku} × ${I} × ${L} × ${rxz.z.toFixed(4)} × 0.001`,
      `ΔV = ${Vd.toFixed(2)} V`,
      `電圧降下率 = ${Vd.toFixed(2)} ÷ ${Vnom} × 100 = ${rate.toFixed(2)} %`,
    ]

    return { Vd, rate, badgeClass, badgeText, steps }
  }, [rxz, current, length, system, voltage, freq, size, pf])

  const hasResult = result !== null

  return (
    <>
      <header className="app-header">
        <Link className="back-link" href="/" aria-label="ホームへ戻る">←</Link>
        <span className="header-icon">📉</span>
        <h1>電圧降下計算</h1>
      </header>

      <main className="main-content">
        <div className="formula-box">
          <div className="formula">ΔV = K × I × L × Z × 0.001</div>
          <div>Z = R·cosθ + X·√(1−cosθ²)　（インピーダンス法 / JCS 103A）</div>
        </div>

        <section className="card">
          <p className="card-title">入力条件</p>

          <div className="form-group">
            <label className="form-label">周波数</label>
            <ChipGroup name="freq" options={FREQ_OPTIONS} value={freq} onChange={setFreq} />
          </div>

          <div className="form-group">
            <label className="form-label">配電方式</label>
            <ChipGroup name="system" options={SYSTEM_OPTIONS} value={system} onChange={setSystem} />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="sel-size">ケーブルサイズ（600V CV-T / CV-D 相当）</label>
            <select
              className="form-control"
              id="sel-size"
              value={size}
              onChange={(e) => setSize(e.target.value)}
            >
              {SIZE_OPTIONS.map((s) => (
                <option key={s} value={s}>{s} sq</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">力率 cosθ</label>
            <ChipGroup name="pf" options={PF_OPTIONS} value={pf} onChange={setPf} />
          </div>

          <div className="rxz-row">
            <div className="rxz-badge">
              <span className="rxz-label">R（Ω/km）</span>
              <span className="rxz-val">{rxz ? rxz.r.toFixed(4) : '—'}</span>
            </div>
            <div className="rxz-badge">
              <span className="rxz-label">X（Ω/km）</span>
              <span className="rxz-val">{rxz ? rxz.x.toFixed(4) : '—'}</span>
            </div>
            <div className="rxz-badge">
              <span className="rxz-label">Z（Ω/km）</span>
              <span className="rxz-val">{rxz ? rxz.z.toFixed(4) : '—'}</span>
            </div>
          </div>

          <div className="form-group mt-2">
            <label className="form-label" htmlFor="inp-current">電流 I（A）</label>
            <input
              type="number"
              className="form-control"
              id="inp-current"
              placeholder="例: 30"
              min="0"
              step="0.1"
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="inp-length">亘長 L（m）</label>
            <input
              type="number"
              className="form-control"
              id="inp-length"
              placeholder="例: 100"
              min="0"
              step="1"
              value={length}
              onChange={(e) => setLength(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">定格電圧（V）</label>
            <ChipGroup name="voltage" options={VOLTAGE_OPTIONS} value={voltage} onChange={setVoltage} />
          </div>
        </section>

        <section className="result-box">
          <div className="d-flex justify-between align-center" style={{ gap: '1rem', flexWrap: 'wrap' }}>
            <div>
              <div className="result-label">電圧降下 ΔV</div>
              <div>
                <span className="vd-display">{hasResult ? result.Vd.toFixed(2) : '—'}</span>
                <span className="result-unit">V</span>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div className="result-label">電圧降下率</div>
              <div>
                <span className="rate-display">{hasResult ? result.rate.toFixed(2) : '—'}</span>
                <span className="result-unit">%</span>
              </div>
              <div style={{ marginTop: '0.4rem' }}>
                {hasResult && <span className={`badge ${result.badgeClass}`}>{result.badgeText}</span>}
              </div>
            </div>
          </div>

          <div className="mt-2">
            <div className="result-label" style={{ marginBottom: '0.5rem' }}>内線規程 許容値との比較</div>
            <table className="allowance-table">
              <thead>
                <tr>
                  <th>こう長</th>
                  <th>低圧受電（幹+分岐）</th>
                  <th>専用変圧器</th>
                  <th>判定</th>
                </tr>
              </thead>
              <tbody>
                {JUDGE_ROWS.map((row) => (
                  <tr key={row.label}>
                    <td>{row.label}</td>
                    <td>{row.lowVoltage}</td>
                    <td>{row.transformer}</td>
                    <td>
                      <JudgeBadge
                        rate={hasResult ? result.rate : 0}
                        limit={row.limit}
                        hasResult={hasResult}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {hasResult && (
          <section className="card mt-2">
            <p className="card-title">計算過程</p>
            <div style={{ fontSize: '0.85rem', lineHeight: 1.9, color: 'var(--text-secondary)' }}>
              {result.steps.map((step, i) => (
                <div key={i}>{step}</div>
              ))}
            </div>
          </section>
        )}

        <div className="disclaimer">
          <strong>⚠ 注意事項</strong>
          R・X値はJCS 103Aを参考にした代表値です（600V CV系）。
          実際の施工では最新のメーカーカタログ・規格を確認してください。
          本ツールの計算結果で生じた損害について、作成者は一切の責任を負いません。
        </div>
      </main>
    </>
  )
}
