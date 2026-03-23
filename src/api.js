const BASE = import.meta.env.VITE_API_BASE_URL || ''

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(err.error || res.statusText)
  }
  return res.json()
}

const api = {
  // System
  status: () => request('/api/status'),
  health: () => request('/api/health'),

  // Auth
  kiteLogin: () => request('/api/kite/login'),
  kiteAutoLogin: () => request('/api/kite/auto-login', { method: 'POST' }),

  // Permission
  getPermission: () => request('/api/permission'),
  setPermission: (data) => request('/api/permission', { method: 'POST', body: JSON.stringify(data) }),

  // Holdings
  getHoldings: () => request('/api/holdings'),
  importCsv: (formData) => fetch(`${BASE}/api/import/csv`, { method: 'POST', body: formData }).then(r => r.json()),
  importJson: (data) => request('/api/import/json', { method: 'POST', body: JSON.stringify(data) }),
  importKite: () => request('/api/import/kite', { method: 'POST' }),
  importManual: (data) => request('/api/import/manual', { method: 'POST', body: JSON.stringify(data) }),
  removeHolding: (symbol) => request(`/api/holdings/${symbol}`, { method: 'DELETE' }),

  // Portfolios
  getPortfolios: () => request('/api/portfolios'),
  savePortfolio: (data) => request('/api/portfolios', { method: 'POST', body: JSON.stringify(data) }),
  deletePortfolio: (id) => request(`/api/portfolios/${id}`, { method: 'DELETE' }),
  loadPortfolio: (id) => request(`/api/portfolios/${id}/load`, { method: 'POST' }),

  // Scanner
  scan: (data) => request('/api/scan', { method: 'POST', body: JSON.stringify(data || {}) }),
  getRecommendations: (params) => request(`/api/recommendations?${new URLSearchParams(params)}`),
  getArbitrage: () => request('/api/arbitrage'),

  // Execution
  execute: (data) => request('/api/execute', { method: 'POST', body: JSON.stringify(data) }),
  getRiskDisclosure: (data) => request('/api/risk-disclosure', { method: 'POST', body: JSON.stringify(data) }),

  // Positions
  getPositions: () => request('/api/positions'),
  closePosition: (id, data) => request(`/api/positions/${id}/close`, { method: 'POST', body: JSON.stringify(data) }),
  getAdjustments: (id) => request(`/api/positions/${id}/adjustments`),
  adjustPosition: (id, data) => request(`/api/positions/${id}/adjust`, { method: 'POST', body: JSON.stringify(data) }),

  // Trades
  getTrades: (params) => request(`/api/trades?${new URLSearchParams(params || {})}`),
  getTrade: (id) => request(`/api/trades/${id}`),

  // Analytics
  getSummary: () => request('/api/analytics/summary'),
  getStrategyBreakdown: () => request('/api/analytics/strategy'),
  getMonthlyPnl: () => request('/api/analytics/monthly'),
  getDailyPnl: () => request('/api/analytics/daily'),

  // Collateral
  getCollateral: () => request('/api/collateral'),

  // Notifications
  getNotifications: (limit = 50) => request(`/api/notifications?limit=${limit}`),
  getUnreadCount: () => request('/api/notifications/unread-count'),
  markRead: (id) => request(`/api/notifications/${id}/read`, { method: 'POST' }),
  markAllRead: () => request('/api/notifications/read-all', { method: 'POST' }),

  // Settings
  getSettings: () => request('/api/settings'),
  updateSettings: (data) => request('/api/settings', { method: 'POST', body: JSON.stringify(data) }),
  getRiskProfile: () => request('/api/settings/risk-profile'),
  setRiskProfile: (data) => request('/api/settings/risk-profile', { method: 'POST', body: JSON.stringify(data) }),

  // Risk
  getRiskStatus: () => request('/api/risk/status'),
  getRiskAlerts: () => request('/api/risk/alerts'),

  // Fees
  estimateFees: (params) => request(`/api/fees/estimate?${new URLSearchParams(params)}`),
  getFeesSummary: () => request('/api/fees/summary'),

  // GTT
  getActiveGtt: () => request('/api/gtt/active'),

  // Audit
  getOrderAudit: () => request('/api/audit/orders'),
  getSafetyCaps: () => request('/api/safety/caps'),

  // Daily Summary
  getDailySummary: () => request('/api/daily-summary'),
}

export default api
