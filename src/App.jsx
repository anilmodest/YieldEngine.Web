import { useState, useEffect } from 'react'

const API_BASE = import.meta.env.VITE_API_BASE_URL || ''

function App() {
  const [status, setStatus] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetch(`${API_BASE}/api/status`)
      .then(res => res.json())
      .then(data => setStatus(data))
      .catch(err => setError(err.message))
  }, [])

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0a0f1a',
      color: '#e2e8f0',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'system-ui, -apple-system, sans-serif',
    }}>
      <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem', color: '#6ee7b7' }}>
        Yield Engine
      </h1>
      <p style={{ fontSize: '1.1rem', color: '#94a3b8', marginBottom: '2rem' }}>
        Portfolio Income System
      </p>
      <div style={{
        background: 'rgba(15,23,42,0.7)',
        border: '1px solid rgba(148,163,184,0.1)',
        borderRadius: '12px',
        padding: '2rem',
        minWidth: '300px',
      }}>
        <h2 style={{ fontSize: '1rem', color: '#94a3b8', marginBottom: '1rem' }}>
          API Status
        </h2>
        {error && <p style={{ color: '#f87171' }}>Error: {error}</p>}
        {status ? (
          <div>
            <p style={{ color: '#6ee7b7' }}>Status: {status.status}</p>
            <p>Service: {status.service}</p>
            <p>Version: {status.version}</p>
            <p>Environment: {status.environment}</p>
          </div>
        ) : !error ? (
          <p style={{ color: '#fcd34d' }}>Connecting...</p>
        ) : null}
      </div>
    </div>
  )
}

export default App
