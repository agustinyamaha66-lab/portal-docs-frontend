import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Navbar from './components/Navbar'
import Login from './pages/Login'
import Home from './pages/Home'
import DocDetail from './pages/DocDetail'
import './index.css'

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--vs-navy)' }}>
      <div style={{ fontFamily: 'var(--vs-font-title)', fontSize: '18px', color: 'rgba(255,255,255,0.4)', letterSpacing: '-0.5px' }}>
        VALDI<span style={{ color: 'var(--vs-pink)' }}>SHOPPER</span>
      </div>
    </div>
  )
  if (!user) return <Navigate to="/login" />
  return children
}

function Layout({ children }) {
  return (
    <>
      <Navbar />
      {children}
    </>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={
            <ProtectedRoute>
              <Layout><Home /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/doc/:id" element={
            <ProtectedRoute>
              <Layout><DocDetail /></Layout>
            </ProtectedRoute>
          } />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
