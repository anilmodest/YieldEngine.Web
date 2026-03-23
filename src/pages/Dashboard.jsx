import React, { useState, useEffect } from 'react';
import api from '../api';

const COLORS = {
  bg: '#0a0f1a',
  card: 'rgba(15,23,42,0.7)',
  border: 'rgba(148,163,184,0.1)',
  emerald: '#6ee7b7',
  red: '#f87171',
  amber: '#fcd34d',
  blue: '#38bdf8',
  textPrimary: '#f1f5f9',
  textSecondary: '#94a3b8',
};

const cardStyle = {
  background: COLORS.card,
  border: `1px solid ${COLORS.border}`,
  borderRadius: '12px',
  padding: '20px',
};

function formatCurrency(value) {
  if (value == null) return '$0.00';
  const abs = Math.abs(value);
  const formatted = abs.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return value < 0 ? `-$${formatted}` : `$${formatted}`;
}

function formatPercent(value) {
  if (value == null) return '0.0%';
  return `${Number(value).toFixed(1)}%`;
}

export default function Dashboard({ onNavigate }) {
  const [summary, setSummary] = useState(null);
  const [positions, setPositions] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [dailySummary, setDailySummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      try {
        const [summaryData, positionsData, notificationsData, dailyData] = await Promise.all([
          api.getSummary(),
          api.getPositions(),
          api.getNotifications(5),
          api.getDailySummary(),
        ]);
        if (!cancelled) {
          setSummary(summaryData);
          setPositions(positionsData || []);
          setNotifications(notificationsData || []);
          setDailySummary(dailyData);
        }
      } catch (err) {
        console.error('Dashboard fetch error:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchData();
    return () => { cancelled = true; };
  }, []);

  const totalIncome = summary?.totalIncome ?? 0;
  const totalLoss = summary?.totalLoss ?? 0;
  const netPnL = summary?.netPnL ?? (totalIncome + totalLoss);
  const winRate = summary?.winRate ?? 0;

  const openPositions = Array.isArray(positions) ? positions.filter(p => p.status === 'open' || p.isOpen) : [];
  const unrealizedPnL = openPositions.reduce((sum, p) => sum + (p.unrealizedPnL ?? 0), 0);

  if (loading) {
    return (
      <div style={{ background: COLORS.bg, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: COLORS.textSecondary, fontSize: '18px' }}>Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div style={{ background: COLORS.bg, minHeight: '100vh', padding: '24px', color: COLORS.textPrimary }}>
      <h1 style={{ fontSize: '28px', fontWeight: 700, marginBottom: '24px', color: COLORS.textPrimary }}>
        Dashboard
      </h1>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        {/* Total Income */}
        <div style={{ ...cardStyle }}>
          <div style={{ fontSize: '13px', color: COLORS.textSecondary, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Total Income
          </div>
          <div style={{ fontSize: '28px', fontWeight: 700, color: COLORS.emerald }}>
            {formatCurrency(totalIncome)}
          </div>
        </div>

        {/* Total Loss */}
        <div style={{ ...cardStyle }}>
          <div style={{ fontSize: '13px', color: COLORS.textSecondary, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Total Loss
          </div>
          <div style={{ fontSize: '28px', fontWeight: 700, color: COLORS.red }}>
            {formatCurrency(totalLoss)}
          </div>
        </div>

        {/* Net P&L */}
        <div style={{ ...cardStyle }}>
          <div style={{ fontSize: '13px', color: COLORS.textSecondary, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Net P&L
          </div>
          <div style={{ fontSize: '28px', fontWeight: 700, color: netPnL >= 0 ? COLORS.emerald : COLORS.red }}>
            {formatCurrency(netPnL)}
          </div>
        </div>

        {/* Win Rate */}
        <div style={{ ...cardStyle }}>
          <div style={{ fontSize: '13px', color: COLORS.textSecondary, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Win Rate
          </div>
          <div style={{ fontSize: '28px', fontWeight: 700, color: COLORS.blue }}>
            {formatPercent(winRate)}
          </div>
        </div>
      </div>

      {/* Chart Placeholder + Open Positions */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px', marginBottom: '24px' }}>
        {/* Monthly P&L Chart Placeholder */}
        <div style={{
          ...cardStyle,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '260px',
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '18px', fontWeight: 600, color: COLORS.textSecondary, marginBottom: '8px' }}>
              Monthly P&L Chart
            </div>
            <div style={{ fontSize: '13px', color: COLORS.textSecondary, opacity: 0.6 }}>
              Recharts integration coming soon
            </div>
          </div>
        </div>

        {/* Open Positions Summary */}
        <div style={{ ...cardStyle, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ fontSize: '13px', color: COLORS.textSecondary, marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Open Positions
          </div>
          <div style={{ fontSize: '40px', fontWeight: 700, color: COLORS.blue, marginBottom: '8px' }}>
            {openPositions.length}
          </div>
          <div style={{ fontSize: '13px', color: COLORS.textSecondary, marginBottom: '4px' }}>
            Unrealized P&L
          </div>
          <div style={{ fontSize: '22px', fontWeight: 600, color: unrealizedPnL >= 0 ? COLORS.emerald : COLORS.red }}>
            {formatCurrency(unrealizedPnL)}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div style={{ ...cardStyle, marginBottom: '24px' }}>
        <div style={{ fontSize: '13px', color: COLORS.textSecondary, marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Quick Actions
        </div>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          {[
            { label: 'Scan Now', target: 'scan', color: COLORS.emerald },
            { label: 'Import Portfolio', target: 'import', color: COLORS.blue },
            { label: 'View Positions', target: 'positions', color: COLORS.amber },
          ].map(({ label, target, color }) => (
            <button
              key={target}
              onClick={() => onNavigate && onNavigate(target)}
              style={{
                background: 'transparent',
                border: `1px solid ${color}`,
                borderRadius: '8px',
                padding: '10px 20px',
                color: color,
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'background 0.2s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = `${color}22`; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Bottom Row: Daily Summary + Notifications */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        {/* Today's Daily Summary */}
        <div style={{ ...cardStyle }}>
          <div style={{ fontSize: '13px', color: COLORS.textSecondary, marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Today's Summary
          </div>
          {dailySummary ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: COLORS.textSecondary, fontSize: '14px' }}>Trades</span>
                <span style={{ color: COLORS.textPrimary, fontSize: '14px', fontWeight: 600 }}>
                  {dailySummary.tradeCount ?? 0}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: COLORS.textSecondary, fontSize: '14px' }}>Realized P&L</span>
                <span style={{
                  fontSize: '14px',
                  fontWeight: 600,
                  color: (dailySummary.realizedPnL ?? 0) >= 0 ? COLORS.emerald : COLORS.red,
                }}>
                  {formatCurrency(dailySummary.realizedPnL)}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: COLORS.textSecondary, fontSize: '14px' }}>Wins / Losses</span>
                <span style={{ color: COLORS.textPrimary, fontSize: '14px', fontWeight: 600 }}>
                  {dailySummary.wins ?? 0} / {dailySummary.losses ?? 0}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: COLORS.textSecondary, fontSize: '14px' }}>Volume</span>
                <span style={{ color: COLORS.textPrimary, fontSize: '14px', fontWeight: 600 }}>
                  {formatCurrency(dailySummary.volume)}
                </span>
              </div>
            </div>
          ) : (
            <div style={{ color: COLORS.textSecondary, fontSize: '14px', opacity: 0.6 }}>
              No trading activity today
            </div>
          )}
        </div>

        {/* Recent Notifications */}
        <div style={{ ...cardStyle }}>
          <div style={{ fontSize: '13px', color: COLORS.textSecondary, marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Recent Notifications
          </div>
          {notifications.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {notifications.map((n, i) => {
                const typeColor = n.type === 'error' ? COLORS.red
                  : n.type === 'warning' ? COLORS.amber
                  : n.type === 'success' ? COLORS.emerald
                  : COLORS.blue;
                return (
                  <div key={n.id ?? i} style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '10px',
                    padding: '8px 0',
                    borderBottom: i < notifications.length - 1 ? `1px solid ${COLORS.border}` : 'none',
                  }}>
                    <div style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: typeColor,
                      marginTop: '6px',
                      flexShrink: 0,
                    }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '14px', color: COLORS.textPrimary, marginBottom: '2px' }}>
                        {n.message ?? n.title ?? 'Notification'}
                      </div>
                      {n.timestamp && (
                        <div style={{ fontSize: '12px', color: COLORS.textSecondary, opacity: 0.6 }}>
                          {new Date(n.timestamp).toLocaleString()}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ color: COLORS.textSecondary, fontSize: '14px', opacity: 0.6 }}>
              No recent notifications
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
