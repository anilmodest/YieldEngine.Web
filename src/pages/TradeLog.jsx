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

const cardStyle = {
  background: COLORS.card,
  border: `1px solid ${COLORS.border}`,
  borderRadius: '12px',
  padding: '20px',
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

const inputStyle = {
  background: 'rgba(15,23,42,0.9)',
  border: `1px solid ${COLORS.border}`,
  borderRadius: '6px',
  padding: '7px 10px',
  color: COLORS.textPrimary,
  fontSize: '0.82rem',
  outline: 'none',
}

const selectStyle = {
  ...inputStyle,
  cursor: 'pointer',
  appearance: 'auto',
}

const btnStyle = {
  padding: '8px 16px',
  borderRadius: '6px',
  border: 'none',
  cursor: 'pointer',
  fontSize: '0.82rem',
  fontWeight: 600,
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

function formatDate(d) {
  if (!d) return '--'
  const dt = new Date(d)
  if (isNaN(dt)) return d
  return dt.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

const STRATEGY_OPTIONS = ['ALL', 'COVERED_CALL', 'CASH_SECURED_PUT', 'PUT_CREDIT_SPREAD', 'COLLAR', 'IRON_CONDOR']
const EXIT_REASONS = ['ALL', 'EXPIRED', 'CLOSED', 'ASSIGNED', 'STOPPED', 'ROLLED', 'ADJUSTED']

export default function TradeLog({ onNavigate }) {
  const [trades, setTrades] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [expandedId, setExpandedId] = useState(null)

  // Filters
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [strategyFilter, setStrategyFilter] = useState('ALL')
  const [symbolFilter, setSymbolFilter] = useState('')
  const [pnlFilter, setPnlFilter] = useState('all')
  const [exitReasonFilter, setExitReasonFilter] = useState('ALL')

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const data = await api.getTrades()
        if (!cancelled) setTrades(Array.isArray(data) ? data : data.trades || [])
      } catch (e) {
        if (!cancelled) setError(e.message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  // Apply filters
  const filtered = trades.filter(t => {
    if (dateFrom) {
      const td = new Date(t.date || t.entryDate || t.entry_date)
      if (td < new Date(dateFrom)) return false
    }
    if (dateTo) {
      const td = new Date(t.date || t.exitDate || t.exit_date || t.entryDate || t.entry_date)
      if (td > new Date(dateTo + 'T23:59:59')) return false
    }
    if (strategyFilter !== 'ALL') {
      const strat = (t.strategy || t.type || '').toUpperCase()
      if (strat !== strategyFilter) return false
    }
    if (symbolFilter) {
      if (!(t.symbol || '').toLowerCase().includes(symbolFilter.toLowerCase())) return false
    }
    if (pnlFilter === 'profit') {
      if ((t.netPnL ?? t.net_pnl ?? 0) <= 0) return false
    } else if (pnlFilter === 'loss') {
      if ((t.netPnL ?? t.net_pnl ?? 0) >= 0) return false
    }
    if (exitReasonFilter !== 'ALL') {
      const reason = (t.exitReason || t.exit_reason || '').toUpperCase()
      if (reason !== exitReasonFilter) return false
    }
    return true
  })

  // Running totals
  const totalGross = filtered.reduce((s, t) => s + (t.grossPnL ?? t.gross_pnl ?? 0), 0)
  const totalFees = filtered.reduce((s, t) => s + (t.fees ?? t.totalFees ?? 0), 0)
  const totalNet = filtered.reduce((s, t) => s + (t.netPnL ?? t.net_pnl ?? 0), 0)

  const exportCsv = () => {
    const headers = ['Date', 'Symbol', 'Strategy', 'Direction', 'Entry Premium', 'Exit Premium', 'Gross P&L', 'Fees', 'Net P&L', 'Exit Reason', 'Duration']
    const rows = filtered.map(t => [
      t.date || t.exitDate || t.exit_date || '',
      t.symbol || '',
      t.strategy || t.type || '',
      t.direction || t.side || '',
      t.entryPremium ?? t.entry_premium ?? '',
      t.exitPremium ?? t.exit_premium ?? '',
      t.grossPnL ?? t.gross_pnl ?? '',
      t.fees ?? t.totalFees ?? '',
      t.netPnL ?? t.net_pnl ?? '',
      t.exitReason ?? t.exit_reason ?? '',
      t.duration ?? t.daysHeld ?? t.days_held ?? '',
    ])
    const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `trade-log-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div style={{ background: COLORS.bg, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: COLORS.info, fontSize: '1.1rem' }}>Loading trade log...</div>
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
          Trade Log
        </h1>
        <button
          onClick={exportCsv}
          style={{ ...btnStyle, background: 'rgba(56,189,248,0.15)', color: COLORS.info }}
        >
          Export CSV
        </button>
      </div>

      {/* Filters */}
      <div style={{
        ...cardStyle,
        marginBottom: '1rem',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '12px',
        alignItems: 'center',
        padding: '14px 20px',
      }}>
        <label style={{ color: COLORS.textSecondary, fontSize: '0.78rem' }}>
          From
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={{ ...inputStyle, marginLeft: '6px' }} />
        </label>
        <label style={{ color: COLORS.textSecondary, fontSize: '0.78rem' }}>
          To
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} style={{ ...inputStyle, marginLeft: '6px' }} />
        </label>
        <select value={strategyFilter} onChange={e => setStrategyFilter(e.target.value)} style={selectStyle}>
          {STRATEGY_OPTIONS.map(o => (
            <option key={o} value={o}>{o === 'ALL' ? 'All Strategies' : o.replace(/_/g, ' ')}</option>
          ))}
        </select>
        <input
          type="text"
          placeholder="Symbol..."
          value={symbolFilter}
          onChange={e => setSymbolFilter(e.target.value)}
          style={{ ...inputStyle, width: '110px' }}
        />
        <select value={pnlFilter} onChange={e => setPnlFilter(e.target.value)} style={selectStyle}>
          <option value="all">All P&L</option>
          <option value="profit">Profit Only</option>
          <option value="loss">Loss Only</option>
        </select>
        <select value={exitReasonFilter} onChange={e => setExitReasonFilter(e.target.value)} style={selectStyle}>
          {EXIT_REASONS.map(o => (
            <option key={o} value={o}>{o === 'ALL' ? 'All Exit Reasons' : o}</option>
          ))}
        </select>
      </div>

      {/* Trade count */}
      <div style={{ color: COLORS.textSecondary, fontSize: '0.85rem', marginBottom: '0.75rem' }}>
        {filtered.length} trade{filtered.length !== 1 ? 's' : ''}
      </div>

      {/* Table */}
      <div style={{ ...cardStyle, padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ ...thStyle, width: '28px' }}></th>
                <th style={thStyle}>Date</th>
                <th style={thStyle}>Symbol</th>
                <th style={thStyle}>Strategy</th>
                <th style={thStyle}>Direction</th>
                <th style={thStyle}>Entry Premium</th>
                <th style={thStyle}>Exit Premium</th>
                <th style={thStyle}>Gross P&L</th>
                <th style={thStyle}>Fees</th>
                <th style={thStyle}>Net P&L</th>
                <th style={thStyle}>Exit Reason</th>
                <th style={thStyle}>Duration</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t) => {
                const id = t.id ?? t._id ?? t.tradeId
                const netPnl = t.netPnL ?? t.net_pnl ?? 0
                const grossPnl = t.grossPnL ?? t.gross_pnl ?? 0
                const isExpanded = expandedId === id

                return (
                  <React.Fragment key={id}>
                    <tr
                      style={{ cursor: 'pointer' }}
                      onClick={() => setExpandedId(isExpanded ? null : id)}
                    >
                      <td style={{ ...tdStyle, textAlign: 'center', color: COLORS.textSecondary, fontSize: '0.7rem' }}>
                        {isExpanded ? '\u25BC' : '\u25B6'}
                      </td>
                      <td style={tdStyle}>{formatDate(t.date || t.exitDate || t.exit_date)}</td>
                      <td style={{ ...tdStyle, fontWeight: 600 }}>{t.symbol}</td>
                      <td style={tdStyle}>
                        <span style={{ color: COLORS.info, fontSize: '0.8rem' }}>
                          {(t.strategy || t.type || '').replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td style={tdStyle}>{t.direction || t.side || '--'}</td>
                      <td style={tdStyle}>{formatCurrency(t.entryPremium ?? t.entry_premium)}</td>
                      <td style={tdStyle}>{formatCurrency(t.exitPremium ?? t.exit_premium)}</td>
                      <td style={{ ...tdStyle, color: pnlColor(grossPnl), fontWeight: 600 }}>
                        {formatCurrency(grossPnl)}
                      </td>
                      <td style={{ ...tdStyle, color: COLORS.warning, fontSize: '0.82rem' }}>
                        {formatCurrency(t.fees ?? t.totalFees)}
                      </td>
                      <td style={{ ...tdStyle, color: pnlColor(netPnl), fontWeight: 700 }}>
                        {formatCurrency(netPnl)}
                      </td>
                      <td style={tdStyle}>
                        <span style={{
                          display: 'inline-block',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '0.72rem',
                          fontWeight: 600,
                          background: 'rgba(148,163,184,0.1)',
                          color: COLORS.textSecondary,
                        }}>
                          {t.exitReason || t.exit_reason || '--'}
                        </span>
                      </td>
                      <td style={tdStyle}>{t.duration ?? t.daysHeld ?? t.days_held ?? '--'}d</td>
                    </tr>

                    {/* Expanded details */}
                    {isExpanded && (
                      <tr>
                        <td colSpan={12} style={{ padding: '16px 24px', background: 'rgba(15,23,42,0.4)', borderBottom: `1px solid ${COLORS.border}` }}>
                          <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
                            {/* Leg details */}
                            <div style={{ flex: 1, minWidth: '280px' }}>
                              <div style={{ color: COLORS.info, fontWeight: 600, fontSize: '0.82rem', marginBottom: '8px' }}>
                                Leg Details
                              </div>
                              {(t.legs || []).length > 0 ? (
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                  <thead>
                                    <tr>
                                      <th style={{ ...thStyle, fontSize: '0.7rem', padding: '6px 8px' }}>Action</th>
                                      <th style={{ ...thStyle, fontSize: '0.7rem', padding: '6px 8px' }}>Strike</th>
                                      <th style={{ ...thStyle, fontSize: '0.7rem', padding: '6px 8px' }}>Type</th>
                                      <th style={{ ...thStyle, fontSize: '0.7rem', padding: '6px 8px' }}>Qty</th>
                                      <th style={{ ...thStyle, fontSize: '0.7rem', padding: '6px 8px' }}>Premium</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {t.legs.map((leg, i) => (
                                      <tr key={i}>
                                        <td style={{ ...tdStyle, fontSize: '0.78rem', padding: '6px 8px' }}>{leg.action || leg.side}</td>
                                        <td style={{ ...tdStyle, fontSize: '0.78rem', padding: '6px 8px' }}>{leg.strike}</td>
                                        <td style={{ ...tdStyle, fontSize: '0.78rem', padding: '6px 8px' }}>{leg.optionType || leg.type || '--'}</td>
                                        <td style={{ ...tdStyle, fontSize: '0.78rem', padding: '6px 8px' }}>{leg.quantity ?? leg.qty ?? '--'}</td>
                                        <td style={{ ...tdStyle, fontSize: '0.78rem', padding: '6px 8px' }}>{formatCurrency(leg.premium)}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              ) : (
                                <div style={{ color: COLORS.textSecondary, fontSize: '0.8rem' }}>No leg details available</div>
                              )}
                            </div>

                            {/* Fee breakdown */}
                            <div style={{ minWidth: '200px' }}>
                              <div style={{ color: COLORS.warning, fontWeight: 600, fontSize: '0.82rem', marginBottom: '8px' }}>
                                Fee Breakdown
                              </div>
                              <div style={{ fontSize: '0.8rem', color: COLORS.textSecondary, lineHeight: 1.8 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                  <span>Brokerage:</span>
                                  <span style={{ color: COLORS.textPrimary }}>{formatCurrency(t.feeBreakdown?.brokerage ?? t.fee_breakdown?.brokerage ?? t.brokerage)}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                  <span>STT:</span>
                                  <span style={{ color: COLORS.textPrimary }}>{formatCurrency(t.feeBreakdown?.stt ?? t.fee_breakdown?.stt ?? t.stt)}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                  <span>Exchange:</span>
                                  <span style={{ color: COLORS.textPrimary }}>{formatCurrency(t.feeBreakdown?.exchange ?? t.fee_breakdown?.exchange ?? t.exchangeFee)}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                  <span>GST:</span>
                                  <span style={{ color: COLORS.textPrimary }}>{formatCurrency(t.feeBreakdown?.gst ?? t.fee_breakdown?.gst ?? t.gst)}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: `1px solid ${COLORS.border}`, paddingTop: '4px', marginTop: '4px' }}>
                                  <span style={{ fontWeight: 600 }}>Total Fees:</span>
                                  <span style={{ color: COLORS.warning, fontWeight: 600 }}>{formatCurrency(t.fees ?? t.totalFees)}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                )
              })}

              {/* Running total row */}
              {filtered.length > 0 && (
                <tr style={{ background: 'rgba(15,23,42,0.5)' }}>
                  <td style={{ ...tdStyle, borderBottom: 'none' }} colSpan={7}>
                    <span style={{ fontWeight: 700, color: COLORS.textSecondary, fontSize: '0.82rem' }}>TOTALS</span>
                  </td>
                  <td style={{ ...tdStyle, fontWeight: 700, color: pnlColor(totalGross), borderBottom: 'none' }}>
                    {formatCurrency(totalGross)}
                  </td>
                  <td style={{ ...tdStyle, fontWeight: 700, color: COLORS.warning, borderBottom: 'none' }}>
                    {formatCurrency(totalFees)}
                  </td>
                  <td style={{ ...tdStyle, fontWeight: 700, color: pnlColor(totalNet), borderBottom: 'none', fontSize: '0.95rem' }}>
                    {formatCurrency(totalNet)}
                  </td>
                  <td style={{ ...tdStyle, borderBottom: 'none' }} colSpan={2}></td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', color: COLORS.textSecondary, padding: '3rem' }}>
            No trades match your filters
          </div>
        )}
      </div>
    </div>
  )
}
