import { useState } from 'react'
import { generateProcessDocs } from '../services/claudeApi'

const AREAS = ['CCO', 'Mejora continua', 'Personas', 'Finanzas']
const FRECUENCIAS = ['Diario', 'Semanal', 'Mensual', 'Bajo demanda']

const labelStyle = {
  fontSize: '12px', fontWeight: 600, color: 'var(--vs-gray-dark)',
  display: 'block', marginBottom: '6px'
}

export default function ProcesoAnalizar({ onUpload }) {
  const [form, setForm] = useState({
    nombre: '', area: '', frecuencia: '', responsable: '',
    herramientas: '', descripcion: '', problema: ''
  })
  const [state, setState] = useState('form') // 'form' | 'generating' | 'preview'
  const [generatedMd, setGeneratedMd] = useState('')
  const [usage, setUsage] = useState(null)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const set = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }))
  const canGenerate = form.nombre.trim() && form.descripcion.trim()

  const handleGenerate = async () => {
    if (!canGenerate) return
    setError('')
    setState('generating')
    try {
      const { text, usage } = await generateProcessDocs(form)
      setGeneratedMd(text)
      setUsage(usage)
      setState('preview')
    } catch (e) {
      setError(e.message || 'Error al generar. Revisá tu conexión e intentá nuevamente.')
      setState('form')
    }
  }

  const handlePublish = async () => {
    setSaving(true)
    setError('')
    try {
      const filename = `${form.nombre.trim().replace(/\s+/g, '_')}.md`
      await onUpload({
        title: form.nombre.trim(),
        desc: `Análisis del proceso: ${form.nombre}${form.area ? ` — ${form.area}` : ''}`,
        tab: 'procesos',
        subtab: null,
        tags: [],
        status: 'active',
        content: generatedMd,
        filename
      })
      // Reset form
      setForm({ nombre: '', area: '', frecuencia: '', responsable: '', herramientas: '', descripcion: '', problema: '' })
      setGeneratedMd('')
      setState('form')
    } catch (e) {
      setError('Error al publicar. Intentá nuevamente.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ maxWidth: '720px' }}>

      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ fontFamily: 'var(--vs-font-title)', fontSize: '20px', fontWeight: 700, color: 'var(--vs-navy)', marginBottom: '6px' }}>
          Documentar proceso con IA
        </div>
        <div style={{ fontSize: '13px', color: 'var(--vs-gray-mid)', lineHeight: 1.6 }}>
          Completá el formulario y Claude genera el análisis completo del proceso. Podés editarlo antes de publicarlo.
        </div>
      </div>

      {/* ESTADO: FORMULARIO */}
      {state === 'form' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          <div>
            <label style={labelStyle}>Nombre del proceso *</label>
            <input value={form.nombre} onChange={set('nombre')} placeholder="Ej: Cierre de caja diario" />
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Área o departamento</label>
              <select value={form.area} onChange={set('area')}>
                <option value="">Seleccionar...</option>
                {AREAS.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Frecuencia</label>
              <select value={form.frecuencia} onChange={set('frecuencia')}>
                <option value="">Seleccionar...</option>
                {FRECUENCIAS.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>¿Quién es responsable?</label>
              <input value={form.responsable} onChange={set('responsable')} placeholder="Ej: Equipo de administración" />
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>¿Qué herramientas usan?</label>
              <input value={form.herramientas} onChange={set('herramientas')} placeholder="Ej: WhatsApp, Google Sheets, Script" />
            </div>
          </div>

          <div>
            <label style={labelStyle}>¿Cómo funciona el proceso hoy? *</label>
            <textarea
              value={form.descripcion}
              onChange={set('descripcion')}
              placeholder="Describí paso a paso cómo se hace actualmente, quiénes participan y qué pasa con la información..."
              style={{ minHeight: '110px', resize: 'vertical' }}
            />
          </div>

          <div>
            <label style={labelStyle}>
              ¿Qué no está funcionando bien?{' '}
              <span style={{ fontWeight: 400, color: 'var(--vs-gray-mid)' }}>(opcional)</span>
            </label>
            <textarea
              value={form.problema}
              onChange={set('problema')}
              placeholder="Ej: Hay inconsistencias entre la información que recibimos y los pagos reales..."
              style={{ minHeight: '80px', resize: 'vertical' }}
            />
          </div>

          {error && (
            <div style={{
              background: '#FEF2F2', border: '1px solid #FCA5A5',
              borderRadius: 'var(--vs-radius-md)', padding: '10px 14px',
              fontSize: '12px', color: '#DC2626'
            }}>
              {error}
            </div>
          )}

          <div>
            <button
              className="btn-primary"
              onClick={handleGenerate}
              disabled={!canGenerate}
              style={{
                opacity: !canGenerate ? 0.5 : 1,
                display: 'inline-flex', alignItems: 'center', gap: '8px',
                background: 'var(--vs-pink)', borderColor: 'var(--vs-pink)'
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 3l1.88 5.47L19 10l-5.12 1.53L12 17l-1.88-5.47L5 10l5.12-1.53z"/>
              </svg>
              Generar análisis con Claude
            </button>
          </div>
        </div>
      )}

      {/* ESTADO: GENERANDO */}
      {state === 'generating' && (
        <div style={{ textAlign: 'center', padding: '48px 20px' }}>
          <div style={{
            width: '56px', height: '56px', borderRadius: '50%',
            background: 'var(--vs-pink-subtle)', margin: '0 auto 16px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            animation: 'pulse 1.5s ease-in-out infinite'
          }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="var(--vs-pink)" strokeWidth="1.5">
              <path d="M12 3l1.88 5.47L19 10l-5.12 1.53L12 17l-1.88-5.47L5 10l5.12-1.53z"/>
            </svg>
          </div>
          <div style={{ fontFamily: 'var(--vs-font-title)', fontSize: '17px', fontWeight: 700, color: 'var(--vs-navy)', marginBottom: '8px' }}>
            Claude está analizando el proceso...
          </div>
          <div style={{ fontSize: '13px', color: 'var(--vs-gray-mid)', lineHeight: 1.6 }}>
            Esto puede tomar entre 15 y 40 segundos.<br />
            Claude genera el análisis completo con KPIs y oportunidades de mejora.
          </div>
          <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', marginTop: '24px' }}>
            {[0, 1, 2].map(i => (
              <div key={i} style={{
                width: '8px', height: '8px', borderRadius: '50%',
                background: 'var(--vs-pink)', opacity: 0.3,
                animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite`
              }} />
            ))}
          </div>
          <style>{`
            @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
            @keyframes bounce { 0%,80%,100%{transform:translateY(0);opacity:0.3} 40%{transform:translateY(-6px);opacity:1} }
          `}</style>
        </div>
      )}

      {/* ESTADO: PREVIEW */}
      {state === 'preview' && (
        <div>
          <div style={{
            background: '#F1FBF4', border: '1px solid #86EFAC',
            borderRadius: 'var(--vs-radius-md)', padding: '10px 14px',
            fontSize: '12px', color: '#15803D', marginBottom: '12px',
            display: 'flex', alignItems: 'center', gap: '8px'
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            Análisis generado para <strong>{form.nombre}</strong>. Revisá el contenido y publicalo.
          </div>

          {usage && (
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
              {[
                { label: 'Entrada', value: usage.input_tokens.toLocaleString(), sub: 'tokens' },
                { label: 'Salida', value: usage.output_tokens.toLocaleString(), sub: 'tokens' },
                { label: 'Total', value: usage.total.toLocaleString(), sub: 'tokens' },
                { label: 'Costo', value: `$${usage.costUSD.toFixed(4)}`, sub: 'USD' },
              ].map(item => (
                <div key={item.label} style={{
                  flex: 1, background: 'var(--vs-navy-subtle)',
                  borderRadius: 'var(--vs-radius-md)', padding: '8px 10px', textAlign: 'center'
                }}>
                  <div style={{ fontSize: '10px', color: 'var(--vs-gray-mid)', fontWeight: 600, marginBottom: '2px' }}>{item.label}</div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--vs-navy)' }}>{item.value}</div>
                  <div style={{ fontSize: '10px', color: 'var(--vs-gray-mid)' }}>{item.sub}</div>
                </div>
              ))}
            </div>
          )}

          <div style={{ marginBottom: '14px' }}>
            <label style={labelStyle}>Contenido generado (editable)</label>
            <textarea
              value={generatedMd}
              onChange={e => setGeneratedMd(e.target.value)}
              style={{
                width: '100%', minHeight: '360px', resize: 'vertical',
                fontFamily: 'monospace', fontSize: '12px', lineHeight: 1.65,
                background: '#F8F9FC', border: '1px solid #D0D5E8',
                borderRadius: 'var(--vs-radius-md)', padding: '14px',
                color: 'var(--vs-navy)', boxSizing: 'border-box'
              }}
            />
          </div>

          {error && (
            <div style={{
              background: '#FEF2F2', border: '1px solid #FCA5A5',
              borderRadius: 'var(--vs-radius-md)', padding: '10px 14px',
              fontSize: '12px', color: '#DC2626', marginBottom: '12px'
            }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              className="btn-secondary"
              onClick={() => setState('form')}
              disabled={saving}
            >
              Volver al formulario
            </button>
            <button
              className="btn-secondary"
              onClick={handleGenerate}
              disabled={saving}
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 3l1.88 5.47L19 10l-5.12 1.53L12 17l-1.88-5.47L5 10l5.12-1.53z"/>
              </svg>
              Regenerar
            </button>
            <button
              className="btn-primary"
              onClick={handlePublish}
              disabled={saving || !generatedMd.trim()}
              style={{
                opacity: (!generatedMd.trim() || saving) ? 0.5 : 1,
                background: 'var(--vs-pink)', borderColor: 'var(--vs-pink)',
                display: 'flex', alignItems: 'center', gap: '8px'
              }}
            >
              {saving ? 'Publicando...' : (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="17 8 12 3 7 8"/>
                    <line x1="12" y1="3" x2="12" y2="15"/>
                  </svg>
                  Publicar análisis
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
