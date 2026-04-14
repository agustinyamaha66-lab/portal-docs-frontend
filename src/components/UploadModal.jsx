import { useState } from 'react'

const AREA_SUBTABS = [
  { value: 'cco', label: 'CCO' },
  { value: 'mejora_continua', label: 'Mejora continua' },
  { value: 'personas', label: 'Personas' },
  { value: 'finanzas', label: 'Finanzas' }
]

const TABS_WITH_SUBTABS = ['proyectos', 'scripts']

export default function UploadModal({ defaultTab, defaultSubtab, onClose, onUpload, editDoc }) {
  const [title, setTitle] = useState(editDoc?.title || '')
  const [desc, setDesc] = useState(editDoc?.descripcion || editDoc?.desc || '')
  const [tab, setTab] = useState(editDoc?.tab || defaultTab || 'proyectos')
  const [subtab, setSubtab] = useState(editDoc?.subtab || defaultSubtab || 'cco')
  const [status, setStatus] = useState(editDoc?.status || 'active')
  const [file, setFile] = useState(null)
  const [pasteContent, setPasteContent] = useState('')
  const [inputMode, setInputMode] = useState('file') // 'file' | 'paste'
  const [loading, setLoading] = useState(false)
  const isEdit = !!editDoc

  const showSubtab = TABS_WITH_SUBTABS.includes(tab)

  const handleFile = (e) => {
    const f = e.target.files[0]
    if (f && f.name.endsWith('.md')) setFile(f)
    else alert('Solo se aceptan archivos .md')
  }

  const hasContent = inputMode === 'file' ? !!file : !!pasteContent.trim()

  const handleSubmit = async () => {
    if (!title.trim() || !desc.trim() || (!isEdit && !hasContent)) return
    setLoading(true)
    try {
      let content = null
      let filename = null
      if (inputMode === 'file' && file) {
        content = await file.text()
        filename = file.name
      } else if (inputMode === 'paste' && pasteContent.trim()) {
        content = pasteContent
        filename = `${title.trim().replace(/\s+/g, '_')}.md`
      }
      await onUpload({ title, desc, tab, subtab: showSubtab ? subtab : null, tags: [], status, content, filename })
      onClose()
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(11,28,73,0.5)',
      zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{
        background: 'var(--vs-white)', borderRadius: 'var(--vs-radius-lg)',
        padding: '28px', width: '100%', maxWidth: '500px',
        maxHeight: '90vh', overflowY: 'auto'
      }}>
        <div style={{
          fontFamily: 'var(--vs-font-title)', fontSize: '18px',
          fontWeight: 700, color: 'var(--vs-navy)', marginBottom: '20px'
        }}>
          {isEdit ? 'Editar documento' : 'Subir nuevo documento'}
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--vs-gray-dark)', display: 'block', marginBottom: '6px' }}>
            Título *
          </label>
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Ej: Nombre del proyecto" />
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--vs-gray-dark)', display: 'block', marginBottom: '6px' }}>
            Descripción breve *
          </label>
          <textarea
            value={desc} onChange={e => setDesc(e.target.value)}
            placeholder="¿Qué cubre este documento? ¿Para quién es útil?"
            style={{ minHeight: '72px', resize: 'vertical' }}
          />
        </div>

        <div style={{ marginBottom: '16px', display: 'flex', gap: '10px' }}>
          {tab !== 'procesos' && (
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--vs-gray-dark)', display: 'block', marginBottom: '6px' }}>
                Sección
              </label>
              <select value={tab} onChange={e => setTab(e.target.value)}>
                <option value="proyectos">Proyectos</option>
              </select>
            </div>
          )}

          {tab === 'procesos' && (
            <div style={{ flex: 1 }}>
              <div style={{
                padding: '8px 12px', borderRadius: 'var(--vs-radius-md)',
                background: 'var(--vs-pink-subtle)', border: '1px solid #F8BBD9',
                fontSize: '12px', fontWeight: 600, color: 'var(--vs-pink)',
                display: 'flex', alignItems: 'center', gap: '6px'
              }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                </svg>
                Se guardará en Procesos
              </div>
            </div>
          )}

          {showSubtab && (
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--vs-gray-dark)', display: 'block', marginBottom: '6px' }}>
                Área
              </label>
              <select value={subtab} onChange={e => setSubtab(e.target.value)}>
                {AREA_SUBTABS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
          )}
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--vs-gray-dark)', display: 'block', marginBottom: '6px' }}>
            Estado
          </label>
          <select value={status} onChange={e => setStatus(e.target.value)}>
            <option value="active">Activo</option>
            <option value="inactive">Inactivo</option>
            <option value="dev">En desarrollo</option>
          </select>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--vs-gray-dark)' }}>
              Contenido {!isEdit && '*'}
            </label>
            <div style={{ display: 'flex', background: 'var(--vs-navy-subtle)', borderRadius: 'var(--vs-radius-pill)', padding: '2px' }}>
              {['file', 'paste'].map(mode => (
                <button
                  key={mode}
                  onClick={() => setInputMode(mode)}
                  style={{
                    fontSize: '11px', fontWeight: 600, padding: '3px 12px',
                    borderRadius: 'var(--vs-radius-pill)', border: 'none', cursor: 'pointer',
                    background: inputMode === mode ? 'var(--vs-navy)' : 'transparent',
                    color: inputMode === mode ? 'var(--vs-white)' : 'var(--vs-navy-muted)',
                    transition: 'all 0.15s'
                  }}
                >
                  {mode === 'file' ? 'Subir archivo' : 'Pegar texto'}
                </button>
              ))}
            </div>
          </div>

          {inputMode === 'file' ? (
            <label style={{
              display: 'block', border: '1.5px dashed #D0D5E8',
              borderRadius: 'var(--vs-radius-md)', padding: '24px',
              textAlign: 'center', cursor: 'pointer',
              background: file ? 'var(--vs-navy-subtle)' : 'transparent'
            }}>
              <input type="file" accept=".md" onChange={handleFile} style={{ display: 'none' }} />
              <div style={{ fontSize: '13px', color: file ? 'var(--vs-navy)' : 'var(--vs-gray-mid)' }}>
                {file ? `✓ ${file.name}` : isEdit
                  ? <>Haz clic para <strong style={{ color: 'var(--vs-pink)' }}>reemplazar</strong> el archivo .md (opcional)</>
                  : <>Haz clic para seleccionar tu archivo <strong style={{ color: 'var(--vs-pink)' }}>.md</strong></>}
              </div>
            </label>
          ) : (
            <textarea
              value={pasteContent}
              onChange={e => setPasteContent(e.target.value)}
              placeholder="Pegá acá el contenido Markdown generado por la IA..."
              style={{ minHeight: '160px', resize: 'vertical', fontFamily: 'monospace', fontSize: '12px' }}
            />
          )}
        </div>

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button className="btn-secondary" onClick={onClose} disabled={loading}>Cancelar</button>
          <button
            className="btn-primary"
            onClick={handleSubmit}
            disabled={loading || !title || !desc || (!isEdit && !hasContent)}
            style={{ opacity: (!title || !desc || (!isEdit && !hasContent)) ? 0.5 : 1 }}
          >
            {loading ? (isEdit ? 'Guardando...' : 'Publicando...') : (isEdit ? 'Guardar cambios' : 'Publicar documento')}
          </button>
        </div>
      </div>
    </div>
  )
}
