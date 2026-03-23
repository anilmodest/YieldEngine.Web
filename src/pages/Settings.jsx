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

const cardStyle = {
  background: COLORS.card,
  border: `1px solid ${COLORS.border}`,
  borderRadius: '12px',
  padding: '1.25rem 1.5rem',
  marginBottom: '1.25rem',
}

const sectionTitle = {
  fontSize: '1rem',
  fontWeight: 700,
  color: COLORS.textPrimary,
  marginBottom: '1rem',
  paddingBottom: '0.5rem',
  borderBottom: `1px solid ${COLORS.border}`,
}

const labelStyle = {
  display: 'block',
  fontSize: '0.8rem',
  color: COLORS.textSecondary,
  marginBottom: '0.35rem',
  fontWeight: 500,
}

const inputStyle = {
  background: 'rgba(30,41,59,0.6)',
  border: `1px solid ${COLORS.border}`,
  borderRadius: '6px',
  padding: '0.5rem 0.75rem',
  color: COLORS.textPrimary,
  fontSize: '0.85rem',
  fontFamily: 'inherit',
  width: '100%',
  boxSizing: 'border-box',
}

const toggleTrack = (on) => ({
  width: '44px',
  height: '24px',
  borderRadius: '12px',
  background: on ? 'rgba(110,231,183,0.25)' : 'rgba(100,116,139,0.25)',
  border: `2px solid ${on ? COLORS.profit : COLORS.muted}`,
  position: 'relative',
  cursor: 'pointer',
  flexShrink: 0,
  transition: 'all 0.2s',
})

const toggleKnob = (on) => ({
  width: '18px',
  height: '18px',
  borderRadius: '50%',
  background: on ? COLORS.profit : COLORS.muted,
  position: 'absolute',
  top: '1px',
  left: on ? '22px' : '1px',
  transition: 'left 0.2s',
})

function Toggle({ value, onChange, label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
      <div style={toggleTrack(value)} onClick={() => onChange(!value)}>
        <div style={toggleKnob(value)} />
      </div>
      {label && <span style={{ fontSize: '0.85rem', color: COLORS.textPrimary }}>{label}</span>}
    </div>
  )
}

const STRATEGIES = [
  'COVERED_CALL',
  'CASH_SECURED_PUT',
  'PUT_CREDIT_SPREAD',
  'COLLAR',
  'CASH_FUTURES_ARB',
]

const NOTIFICATION_TYPES = [
  { key: 'scan_complete', label: 'Scan Complete' },
  { key: 'expiry_reminder', label: 'Expiry Reminder' },
  { key: 'token_expired', label: 'Token Expired' },
  { key: 'margin_warning', label: 'Margin Warning' },
  { key: 'daily_summary', label: 'Daily Summary' },
]

const RISK_PROFILES = [
  {
    value: 'Conservative',
    desc: 'Focus on capital preservation. Lower premiums, higher probability of profit. Ideal for beginners or risk-averse investors.',
    color: '#22c55e',
  },
  {
    value: 'Moderate',
    desc: 'Balanced risk-reward. Moderate premiums with reasonable safety margins. Suitable for experienced investors.',
    color: '#f59e0b',
  },
  {
    value: 'Aggressive',
    desc: 'Higher premiums, closer-to-money strikes. Greater risk of assignment but maximizes income potential.',
    color: '#ef4444',
  },
]

export default function Settings({ onNavigate }) {
  const [settings, setSettings] = useState(null)
  const [dirty, setDirty] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [showResetConfirm, setShowResetConfirm] = useState(false)
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    api.getSettings()
      .then(data => {
        setSettings(data)
        setLoading(false)
      })
      .catch(e => {
        setError(e.message)
        setLoading(false)
      })
  }, [])

  const get = (key, fallback) => {
    if (key in dirty) return dirty[key]
    if (settings && key in settings) return settings[key]
    return fallback
  }

  const set = (key, value) => {
    setDirty(prev => ({ ...prev, [key]: value }))
    setSuccess(null)
  }

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    setSuccess(null)
    try {
      const updated = await api.updateSettings(dirty)
      setSettings(prev => ({ ...prev, ...dirty, ...updated }))
      setDirty({})
      setSuccess('Settings saved successfully.')
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  const handleReset = async () => {
    setShowResetConfirm(false)
    setSaving(true)
    try {
      const fresh = await api.updateSettings({ reset: true })
      setSettings(fresh)
      setDirty({})
      setSuccess('Settings have been reset to defaults.')
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  const handleExport = async () => {
    setExporting(true)
    try {
      const trades = await api.getTrades({})
      const rows = Array.isArray(trades) ? trades : trades.trades || []
      if (rows.length === 0) {
        setError('No trades to export.')
        setExporting(false)
        return
      }
      const headers = Object.keys(rows[0])
      const csv = [
        headers.join(','),
        ...rows.map(r => headers.map(h => {
          const v = r[h]
          return typeof v === 'string' && v.includes(',') ? `"${v}"` : (v ?? '')
        }).join(',')),
      ].join('\n')
      const blob = new Blob([csv], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `yield-engine-trades-${new Date().toISOString().slice(0, 10)}.csv`
      a.click()
      URL.revokeObjectURL(url)
    } catch (e) {
      setError('Export failed: ' + e.message)
    } finally {
      setExporting(false)
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <span style={{ color: COLORS.textSecondary, fontSize: '1rem' }}>Loading settings...</span>
      </div>
    )
  }

  const kiteConnected = get('kite_connected', false)
  const allowedStrategies = get('allowed_strategies', STRATEGIES)
  const notifications = get('notifications', {})
  const strikeMode = get('strike_mode', 'auto')

  const hasDirty = Object.keys(dirty).length > 0

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: COLORS.textPrimary, margin: 0 }}>Settings</h1>
        <button
          onClick={handleSave}
          disabled={saving || !hasDirty}
          style={{
            background: hasDirty
              ? 'linear-gradient(135deg, #10b981, #059669)'
              : '#1e293b',
            color: hasDirty ? '#fff' : '#475569',
            border: 'none',
            borderRadius: '8px',
            padding: '0.6rem 1.5rem',
            fontWeight: 600,
            fontSize: '0.9rem',
            cursor: hasDirty ? 'pointer' : 'not-allowed',
            fontFamily: 'inherit',
          }}
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
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

      {success && (
        <div style={{
          background: 'rgba(110,231,183,0.1)', border: '1px solid rgba(110,231,183,0.3)',
          borderRadius: '8px', padding: '0.75rem 1rem', marginBottom: '1rem',
          color: COLORS.profit, fontSize: '0.85rem',
        }}>
          {success}
        </div>
      )}

      {/* 1. Kite Connection */}
      <div style={cardStyle}>
        <div style={sectionTitle}>Kite Connection</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
          <div style={{
            width: '10px', height: '10px', borderRadius: '50%',
            background: kiteConnected ? COLORS.profit : COLORS.loss,
            boxShadow: kiteConnected ? '0 0 8px rgba(110,231,183,0.5)' : '0 0 8px rgba(248,113,113,0.5)',
          }} />
          <span style={{ color: kiteConnected ? COLORS.profit : COLORS.loss, fontWeight: 600, fontSize: '0.9rem' }}>
            {kiteConnected ? 'Connected' : 'Disconnected'}
          </span>
          <button
            onClick={() => api.kiteLogin().then(d => { if (d.url) window.open(d.url, '_blank') }).catch(() => {})}
            style={{
              marginLeft: 'auto',
              background: 'linear-gradient(135deg, #38bdf8, #0284c7)',
              color: '#fff', border: 'none', borderRadius: '6px',
              padding: '0.45rem 1rem', fontWeight: 600, fontSize: '0.8rem',
              cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            Login to Kite
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '0.75rem' }}>
          <div>
            <label style={labelStyle}>User ID</label>
            <input
              style={inputStyle}
              value={get('kite_user_id', '')}
              onChange={e => set('kite_user_id', e.target.value)}
              placeholder="e.g. AB1234"
            />
          </div>
          <div>
            <label style={labelStyle}>TOTP Secret</label>
            <input
              style={inputStyle}
              type="password"
              value={get('totp_secret', '')}
              onChange={e => set('totp_secret', e.target.value)}
              placeholder="TOTP secret key"
            />
          </div>
        </div>

        <Toggle
          value={get('auto_login', false)}
          onChange={v => set('auto_login', v)}
          label="Auto-login on startup"
        />
      </div>

      {/* 2. Risk Profile */}
      <div style={cardStyle}>
        <div style={sectionTitle}>Risk Profile</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {RISK_PROFILES.map(rp => {
            const selected = get('risk_profile', 'Moderate') === rp.value
            return (
              <label
                key={rp.value}
                onClick={() => set('risk_profile', rp.value)}
                style={{
                  display: 'flex', alignItems: 'flex-start', gap: '0.75rem',
                  padding: '0.75rem 1rem', borderRadius: '8px', cursor: 'pointer',
                  background: selected ? `${rp.color}11` : 'transparent',
                  border: `1px solid ${selected ? `${rp.color}44` : COLORS.border}`,
                  transition: 'all 0.15s',
                }}
              >
                <div style={{
                  width: '18px', height: '18px', borderRadius: '50%', flexShrink: 0,
                  border: `2px solid ${selected ? rp.color : COLORS.muted}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginTop: '2px',
                }}>
                  {selected && <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: rp.color }} />}
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem', color: selected ? rp.color : COLORS.textPrimary }}>
                    {rp.value}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: COLORS.textSecondary, marginTop: '0.2rem', lineHeight: 1.5 }}>
                    {rp.desc}
                  </div>
                </div>
              </label>
            )
          })}
        </div>
      </div>

      {/* 3. Strike Selection */}
      <div style={cardStyle}>
        <div style={sectionTitle}>Strike Selection</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
          <span style={{ fontSize: '0.85rem', color: COLORS.textSecondary }}>Mode:</span>
          {['auto', 'manual'].map(mode => (
            <button
              key={mode}
              onClick={() => set('strike_mode', mode)}
              style={{
                background: strikeMode === mode ? 'rgba(56,189,248,0.15)' : 'transparent',
                color: strikeMode === mode ? COLORS.info : COLORS.muted,
                border: `1px solid ${strikeMode === mode ? 'rgba(56,189,248,0.4)' : COLORS.border}`,
                borderRadius: '6px', padding: '0.4rem 0.9rem', fontSize: '0.8rem',
                cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600,
                textTransform: 'capitalize',
              }}
            >
              {mode}
            </button>
          ))}
        </div>

        {strikeMode === 'manual' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={labelStyle}>Min OTM %</label>
              <input style={inputStyle} type="number" step="0.5"
                value={get('min_otm_pct', 5)} onChange={e => set('min_otm_pct', parseFloat(e.target.value))} />
            </div>
            <div>
              <label style={labelStyle}>Max OTM %</label>
              <input style={inputStyle} type="number" step="0.5"
                value={get('max_otm_pct', 15)} onChange={e => set('max_otm_pct', parseFloat(e.target.value))} />
            </div>
            <div>
              <label style={labelStyle}>Target Delta (Puts)</label>
              <input style={inputStyle} type="number" step="0.01"
                value={get('target_delta_puts', 0.20)} onChange={e => set('target_delta_puts', parseFloat(e.target.value))} />
            </div>
            <div>
              <label style={labelStyle}>Target Delta (Calls)</label>
              <input style={inputStyle} type="number" step="0.01"
                value={get('target_delta_calls', 0.25)} onChange={e => set('target_delta_calls', parseFloat(e.target.value))} />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>Skip if IV Rank Above</label>
              <input style={{ ...inputStyle, maxWidth: '200px' }} type="number" step="1"
                value={get('skip_iv_rank_above', 80)} onChange={e => set('skip_iv_rank_above', parseInt(e.target.value))} />
              <span style={{ fontSize: '0.75rem', color: COLORS.muted, marginLeft: '0.5rem' }}>
                (0-100, skip scanning if IV rank exceeds this threshold)
              </span>
            </div>
          </div>
        )}
      </div>

      {/* 4. Risk Management */}
      <div style={cardStyle}>
        <div style={sectionTitle}>Risk Management</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
          <div>
            <label style={labelStyle}>Stop-Loss Multiplier</label>
            <input style={inputStyle} type="number" step="0.5"
              value={get('stop_loss_multiplier', 2)} onChange={e => set('stop_loss_multiplier', parseFloat(e.target.value))} />
            <span style={{ fontSize: '0.72rem', color: COLORS.muted }}>
              e.g. 2x means stop-loss at 2x the premium received
            </span>
          </div>
          <div>
            <label style={labelStyle}>Delta Alert Threshold</label>
            <input style={inputStyle} type="number" step="0.05"
              value={get('delta_alert_threshold', 0.50)} onChange={e => set('delta_alert_threshold', parseFloat(e.target.value))} />
          </div>
          <div>
            <label style={labelStyle}>Daily Loss Limit</label>
            <input style={inputStyle} type="number" step="1000"
              value={get('daily_loss_limit', 10000)} onChange={e => set('daily_loss_limit', parseInt(e.target.value))} />
          </div>
          <div>
            <label style={labelStyle}>Intraday Drop Alert %</label>
            <input style={inputStyle} type="number" step="0.5"
              value={get('intraday_drop_alert_pct', 3)} onChange={e => set('intraday_drop_alert_pct', parseFloat(e.target.value))} />
          </div>
        </div>

        <div style={{
          background: 'rgba(248,113,113,0.06)', border: '1px solid rgba(248,113,113,0.2)',
          borderRadius: '8px', padding: '0.75rem 1rem', marginBottom: '1rem',
        }}>
          <Toggle
            value={get('circuit_breaker', false)}
            onChange={v => set('circuit_breaker', v)}
            label="Circuit Breaker"
          />
          <span style={{ fontSize: '0.78rem', color: COLORS.loss, display: 'block', marginLeft: '3.25rem', marginTop: '-0.5rem' }}>
            WARNING: When enabled, all trading halts automatically if daily loss limit is breached. Requires manual re-enable.
          </span>
        </div>

        <Toggle
          value={get('auto_stop_loss', true)}
          onChange={v => set('auto_stop_loss', v)}
          label="Auto stop-loss on new positions"
        />
        <Toggle
          value={get('auto_gtt_on_entry', true)}
          onChange={v => set('auto_gtt_on_entry', v)}
          label="Auto GTT order on entry"
        />
        <Toggle
          value={get('close_itm_before_expiry', true)}
          onChange={v => set('close_itm_before_expiry', v)}
          label="Close ITM positions before expiry"
        />
      </div>

      {/* 5. Allowed Strategies */}
      <div style={cardStyle}>
        <div style={sectionTitle}>Allowed Strategies</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {STRATEGIES.map(strat => {
            const checked = Array.isArray(allowedStrategies) && allowedStrategies.includes(strat)
            return (
              <label
                key={strat}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.75rem',
                  cursor: 'pointer', padding: '0.35rem 0',
                }}
                onClick={() => {
                  const current = Array.isArray(allowedStrategies) ? [...allowedStrategies] : [...STRATEGIES]
                  if (checked) {
                    set('allowed_strategies', current.filter(s => s !== strat))
                  } else {
                    set('allowed_strategies', [...current, strat])
                  }
                }}
              >
                <div style={{
                  width: '18px', height: '18px', borderRadius: '4px', flexShrink: 0,
                  border: `2px solid ${checked ? COLORS.info : COLORS.muted}`,
                  background: checked ? 'rgba(56,189,248,0.2)' : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.7rem', color: COLORS.info, fontWeight: 700,
                }}>
                  {checked ? '\u2713' : ''}
                </div>
                <span style={{ fontSize: '0.85rem', color: COLORS.textPrimary }}>
                  {strat.replace(/_/g, ' ')}
                </span>
              </label>
            )
          })}
        </div>
      </div>

      {/* 6. Notifications */}
      <div style={cardStyle}>
        <div style={sectionTitle}>Notifications</div>
        {NOTIFICATION_TYPES.map(nt => (
          <Toggle
            key={nt.key}
            value={notifications[nt.key] !== false}
            onChange={v => set('notifications', { ...get('notifications', {}), [nt.key]: v })}
            label={nt.label}
          />
        ))}
        <div style={{ marginTop: '0.75rem' }}>
          <label style={labelStyle}>P&L Threshold for Alerts</label>
          <input
            style={{ ...inputStyle, maxWidth: '200px' }}
            type="number"
            step="500"
            value={get('pnl_alert_threshold', 5000)}
            onChange={e => set('pnl_alert_threshold', parseInt(e.target.value))}
          />
          <span style={{ fontSize: '0.72rem', color: COLORS.muted, marginLeft: '0.5rem' }}>
            Notify when unrealized P&L exceeds this amount
          </span>
        </div>
      </div>

      {/* 7. Data Management */}
      <div style={cardStyle}>
        <div style={sectionTitle}>Data Management</div>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <button
            onClick={handleExport}
            disabled={exporting}
            style={{
              background: 'rgba(56,189,248,0.15)',
              color: COLORS.info,
              border: `1px solid rgba(56,189,248,0.3)`,
              borderRadius: '8px',
              padding: '0.55rem 1.25rem',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: exporting ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit',
            }}
          >
            {exporting ? 'Exporting...' : 'Export Trades CSV'}
          </button>
          {!showResetConfirm ? (
            <button
              onClick={() => setShowResetConfirm(true)}
              style={{
                background: 'rgba(248,113,113,0.1)',
                color: COLORS.loss,
                border: '1px solid rgba(248,113,113,0.3)',
                borderRadius: '8px',
                padding: '0.55rem 1.25rem',
                fontWeight: 600,
                fontSize: '0.85rem',
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              Reset Settings
            </button>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ color: COLORS.loss, fontSize: '0.85rem', fontWeight: 600 }}>Are you sure?</span>
              <button
                onClick={handleReset}
                style={{
                  background: COLORS.loss, color: '#fff', border: 'none',
                  borderRadius: '6px', padding: '0.45rem 1rem', fontWeight: 600,
                  fontSize: '0.8rem', cursor: 'pointer', fontFamily: 'inherit',
                }}
              >
                Yes, Reset
              </button>
              <button
                onClick={() => setShowResetConfirm(false)}
                style={{
                  background: 'transparent', color: COLORS.textSecondary,
                  border: `1px solid ${COLORS.border}`, borderRadius: '6px',
                  padding: '0.45rem 1rem', fontWeight: 600, fontSize: '0.8rem',
                  cursor: 'pointer', fontFamily: 'inherit',
                }}
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
