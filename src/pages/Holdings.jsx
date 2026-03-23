import React, { useState, useEffect } from 'react';
import api from '../api';

export default function Holdings({ onNavigate }) {
  const [holdings, setHoldings] = useState([]);
  const [cashBalance, setCashBalance] = useState(0);
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [showSnapshots, setShowSnapshots] = useState(false);
  const [snapshots, setSnapshots] = useState([]);
  const [manualForm, setManualForm] = useState({ symbol: '', qty: '', avgPrice: '', ltp: '' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHoldings();
  }, []);

  const fetchHoldings = async () => {
    try {
      setLoading(true);
      const data = await api.getHoldings();
      setHoldings(data || []);
    } catch (err) {
      console.error('Failed to fetch holdings:', err);
    } finally {
      setLoading(false);
    }
  };

  const portfolioValue = holdings.reduce((sum, h) => sum + (h.ltp || 0) * (h.qty || 0), 0);
  const unrealizedPnL = holdings.reduce((sum, h) => sum + ((h.ltp || 0) - (h.avgPrice || 0)) * (h.qty || 0), 0);
  const nonCashCollateral = holdings.reduce((sum, h) => {
    const value = (h.ltp || 0) * (h.qty || 0);
    const haircut = h.haircut || 0;
    return sum + value * (1 - haircut / 100);
  }, 0);
  const cashEquivalent = parseFloat(cashBalance) || 0;
  const usableMargin = nonCashCollateral + cashEquivalent;

  const handleImportKite = async () => {
    try {
      const data = await api.importKite();
      setHoldings(data || []);
    } catch (err) {
      console.error('Failed to import from Kite:', err);
    }
  };

  const handleCSVUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const lines = evt.target.result.trim().split('\n');
      const parsed = lines
        .filter((line) => line.trim() && !line.startsWith('symbol'))
        .map((line) => {
          const [symbol, qty, avgPrice, ltp] = line.split(',').map((s) => s.trim());
          return { symbol, qty: parseFloat(qty), avgPrice: parseFloat(avgPrice), ltp: parseFloat(ltp) };
        })
        .filter((h) => h.symbol && !isNaN(h.qty));
      setHoldings((prev) => [...prev, ...parsed]);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleManualAdd = () => {
    const { symbol, qty, avgPrice, ltp } = manualForm;
    if (!symbol || !qty) return;
    setHoldings((prev) => [
      ...prev,
      { symbol: symbol.toUpperCase(), qty: parseFloat(qty), avgPrice: parseFloat(avgPrice) || 0, ltp: parseFloat(ltp) || 0 },
    ]);
    setManualForm({ symbol: '', qty: '', avgPrice: '', ltp: '' });
  };

  const handleDelete = (index) => {
    setHoldings((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSaveSnapshot = () => {
    const snapshot = {
      id: Date.now(),
      date: new Date().toLocaleString(),
      holdings: [...holdings],
      cashBalance,
    };
    setSnapshots((prev) => [...prev, snapshot]);
  };

  const handleLoadSnapshot = (snapshot) => {
    setHoldings(snapshot.holdings);
    setCashBalance(snapshot.cashBalance);
    setShowSnapshots(false);
  };

  const formatCurrency = (val) => {
    const num = parseFloat(val) || 0;
    return num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const styles = {
    page: {
      minHeight: '100vh',
      background: '#0a0f1a',
      color: '#e2e8f0',
      padding: '24px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    },
    header: {
      fontSize: '28px',
      fontWeight: 700,
      marginBottom: '24px',
      color: '#f1f5f9',
    },
    statsBar: {
      display: 'grid',
      gridTemplateColumns: 'repeat(5, 1fr)',
      gap: '16px',
      marginBottom: '24px',
    },
    statCard: {
      background: 'rgba(15,23,42,0.7)',
      border: '1px solid rgba(148,163,184,0.1)',
      borderRadius: '12px',
      padding: '16px',
    },
    statLabel: {
      fontSize: '12px',
      color: '#94a3b8',
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
      marginBottom: '4px',
    },
    statValue: {
      fontSize: '20px',
      fontWeight: 600,
    },
    card: {
      background: 'rgba(15,23,42,0.7)',
      border: '1px solid rgba(148,163,184,0.1)',
      borderRadius: '12px',
      padding: '20px',
      marginBottom: '20px',
    },
    sectionTitle: {
      fontSize: '16px',
      fontWeight: 600,
      marginBottom: '12px',
      color: '#f1f5f9',
    },
    buttonRow: {
      display: 'flex',
      gap: '12px',
      flexWrap: 'wrap',
      alignItems: 'center',
    },
    btn: {
      padding: '10px 20px',
      borderRadius: '8px',
      border: '1px solid rgba(148,163,184,0.2)',
      background: 'rgba(30,41,59,0.8)',
      color: '#e2e8f0',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: 500,
      transition: 'background 0.2s',
    },
    btnPrimary: {
      padding: '10px 20px',
      borderRadius: '8px',
      border: 'none',
      background: '#6ee7b7',
      color: '#0a0f1a',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: 600,
    },
    input: {
      padding: '10px 14px',
      borderRadius: '8px',
      border: '1px solid rgba(148,163,184,0.2)',
      background: 'rgba(15,23,42,0.9)',
      color: '#e2e8f0',
      fontSize: '14px',
      outline: 'none',
      width: '100%',
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse',
    },
    th: {
      textAlign: 'left',
      padding: '12px 16px',
      fontSize: '12px',
      color: '#94a3b8',
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
      borderBottom: '1px solid rgba(148,163,184,0.1)',
    },
    td: {
      padding: '12px 16px',
      fontSize: '14px',
      borderBottom: '1px solid rgba(148,163,184,0.05)',
    },
    deleteBtn: {
      padding: '4px 12px',
      borderRadius: '6px',
      border: '1px solid rgba(248,113,113,0.3)',
      background: 'rgba(248,113,113,0.1)',
      color: '#f87171',
      cursor: 'pointer',
      fontSize: '12px',
    },
    helpText: {
      fontSize: '12px',
      color: '#64748b',
      marginTop: '8px',
    },
  };

  return (
    <div style={styles.page}>
      <div style={styles.header}>Holdings / Portfolio</div>

      {/* Stats Bar */}
      <div style={styles.statsBar}>
        <div style={styles.statCard}>
          <div style={styles.statLabel}>Portfolio Value</div>
          <div style={{ ...styles.statValue, color: '#f1f5f9' }}>{formatCurrency(portfolioValue)}</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statLabel}>Unrealized P&L</div>
          <div style={{ ...styles.statValue, color: unrealizedPnL >= 0 ? '#6ee7b7' : '#f87171' }}>
            {unrealizedPnL >= 0 ? '+' : ''}{formatCurrency(unrealizedPnL)}
          </div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statLabel}>Non-Cash Collateral</div>
          <div style={{ ...styles.statValue, color: '#f1f5f9' }}>{formatCurrency(nonCashCollateral)}</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statLabel}>Cash Equivalent</div>
          <div style={{ ...styles.statValue, color: '#f1f5f9' }}>{formatCurrency(cashEquivalent)}</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statLabel}>Usable Margin</div>
          <div style={{ ...styles.statValue, color: '#6ee7b7' }}>{formatCurrency(usableMargin)}</div>
        </div>
      </div>

      {/* Cash Balance Input */}
      <div style={styles.card}>
        <div style={styles.sectionTitle}>Cash Balance</div>
        <input
          style={{ ...styles.input, maxWidth: '300px' }}
          type="number"
          placeholder="Enter cash balance"
          value={cashBalance}
          onChange={(e) => setCashBalance(e.target.value)}
        />
      </div>

      {/* Import Section */}
      <div style={styles.card}>
        <div style={styles.sectionTitle}>Import Holdings</div>
        <div style={styles.buttonRow}>
          <button style={styles.btn} onClick={handleImportKite}>From Kite</button>
          <label style={{ ...styles.btn, display: 'inline-flex', alignItems: 'center' }}>
            Upload CSV
            <input type="file" accept=".csv" onChange={handleCSVUpload} style={{ display: 'none' }} />
          </label>
          <button
            style={showManualEntry ? styles.btnPrimary : styles.btn}
            onClick={() => { setShowManualEntry(!showManualEntry); setShowSnapshots(false); }}
          >
            Manual Entry
          </button>
          <button
            style={showSnapshots ? styles.btnPrimary : styles.btn}
            onClick={() => { setShowSnapshots(!showSnapshots); setShowManualEntry(false); }}
          >
            Load Saved
          </button>
        </div>
        <div style={styles.helpText}>CSV format: symbol,qty,avgPrice,ltp</div>
      </div>

      {/* Manual Entry Form */}
      {showManualEntry && (
        <div style={styles.card}>
          <div style={styles.sectionTitle}>Manual Entry</div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '140px' }}>
              <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Symbol</label>
              <input
                style={styles.input}
                placeholder="e.g. RELIANCE"
                value={manualForm.symbol}
                onChange={(e) => setManualForm({ ...manualForm, symbol: e.target.value })}
              />
            </div>
            <div style={{ flex: 1, minWidth: '100px' }}>
              <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Qty</label>
              <input
                style={styles.input}
                type="number"
                placeholder="0"
                value={manualForm.qty}
                onChange={(e) => setManualForm({ ...manualForm, qty: e.target.value })}
              />
            </div>
            <div style={{ flex: 1, minWidth: '100px' }}>
              <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Avg Price</label>
              <input
                style={styles.input}
                type="number"
                placeholder="0.00"
                value={manualForm.avgPrice}
                onChange={(e) => setManualForm({ ...manualForm, avgPrice: e.target.value })}
              />
            </div>
            <div style={{ flex: 1, minWidth: '100px' }}>
              <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>LTP</label>
              <input
                style={styles.input}
                type="number"
                placeholder="0.00"
                value={manualForm.ltp}
                onChange={(e) => setManualForm({ ...manualForm, ltp: e.target.value })}
              />
            </div>
            <button style={styles.btnPrimary} onClick={handleManualAdd}>Add</button>
          </div>
        </div>
      )}

      {/* Snapshots */}
      {showSnapshots && (
        <div style={styles.card}>
          <div style={styles.sectionTitle}>Saved Snapshots</div>
          {snapshots.length === 0 ? (
            <div style={{ color: '#64748b', fontSize: '14px' }}>No saved snapshots yet.</div>
          ) : (
            snapshots.map((snap) => (
              <div
                key={snap.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  background: 'rgba(30,41,59,0.5)',
                  marginBottom: '8px',
                }}
              >
                <span style={{ fontSize: '14px' }}>{snap.date} - {snap.holdings.length} holdings</span>
                <button style={styles.btn} onClick={() => handleLoadSnapshot(snap)}>Load</button>
              </div>
            ))
          )}
        </div>
      )}

      {/* Holdings Table */}
      <div style={styles.card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={styles.sectionTitle}>Holdings ({holdings.length})</div>
          <button style={styles.btnPrimary} onClick={handleSaveSnapshot}>Save Portfolio Snapshot</button>
        </div>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>Loading holdings...</div>
        ) : holdings.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>No holdings. Import or add holdings above.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Symbol</th>
                  <th style={{ ...styles.th, textAlign: 'right' }}>Qty</th>
                  <th style={{ ...styles.th, textAlign: 'right' }}>Avg Price</th>
                  <th style={{ ...styles.th, textAlign: 'right' }}>LTP</th>
                  <th style={{ ...styles.th, textAlign: 'right' }}>Value</th>
                  <th style={{ ...styles.th, textAlign: 'right' }}>P&L</th>
                  <th style={{ ...styles.th, textAlign: 'right' }}>Haircut</th>
                  <th style={{ ...styles.th, textAlign: 'right' }}>Collateral</th>
                  <th style={{ ...styles.th, textAlign: 'center' }}></th>
                </tr>
              </thead>
              <tbody>
                {holdings.map((h, i) => {
                  const value = (h.ltp || 0) * (h.qty || 0);
                  const pnl = ((h.ltp || 0) - (h.avgPrice || 0)) * (h.qty || 0);
                  const haircut = h.haircut || 0;
                  const collateral = value * (1 - haircut / 100);
                  return (
                    <tr key={i} style={{ transition: 'background 0.2s' }}>
                      <td style={{ ...styles.td, fontWeight: 600, color: '#f1f5f9' }}>{h.symbol}</td>
                      <td style={{ ...styles.td, textAlign: 'right' }}>{h.qty}</td>
                      <td style={{ ...styles.td, textAlign: 'right' }}>{formatCurrency(h.avgPrice)}</td>
                      <td style={{ ...styles.td, textAlign: 'right' }}>{formatCurrency(h.ltp)}</td>
                      <td style={{ ...styles.td, textAlign: 'right' }}>{formatCurrency(value)}</td>
                      <td style={{ ...styles.td, textAlign: 'right', color: pnl >= 0 ? '#6ee7b7' : '#f87171', fontWeight: 500 }}>
                        {pnl >= 0 ? '+' : ''}{formatCurrency(pnl)}
                      </td>
                      <td style={{ ...styles.td, textAlign: 'right' }}>{haircut}%</td>
                      <td style={{ ...styles.td, textAlign: 'right' }}>{formatCurrency(collateral)}</td>
                      <td style={{ ...styles.td, textAlign: 'center' }}>
                        <button style={styles.deleteBtn} onClick={() => handleDelete(i)}>Delete</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
