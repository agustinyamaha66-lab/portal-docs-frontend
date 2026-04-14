import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'

export default function Login() {
  const { user, login } = useAuth()
  const navigate = useNavigate()
  const [error, setError] = useState('')

  useEffect(() => {
    if (user) navigate('/')
  }, [user])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const errorCode = params.get('error_code')
    if (errorCode === 'bad_oauth_state') {
      setError('La sesión de login expiró. Por favor intentá de nuevo.')
    } else if (params.get('error')) {
      setError('Error al iniciar sesión. Por favor intentá de nuevo.')
    }
  }, [])

  const handleLogin = async () => {
    setError('')
    try {
      await login()
    } catch (e) {
      console.error(e)
      setError('Acceso denegado. Solo cuentas @valdishopper.com.')
    }
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', background: 'var(--vs-navy)'
    }}>
      <div style={{
        background: 'var(--vs-white)', borderRadius: 'var(--vs-radius-lg)',
        padding: '48px 40px', width: '100%', maxWidth: '380px',
        textAlign: 'center', boxShadow: 'var(--vs-shadow-md)'
      }}>
        <div style={{
          fontFamily: 'var(--vs-font-title)', fontSize: '24px',
          fontWeight: 700, color: 'var(--vs-navy)', marginBottom: '4px'
        }}>
          VALDI<span style={{ color: 'var(--vs-pink)' }}>SHOPPER</span>
        </div>
        <div style={{
          fontSize: '11px', color: 'var(--vs-gray-mid)',
          letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '36px'
        }}>
          Portal de Documentación
        </div>

        <div style={{
          width: '56px', height: '56px', borderRadius: '50%',
          background: 'var(--vs-pink-subtle)', margin: '0 auto 24px',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--vs-pink)" strokeWidth="1.5">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
          </svg>
        </div>

        <p style={{ fontSize: '13px', color: 'var(--vs-gray-mid)', marginBottom: '28px', lineHeight: 1.6 }}>
          Acceso exclusivo para cuentas<br />
          <strong style={{ color: 'var(--vs-navy)' }}>@valdishopper.com</strong>
        </p>

        {error && (
          <div style={{
            background: '#FEF2F2', border: '1px solid #FCA5A5',
            borderRadius: 'var(--vs-radius-md)', padding: '10px 14px',
            fontSize: '12px', color: '#DC2626', marginBottom: '16px'
          }}>
            {error}
          </div>
        )}

        <button className="btn-primary" onClick={handleLogin} style={{ width: '100%', justifyContent: 'center', padding: '12px' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
            <polyline points="10 17 15 12 10 7"/>
            <line x1="15" y1="12" x2="3" y2="12"/>
          </svg>
          Ingresar con Google
        </button>
      </div>
    </div>
  )
}
