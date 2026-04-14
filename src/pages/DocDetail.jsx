import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import UploadModal from '../components/UploadModal'
import UpdateDocModal from '../components/UpdateDocModal'
import Toast from '../components/Toast'
import { supabase } from '../supabase'

const STATUS_LABEL = { active: 'Activo', dev: 'En desarrollo', archived: 'Archivado' }
const STATUS_STYLE = {
  active: { background: '#E8F5E9', color: '#1B6B3A' },
  dev: { background: '#FFF8E1', color: '#9A6700' },
  archived: { background: 'var(--vs-gray-light)', color: 'var(--vs-gray-mid)' }
}

const CRITICIDAD_STYLE = {
  Alta: { background: '#FEF2F2', color: '#DC2626' },
  Media: { background: '#FFFBEB', color: '#D97706' },
  Baja: { background: '#F0FDF4', color: '#16A34A' },
}

const FRECUENCIA_LABEL = {
  '3+/dia': '3+ / día',
  'diario': 'Diario',
  'semanal': 'Semanal',
  'ondemand': 'On demand',
  'triggers': 'Triggers',
}

export default function DocDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [doc, setDoc] = useState(null)
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(true)
  const [showEdit, setShowEdit] = useState(false)
  const [showUpdate, setShowUpdate] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [toast, setToast] = useState(null)
  const [activeFileIdx, setActiveFileIdx] = useState(0)

  useEffect(() => {
    const load = async () => {
      try {
        const { data, error } = await supabase
          .from('documentos')
          .select('*')
          .eq('id', id)
          .single()
        if (error) throw error
        setDoc(data)
        if (data.content) setContent(data.content)
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  const handleDownloadMd = () => {
    const blob = new Blob([content], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${doc.title}.md`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleDownloadPdf = async () => {
    const element = document.querySelector('.md-content')
    if (!element) return
    const { default: html2canvas } = await import('html2canvas')
    const jspdfModule = await import('jspdf')
    const jsPDF = jspdfModule.jsPDF || jspdfModule.default
    const canvas = await html2canvas(element, { scale: 2, useCORS: true })
    const imgData = canvas.toDataURL('image/png')
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
    const pdfWidth = pdf.internal.pageSize.getWidth()
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width
    let y = 0
    const pageHeight = pdf.internal.pageSize.getHeight()
    while (y < pdfHeight) {
      pdf.addImage(imgData, 'PNG', 0, -y, pdfWidth, pdfHeight)
      y += pageHeight
      if (y < pdfHeight) pdf.addPage()
    }
    pdf.save(`${doc.title}.pdf`)
  }

  const handleEdit = async (payload) => {
    const updates = {
      title: payload.title,
      descripcion: payload.desc,
      tab: payload.tab,
      tags: payload.tags,
      status: payload.status,
    }
    if (payload.content) updates.content = payload.content
    const { data, error } = await supabase
      .from('documentos')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    if (error) throw new Error('Error al actualizar')
    setDoc(data)
    if (payload.content) setContent(payload.content)
    setToast({ message: '✓ Documento actualizado correctamente', type: 'success' })
  }

  const handleDelete = async () => {
    setDeleting(true)
    const { error } = await supabase.from('documentos').delete().eq('id', id)
    if (error) {
      setDeleting(false)
      setToast({ message: 'Error al eliminar el documento', type: 'error' })
      return
    }
    navigate('/')
  }

  const handleVersionUpdate = async ({ content: newContent, changelog, version, version_history }) => {
    const { data, error } = await supabase
      .from('documentos')
      .update({ content: newContent, version, version_history })
      .eq('id', id)
      .select()
      .single()
    if (error) throw new Error('Error al publicar la nueva versión')
    setDoc(data)
    setContent(newContent)
    setToast({ message: `✓ Versión v${version} publicada correctamente`, type: 'success' })
  }

  if (loading) return (
    <div style={{ padding: '48px', textAlign: 'center', color: 'var(--vs-gray-mid)', fontSize: '13px' }}>
      Cargando documento...
    </div>
  )

  if (!doc) return (
    <div style={{ padding: '48px', textAlign: 'center' }}>
      <div style={{ fontFamily: 'var(--vs-font-title)', color: 'var(--vs-navy)', marginBottom: '12px' }}>Documento no encontrado</div>
      <button className="btn-secondary" onClick={() => navigate('/')}>Volver al portal</button>
    </div>
  )

  const isScript = doc.tab === 'scripts'
  const version = doc.version || 1
  const history = Array.isArray(doc.version_history) ? doc.version_history : []

  return (
    <div style={{ padding: '28px', maxWidth: '900px', margin: '0 auto' }}>
      <button
        onClick={() => navigate('/')}
        style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          background: 'none', border: 'none', cursor: 'pointer',
          fontFamily: 'var(--vs-font-body)', fontSize: '13px',
          fontWeight: 600, color: 'var(--vs-navy-muted)', marginBottom: '20px', padding: 0
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="15 18 9 12 15 6"/>
        </svg>
        Volver al portal
      </button>

      <div style={{
        background: 'var(--vs-white)', borderRadius: 'var(--vs-radius-lg)',
        border: '0.5px solid #D0D5E8', padding: '28px', marginBottom: '16px',
        position: 'relative', overflow: 'hidden'
      }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '5px', background: 'var(--vs-navy)' }} />

        {/* Badges de estado y sección */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center', marginBottom: '12px', marginTop: '4px' }}>
          <span style={{
            fontSize: '11px', fontWeight: 600, padding: '3px 10px',
            borderRadius: 'var(--vs-radius-pill)',
            background: 'var(--vs-navy-subtle)', color: 'var(--vs-navy)'
          }}>
            {doc.tab ? doc.tab.charAt(0).toUpperCase() + doc.tab.slice(1) : 'Proyecto'}
          </span>
          <span style={{
            fontSize: '10px', fontWeight: 600, padding: '3px 9px',
            borderRadius: 'var(--vs-radius-pill)',
            ...STATUS_STYLE[doc.status || 'active']
          }}>
            {STATUS_LABEL[doc.status || 'active']}
          </span>
          {/* Badge de versión */}
          <span style={{
            fontSize: '10px', fontWeight: 700, padding: '3px 9px',
            borderRadius: 'var(--vs-radius-pill)',
            background: version > 1 ? '#EEF1F8' : 'var(--vs-navy-subtle)',
            color: 'var(--vs-navy-muted)'
          }}>
            v{version}
          </span>
        </div>

        <div style={{ fontFamily: 'var(--vs-font-title)', fontSize: '24px', fontWeight: 700, color: 'var(--vs-navy)', marginBottom: '8px' }}>
          {doc.title}
        </div>
        <div style={{ fontSize: '13px', color: 'var(--vs-gray-mid)', marginBottom: '16px', lineHeight: 1.6 }}>
          {doc.descripcion}
        </div>

        {/* Metadata chips: línea de negocio, frecuencia, criticidad, responsable */}
        {(doc.linea_negocio || doc.frecuencia || doc.criticidad || doc.responsable) && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
            {doc.linea_negocio && (
              <span style={{
                fontSize: '11px', fontWeight: 600, padding: '4px 10px',
                borderRadius: 'var(--vs-radius-pill)',
                background: '#EEF1F8', color: 'var(--vs-navy)',
                display: 'flex', alignItems: 'center', gap: '5px'
              }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <rect x="2" y="7" width="20" height="14" rx="2"/>
                  <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
                </svg>
                {doc.linea_negocio}
              </span>
            )}
            {doc.frecuencia && (
              <span style={{
                fontSize: '11px', fontWeight: 600, padding: '4px 10px',
                borderRadius: 'var(--vs-radius-pill)',
                background: '#F0F4FF', color: '#3D5490',
                display: 'flex', alignItems: 'center', gap: '5px'
              }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="12 6 12 12 16 14"/>
                </svg>
                {FRECUENCIA_LABEL[doc.frecuencia] || doc.frecuencia}
              </span>
            )}
            {doc.criticidad && (
              <span style={{
                fontSize: '11px', fontWeight: 700, padding: '4px 10px',
                borderRadius: 'var(--vs-radius-pill)',
                ...(CRITICIDAD_STYLE[doc.criticidad] || { background: '#EEF1F8', color: 'var(--vs-navy)' }),
                display: 'flex', alignItems: 'center', gap: '5px'
              }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                  <line x1="12" y1="9" x2="12" y2="13"/>
                  <line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
                {doc.criticidad}
              </span>
            )}
            {doc.responsable && (
              <span style={{
                fontSize: '11px', fontWeight: 600, padding: '4px 10px',
                borderRadius: 'var(--vs-radius-pill)',
                background: '#FDF4FF', color: '#7C3AED',
                display: 'flex', alignItems: 'center', gap: '5px'
              }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
                {doc.responsable}
              </span>
            )}
          </div>
        )}

        {doc.tags?.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '16px' }}>
            {doc.tags.map(tag => (
              <span key={tag} style={{
                fontSize: '11px', fontWeight: 600, padding: '3px 10px',
                borderRadius: 'var(--vs-radius-pill)',
                background: 'var(--vs-navy-subtle)', color: 'var(--vs-navy-muted)'
              }}>
                {tag}
              </span>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '0.5px solid #EEF1F8', paddingTop: '12px', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: 'var(--vs-gray-mid)' }}>
            <span>Subido por <strong style={{ color: 'var(--vs-navy)' }}>{doc.author?.split('@')[0] || 'Equipo'}</strong></span>
            {doc.created_at && (
              <span>{new Date(doc.created_at).toLocaleDateString('es-CL', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
            )}
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
            {/* Confirmación de borrado inline */}
            {confirmDelete && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                background: '#FEF2F2', border: '1px solid #FCA5A5',
                borderRadius: 'var(--vs-radius-pill)', padding: '4px 12px 4px 10px',
                fontSize: '12px', color: '#DC2626', fontWeight: 600
              }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                  <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
                ¿Eliminar definitivamente?
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  style={{
                    background: '#DC2626', color: 'white', border: 'none', cursor: 'pointer',
                    fontSize: '11px', fontWeight: 700, padding: '3px 10px',
                    borderRadius: 'var(--vs-radius-pill)', opacity: deleting ? 0.6 : 1
                  }}
                >
                  {deleting ? 'Eliminando...' : 'Sí, eliminar'}
                </button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    fontSize: '11px', fontWeight: 600, color: '#DC2626', padding: '2px 4px'
                  }}
                >
                  Cancelar
                </button>
              </div>
            )}
            {/* Botón Eliminar */}
            {!confirmDelete && (
              <button
                onClick={() => setConfirmDelete(true)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '5px',
                  fontSize: '12px', padding: '6px 14px',
                  background: 'none', border: '1px solid #FCA5A5',
                  borderRadius: 'var(--vs-radius-pill)', cursor: 'pointer',
                  color: '#DC2626', fontWeight: 600
                }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="3 6 5 6 21 6"/>
                  <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                  <path d="M10 11v6M14 11v6"/>
                  <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                </svg>
                Eliminar
              </button>
            )}

            {/* Botón Actualizar documentación (solo scripts) */}
            {isScript && content && (
              <button
                className="btn-secondary"
                onClick={() => setShowUpdate(true)}
                style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', padding: '6px 14px', borderColor: 'var(--vs-navy)', color: 'var(--vs-navy)' }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="23 4 23 10 17 10"/>
                  <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
                </svg>
                Actualizar doc
              </button>
            )}
            <button
              className="btn-secondary"
              onClick={() => setShowEdit(true)}
              style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', padding: '6px 14px' }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
              Editar
            </button>
            {content && (
              <button
                className="btn-secondary"
                onClick={handleDownloadMd}
                style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', padding: '6px 14px' }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="7 10 12 15 17 10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                .md
              </button>
            )}
            {content && (
              <button
                className="btn-primary"
                onClick={handleDownloadPdf}
                style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', padding: '6px 14px' }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                </svg>
                PDF
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Historial de versiones */}
      {history.length > 0 && (
        <div style={{
          background: 'var(--vs-white)', borderRadius: 'var(--vs-radius-lg)',
          border: '0.5px solid #D0D5E8', marginBottom: '16px', overflow: 'hidden'
        }}>
          <button
            onClick={() => setShowHistory(h => !h)}
            style={{
              width: '100%', padding: '14px 20px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              background: 'none', border: 'none', cursor: 'pointer',
              fontFamily: 'var(--vs-font-body)', fontSize: '13px', fontWeight: 600, color: 'var(--vs-navy)'
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 8 12 12 14 14"/>
              </svg>
              Historial de versiones ({history.length} versión{history.length !== 1 ? 'es' : ''} anterior{history.length !== 1 ? 'es' : ''})
            </span>
            <svg
              width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
              style={{ transform: showHistory ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}
            >
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </button>

          {showHistory && (
            <div style={{ borderTop: '0.5px solid #EEF1F8' }}>
              {[...history].reverse().map((entry, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '16px 20px',
                    borderBottom: idx < history.length - 1 ? '0.5px solid #EEF1F8' : 'none'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <span style={{
                      fontSize: '11px', fontWeight: 700, padding: '2px 8px',
                      borderRadius: 'var(--vs-radius-pill)',
                      background: 'var(--vs-navy-subtle)', color: 'var(--vs-navy-muted)'
                    }}>
                      v{entry.version}
                    </span>
                    <span style={{ fontSize: '11px', color: 'var(--vs-gray-mid)' }}>
                      {entry.updated_at ? new Date(entry.updated_at).toLocaleDateString('es-CL', {
                        day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                      }) : '—'}
                    </span>
                    {entry.author && (
                      <span style={{ fontSize: '11px', color: 'var(--vs-gray-mid)' }}>
                        · por {entry.author.split('@')[0]}
                      </span>
                    )}
                  </div>
                  {entry.changelog && (
                    <div style={{
                      fontSize: '12px', color: 'var(--vs-navy-muted)', lineHeight: 1.6,
                      background: '#FFFBEB', borderRadius: 'var(--vs-radius-md)',
                      padding: '10px 14px', border: '1px solid #FCD34D'
                    }}>
                      <div style={{ fontWeight: 600, fontSize: '11px', color: '#92400E', marginBottom: '4px' }}>CHANGELOG</div>
                      <div className="md-content" style={{ fontSize: '12px' }}>
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{entry.changelog}</ReactMarkdown>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Contenido del documento */}
      <div style={{
        background: 'var(--vs-white)', borderRadius: 'var(--vs-radius-lg)',
        border: '0.5px solid #D0D5E8', padding: '32px'
      }}>
        {content ? (
          <div className="md-content">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
          </div>
        ) : (
          <div style={{ textAlign: 'center', color: 'var(--vs-gray-mid)', fontSize: '13px', padding: '24px' }}>
            No se pudo cargar el contenido del archivo.
          </div>
        )}
      </div>

      {/* Archivos fuente (proyectos multi-archivo) */}
      {Array.isArray(doc.files) && doc.files.length > 0 && (
        <div style={{
          background: 'var(--vs-white)', borderRadius: 'var(--vs-radius-lg)',
          border: '0.5px solid #D0D5E8', marginTop: '16px', overflow: 'hidden'
        }}>
          {/* Header */}
          <div style={{
            padding: '14px 20px', borderBottom: '0.5px solid #EEF1F8',
            display: 'flex', alignItems: 'center', gap: '8px'
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--vs-success)" strokeWidth="2">
              <polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>
            </svg>
            <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--vs-navy)' }}>
              Archivos del proyecto
            </span>
            <span style={{
              fontSize: '10px', fontWeight: 600, padding: '2px 8px',
              borderRadius: 'var(--vs-radius-pill)',
              background: '#E8F5E9', color: 'var(--vs-success)'
            }}>
              {doc.files.length} archivo{doc.files.length !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Pestañas */}
          <div style={{ display: 'flex', gap: '2px', overflowX: 'auto', padding: '0 16px', borderBottom: '1.5px solid #D0D5E8', background: '#FAFBFE' }}>
            {doc.files.map((f, idx) => (
              <button
                key={idx}
                onClick={() => setActiveFileIdx(idx)}
                style={{
                  padding: '8px 14px', cursor: 'pointer', flexShrink: 0,
                  borderRadius: 'var(--vs-radius-sm) var(--vs-radius-sm) 0 0',
                  background: activeFileIdx === idx ? 'white' : 'transparent',
                  border: activeFileIdx === idx ? '1.5px solid #D0D5E8' : '1.5px solid transparent',
                  borderBottom: activeFileIdx === idx ? '1.5px solid white' : 'none',
                  marginBottom: activeFileIdx === idx ? '-1.5px' : '0',
                  fontSize: '12px', fontWeight: 600,
                  color: activeFileIdx === idx ? 'var(--vs-navy)' : 'var(--vs-gray-mid)',
                  display: 'flex', alignItems: 'center', gap: '5px',
                  transition: 'color 0.15s'
                }}
              >
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                </svg>
                {f.name}
              </button>
            ))}
          </div>

          {/* Contenido del archivo activo */}
          <div style={{ padding: '16px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <span style={{ fontSize: '11px', color: 'var(--vs-gray-mid)', fontWeight: 600 }}>
                {doc.files[activeFileIdx]?.content?.trim().split('\n').length || 0} líneas
              </span>
              <button
                onClick={() => {
                  const f = doc.files[activeFileIdx]
                  const blob = new Blob([f.content], { type: 'text/plain' })
                  const url = URL.createObjectURL(blob)
                  const a = document.createElement('a')
                  a.href = url
                  a.download = f.name
                  a.click()
                  URL.revokeObjectURL(url)
                }}
                style={{
                  fontSize: '11px', fontWeight: 600, padding: '3px 10px',
                  borderRadius: 'var(--vs-radius-pill)', border: '1px solid #D0D5E8',
                  background: 'white', color: 'var(--vs-navy-muted)', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: '4px'
                }}
              >
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="7 10 12 15 17 10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                Descargar {doc.files[activeFileIdx]?.name}
              </button>
            </div>
            <pre style={{
              margin: 0, padding: '16px', overflowX: 'auto',
              background: '#F8F9FC', borderRadius: 'var(--vs-radius-md)',
              border: '0.5px solid #D0D5E8',
              fontFamily: 'monospace', fontSize: '12px', lineHeight: 1.7,
              color: 'var(--vs-navy)', whiteSpace: 'pre'
            }}>
              {doc.files[activeFileIdx]?.content || ''}
            </pre>
          </div>
        </div>
      )}

      {showEdit && (
        <UploadModal
          editDoc={doc}
          onClose={() => setShowEdit(false)}
          onUpload={handleEdit}
        />
      )}

      {showUpdate && (
        <UpdateDocModal
          doc={doc}
          onClose={() => setShowUpdate(false)}
          onUpdate={handleVersionUpdate}
        />
      )}

      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
    </div>
  )
}
