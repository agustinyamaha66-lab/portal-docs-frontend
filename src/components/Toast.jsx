import { useEffect, useState } from 'react'

export default function Toast({ message, type = 'success', onClose }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    setVisible(true)
    const t = setTimeout(() => {
      setVisible(false)
      setTimeout(onClose, 300)
    }, 3000)
    return () => clearTimeout(t)
  }, [])

  const colors = {
    success: 'var(--vs-success)',
    error: 'var(--vs-danger)',
    warning: 'var(--vs-warning)'
  }

  return (
    <div style={{
      position: 'fixed', bottom: '24px', right: '24px',
      background: 'var(--vs-navy)', color: 'var(--vs-white)',
      fontFamily: 'var(--vs-font-body)', fontSize: '13px',
      padding: '12px 18px', borderRadius: 'var(--vs-radius-md)',
      borderLeft: `4px solid ${colors[type]}`,
      boxShadow: 'var(--vs-shadow-md)', zIndex: 999,
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0)' : 'translateY(10px)',
      transition: 'opacity 0.3s, transform 0.3s',
      maxWidth: '320px'
    }}>
      {message}
    </div>
  )
}
