import { useState, useEffect } from 'react'
import api from '../api'

const navItems = [
  { path: '/', label: 'Dashboard' },
  { path: '/holdings', label: 'Holdings' },
  { path: '/scanner', label: 'Scanner' },
  { path: '/positions', label: 'Positions' },
  { path: '/trades', label: 'Trades' },
  { path: '/analytics', label: 'Analytics' },
  { path: '/risk', label: 'Risk' },
  { path: '/settings', label: 'Settings' },
]

export default function Header({ currentPage, onNavigate, permission }) {
  const [unread, setUnread] = useState(0)
  const [showNotifications, setShowNotifications] = useState(false)
  const [notifications, setNotifications] = useState([])

  useEffect(() => {
    api.getUnreadCount().then(d => setUnread(d.count)).catch(() => {})
    const interval = setInterval(() => {
      api.getUnreadCount().then(d => setUnread(d.count)).catch(() => {})
    }, 30000)
    return () => clearInterval(interval)
  }, [])

  const toggleNotifications = async () => {
    if (!showNotifications) {
      const data = await api.getNotifications(20).catch(() => [])
      setNotifications(Array.isArray(data) ? data : [])
    }
    setShowNotifications(!showNotifications)
  }

  const severityColor = { INFO: '#38bdf8', WARNING: '#fcd34d', URGENT: '#f87171' }

  return (
    <header style={{
      background: 'rgba(15,23,42,0.9)', borderBottom: '1px solid rgba(148,163,184,0.1)',
      padding: '0 1.5rem', display: 'flex', alignItems: 'center', height: '56px',
      position: 'sticky', top: 0, zIndex: 100, backdropFilter: 'blur(10px)',
    }}>
      <div style={{ fontWeight: 700, fontSize: '1.1rem', color: '#6ee7b7', marginRight: '2rem', cursor: 'pointer' }}
           onClick={() => onNavigate('/')}>
        Yield Engine
      </div>

      <nav style={{ display: 'flex', gap: '0.25rem', flex: 1 }}>
        {navItems.map(item => (
          <button key={item.path} onClick={() => onNavigate(item.path)}
            style={{
              background: currentPage === item.path ? 'rgba(110,231,183,0.1)' : 'transparent',
              color: currentPage === item.path ? '#6ee7b7' : '#94a3b8',
              border: 'none', padding: '0.5rem 0.75rem', borderRadius: '6px',
              cursor: 'pointer', fontSize: '0.85rem', fontFamily: 'inherit',
            }}>
            {item.label}
          </button>
        ))}
      </nav>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <span style={{
          fontSize: '0.75rem', padding: '0.25rem 0.5rem', borderRadius: '4px',
          background: permission === 'EXECUTE' ? 'rgba(248,113,113,0.15)' : 'rgba(110,231,183,0.15)',
          color: permission === 'EXECUTE' ? '#f87171' : '#6ee7b7',
        }}>
          {permission}
        </span>

        <div style={{ position: 'relative' }}>
          <button onClick={toggleNotifications} style={{
            background: 'transparent', border: 'none', color: '#94a3b8',
            cursor: 'pointer', fontSize: '1.2rem', position: 'relative', padding: '4px',
          }}>
            &#128276;
            {unread > 0 && (
              <span style={{
                position: 'absolute', top: -2, right: -4, background: '#f87171',
                color: '#fff', fontSize: '0.6rem', borderRadius: '50%',
                width: '16px', height: '16px', display: 'flex', alignItems: 'center',
                justifyContent: 'center',
              }}>{unread > 9 ? '9+' : unread}</span>
            )}
          </button>

          {showNotifications && (
            <div style={{
              position: 'absolute', top: '100%', right: 0, width: '360px',
              background: '#0f172a', border: '1px solid rgba(148,163,184,0.15)',
              borderRadius: '8px', maxHeight: '400px', overflowY: 'auto',
              boxShadow: '0 10px 40px rgba(0,0,0,0.5)', zIndex: 200,
            }}>
              <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid rgba(148,163,184,0.1)',
                           display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>Notifications</span>
                <button onClick={() => { api.markAllRead(); setUnread(0) }}
                  style={{ background: 'transparent', border: 'none', color: '#6ee7b7',
                           cursor: 'pointer', fontSize: '0.75rem' }}>
                  Mark all read
                </button>
              </div>
              {notifications.length === 0 && (
                <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>No notifications</div>
              )}
              {notifications.map(n => (
                <div key={n.id} style={{
                  padding: '0.75rem 1rem', borderBottom: '1px solid rgba(148,163,184,0.05)',
                  opacity: n.read ? 0.6 : 1, cursor: 'pointer',
                }} onClick={() => { api.markRead(n.id); if (n.action_url) onNavigate(n.action_url) }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 600, color: severityColor[n.severity] || '#e2e8f0' }}>
                      {n.title}
                    </span>
                    <span style={{ fontSize: '0.65rem', color: '#64748b' }}>
                      {new Date(n.created_at).toLocaleTimeString()}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{n.message}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
