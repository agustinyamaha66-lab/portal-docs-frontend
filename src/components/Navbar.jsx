import { useAuth } from '../contexts/AuthContext'

export default function Navbar() {
  const { user, logout } = useAuth()

  return (
    <header style={{
      background: 'var(--vs-navy)', padding: '14px 28px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      position: 'sticky', top: 0, zIndex: 50
    }}>
      <div>
        <div style={{
          fontFamily: 'var(--vs-font-title)', fontSize: '18px',
          fontWeight: 700, color: 'var(--vs-white)', letterSpacing: '-0.5px'
        }}>
          VALDI<span style={{ color: 'var(--vs-pink)' }}>SHOPPER</span>
        </div>
        <div style={{ fontSize: '10px', color: 'var(--vs-navy-muted)', letterSpacing: '1px', textTransform: 'uppercase' }}>
          Portal de Documentación Interna
        </div>
      </div>

      {user && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--vs-white)' }}>
              {user.displayName}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--vs-navy-muted)' }}>
              {user.email}
            </div>
          </div>
          {user.photoURL && (
            <img
              src={user.photoURL}
              alt="avatar"
              style={{ width: '32px', height: '32px', borderRadius: '50%', border: '2px solid var(--vs-navy-light)' }}
            />
          )}
          <button
            onClick={logout}
            style={{
              background: 'none', border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: 'var(--vs-radius-pill)', padding: '5px 12px',
              color: 'rgba(255,255,255,0.6)', fontSize: '12px', cursor: 'pointer',
              fontFamily: 'var(--vs-font-body)', transition: 'all 0.2s'
            }}
          >
            Salir
          </button>
        </div>
      )}
    </header>
  )
}
