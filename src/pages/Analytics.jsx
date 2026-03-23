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
  borderBottom: `1px solid rgba(148,163,184,0.05)`,
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

function pnlColor(v) {
  return (v ?? 0) >= 0 ? COLORS.profit : COLORS.loss;
}

export default function Analytics({ onNavigate }) {
  const [summary, setSummary] = useState(null);
  const [strategies, setStrategies] = useState([]);
  const [monthly, setMonthly] = useState([]);
  const [fees, setFees] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function fetchData() {
      try {
        const [summaryData, strategyData, monthlyData, feesData] = await Promise.all([
          api.getSummary(),
          api.getStrategyBreakdown(),
          api.getMonthlyPnl(),
          api.getFeesSummary(),
        ]);
        if (!cancelled) {
          setSummary(summaryData);
          setStrategies(strategyData || []);
          setMonthly(monthlyData || []);
          setFees(feesData);
        }
      } catch (err) {
        console.error('Analytics fetch error:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchData();
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <div style={{ background: COLORS.bg, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: COLORS.textSecondary, fontSize: '18px' }}>Loading analytics...</div>
      </div>
    );
  }

  const totalGross = summary?.totalIncome ?? 0;
  const totalFees = fees?.totalFees ?? summary?.totalFees ?? 0;
  const netPnL = summary?.netPnL ?? (totalGross - totalFees);
  const winRate = summary?.winRate ?? 0;
  const wins = summary?.wins ?? 0;
  const losses = summary?.losses ?? 0;
  const totalTrades = summary?.totalTrades ?? (wins + losses);
  const topTrades = summary?.topTrades ?? [];
  const worstTrades = summary?.worstTrades ?? [];

  // Cumulative P&L from monthly data
  let cumulative = 0;
  const cumulativeData = monthly.map((m) => {
    cumulative += (m.netPnL ?? m.net ?? 0);
    return { ...m, cumulative };
  });

  // Monthly bar chart max for scaling
  const monthlyMax = Math.max(1, ...monthly.map((m) => Math.abs(m.grossPnL ?? m.gross ?? m.netPnL ?? m.net ?? 0)));

  // Fee analysis
  const monthlyFees = totalFees / Math.max(1, monthly.length);
  const yearlyFees = monthlyFees * 12;
  const feePctOfGross = totalGross !== 0 ? (totalFees / Math.abs(totalGross)) * 100 : 0;
  const avgFeePerTrade = totalTrades > 0 ? totalFees / totalTrades : 0;

  return (
    <div style={{ background: COLORS.bg, minHeight: '100vh', padding: '24px', color: COLORS.textPrimary }}>
      <h1 style={{ fontSize: '28px', fontWeight: 700, marginBottom: '24px', color: COLORS.textPrimary }}>
        Analytics
      </h1>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div style={cardStyle}>
          <div style={{ fontSize: '12px', color: COLORS.textSecondary, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>Gross P&L</div>
          <div style={{ fontSize: '28px', fontWeight: 700, color: pnlColor(totalGross) }}>{fmt(totalGross)}</div>
        </div>
        <div style={cardStyle}>
          <div style={{ fontSize: '12px', color: COLORS.textSecondary, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>Total Fees</div>
          <div style={{ fontSize: '28px', fontWeight: 700, color: COLORS.warning }}>{fmt(totalFees)}</div>
        </div>
        <div style={cardStyle}>
          <div style={{ fontSize: '12px', color: COLORS.textSecondary, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>Net P&L</div>
          <div style={{ fontSize: '28px', fontWeight: 700, color: pnlColor(netPnL) }}>{fmt(netPnL)}</div>
        </div>
        <div style={cardStyle}>
          <div style={{ fontSize: '12px', color: COLORS.textSecondary, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>Total Trades</div>
          <div style={{ fontSize: '28px', fontWeight: 700, color: COLORS.info }}>{totalTrades}</div>
        </div>
      </div>

      {/* Strategy Performance Table */}
      <div style={cardStyle}>
        <div style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px', color: COLORS.textPrimary }}>Strategy Performance</div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={thStyle}>Strategy</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>Trades</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>Gross P&L</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>Fees</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>Net P&L</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>Avg P&L/Trade</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>Win Rate</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>Best Trade</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>Worst Trade</th>
              </tr>
            </thead>
            <tbody>
              {strategies.length === 0 ? (
                <tr><td colSpan={9} style={{ ...tdStyle, textAlign: 'center', color: COLORS.textSecondary, padding: '32px' }}>No strategy data available</td></tr>
              ) : strategies.map((s, i) => {
                const gross = s.grossPnL ?? s.totalGross ?? 0;
                const sFees = s.fees ?? s.totalFees ?? 0;
                const net = s.netPnL ?? s.totalNet ?? (gross - sFees);
                const count = s.tradeCount ?? s.trades ?? 0;
                const avg = count > 0 ? net / count : 0;
                const wr = s.winRate ?? 0;
                const best = s.bestTrade ?? s.best ?? 0;
                const worst = s.worstTrade ?? s.worst ?? 0;
                return (
                  <tr key={i}>
                    <td style={{ ...tdStyle, fontWeight: 600, color: COLORS.purple }}>{s.strategy ?? s.type ?? s.name ?? 'Unknown'}</td>
                    <td style={{ ...tdStyle, textAlign: 'right' }}>{count}</td>
                    <td style={{ ...tdStyle, textAlign: 'right', color: pnlColor(gross) }}>{fmt(gross)}</td>
                    <td style={{ ...tdStyle, textAlign: 'right', color: COLORS.warning }}>{fmt(sFees)}</td>
                    <td style={{ ...tdStyle, textAlign: 'right', color: pnlColor(net), fontWeight: 600 }}>{fmt(net)}</td>
                    <td style={{ ...tdStyle, textAlign: 'right', color: pnlColor(avg) }}>{fmt(avg)}</td>
                    <td style={{ ...tdStyle, textAlign: 'right', color: COLORS.info }}>{pct(wr)}</td>
                    <td style={{ ...tdStyle, textAlign: 'right', color: COLORS.profit }}>{fmt(best)}</td>
                    <td style={{ ...tdStyle, textAlign: 'right', color: COLORS.loss }}>{fmt(worst)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Monthly P&L Section */}
      <div style={cardStyle}>
        <div style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px', color: COLORS.textPrimary }}>Monthly P&L</div>
        {monthly.length === 0 ? (
          <div style={{ color: COLORS.textSecondary, fontSize: '14px', padding: '20px', textAlign: 'center' }}>No monthly data available</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {cumulativeData.map((m, i) => {
              const gross = m.grossPnL ?? m.gross ?? 0;
              const net = m.netPnL ?? m.net ?? 0;
              const barWidth = Math.min(100, (Math.abs(gross) / monthlyMax) * 100);
              const isPositive = gross >= 0;
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ minWidth: '80px', fontSize: '13px', color: COLORS.textSecondary, fontWeight: 500 }}>
                    {m.month ?? m.label ?? `Month ${i + 1}`}
                  </div>
                  <div style={{ flex: 1, position: 'relative', height: '28px', background: 'rgba(30,41,59,0.5)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{
                      position: 'absolute',
                      top: 0,
                      left: isPositive ? '50%' : `${50 - barWidth / 2}%`,
                      width: `${barWidth / 2}%`,
                      height: '100%',
                      background: isPositive ? COLORS.profit : COLORS.loss,
                      opacity: 0.7,
                      borderRadius: '4px',
                      transition: 'width 0.3s',
                    }} />
                    <div style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '1px',
                      height: '100%',
                      background: COLORS.border,
                      left: '50%',
                    }} />
                  </div>
                  <div style={{ minWidth: '100px', textAlign: 'right', fontSize: '13px', color: pnlColor(gross), fontWeight: 600 }}>
                    {fmt(gross)}
                  </div>
                  <div style={{ minWidth: '100px', textAlign: 'right', fontSize: '12px', color: pnlColor(net) }}>
                    Net: {fmt(net)}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Cumulative P&L */}
      <div style={cardStyle}>
        <div style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px', color: COLORS.textPrimary }}>Cumulative P&L</div>
        {cumulativeData.length === 0 ? (
          <div style={{ color: COLORS.textSecondary, fontSize: '14px', padding: '20px', textAlign: 'center' }}>No data available</div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', height: '180px', padding: '0 8px' }}>
            {(() => {
              const maxCum = Math.max(1, ...cumulativeData.map((d) => Math.abs(d.cumulative)));
              return cumulativeData.map((d, i) => {
                const height = Math.max(4, (Math.abs(d.cumulative) / maxCum) * 160);
                const isPos = d.cumulative >= 0;
                return (
                  <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', height: '100%' }}>
                    <div style={{ fontSize: '10px', color: pnlColor(d.cumulative), marginBottom: '4px', whiteSpace: 'nowrap' }}>
                      {fmt(d.cumulative)}
                    </div>
                    <div style={{
                      width: '100%',
                      maxWidth: '40px',
                      height: `${height}px`,
                      background: isPos ? COLORS.profit : COLORS.loss,
                      opacity: 0.8,
                      borderRadius: '4px 4px 0 0',
                    }} />
                    <div style={{ fontSize: '9px', color: COLORS.textSecondary, marginTop: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '60px', textAlign: 'center' }}>
                      {d.month ?? d.label ?? ''}
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        )}
      </div>

      {/* Win Rate + Top/Worst Trades Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '20px' }}>
        {/* Win Rate */}
        <div style={cardStyle}>
          <div style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px', color: COLORS.textPrimary }}>Win Rate</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{ position: 'relative', width: '100px', height: '100px' }}>
              <svg viewBox="0 0 36 36" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="rgba(148,163,184,0.1)" strokeWidth="3" />
                <circle cx="18" cy="18" r="15.9" fill="none" stroke={COLORS.profit} strokeWidth="3"
                  strokeDasharray={`${winRate} ${100 - winRate}`} strokeLinecap="round" />
              </svg>
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontSize: '18px', fontWeight: 700, color: COLORS.profit }}>
                {pct(winRate)}
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '2px', background: COLORS.profit }} />
                <span style={{ fontSize: '14px', color: COLORS.textSecondary }}>Wins: <span style={{ color: COLORS.profit, fontWeight: 600 }}>{wins}</span></span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '2px', background: COLORS.loss }} />
                <span style={{ fontSize: '14px', color: COLORS.textSecondary }}>Losses: <span style={{ color: COLORS.loss, fontWeight: 600 }}>{losses}</span></span>
              </div>
            </div>
          </div>
        </div>

        {/* Top 5 Trades */}
        <div style={cardStyle}>
          <div style={{ fontSize: '16px', fontWeight: 600, marginBottom: '12px', color: COLORS.profit }}>Top 5 Trades</div>
          {topTrades.length === 0 ? (
            <div style={{ color: COLORS.textSecondary, fontSize: '13px' }}>No data</div>
          ) : topTrades.slice(0, 5).map((t, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: i < 4 ? `1px solid ${COLORS.border}` : 'none' }}>
              <span style={{ fontSize: '13px', color: COLORS.textPrimary }}>{t.symbol ?? t.name ?? `Trade ${i + 1}`}</span>
              <span style={{ fontSize: '13px', fontWeight: 600, color: COLORS.profit }}>{fmt(t.pnl ?? t.profit ?? t.net ?? 0)}</span>
            </div>
          ))}
        </div>

        {/* Worst 5 Trades */}
        <div style={cardStyle}>
          <div style={{ fontSize: '16px', fontWeight: 600, marginBottom: '12px', color: COLORS.loss }}>Worst 5 Trades</div>
          {worstTrades.length === 0 ? (
            <div style={{ color: COLORS.textSecondary, fontSize: '13px' }}>No data</div>
          ) : worstTrades.slice(0, 5).map((t, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: i < 4 ? `1px solid ${COLORS.border}` : 'none' }}>
              <span style={{ fontSize: '13px', color: COLORS.textPrimary }}>{t.symbol ?? t.name ?? `Trade ${i + 1}`}</span>
              <span style={{ fontSize: '13px', fontWeight: 600, color: COLORS.loss }}>{fmt(t.pnl ?? t.profit ?? t.net ?? 0)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Fee Analysis */}
      <div style={cardStyle}>
        <div style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px', color: COLORS.textPrimary }}>Fee Analysis</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
          <div style={{ background: 'rgba(30,41,59,0.5)', borderRadius: '8px', padding: '16px' }}>
            <div style={{ fontSize: '12px', color: COLORS.textSecondary, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>Total Fees</div>
            <div style={{ fontSize: '22px', fontWeight: 700, color: COLORS.warning }}>{fmt(totalFees)}</div>
          </div>
          <div style={{ background: 'rgba(30,41,59,0.5)', borderRadius: '8px', padding: '16px' }}>
            <div style={{ fontSize: '12px', color: COLORS.textSecondary, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>Monthly Avg</div>
            <div style={{ fontSize: '22px', fontWeight: 700, color: COLORS.warning }}>{fmt(monthlyFees)}</div>
          </div>
          <div style={{ background: 'rgba(30,41,59,0.5)', borderRadius: '8px', padding: '16px' }}>
            <div style={{ fontSize: '12px', color: COLORS.textSecondary, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>Yearly (Projected)</div>
            <div style={{ fontSize: '22px', fontWeight: 700, color: COLORS.warning }}>{fmt(yearlyFees)}</div>
          </div>
          <div style={{ background: 'rgba(30,41,59,0.5)', borderRadius: '8px', padding: '16px' }}>
            <div style={{ fontSize: '12px', color: COLORS.textSecondary, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>Fees % of Gross</div>
            <div style={{ fontSize: '22px', fontWeight: 700, color: feePctOfGross > 20 ? COLORS.loss : COLORS.warning }}>{pct(feePctOfGross)}</div>
          </div>
          <div style={{ background: 'rgba(30,41,59,0.5)', borderRadius: '8px', padding: '16px' }}>
            <div style={{ fontSize: '12px', color: COLORS.textSecondary, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>Avg Fee / Trade</div>
            <div style={{ fontSize: '22px', fontWeight: 700, color: COLORS.warning }}>{fmt(avgFeePerTrade)}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
