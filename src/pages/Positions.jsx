import React, { useState, useEffect } from 'react'
import api from '../api'

const COLORS = {
  bg: '#0a0f1a',
  card: 'rgba(15,23,42,0.7)',
  border: 'rgba(148,163,184,0.1)',
  profit: '#6ee7b7',
  loss: '#f87171',
  warning: '#fcd34d',
  info: '#38bdf8',
  textPrimary: '#f1f5f9',
  textSecondary: '#94a3b8',
}

const STATUS_CONFIG = {
  SAFE: { color: COLORS.profit, label: 'SAFE', borderColor: null },
  AT_RISK: { color: COLORS.warning, label: 'AT RISK', borderColor: COLORS.warning },
  ITM: { color: COLORS.loss, label: 'ITM', borderColor: COLORS.loss },
}

function getStatus(delta) {
  const d = Math.abs(delta ?? 0)
  if (d > 0.50) return 'ITM'
  if (d >= 0.30) return 'AT_RISK'
  return 'SAFE'
}

function formatCurrency(v) {
  if (v == null) return '$0.00'
  const abs = Math.abs(v)
  const formatted = abs.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  return v < 0 ? `-$${formatted}` : `$${formatted}`
}

function pnlColor(v) {
  if (v == null || v === 0) return COLORS.textSecondary
  return v > 0 ? COLORS.profit : COLORS.loss
}

const cardStyle = {
  background: COLORS.card,
  border: `1px solid ${COLORS.border}`,
  borderRadius: '12px',
  padding: '20px',
}

const btnStyle = {
  padding: '6px 14px',
  borderRadius: '6px',
  border: 'none',
  cursor: 'pointer',
  fontSize: '0.8rem',
  fontWeight: 600,
}

const thStyle = {
  padding: '10px 12px',
  textAlign: 'left',
  color: COLORS.textSecondary,
  fontSize: '0.75rem',
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  borderBottom: `1px solid ${COLORS.border}`,
}

const tdStyle = {
  padding: '12px',
  color: COLORS.textPrimary,
  fontSize: '0.85rem',
  borderBottom: `1px solid ${COLORS.border}`,
}

export default function Positions({ onNavigate, permission }) {
  const [positions, setPositions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [expandedId, setExpandedId] = useState(null)
  const [adjustments, setAdjustments] = useState({})
  const [adjLoading, setAdjLoading] = useState({})
  const [closing, setClosing] = useState({})

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const data = await api.getPositions()
        if (!cancelled) setPositions(Array.isArray(data) ? data : data.positions || [])
      } catch (e) {
        if (!cancelled) setError(e.message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  const totalUnrealized = positions.reduce((s, p) => s + (p.unrealizedPnL ?? 0), 0)

  const handleAdjustments = async (id) => {
    if (expandedId === id) {
      setExpandedId(null)
      return
    }
    setExpandedId(id)
    if (adjustments[id]) return
    setAdjLoading(prev => ({ ...prev, [id]: true }))
    try {
      const data = await api.getAdjustments(id)
      setAdjustments(prev => ({ ...prev, [id]: data }))
    } catch (e) {
      setAdjustments(prev => ({ ...prev, [id]: { error: e.message } }))
    } finally {
      setAdjLoading(prev => ({ ...prev, [id]: false }))
    }
  }

  const handleClose = async (id) => {
    if (!confirm('Close this position?')) return
    setClosing(prev => ({ ...prev, [id]: true }))
    try {
      await api.closePosition(id, {})
      setPositions(prev => prev.filter(p => (p.id ?? p._id) !== id))
    } catch (e) {
      alert('Close failed: ' + e.message)
    } finally {
      setClosing(prev => ({ ...prev, [id]: false }))
    }
  }

  if (loading) {
    return (
      <div style={{ background: COLORS.bg, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: COLORS.info, fontSize: '1.1rem' }}>Loading positions...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ ...cardStyle, borderColor: COLORS.loss, color: COLORS.loss, textAlign: 'center' }}>
          Error: {error}
        </div>
      </div>
    )
  }

  return (
    <div style={{ padding: '1.5rem', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: COLORS.textPrimary, margin: 0 }}>
          Open Positions
        </h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ color: COLORS.textSecondary, fontSize: '0.85rem' }}>Total Unrealized P&L:</span>
          <span style={{ fontSize: '1.25rem', fontWeight: 700, color: pnlColor(totalUnrealized) }}>
            {formatCurrency(totalUnrealized)}
          </span>
        </div>
      </div>

      {/* Positions count */}
      <div style={{ color: COLORS.textSecondary, fontSize: '0.85rem', marginBottom: '1rem' }}>
        {positions.length} position{positions.length !== 1 ? 's' : ''}
      </div>

      {positions.length === 0 ? (
        <div style={{ ...cardStyle, textAlign: 'center', color: COLORS.textSecondary, padding: '3rem' }}>
          No open positions
        </div>
      ) : (
        <div style={{ ...cardStyle, padding: 0, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={thStyle}>Symbol</th>
                  <th style={thStyle}>Strategy</th>
                  <th style={thStyle}>Legs</th>
                  <th style={thStyle}>Entry Premium</th>
                  <th style={thStyle}>Current Value</th>
                  <th style={thStyle}>Unrealized P&L</th>
                  <th style={thStyle}>Days Held</th>
                  <th style={thStyle}>Expiry</th>
                  <th style={thStyle}>Status</th>
                  <th style={thStyle}>GTT</th>
                  <th style={thStyle}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {positions.map((pos) => {
                  const id = pos.id ?? pos._id
                  const status = getStatus(pos.delta)
                  const cfg = STATUS_CONFIG[status]
                  const rowBorder = cfg.borderColor ? `2px solid ${cfg.borderColor}` : 'none'
                  const isExpanded = expandedId === id

                  return (
                    <React.Fragment key={id}>
                      {/* -- need React import for Fragment -- */}
                      <tr style={{ borderLeft: rowBorder }}>
                        <td style={tdStyle}>
                          <span style={{ fontWeight: 600 }}>{pos.symbol}</span>
                        </td>
                        <td style={tdStyle}>
                          <span style={{ color: COLORS.info, fontSize: '0.8rem' }}>
                            {(pos.strategy || pos.type || '').replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td style={tdStyle}>
                          {(pos.legs || []).map((leg, i) => (
                            <div key={i} style={{ fontSize: '0.78rem', color: COLORS.textSecondary, whiteSpace: 'nowrap' }}>
                              {leg.action || leg.side} {leg.strike} {leg.optionType || leg.type || ''}
                            </div>
                          ))}
                          {(!pos.legs || pos.legs.length === 0) && (
                            <span style={{ color: COLORS.textSecondary, fontSize: '0.78rem' }}>--</span>
                          )}
                        </td>
                        <td style={tdStyle}>{formatCurrency(pos.entryPremium ?? pos.entry_premium)}</td>
                        <td style={tdStyle}>{formatCurrency(pos.currentValue ?? pos.current_value)}</td>
                        <td style={{ ...tdStyle, fontWeight: 600, color: pnlColor(pos.unrealizedPnL ?? pos.unrealized_pnl) }}>
                          {formatCurrency(pos.unrealizedPnL ?? pos.unrealized_pnl)}
                        </td>
                        <td style={{ ...tdStyle, textAlign: 'center' }}>{pos.daysHeld ?? pos.days_held ?? '--'}</td>
                        <td style={tdStyle}>
                          <span style={{ fontSize: '0.8rem' }}>{pos.expiry || pos.expiryDate || '--'}</span>
                        </td>
                        <td style={tdStyle}>
                          <span style={{
                            display: 'inline-block',
                            padding: '3px 10px',
                            borderRadius: '9999px',
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            color: '#0a0f1a',
                            background: cfg.color,
                          }}>
                            {cfg.label}
                          </span>
                        </td>
                        <td style={tdStyle}>
                          <span style={{
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            color: pos.gttActive ? COLORS.profit : COLORS.textSecondary,
                          }}>
                            {pos.gttActive ? 'Active' : 'Not Set'}
                          </span>
                        </td>
                        <td style={tdStyle}>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button
                              onClick={() => handleClose(id)}
                              disabled={closing[id]}
                              style={{
                                ...btnStyle,
                                background: 'rgba(248,113,113,0.15)',
                                color: COLORS.loss,
                                opacity: closing[id] ? 0.5 : 1,
                              }}
                            >
                              {closing[id] ? '...' : 'Close'}
                            </button>
                            <button
                              onClick={() => handleAdjustments(id)}
                              style={{
                                ...btnStyle,
                                background: isExpanded ? 'rgba(56,189,248,0.2)' : 'rgba(56,189,248,0.1)',
                                color: COLORS.info,
                              }}
                            >
                              Adjustments
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Adjustment cards row */}
                      {isExpanded && (
                        <tr>
                          <td colSpan={11} style={{ padding: '16px 20px', background: 'rgba(15,23,42,0.4)', borderBottom: `1px solid ${COLORS.border}` }}>
                            {adjLoading[id] ? (
                              <div style={{ color: COLORS.info, fontSize: '0.85rem' }}>Loading adjustments...</div>
                            ) : adjustments[id]?.error ? (
                              <div style={{ color: COLORS.loss, fontSize: '0.85rem' }}>Error: {adjustments[id].error}</div>
                            ) : (
                              <AdjustmentCards data={adjustments[id]} />
                            )}
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

function AdjustmentCards({ data }) {
  const cards = [
    {
      key: 'exit',
      title: 'Exit Now',
      icon: '\u2716',
      color: COLORS.loss,
      cost: data?.exitNow?.cost ?? data?.exit_now?.cost,
      description: data?.exitNow?.description ?? data?.exit_now?.description ?? 'Close all legs at current market price.',
      recommendation: data?.exitNow?.recommendation ?? data?.exit_now?.recommendation,
    },
    {
      key: 'roll',
      title: 'Roll Down + Out',
      icon: '\u21BB',
      color: COLORS.warning,
      cost: data?.rollDownOut?.cost ?? data?.roll_down_out?.cost,
      description: data?.rollDownOut?.description ?? data?.roll_down_out?.description ?? 'Roll to a lower strike and later expiry.',
      recommendation: data?.rollDownOut?.recommendation ?? data?.roll_down_out?.recommendation,
    },
    {
      key: 'spread',
      title: 'Convert to Spread',
      icon: '\u2194',
      color: COLORS.info,
      cost: data?.convertSpread?.cost ?? data?.convert_spread?.cost,
      description: data?.convertSpread?.description ?? data?.convert_spread?.description ?? 'Add a protective leg to cap risk.',
      recommendation: data?.convertSpread?.recommendation ?? data?.convert_spread?.recommendation,
    },
    {
      key: 'nothing',
      title: 'Do Nothing',
      icon: '\u23F8',
      color: COLORS.textSecondary,
      cost: data?.doNothing?.cost ?? data?.do_nothing?.cost ?? 0,
      description: data?.doNothing?.description ?? data?.do_nothing?.description ?? 'Hold current position and monitor.',
      recommendation: data?.doNothing?.recommendation ?? data?.do_nothing?.recommendation,
    },
  ]

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
      {cards.map(c => (
        <div key={c.key} style={{
          background: COLORS.card,
          border: `1px solid ${COLORS.border}`,
          borderTop: `3px solid ${c.color}`,
          borderRadius: '8px',
          padding: '14px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <span style={{ fontSize: '1rem' }}>{c.icon}</span>
            <span style={{ fontWeight: 700, color: c.color, fontSize: '0.85rem' }}>{c.title}</span>
          </div>
          {c.cost != null && (
            <div style={{ fontSize: '0.8rem', color: COLORS.textSecondary, marginBottom: '6px' }}>
              Cost: <span style={{ color: pnlColor(-Math.abs(c.cost)), fontWeight: 600 }}>{formatCurrency(c.cost)}</span>
            </div>
          )}
          <div style={{ fontSize: '0.78rem', color: COLORS.textSecondary, lineHeight: 1.4, marginBottom: '6px' }}>
            {c.description}
          </div>
          {c.recommendation && (
            <div style={{
              fontSize: '0.75rem',
              color: COLORS.warning,
              fontStyle: 'italic',
              borderTop: `1px solid ${COLORS.border}`,
              paddingTop: '6px',
              marginTop: '4px',
            }}>
              {c.recommendation}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
