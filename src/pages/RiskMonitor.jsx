import React, { useState, useEffect } from 'react';
import api from '../api';

const COLORS = {
  bg: '#0a0f1a',
  card: 'rgba(15,23,42,0.7)',
  border: 'rgba(148,163,184,0.1)',
  profit: '#6ee7b7',
  loss: '#f87171',
  warning: '#fcd34d',
  info: '#38bdf8',
  purple: '#a78bfa',
  textPrimary: '#f1f5f9',
  textSecondary: '#94a3b8',
};

const cardStyle = {
  background: COLORS.card,
  border: `1px solid ${COLORS.border}`,
  borderRadius: '12px',
  padding: '20px',
  marginBottom: '20px',
};

const thStyle = {
  textAlign: 'left',
  padding: '12px 16px',
  fontSize: '12px',
  color: COLORS.textSecondary,
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
  borderBottom: `1px solid ${COLORS.border}`,
};

const tdStyle = {
  padding: '12px 16px',
  fontSize: '14px',
  borderBottom: ' 1px solid rgba(148,163,184,0.05)',
};

function fmt(value) {
  if (value == null) return '$0.00';
  const abs = Math.abs(value);
  const formatted = abs.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return value < 0 ? `-$${formatted}` : `$${formatted}`;
}

function pct(value) {
  if (value == null) return '0.0%';
  return `${Number(value).toFixed(1)}%`;
}

function marginColor(utilization) {
  if (utilization > 80) return COLORS.loss;
  if (utilization > 60) return COLORS.warning;
  return COLORS.profit;
}

function deltaColor(delta) {
  const abs = Math.abs(delta);
  if (abs > 0.7) return COLORS.loss;
  if (abs > 0.4) return COLORS.warning;
  return COLORS.profit;
}

export default function RiskMonitor({ onNavigate, permission }) {
  const [risk, setRisk] = useState(null);
  const [positions, setPositions] = useState([]);
  const [gttOrders, setGttOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function fetchData() {
      try {
        const [riskData, positionsData, gttData] = await Promise.all([
          api.getRiskStatus(),
          api.getPositions(),
          api.getActiveGtt(),
        ]);
        if (!cancelled) {
          setRisk(riskData);
          setPositions(positionsData || []);
          setGttOrders(gttData || []);
        }
      } catch (err) {
        console.error('RiskMonitor fetch error:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchData();
    const interval = setInterval(fetchData, 15000);
    return () => { cancelled = true; clearInterval(interval); };
  }, []);

  if (loading) {
    return (
      <div style={{ background: COLORS.bg, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: COLORS.textSecondary, fontSize: '18px' }}>Loading risk dashboard...</div>
      </div>
    );
  }

  const netDelta = risk?.netDelta ?? risk?.portfolioDelta ?? 0;
  const marginUtil = risk?.marginUtilization ?? risk?.marginUsed ?? 0;
  const dailyPnL = risk?.dailyPnL ?? risk?.todayPnL ?? 0;
  const dailyLossLimit = risk?.dailyLossLimit ?? risk?.lossLimit ?? 10000;
  const dailyPnLPct = dailyLossLimit !== 0 ? (Math.abs(Math.min(0, dailyPnL)) / dailyLossLimit) * 100 : 0;
  const openPositions = Array.isArray(positions) ? positions.filter((p) => p.status === 'open' || p.isOpen) : [];
  const deltaThreshold = risk?.deltaThreshold ?? 0.3;
  const atRiskPositions = openPositions.filter((p) => Math.abs(p.delta ?? 0) > deltaThreshold);
  const circuitBreaker = risk?.circuitBreaker ?? {};
  const cbArmed = circuitBreaker.armed ?? circuitBreaker.enabled ?? false;
  const cbThreshold = circuitBreaker.threshold ?? dailyLossLimit;

  return (
    <div style={{ background: COLORS.bg, minHeight: '100vh', padding: '24px', color: COLORS.textPrimary }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 700, color: COLORS.textPrimary, margin: 0 }}>
          Risk Monitor
        </h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: COLORS.profit,
            animation: 'pulse 2s infinite',
          }} />
          <span style={{ fontSize: '13px', color: COLORS.textSecondary }}>Live</span>
          {permission && (
            <span style={{
              marginLeft: '12px',
              fontSize: '11px',
              padding: '3px 8px',
              borderRadius: '4px',
              background: permission === 'full' ? 'rgba(110,231,183,0.15)' : 'rgba(252,211,77,0.15)',
              color: permission === 'full' ? COLORS.profit : COLORS.warning,
              fontWeight: 600,
              textTransform: 'uppercase',
            }}>
              {permission}
            </span>
          )}
        </div>
      </div>

      {/* Live Risk Dashboard - 4 Gauges */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>

        {/* Net Delta Gauge */}
        <div style={cardStyle}>
          <div style={{ fontSize: '12px', color: COLORS.textSecondary, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>Portfolio Net Delta</div>
          <div style={{ fontSize: '28px', fontWeight: 700, color: deltaColor(netDelta), marginBottom: '12px' }}>
            {netDelta >= 0 ? '+' : ''}{Number(netDelta).toFixed(3)}
          </div>
          <div style={{ position: 'relative', height: '8px', background: 'rgba(30,41,59,0.8)', borderRadius: '4px', overflow: 'hidden' }}>
            {/* Center line */}
            <div style={{ position: 'absolute', top: 0, left: '50%', width: '2px', height: '100%', background: COLORS.textSecondary, opacity: 0.4, zIndex: 2 }} />
            {/* Delta bar */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: netDelta >= 0 ? '50%' : `${50 + (netDelta / 1.0) * 50}%`,
              width: `${Math.abs(netDelta / 1.0) * 50}%`,
              height: '100%',
              background: deltaColor(netDelta),
              borderRadius: '4px',
              transition: 'all 0.3s',
            }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
            <span style={{ fontSize: '10px', color: COLORS.textSecondary }}>-1.0</span>
            <span style={{ fontSize: '10px', color: COLORS.textSecondary }}>0</span>
            <span style={{ fontSize: '10px', color: COLORS.textSecondary }}>+1.0</span>
          </div>
        </div>

        {/* Margin Utilization */}
        <div style={cardStyle}>
          <div style={{ fontSize: '12px', color: COLORS.textSecondary, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>Margin Utilization</div>
          <div style={{ fontSize: '28px', fontWeight: 700, color: marginColor(marginUtil), marginBottom: '12px' }}>
            {pct(marginUtil)}
          </div>
          <div style={{ position: 'relative', height: '8px', background: 'rgba(30,41,59,0.8)', borderRadius: '4px', overflow: 'hidden' }}>
            <div style={{
              width: `${Math.min(100, marginUtil)}%`,
              height: '100%',
              background: marginColor(marginUtil),
              borderRadius: '4px',
              transition: 'width 0.3s',
            }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
            <span style={{ fontSize: '10px', color: COLORS.textSecondary }}>0%</span>
            <span style={{ fontSize: '10px', color: marginUtil > 60 ? COLORS.warning : COLORS.textSecondary }}>60%</span>
            <span style={{ fontSize: '10px', color: marginUtil > 80 ? COLORS.loss : COLORS.textSecondary }}>80%</span>
            <span style={{ fontSize: '10px', color: COLORS.textSecondary }}>100%</span>
          </div>
        </div>

        {/* Daily P&L Meter */}
        <div style={cardStyle}>
          <div style={{ fontSize: '12px', color: COLORS.textSecondary, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>Daily P&L</div>
          <div style={{ fontSize: '28px', fontWeight: 700, color: dailyPnL >= 0 ? COLORS.profit : COLORS.loss, marginBottom: '4px' }}>
            {fmt(dailyPnL)}
          </div>
          <div style={{ fontSize: '11px', color: COLORS.textSecondary, marginBottom: '12px' }}>
            Loss limit: {fmt(dailyLossLimit)}
          </div>
          <div style={{ position: 'relative', height: '8px', background: 'rgba(30,41,59,0.8)', borderRadius: '4px', overflow: 'hidden' }}>
            <div style={{
              width: `${Math.min(100, dailyPnLPct)}%`,
              height: '100%',
              background: dailyPnLPct > 80 ? COLORS.loss : dailyPnLPct > 50 ? COLORS.warning : COLORS.profit,
              borderRadius: '4px',
              transition: 'width 0.3s',
            }} />
          </div>
          <div style={{ fontSize: '10px', color: COLORS.textSecondary, marginTop: '4px', textAlign: 'right' }}>
            {pct(dailyPnLPct)} of limit used
          </div>
        </div>

        {/* Open Positions Count */}
        <div style={cardStyle}>
          <div style={{ fontSize: '12px', color: COLORS.textSecondary, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>Open Positions</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ fontSize: '40px', fontWeight: 700, color: COLORS.info }}>
              {openPositions.length}
            </div>
            {atRiskPositions.length > 0 && (
              <div style={{
                padding: '4px 10px',
                borderRadius: '12px',
                background: 'rgba(248,113,113,0.15)',
                border: '1px solid rgba(248,113,113,0.3)',
                fontSize: '12px',
                fontWeight: 600,
                color: COLORS.loss,
                whiteSpace: 'nowrap',
              }}>
                {atRiskPositions.length} at risk
              </div>
            )}
          </div>
          <div style={{ fontSize: '12px', color: COLORS.textSecondary, marginTop: '8px' }}>
            Delta threshold: {deltaThreshold}
          </div>
        </div>
      </div>

      {/* Positions at Risk */}
      <div style={cardStyle}>
        <div style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px', color: COLORS.loss }}>Positions at Risk</div>
        {atRiskPositions.length === 0 ? (
          <div style={{ color: COLORS.textSecondary, fontSize: '14px', padding: '20px', textAlign: 'center' }}>
            No positions exceed the delta threshold of {deltaThreshold}
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={thStyle}>Symbol</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>Qty</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>Delta</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>Unrealized P&L</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>Entry Price</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>LTP</th>
                  <th style={thStyle}>Risk Level</th>
                </tr>
              </thead>
              <tbody>
                {atRiskPositions.map((p, i) => {
                  const delta = Math.abs(p.delta ?? 0);
                  const riskLevel = delta > 0.7 ? 'HIGH' : delta > 0.5 ? 'MEDIUM' : 'ELEVATED';
                  const riskColor = delta > 0.7 ? COLORS.loss : delta > 0.5 ? COLORS.warning : COLORS.info;
                  return (
                    <tr key={i}>
                      <td style={{ ...tdStyle, fontWeight: 600, color: COLORS.textPrimary }}>{p.symbol ?? p.tradingsymbol ?? 'N/A'}</td>
                      <td style={{ ...tdStyle, textAlign: 'right' }}>{p.qty ?? p.quantity ?? 0}</td>
                      <td style={{ ...tdStyle, textAlign: 'right', color: deltaColor(p.delta ?? 0), fontWeight: 600 }}>
                        {(p.delta ?? 0) >= 0 ? '+' : ''}{Number(p.delta ?? 0).toFixed(3)}
                      </td>
                      <td style={{ ...tdStyle, textAlign: 'right', color: (p.unrealizedPnL ?? p.pnl ?? 0) >= 0 ? COLORS.profit : COLORS.loss }}>
                        {fmt(p.unrealizedPnL ?? p.pnl ?? 0)}
                      </td>
                      <td style={{ ...tdStyle, textAlign: 'right' }}>{fmt(p.entryPrice ?? p.avgPrice ?? 0)}</td>
                      <td style={{ ...tdStyle, textAlign: 'right' }}>{fmt(p.ltp ?? p.lastPrice ?? 0)}</td>
                      <td style={tdStyle}>
                        <span style={{
                          padding: '3px 10px',
                          borderRadius: '12px',
                          fontSize: '11px',
                          fontWeight: 700,
                          background: `${riskColor}22`,
                          color: riskColor,
                          textTransform: 'uppercase',
                        }}>
                          {riskLevel}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Active GTT Orders + Circuit Breaker Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px' }}>

        {/* Active GTT Orders */}
        <div style={cardStyle}>
          <div style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px', color: COLORS.purple }}>Active GTT Orders</div>
          {gttOrders.length === 0 ? (
            <div style={{ color: COLORS.textSecondary, fontSize: '14px', padding: '20px', textAlign: 'center' }}>
              No active GTT orders
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={thStyle}>Symbol</th>
                    <th style={thStyle}>Type</th>
                    <th style={{ ...thStyle, textAlign: 'right' }}>Trigger Price</th>
                    <th style={{ ...thStyle, textAlign: 'right' }}>Qty</th>
                    <th style={thStyle}>Status</th>
                    <th style={thStyle}>Created</th>
                  </tr>
                </thead>
                <tbody>
                  {gttOrders.map((g, i) => {
                    const statusColor = (g.status ?? '').toLowerCase() === 'active' ? COLORS.profit
                      : (g.status ?? '').toLowerCase() === 'triggered' ? COLORS.info
                      : (g.status ?? '').toLowerCase() === 'cancelled' ? COLORS.loss
                      : COLORS.warning;
                    return (
                      <tr key={i}>
                        <td style={{ ...tdStyle, fontWeight: 600, color: COLORS.textPrimary }}>{g.symbol ?? g.tradingsymbol ?? 'N/A'}</td>
                        <td style={{ ...tdStyle, color: COLORS.textSecondary }}>{g.type ?? g.orderType ?? 'OCO'}</td>
                        <td style={{ ...tdStyle, textAlign: 'right' }}>{fmt(g.triggerPrice ?? g.trigger ?? 0)}</td>
                        <td style={{ ...tdStyle, textAlign: 'right' }}>{g.qty ?? g.quantity ?? 0}</td>
                        <td style={tdStyle}>
                          <span style={{
                            padding: '3px 10px',
                            borderRadius: '12px',
                            fontSize: '11px',
                            fontWeight: 700,
                            background: `${statusColor}22`,
                            color: statusColor,
                            textTransform: 'uppercase',
                          }}>
                            {g.status ?? 'Active'}
                          </span>
                        </td>
                        <td style={{ ...tdStyle, color: COLORS.textSecondary, fontSize: '12px' }}>
                          {g.createdAt ? new Date(g.createdAt).toLocaleDateString() : g.created ?? '--'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Circuit Breaker Status */}
        <div style={cardStyle}>
          <div style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px', color: COLORS.textPrimary }}>Circuit Breaker</div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', padding: '12px 0' }}>
            {/* Toggle Display */}
            <div style={{
              width: '80px',
              height: '40px',
              borderRadius: '20px',
              background: cbArmed ? 'rgba(110,231,183,0.2)' : 'rgba(248,113,113,0.2)',
              border: `2px solid ${cbArmed ? COLORS.profit : COLORS.loss}`,
              position: 'relative',
              cursor: 'default',
            }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: cbArmed ? COLORS.profit : COLORS.loss,
                position: 'absolute',
                top: '2px',
                left: cbArmed ? '44px' : '2px',
                transition: 'left 0.3s',
              }} />
            </div>
            <div style={{
              fontSize: '18px',
              fontWeight: 700,
              color: cbArmed ? COLORS.profit : COLORS.loss,
              textTransform: 'uppercase',
            }}>
              {cbArmed ? 'Armed' : 'Disarmed'}
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '12px', color: COLORS.textSecondary, marginBottom: '4px' }}>Loss Threshold</div>
              <div style={{ fontSize: '20px', fontWeight: 600, color: COLORS.warning }}>{fmt(cbThreshold)}</div>
            </div>
            <div style={{
              fontSize: '12px',
              color: COLORS.textSecondary,
              textAlign: 'center',
              lineHeight: 1.5,
              padding: '8px 12px',
              background: 'rgba(30,41,59,0.5)',
              borderRadius: '8px',
            }}>
              {cbArmed
                ? 'Trading will halt automatically if daily loss exceeds the threshold.'
                : 'Circuit breaker is currently disabled. Trading will not be auto-halted.'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
