import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import UploadModal from '../components/UploadModal'
import Toast from '../components/Toast'
import { supabase } from '../supabase'

const STATUS_LABEL = { active: 'Activo', dev: 'En desarrollo', archived: 'Archivado' }
const STATUS_STYLE = {
  active: { background: '#E8F5E9', color: '#1B6B3A' },
  dev: { background: '#FFF8E1', color: '#9A6700' },
  archived: { background: 'var(--vs-gray-light)', color: 'var(--vs-gray-mid)' }
}

export default function DocDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [doc, setDoc] = useState(null)
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(true)
  const [showEdit, setShowEdit] = useState(false)
  const [toast, setToast] = useState(null)

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
        </div>

        <div style={{ fontFamily: 'var(--vs-font-title)', fontSize: '24px', fontWeight: 700, color: 'var(--vs-navy)', marginBottom: '8px' }}>
          {doc.title}
        </div>
        <div style={{ fontSize: '13px', color: 'var(--vs-gray-mid)', marginBottom: '16px', lineHeight: 1.6 }}>
          {doc.descripcion}
        </div>

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

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '0.5px solid #EEF1F8', paddingTop: '12px' }}>
          <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: 'var(--vs-gray-mid)' }}>
            <span>Subido por <strong style={{ color: 'var(--vs-navy)' }}>{doc.author?.split('@')[0] || 'Equipo'}</strong></span>
            {doc.created_at && (
              <span>{new Date(doc.created_at).toLocaleDateString('es-CL', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
            )}
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn-secondary" onClick={() => setShowEdit(true)} style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', padding: '6px 14px' }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
              Editar
            </button>
            {content && (
              <button className="btn-secondary" onClick={handleDownloadMd} style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', padding: '6px 14px' }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="7 10 12 15 17 10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                .md
              </button>
            )}
            {content && (
              <button className="btn-primary" onClick={handleDownloadPdf} style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', padding: '6px 14px' }}>
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

      {showEdit && (
        <UploadModal
          editDoc={doc}
          onClose={() => setShowEdit(false)}
          onUpload={handleEdit}
        />
      )}

      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
    </div>
  )
}
