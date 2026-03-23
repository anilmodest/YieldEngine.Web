import { useState, useEffect } from 'react'
import api from './api'
import Header from './components/Header'
import Dashboard from './pages/Dashboard'
import Holdings from './pages/Holdings'
import Scanner from './pages/Scanner'
import Positions from './pages/Positions'
import TradeLog from './pages/TradeLog'
import Analytics from './pages/Analytics'
import RiskMonitor from './pages/RiskMonitor'
import Settings from './pages/Settings'
import Arbitrage from './pages/Arbitrage'

function App() {
  const [page, setPage] = useState('/')
  const [permission, setPermission] = useState('READONLY')

  useEffect(() => {
    api.getPermission()
      .then(d => setPermission(d.permission))
      .catch(() => {})
  }, [])

  const navigate = (path) => setPage(path)

  const renderPage = () => {
    switch (page) {
      case '/': return <Dashboard onNavigate={navigate} />
      case '/holdings': return <Holdings onNavigate={navigate} />
      case '/scanner': return <Scanner onNavigate={navigate} permission={permission} />
      case '/positions': return <Positions onNavigate={navigate} permission={permission} />
      case '/trades': return <TradeLog onNavigate={navigate} />
      case '/analytics': return <Analytics onNavigate={navigate} />
      case '/risk': return <RiskMonitor onNavigate={navigate} permission={permission} />
      case '/settings': return <Settings onNavigate={navigate} />
      case '/arbitrage': return <Arbitrage onNavigate={navigate} permission={permission} />
      default: return <Dashboard onNavigate={navigate} />
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0a0f1a', color: '#e2e8f0',
                  fontFamily: "'DM Sans', system-ui, -apple-system, sans-serif" }}>
      <Header currentPage={page} onNavigate={navigate} permission={permission} />
      <main style={{ padding: '1.5rem', maxWidth: '1400px', margin: '0 auto' }}>
        {renderPage()}
      </main>
    </div>
  )
}

function Placeholder({ title }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center',
                  height: '60vh', color: '#64748b' }}>
      <div style={{ textAlign: 'center' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', color: '#94a3b8' }}>{title}</h2>
        <p>Coming in next phase</p>
      </div>
    </div>
  )
}

export default App
