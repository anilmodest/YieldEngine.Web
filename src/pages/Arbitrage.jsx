import { useState, useEffect } from 'react'
import api from '../api'

const COLORS = {
  bg: '#0a0f1a',
  card: 'rgba(15,23,42,0.7)',
  border: 'rgba(148,163,184,0.1)',
  profit: '#6ee7b7',
  loss: '#f87171',
  warning: '#fcd34d',
  info: '#38bdf8',
  textPrimary: '#e2e8f0',
  textSecondary: '#94a3b8',
  muted: '#64748b',
}

const TYPE_COLORS = {
  CASH_FUTURES: '#38bdf8',
  CASH_FUTURES_ARB: '#38bdf8',
  PUT_CALL_PARITY: '#a78bfa',
}

function formatCurrency(v) {
  if (v == null) return '--'
  return '\u20B9' + Number(v).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function formatPct(v) {
  if (v == null) return '--'
  return Number(v).toFixed(2) + '%'
}

export default function Arbitrage({ onNavigate, permission }) {
  const [opportunities, setOpportunities] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [expandedCard, setExpandedCard] = useState(null)

  useEffect(() => {
    let cancelled = false
    api.getArbitrage()
      .then(data => {
        if (cancelled) return
        const items = Array.isArray(data) ? data : data.opportunities || data.arbitrage || []
        const sorted = items.sort((a, b) => (b.annualized_return ?? 0) - (a.annualized_return ?? 0))
        setOpportunities(sorted)
      })
      .catch(e => {
        if (!cancelled) setError(e.message)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [])

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <span style={{ color: COLORS.textSecondary, fontSize: '1rem' }}>Loading arbitrage opportunities...</span>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: COLORS.textPrimary, margin: 0 }}>
          Arbitrage Opportunities
        </h1>
        <span style={{
          padding: '0.3rem 0.75rem', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 600,
          background: 'rgba(110,231,183,0.12)', color: COLORS.profit,
          border: '1px solid rgba(110,231,183,0.3)',
        }}>
          {opportunities.length} found
        </span>
      </div>

      {error && (
        <div style={{
          background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)',
          borderRadius: '8px', padding: '0.75rem 1rem', marginBottom: '1rem',
          color: COLORS.loss, fontSize: '0.85rem',
        }}>
          {error}
        </div>
      )}

      {opportunities.length === 0 && !error && (
        <div style={{
          textAlign: 'center', padding: '3rem', color: COLORS.muted, fontSize: '0.9rem',
        }}>
          No arbitrage opportunities found at this time. Run a scan to refresh.
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {opportunities.map((opp, idx) => {
          const typeKey = (opp.type || '').replace(/_ARB$/, '').replace(/ /g, '_').toUpperCase()
          const typeColor = TYPE_COLORS[typeKey] || TYPE_COLORS[opp.type] || COLORS.info
          const isExpanded = expandedCard === idx

          return (
            <div key={idx} style={{
              background: COLORS.card,
              border: `1px solid ${COLORS.border}`,
              borderRadius: '10px',
              borderLeft: `4px solid ${COLORS.profit}`,
              overflow: 'hidden',
            }}>
              {/* Card header */}
              <div
                onClick={() => setExpandedCard(isExpanded ? null : idx)}
                style={{
                  padding: '1rem 1.25rem',
                  display: 'flex', alignItems: 'center', gap: '1rem',
                  cursor: 'pointer', flexWrap: 'wrap',
                }}
              >
                {/* Type badge */}
                <span style={{
                  padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 700,
                  background: `${typeColor}22`, color: typeColor, letterSpacing: '0.03em',
                  whiteSpace: 'nowrap',
                }}>
                  {(opp.type || 'ARBITRAGE').replace(/_/g, ' ')}
                </span>

                {/* Symbol */}
                <span style={{ color: COLORS.textPrimary, fontWeight: 700, fontSize: '1rem' }}>
                  {opp.symbol || opp.underlying || '--'}
                </span>

                {/* Risk-Free badge */}
                <span style={{
                  padding: '0.18rem 0.55rem', borderRadius: '4px', fontSize: '0.68rem', fontWeight: 700,
                  background: 'rgba(110,231,183,0.15)', color: COLORS.profit,
                  border: '1px solid rgba(110,231,183,0.3)',
                }}>
                  Risk-Free
                </span>

                {/* Holding days */}
                {opp.holding_days != null && (
                  <span style={{ fontSize: '0.78rem', color: COLORS.muted }}>
                    {opp.holding_days}d hold
                  </span>
                )}

                {/* Right side: annualized return */}
                <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                  <div style={{ color: COLORS.profit, fontWeight: 700, fontSize: '1.1rem' }}>
                    {formatPct(opp.annualized_return)}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: COLORS.muted }}>annualized</div>
                </div>

                <span style={{ color: COLORS.muted, fontSize: '0.85rem' }}>
                  {isExpanded ? '\u25B2' : '\u25BC'}
                </span>
              </div>

              {/* Expanded details */}
              {isExpanded && (
                <div style={{
                  padding: '0 1.25rem 1.25rem',
                  borderTop: `1px solid rgba(148,163,184,0.08)`,
                }}>
                  {/* Metrics row */}
                  <div style={{
                    display: 'flex', gap: '1.5rem', flexWrap: 'wrap', padding: '1rem 0 0.75rem',
                  }}>
                    {[
                      { label: 'Spread / Profit', value: formatCurrency(opp.spread ?? opp.profit ?? opp.net_premium) },
                      { label: 'Margin Needed', value: formatCurrency(opp.margin_needed ?? opp.margin) },
                      { label: 'Return', value: formatPct(opp.return_pct ?? opp.absolute_return) },
                      { label: 'Annualized', value: formatPct(opp.annualized_return) },
                      { label: 'Holding Days', value: opp.holding_days ?? opp.days_to_expiry ?? '--' },
                    ].map(m => (
                      <div key={m.label}>
                        <div style={{ color: COLORS.muted, fontSize: '0.7rem', marginBottom: '0.2rem' }}>{m.label}</div>
                        <div style={{ color: COLORS.textPrimary, fontSize: '0.9rem', fontWeight: 600 }}>{m.value}</div>
                      </div>
                    ))}
                  </div>

                  {/* Legs */}
                  {opp.legs && opp.legs.length > 0 && (
                    <div style={{ marginTop: '0.5rem' }}>
                      <div style={{ color: COLORS.muted, fontSize: '0.72rem', fontWeight: 600, marginBottom: '0.5rem', textTransform: 'uppercase' }}>
                        LEG DETAILS
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                        {opp.legs.map((leg, li) => {
                          const isBuy = (leg.side || leg.action || '').toUpperCase() === 'BUY'
                          const sideColor = isBuy ? COLORS.info : COLORS.warning
                          return (
                            <div key={li} style={{
                              display: 'flex', alignItems: 'center', gap: '0.75rem',
                              background: 'rgba(30,41,59,0.5)', borderRadius: '6px',
                              padding: '0.5rem 0.75rem', flexWrap: 'wrap',
                            }}>
                              <span style={{
                                padding: '0.15rem 0.45rem', borderRadius: '4px', fontSize: '0.7rem',
                                fontWeight: 700, background: `${sideColor}22`, color: sideColor,
                                minWidth: '36px', textAlign: 'center',
                              }}>
                                {(leg.side || leg.action || 'BUY').toUpperCase()}
                              </span>
                              <span style={{ color: COLORS.textPrimary, fontWeight: 600, fontSize: '0.85rem' }}>
                                {leg.instrument || leg.symbol || leg.tradingsymbol || '--'}
                              </span>
                              {leg.qty != null && (
                                <span style={{ color: COLORS.textSecondary, fontSize: '0.8rem' }}>
                                  x{leg.qty ?? leg.quantity}
                                </span>
                              )}
                              {leg.price != null && (
                                <span style={{ color: COLORS.textSecondary, fontSize: '0.8rem', marginLeft: 'auto' }}>
                                  @ {formatCurrency(leg.price)}
                                </span>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* Execute / Readonly */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
                    {permission === 'EXECUTE' ? (
                      <button
                        onClick={e => {
                          e.stopPropagation()
                          api.execute({
                            type: 'arbitrage',
                            symbol: opp.symbol || opp.underlying,
                            legs: opp.legs,
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
                        border: `1px solid ${COLORS.border}`,
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
