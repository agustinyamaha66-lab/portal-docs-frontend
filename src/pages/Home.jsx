import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import UploadModal from '../components/UploadModal'
import ScriptUploadModal from '../components/ScriptUploadModal'
import Toast from '../components/Toast'
import ProcesoAnalizar from '../components/ProcesoAnalizar'
import { supabase } from '../supabase'
import { useAuth } from '../contexts/AuthContext'

const DAILY_LIMIT = 3
const UNLIMITED_USERS = ['agustin.williamson@valdishopper.com']

const TABS = [
  { value: 'proyectos', label: 'Proyectos' },
  { value: 'scripts', label: 'Scripts' },
  { value: 'procesos', label: 'Procesos' }
]

const AREA_SUBTABS = [
  { value: 'cco', label: 'CCO' },
  { value: 'mejora_continua', label: 'Mejora continua' },
  { value: 'personas', label: 'Personas' },
  { value: 'finanzas', label: 'Finanzas' }
]

const TABS_WITH_SUBTABS = ['proyectos', 'scripts']

const STATUS_LABEL = { active: 'Activo', inactive: 'Inactivo', dev: 'En desarrollo' }
const STATUS_STYLE = {
  active: { background: '#E8F5E9', color: '#1B6B3A' },
  inactive: { background: 'var(--vs-gray-light)', color: 'var(--vs-gray-mid)' },
  dev: { background: '#FFF8E1', color: '#9A6700' }
}

const ACCENT_COLOR = {
  proyectos: 'var(--vs-navy)',
  scripts: 'var(--vs-success)',
  procesos: 'var(--vs-pink)',
  cco: 'var(--vs-navy)',
  mejora_continua: '#2E7D32',
  personas: '#AD1457',
  finanzas: '#1565C0'
}

const ICON_BG = {
  proyectos: 'var(--vs-navy-subtle)',
  scripts: '#E8F5E9',
  procesos: 'var(--vs-pink-subtle)',
  cco: 'var(--vs-navy-subtle)',
  mejora_continua: '#E8F5E9',
  personas: '#FCE4EC',
  finanzas: '#E3F2FD'
}

const ICON_COLOR = {
  proyectos: 'var(--vs-navy)',
  scripts: 'var(--vs-success)',
  procesos: 'var(--vs-pink)',
  cco: 'var(--vs-navy)',
  mejora_continua: '#2E7D32',
  personas: '#AD1457',
  finanzas: '#1565C0'
}

function DocIcon({ colorKey }) {
  const color = ICON_COLOR[colorKey] || ICON_COLOR.proyectos
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="16" y1="13" x2="8" y2="13"/>
      <line x1="16" y1="17" x2="8" y2="17"/>
    </svg>
  )
}

function ScriptIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--vs-success)" strokeWidth="1.5">
      <polyline points="16 18 22 12 16 6"/>
      <polyline points="8 6 2 12 8 18"/>
    </svg>
  )
}

export default function Home() {
  const [activeTab, setActiveTab] = useState('proyectos')
  const [activeSubtab, setActiveSubtab] = useState('cco')
  const [docs, setDocs] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [toast, setToast] = useState(null)
  const [scriptsTodayCount, setScriptsTodayCount] = useState(null)
  const navigate = useNavigate()
  const { user } = useAuth()

  useEffect(() => {
    if (!user?.email || UNLIMITED_USERS.includes(user.email)) return
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    supabase
      .from('documentos')
      .select('id', { count: 'exact', head: true })
      .eq('tab', 'scripts')
      .eq('author', user.email)
      .gte('created_at', todayStart.toISOString())
      .then(({ count }) => setScriptsTodayCount(count ?? 0))
  }, [user?.email])

  const hasSubtabs = TABS_WITH_SUBTABS.includes(activeTab)
  const currentSubtab = hasSubtabs ? activeSubtab : null

  useEffect(() => {
    fetchDocs(activeTab, currentSubtab)
  }, [activeTab, currentSubtab])

  const fetchDocs = async (tab, subtab) => {
    setLoading(true)
    try {
      let query = supabase.from('documentos').select('*').eq('tab', tab)
      if (subtab) query = query.eq('subtab', subtab)
      const { data, error } = await query.order('created_at', { ascending: false })
      if (error) throw error
      setDocs(data || [])
    } catch (e) {
      console.error(e)
      setDocs([])
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (docId) => {
    const { error } = await supabase.from('documentos').delete().eq('id', docId)
    if (error) {
      setToast({ message: 'Error al eliminar el documento', type: 'error' })
      return
    }
    setToast({ message: '✓ Documento eliminado', type: 'success' })
    fetchDocs(activeTab, currentSubtab)
  }

  const handleUpload = async (payload) => {
    const { error } = await supabase.from('documentos').insert({
      title: payload.title,
      descripcion: payload.desc,
      tab: payload.tab,
      subtab: payload.subtab || null,
      tags: payload.tags,
      status: payload.status,
      content: payload.content,
      author: user?.email,
      linea_negocio: payload.linea_negocio || null,
      responsable: payload.responsable || null,
      frecuencia: payload.frecuencia || null,
      criticidad: payload.criticidad || null,
      version: 1,
      version_history: []
    })
    if (error) throw new Error('Error al subir')
    setToast({ message: '✓ Documento publicado correctamente', type: 'success' })
    fetchDocs(activeTab, currentSubtab)
  }

  const filtered = docs.filter(d =>
    !search || d.title.toLowerCase().includes(search.toLowerCase()) ||
    d.descripcion?.toLowerCase().includes(search.toLowerCase()) ||
    d.tags?.some(t => t.toLowerCase().includes(search.toLowerCase()))
  )

  const activeSubtabLabel = AREA_SUBTABS.find(s => s.value === activeSubtab)?.label

  return (
    <div style={{ minHeight: '100vh' }}>
      {/* Tabs principales */}
      <div style={{ background: 'var(--vs-navy-light)', display: 'flex', gap: '4px', padding: '0 28px' }}>
        {TABS.map(t => (
          <button
            key={t.value}
            onClick={() => { setActiveTab(t.value); setSearch('') }}
            style={{
              fontFamily: 'var(--vs-font-body)', fontSize: '13px', fontWeight: 600,
              color: activeTab === t.value ? 'var(--vs-white)' : 'rgba(255,255,255,0.5)',
              padding: '12px 18px', border: 'none', background: 'none', cursor: 'pointer',
              borderBottom: activeTab === t.value ? '3px solid var(--vs-pink)' : '3px solid transparent',
              transition: 'color 0.2s'
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Subtabs de área */}
      {hasSubtabs && (
        <div style={{ background: 'var(--vs-white)', borderBottom: '1px solid #E8EBF4', display: 'flex', gap: '2px', padding: '0 28px' }}>
          {AREA_SUBTABS.map(s => (
            <button
              key={s.value}
              onClick={() => { setActiveSubtab(s.value); setSearch('') }}
              style={{
                fontFamily: 'var(--vs-font-body)', fontSize: '12px', fontWeight: 600,
                color: activeSubtab === s.value ? ACCENT_COLOR[s.value] : 'var(--vs-gray-mid)',
                padding: '10px 16px', border: 'none', background: 'none', cursor: 'pointer',
                borderBottom: activeSubtab === s.value ? `2px solid ${ACCENT_COLOR[s.value]}` : '2px solid transparent',
                transition: 'color 0.2s'
              }}
            >
              {s.label}
            </button>
          ))}
        </div>
      )}

      <div style={{ padding: '28px' }}>

        {/* ─── TAB: PROCESOS ─── */}
        {activeTab === 'procesos' ? (
          <>
            <ProcesoAnalizar onUpload={handleUpload} />

            <div style={{ margin: '40px 0 20px', borderTop: '1px solid #E8EBF4', paddingTop: '32px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div>
                  <div style={{ fontFamily: 'var(--vs-font-title)', fontSize: '17px', fontWeight: 700, color: 'var(--vs-navy)', marginBottom: '4px' }}>
                    Mejoras documentadas
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--vs-gray-mid)' }}>
                    Documentos de análisis y mejora de procesos generados con IA.
                  </div>
                </div>
                <button className="btn-secondary" onClick={() => setShowModal(true)}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="17 8 12 3 7 8"/>
                    <line x1="12" y1="3" x2="12" y2="15"/>
                  </svg>
                  Subir .md manualmente
                </button>
              </div>

              {loading ? (
                <div style={{ textAlign: 'center', padding: '32px', color: 'var(--vs-gray-mid)', fontSize: '13px' }}>
                  Cargando documentos...
                </div>
              ) : docs.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px', background: 'var(--vs-navy-subtle)', borderRadius: 'var(--vs-radius-lg)', border: '1px dashed #D0D5E8' }}>
                  <div style={{ fontSize: '13px', color: 'var(--vs-navy-muted)', fontWeight: 600, marginBottom: '4px' }}>Sin documentos aún</div>
                  <div style={{ fontSize: '12px', color: 'var(--vs-gray-mid)' }}>Completá el formulario de arriba y publicá el análisis generado por Claude.</div>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px' }}>
                  {docs.map(doc => (
                    <DocCard key={doc.id} doc={doc} colorKey="procesos" onClick={() => navigate(`/doc/${doc.id}`)} onDelete={handleDelete} />
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (

        /* ─── TABS: PROYECTOS / SCRIPTS ─── */
        <>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <div style={{ fontFamily: 'var(--vs-font-title)', fontSize: '20px', fontWeight: 700, color: 'var(--vs-navy)' }}>
              {TABS.find(t => t.value === activeTab)?.label}
              {hasSubtabs && (
                <>
                  <span style={{ fontSize: '20px', fontWeight: 400, color: 'var(--vs-gray-mid)', margin: '0 8px' }}>›</span>
                  <span style={{ color: ACCENT_COLOR[activeSubtab] }}>{activeSubtabLabel}</span>
                </>
              )}
              <span style={{ fontSize: '13px', fontWeight: 400, color: 'var(--vs-gray-mid)', marginLeft: '10px' }}>
                {filtered.length} {filtered.length === 1 ? 'documento' : 'documentos'}
              </span>
            </div>

            {/* Botón diferente según tab */}
            {activeTab === 'scripts' ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '5px' }}>
                <button
                  className="btn-primary"
                  onClick={() => setShowModal(true)}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--vs-success)', borderColor: 'var(--vs-success)' }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 3l1.88 5.47L19 10l-5.12 1.53L12 17l-1.88-5.47L5 10l5.12-1.53z"/>
                  </svg>
                  Documentar script con IA
                </button>
                {scriptsTodayCount !== null && (
                  <span style={{
                    fontSize: '11px', fontWeight: 600,
                    color: scriptsTodayCount >= DAILY_LIMIT ? '#DC2626'
                      : scriptsTodayCount >= DAILY_LIMIT - 1 ? '#D97706'
                      : 'var(--vs-gray-mid)'
                  }}>
                    {scriptsTodayCount >= DAILY_LIMIT
                      ? '⛔ Límite diario alcanzado'
                      : `${scriptsTodayCount}/${DAILY_LIMIT} generaciones usadas hoy`
                    }
                  </span>
                )}
              </div>
            ) : (
              <button className="btn-primary" onClick={() => setShowModal(true)}
                style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="17 8 12 3 7 8"/>
                  <line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
                Subir documento
              </button>
            )}
          </div>

          {/* Banner informativo para Scripts */}
          {activeTab === 'scripts' && (
            <div style={{
              background: '#F1FBF4', border: '1px solid #86EFAC',
              borderRadius: 'var(--vs-radius-lg)', padding: '14px 18px',
              marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px'
            }}>
              <div style={{
                width: '36px', height: '36px', borderRadius: 'var(--vs-radius-md)',
                background: '#DCFCE7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
              }}>
                <ScriptIcon />
              </div>
              <div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#15803D', marginBottom: '2px' }}>
                  Documentación automática con Claude
                </div>
                <div style={{ fontSize: '12px', color: '#166534', lineHeight: 1.5 }}>
                  Pegá tu script (.py, .js, .sql, .sh...) y Claude genera la documentación técnica completa en segundos.
                </div>
              </div>
            </div>
          )}

          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por título, descripción o tecnología..."
            style={{ borderRadius: 'var(--vs-radius-pill)', marginBottom: '20px' }}
          />

          {loading ? (
            <div style={{ textAlign: 'center', padding: '48px', color: 'var(--vs-gray-mid)', fontSize: '13px' }}>
              Cargando documentos...
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px' }}>
              <div style={{ fontFamily: 'var(--vs-font-title)', fontSize: '16px', color: 'var(--vs-navy-muted)', marginBottom: '6px' }}>
                {search ? 'Sin resultados para esa búsqueda' : 'Sin documentos aún'}
              </div>
              <div style={{ fontSize: '13px', color: 'var(--vs-gray-mid)' }}>
                {!search && activeTab === 'scripts'
                  ? 'Hacé clic en "Documentar script con IA" para comenzar'
                  : !search ? 'Subí el primero con el botón "Subir documento"' : ''}
              </div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px' }}>
              {filtered.map(doc => {
                const colorKey = doc.subtab || doc.tab || activeTab
                return (
                  <DocCard
                    key={doc.id}
                    doc={doc}
                    colorKey={colorKey}
                    isScript={activeTab === 'scripts'}
                    onClick={() => navigate(`/doc/${doc.id}`)}
                    onDelete={handleDelete}
                  />
                )
              })}
            </div>
          )}
        </>
        )}
      </div>

      {/* Modales */}
      {showModal && activeTab === 'scripts' && (
        <ScriptUploadModal
          defaultSubtab={currentSubtab}
          onClose={() => setShowModal(false)}
          onUpload={handleUpload}
        />
      )}

      {showModal && activeTab !== 'scripts' && (
        <UploadModal
          defaultTab={activeTab}
          defaultSubtab={currentSubtab}
          onClose={() => setShowModal(false)}
          onUpload={handleUpload}
        />
      )}

      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
    </div>
  )
}

function DocCard({ doc, colorKey, isScript = false, onClick, onDelete }) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const handleDeleteClick = async (e) => {
    e.stopPropagation()
    if (!confirmDelete) { setConfirmDelete(true); return }
    setDeleting(true)
    await onDelete(doc.id)
  }

  const handleCancelDelete = (e) => {
    e.stopPropagation()
    setConfirmDelete(false)
  }

  return (
    <div
      onClick={onClick}
      style={{
        background: 'var(--vs-white)', borderRadius: 'var(--vs-radius-lg)',
        border: confirmDelete ? '1px solid #FCA5A5' : '0.5px solid #D0D5E8',
        padding: '20px', boxShadow: 'var(--vs-shadow-sm)', cursor: 'pointer',
        transition: 'box-shadow 0.2s, transform 0.15s, border-color 0.2s',
        position: 'relative', overflow: 'hidden'
      }}
      onMouseEnter={e => { if (!confirmDelete) { e.currentTarget.style.boxShadow = 'var(--vs-shadow-md)'; e.currentTarget.style.transform = 'translateY(-2px)' } }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = 'var(--vs-shadow-sm)'; e.currentTarget.style.transform = 'translateY(0)' }}
    >
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: confirmDelete ? '#FCA5A5' : (ACCENT_COLOR[colorKey] || ACCENT_COLOR.proyectos) }} />

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '10px' }}>
        <div style={{
          width: '36px', height: '36px', borderRadius: 'var(--vs-radius-md)',
          background: ICON_BG[colorKey] || ICON_BG.proyectos,
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          {isScript
            ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--vs-success)" strokeWidth="1.5"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
            : <DocIcon colorKey={colorKey} />
          }
        </div>
        <span style={{
          fontSize: '10px', fontWeight: 600, padding: '3px 9px',
          borderRadius: 'var(--vs-radius-pill)',
          ...STATUS_STYLE[doc.status || 'active']
        }}>
          {STATUS_LABEL[doc.status || 'active']}
        </span>
      </div>

      <div style={{ fontFamily: 'var(--vs-font-title)', fontSize: '15px', fontWeight: 700, color: 'var(--vs-navy)', marginBottom: '6px' }}>
        {doc.title}
      </div>
      <div style={{ fontSize: '12px', color: 'var(--vs-gray-mid)', lineHeight: 1.6, marginBottom: '14px' }}>
        {doc.descripcion}
      </div>

      {doc.tags?.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginBottom: '14px' }}>
          {doc.tags.map(tag => (
            <span key={tag} style={{
              fontSize: '10px', fontWeight: 600, padding: '2px 8px',
              borderRadius: 'var(--vs-radius-pill)',
              background: 'var(--vs-navy-subtle)', color: 'var(--vs-navy-muted)'
            }}>
              {tag}
            </span>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '0.5px solid #EEF1F8', paddingTop: '12px' }}>
        <span style={{
          fontSize: '11px', fontWeight: 600, padding: '3px 10px',
          borderRadius: 'var(--vs-radius-pill)',
          background: 'var(--vs-navy-subtle)', color: 'var(--vs-navy)'
        }}>
          {doc.author?.split('@')[0] || 'Equipo'}
        </span>

        {confirmDelete ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }} onClick={e => e.stopPropagation()}>
            <span style={{ fontSize: '11px', fontWeight: 600, color: '#DC2626' }}>¿Eliminar?</span>
            <button
              onClick={handleDeleteClick}
              disabled={deleting}
              style={{
                fontSize: '11px', fontWeight: 700, padding: '3px 10px',
                borderRadius: 'var(--vs-radius-pill)', border: 'none',
                background: '#DC2626', color: 'white', cursor: 'pointer',
                opacity: deleting ? 0.6 : 1
              }}
            >
              {deleting ? '...' : 'Sí'}
            </button>
            <button
              onClick={handleCancelDelete}
              style={{
                fontSize: '11px', fontWeight: 600, padding: '3px 8px',
                borderRadius: 'var(--vs-radius-pill)', border: '1px solid #D0D5E8',
                background: 'white', color: 'var(--vs-gray-mid)', cursor: 'pointer'
              }}
            >
              No
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '11px', color: 'var(--vs-gray-mid)' }}>
              {doc.created_at ? new Date(doc.created_at).toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
            </span>
            <button
              onClick={handleDeleteClick}
              title="Eliminar documento"
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--vs-gray-mid)', padding: '2px', display: 'flex',
                borderRadius: 'var(--vs-radius-sm)',
                transition: 'color 0.15s'
              }}
              onMouseEnter={e => e.currentTarget.style.color = '#DC2626'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--vs-gray-mid)'}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                <path d="M10 11v6M14 11v6"/>
                <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
