import { useState, useEffect } from 'react'
import api from '../api'

const SAFETY_COLORS = {
  VERY_SAFE: '#22c55e',
  SAFE: '#10b981',
  MODERATE: '#f59e0b',
  AGGRESSIVE: '#ef4444',
}

const TYPE_COLORS = {
  COVERED_CALL: '#38bdf8',
  CASH_SECURED_PUT: '#a78bfa',
  PUT_CREDIT_SPREAD: '#fb923c',
  COLLAR: '#f472b6',
}

const SAFETY_TAGS = ['ALL', 'VERY_SAFE', 'SAFE', 'MODERATE', 'AGGRESSIVE']
const TYPE_OPTIONS = ['ALL', 'COVERED_CALL', 'CASH_SECURED_PUT', 'PUT_CREDIT_SPREAD', 'COLLAR']
const RISK_PROFILES = ['Conservative', 'Moderate', 'Aggressive']

function formatCurrency(v) {
  if (v == null) return '--'
  return '\u20B9' + Number(v).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function formatPct(v) {
  if (v == null) return '--'
  return Number(v).toFixed(2) + '%'
}

export default function Scanner({ onNavigate, permission }) {
  const [recommendations, setRecommendations] = useState([])
  const [scanning, setScanning] = useState(false)
  const [error, setError] = useState(null)
  const [safetyFilter, setSafetyFilter] = useState('ALL')
  const [typeFilter, setTypeFilter] = useState('ALL')
  const [riskProfile, setRiskProfile] = useState(null)
  const [expandedCard, setExpandedCard] = useState(null)
  const [summary, setSummary] = useState({ weeklyIncome: 0, arbitrageCount: 0, riskProfile: null })

  const doScan = async (profile) => {
    setScanning(true)
    setError(null)
    try {
      const payload = profile ? { risk_profile: profile } : {}
      const data = await api.scan(payload)
      const recs = data.recommendations || data || []
      setRecommendations(Array.isArray(recs) ? recs : [])
      setSummary({
        weeklyIncome: data.estimated_weekly_income || recs.reduce((s, r) => s + (r.premium || 0), 0),
        arbitrageCount: data.arbitrage_count || 0,
        riskProfile: data.risk_profile || profile || riskProfile || 'Moderate',
      })
      if (profile) setRiskProfile(profile)
    } catch (e) {
      setError(e.message)
    } finally {
      setScanning(false)
    }
  }

  const filtered = recommendations.filter(r => {
    if (safetyFilter !== 'ALL' && r.safety !== safetyFilter) return false
    if (typeFilter !== 'ALL' && r.type !== typeFilter) return false
    return true
  })

  const riskBadgeColor = {
    Conservative: '#22c55e',
    Moderate: '#f59e0b',
    Aggressive: '#ef4444',
  }

  return (
    <div style={{ padding: '1.5rem', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#e2e8f0', margin: 0 }}>
          Strategy Scanner
        </h1>
        <button
          onClick={() => doScan(riskProfile)}
          disabled={scanning}
          style={{
            background: scanning ? '#1e293b' : 'linear-gradient(135deg, #10b981, #059669)',
            color: scanning ? '#64748b' : '#fff',
            border: 'none', borderRadius: '8px', padding: '0.6rem 1.5rem',
            fontWeight: 600, fontSize: '0.9rem', cursor: scanning ? 'not-allowed' : 'pointer',
            fontFamily: 'inherit',
          }}
        >
          {scanning ? 'Scanning...' : 'Scan Now'}
        </button>
      </div>

      {error && (
        <div style={{
          background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)',
          borderRadius: '8px', padding: '0.75rem 1rem', marginBottom: '1rem',
          color: '#f87171', fontSize: '0.85rem',
        }}>
          {error}
        </div>
      )}

      {/* Summary line */}
      <div style={{
        display: 'flex', gap: '1.5rem', alignItems: 'center', marginBottom: '1.25rem',
        flexWrap: 'wrap',
      }}>
        <div style={{
          background: 'rgba(15,23,42,0.7)', border: '1px solid rgba(148,163,184,0.1)',
          borderRadius: '8px', padding: '0.6rem 1rem',
        }}>
          <span style={{ color: '#64748b', fontSize: '0.75rem' }}>Safe Weekly Income</span>
          <div style={{ color: '#6ee7b7', fontWeight: 700, fontSize: '1.1rem' }}>
            {formatCurrency(summary.weeklyIncome)}
          </div>
        </div>
        <div style={{
          background: 'rgba(15,23,42,0.7)', border: '1px solid rgba(148,163,184,0.1)',
          borderRadius: '8px', padding: '0.6rem 1rem',
        }}>
          <span style={{ color: '#64748b', fontSize: '0.75rem' }}>Arbitrage Opportunities</span>
          <div style={{ color: '#38bdf8', fontWeight: 700, fontSize: '1.1rem' }}>
            {summary.arbitrageCount}
          </div>
        </div>
        {summary.riskProfile && (
          <span style={{
            padding: '0.35rem 0.75rem', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 600,
            background: `${riskBadgeColor[summary.riskProfile] || '#64748b'}22`,
            color: riskBadgeColor[summary.riskProfile] || '#94a3b8',
            border: `1px solid ${riskBadgeColor[summary.riskProfile] || '#64748b'}44`,
          }}>
            {summary.riskProfile}
          </span>
        )}
      </div>

      {/* Filter bar */}
      <div style={{
        display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '1rem',
        flexWrap: 'wrap',
      }}>
        <span style={{ color: '#64748b', fontSize: '0.75rem', fontWeight: 600 }}>SAFETY:</span>
        {SAFETY_TAGS.map(tag => (
          <button key={tag} onClick={() => setSafetyFilter(tag)} style={{
            background: safetyFilter === tag
              ? (tag === 'ALL' ? 'rgba(148,163,184,0.2)' : `${SAFETY_COLORS[tag]}22`)
              : 'transparent',
            color: safetyFilter === tag
              ? (tag === 'ALL' ? '#e2e8f0' : SAFETY_COLORS[tag])
              : '#64748b',
            border: `1px solid ${safetyFilter === tag
              ? (tag === 'ALL' ? 'rgba(148,163,184,0.3)' : `${SAFETY_COLORS[tag]}44`)
              : 'rgba(148,163,184,0.1)'}`,
            borderRadius: '6px', padding: '0.3rem 0.6rem', fontSize: '0.75rem',
            cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500,
          }}>
            {tag.replace(/_/g, ' ')}
          </button>
        ))}

        <span style={{ color: '#64748b', fontSize: '0.75rem', fontWeight: 600, marginLeft: '0.75rem' }}>TYPE:</span>
        <select
          value={typeFilter}
          onChange={e => setTypeFilter(e.target.value)}
          style={{
            background: '#0f172a', color: '#e2e8f0', border: '1px solid rgba(148,163,184,0.15)',
            borderRadius: '6px', padding: '0.35rem 0.5rem', fontSize: '0.75rem',
            fontFamily: 'inherit', cursor: 'pointer',
          }}
        >
          {TYPE_OPTIONS.map(opt => (
            <option key={opt} value={opt}>{opt.replace(/_/g, ' ')}</option>
          ))}
        </select>
      </div>

      {/* Risk profile quick-switch */}
      <div style={{
        display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '1.5rem',
      }}>
        <span style={{ color: '#64748b', fontSize: '0.75rem', fontWeight: 600 }}>RISK PROFILE:</span>
        {RISK_PROFILES.map(p => (
          <button key={p} onClick={() => doScan(p)} disabled={scanning} style={{
            background: riskProfile === p ? `${riskBadgeColor[p]}22` : 'rgba(15,23,42,0.7)',
            color: riskProfile === p ? riskBadgeColor[p] : '#94a3b8',
            border: `1px solid ${riskProfile === p ? `${riskBadgeColor[p]}44` : 'rgba(148,163,184,0.1)'}`,
            borderRadius: '6px', padding: '0.4rem 0.8rem', fontSize: '0.8rem',
            cursor: scanning ? 'not-allowed' : 'pointer', fontFamily: 'inherit', fontWeight: 500,
          }}>
            {p}
          </button>
        ))}
      </div>

      {/* Recommendation cards */}
      {filtered.length === 0 && !scanning && (
        <div style={{
          textAlign: 'center', padding: '3rem', color: '#64748b', fontSize: '0.9rem',
        }}>
          {recommendations.length === 0
            ? 'Click "Scan Now" to generate strategy recommendations.'
            : 'No recommendations match the current filters.'}
        </div>
      )}

      {scanning && (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8', fontSize: '0.9rem' }}>
          Scanning strategies...
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {filtered.map((rec, idx) => {
          const safetyColor = SAFETY_COLORS[rec.safety] || '#64748b'
          const typeColor = TYPE_COLORS[rec.type] || '#94a3b8'
          const isExpanded = expandedCard === idx

          return (
            <div key={idx} style={{
              background: 'rgba(15,23,42,0.7)', border: '1px solid rgba(148,163,184,0.1)',
              borderRadius: '8px', borderLeft: `4px solid ${safetyColor}`,
              cursor: 'pointer', transition: 'background 0.15s',
            }}>
              {/* Card header */}
              <div
                onClick={() => setExpandedCard(isExpanded ? null : idx)}
                style={{ padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}
              >
                <span style={{ color: '#64748b', fontSize: '0.75rem', fontWeight: 600, minWidth: '28px' }}>
                  #{rec.rank || idx + 1}
                </span>
                <span style={{ color: '#e2e8f0', fontWeight: 700, fontSize: '1rem', minWidth: '80px' }}>
                  {rec.symbol}
                </span>
                <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>
                  {rec.strike}
                </span>
                <span style={{
                  padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 600,
                  background: `${typeColor}22`, color: typeColor,
                }}>
                  {(rec.type || '').replace(/_/g, ' ')}
                </span>
                <span style={{
                  padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 600,
                  background: `${safetyColor}22`, color: safetyColor,
                }}>
                  {(rec.safety || '').replace(/_/g, ' ')}
                </span>
                <span style={{ marginLeft: 'auto', color: '#6ee7b7', fontWeight: 700, fontSize: '1rem' }}>
                  {formatCurrency(rec.premium)}
                </span>
                <span style={{ color: '#64748b', fontSize: '0.85rem' }}>
                  {isExpanded ? '\u25B2' : '\u25BC'}
                </span>
              </div>

              {/* Expanded details */}
              {isExpanded && (
                <div style={{ padding: '0 1.25rem 1.25rem', borderTop: '1px solid rgba(148,163,184,0.08)' }}>
                  {/* Metrics row */}
                  <div style={{
                    display: 'flex', gap: '1.5rem', flexWrap: 'wrap', padding: '1rem 0',
                  }}>
                    {[
                      { label: 'Prob OTM', value: formatPct(rec.prob_otm) },
                      { label: 'Delta', value: rec.delta != null ? Number(rec.delta).toFixed(3) : '--' },
                      { label: 'Margin Needed', value: formatCurrency(rec.margin_needed) },
                      { label: 'Annualized Return', value: formatPct(rec.annualized_return) },
                      { label: 'Theta/day', value: rec.theta != null ? formatCurrency(rec.theta) : '--' },
                    ].map(m => (
                      <div key={m.label}>
                        <div style={{ color: '#64748b', fontSize: '0.7rem', marginBottom: '0.2rem' }}>{m.label}</div>
                        <div style={{ color: '#e2e8f0', fontSize: '0.9rem', fontWeight: 600 }}>{m.value}</div>
                      </div>
                    ))}
                  </div>

                  {/* Strike Rationale */}
                  {rec.rationale && (
                    <div style={{
                      background: 'rgba(30,41,59,0.5)', borderRadius: '6px', padding: '0.75rem 1rem',
                      marginBottom: '1rem',
                    }}>
                      <div style={{ color: '#64748b', fontSize: '0.7rem', marginBottom: '0.35rem', fontWeight: 600 }}>
                        STRIKE RATIONALE
                      </div>
                      <div style={{ color: '#cbd5e1', fontSize: '0.8rem', lineHeight: 1.5 }}>
                        {rec.rationale}
                      </div>
                    </div>
                  )}

                  {/* Risk Ladder */}
                  {rec.alternatives && rec.alternatives.length > 0 && (
                    <div style={{ marginBottom: '1rem' }}>
                      <div style={{ color: '#64748b', fontSize: '0.7rem', marginBottom: '0.5rem', fontWeight: 600 }}>
                        RISK LADDER
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        {rec.alternatives.map((alt, ai) => {
                          const altLabel = alt.label || ['Conservative', 'Moderate', 'Aggressive'][ai] || `Alt ${ai + 1}`
                          const altColor = riskBadgeColor[altLabel] || '#94a3b8'
                          return (
                            <div key={ai} style={{
                              background: 'rgba(30,41,59,0.5)', border: `1px solid ${altColor}33`,
                              borderRadius: '6px', padding: '0.5rem 0.75rem', minWidth: '140px',
                            }}>
                              <div style={{ color: altColor, fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                                {altLabel}
                              </div>
                              <div style={{ color: '#e2e8f0', fontSize: '0.85rem', fontWeight: 600 }}>
                                {formatCurrency(alt.premium)}
                              </div>
                              <div style={{ color: '#94a3b8', fontSize: '0.7rem' }}>
                                Prob OTM: {formatPct(alt.prob_otm)}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* Fees estimate */}
                  {rec.fees != null && (
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem',
                    }}>
                      <span style={{ color: '#64748b', fontSize: '0.75rem', fontWeight: 600 }}>FEES ESTIMATE:</span>
                      <span style={{ color: '#fcd34d', fontSize: '0.85rem', fontWeight: 600 }}>
                        {formatCurrency(rec.fees)}
                      </span>
                    </div>
                  )}

                  {/* Execute button */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    {permission === 'EXECUTE' ? (
                      <button
                        onClick={e => {
                          e.stopPropagation()
                          api.execute({
                            symbol: rec.symbol,
                            strike: rec.strike,
                            type: rec.type,
                            premium: rec.premium,
                          }).catch(() => {})
                        }}
                        style={{
                          background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                          color: '#fff', border: 'none', borderRadius: '6px',
                          padding: '0.5rem 1.25rem', fontWeight: 600, fontSize: '0.8rem',
                          cursor: 'pointer', fontFamily: 'inherit',
                        }}
                      >
                        Execute
                      </button>
                    ) : (
                      <span style={{
                        background: '#1e293b', color: '#475569', borderRadius: '6px',
                        padding: '0.5rem 1.25rem', fontWeight: 600, fontSize: '0.8rem',
                        border: '1px solid rgba(148,163,184,0.1)',
                      }}>
                        READONLY
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
