import { useState, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { generateScriptDocs } from '../services/claudeApi'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../supabase'

const DAILY_LIMIT = 3
const UNLIMITED_USERS = ['agustin.williamson@valdishopper.com']

const AREA_SUBTABS = [
  { value: 'cco', label: 'CCO' },
  { value: 'mejora_continua', label: 'Mejora continua' },
  { value: 'personas', label: 'Personas' },
  { value: 'finanzas', label: 'Finanzas' }
]

const LINEAS_NEGOCIO = ['HD', 'CATEX', 'Nodos', 'LAT', 'Mercado Libre', 'Falabella', 'Transversal']

const FRECUENCIAS = [
  { value: '3+/dia', label: '3+ ejecuciones/día' },
  { value: 'diario', label: 'Diario' },
  { value: 'semanal', label: 'Semanal' },
  { value: 'ondemand', label: 'On demand' },
  { value: 'triggers', label: 'Triggers configurados' },
]

const CRITICIDADES = [
  { value: 'Alta', label: 'Alta', color: '#DC2626', bg: '#FEF2F2' },
  { value: 'Media', label: 'Media', color: '#D97706', bg: '#FFFBEB' },
  { value: 'Baja', label: 'Baja', color: '#16A34A', bg: '#F0FDF4' },
]

const STEPS = ['upload', 'generating', 'preview']

const labelStyle = {
  fontSize: '12px', fontWeight: 600, color: 'var(--vs-gray-dark)',
  display: 'block', marginBottom: '6px'
}

function StepIndicator({ step }) {
  const steps = [
    { key: 'upload', label: 'Subir script' },
    { key: 'generating', label: 'Generando' },
    { key: 'preview', label: 'Revisar y publicar' }
  ]
  const currentIdx = STEPS.indexOf(step)

  return (
    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '24px' }}>
      {steps.map((s, i) => (
        <div key={s.key} style={{ display: 'flex', alignItems: 'center', flex: i < steps.length - 1 ? 1 : 'none' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{
              width: '28px', height: '28px', borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '11px', fontWeight: 700,
              background: i < currentIdx ? 'var(--vs-success)' : i === currentIdx ? 'var(--vs-navy)' : 'var(--vs-navy-subtle)',
              color: i <= currentIdx ? 'white' : 'var(--vs-gray-mid)',
              transition: 'all 0.3s'
            }}>
              {i < currentIdx ? (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              ) : (i + 1)}
            </div>
            <div style={{
              fontSize: '10px', fontWeight: 600, marginTop: '4px', whiteSpace: 'nowrap',
              color: i === currentIdx ? 'var(--vs-navy)' : 'var(--vs-gray-mid)'
            }}>
              {s.label}
            </div>
          </div>
          {i < steps.length - 1 && (
            <div style={{
              flex: 1, height: '2px', margin: '0 8px', marginBottom: '18px',
              background: i < currentIdx ? 'var(--vs-success)' : '#E8EBF4',
              transition: 'background 0.3s'
            }} />
          )}
        </div>
      ))}
    </div>
  )
}

export default function ScriptUploadModal({ defaultSubtab, onClose, onUpload }) {
  const { user } = useAuth()
  const [step, setStep] = useState('upload')
  const [title, setTitle] = useState('')
  const [desc, setDesc] = useState('')
  const [subtab, setSubtab] = useState(defaultSubtab || 'cco')
  const [status, setStatus] = useState('active')
  const [scriptContent, setScriptContent] = useState('')
  const [generatedMd, setGeneratedMd] = useState('')
  const [usage, setUsage] = useState(null)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [todayCount, setTodayCount] = useState(null) // null = cargando

  // Cargar cuántos scripts subió hoy este usuario
  useEffect(() => {
    if (!user?.email) return
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    supabase
      .from('documentos')
      .select('id', { count: 'exact', head: true })
      .eq('tab', 'scripts')
      .eq('author', user.email)
      .gte('created_at', todayStart.toISOString())
      .then(({ count }) => setTodayCount(count ?? 0))
  }, [user?.email])

  // Nuevos campos
  const [lineaNegocio, setLineaNegocio] = useState('')
  const [responsable, setResponsable] = useState('')
  const [frecuencia, setFrecuencia] = useState('')
  const [criticidad, setCriticidad] = useState('')

  // Preview mode en step 3
  const [previewMode, setPreviewMode] = useState('edit')

  const checkDailyLimit = async () => {
    if (!user?.email) return false
    if (UNLIMITED_USERS.includes(user.email)) return false
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    const { count, error } = await supabase
      .from('documentos')
      .select('id', { count: 'exact', head: true })
      .eq('tab', 'scripts')
      .eq('author', user.email)
      .gte('created_at', todayStart.toISOString())
    if (error) return false // si falla la consulta, dejar pasar
    return count >= DAILY_LIMIT
  }

  const handleGenerate = async () => {
    if (!scriptContent.trim() || !title.trim() || !desc.trim()) return
    setError('')
    // Verificar límite diario antes de llamar a Claude
    const limitReached = await checkDailyLimit()
    if (limitReached) {
      setError(`Límite diario alcanzado: podés generar hasta ${DAILY_LIMIT} documentos por día. Intentá nuevamente mañana.`)
      return
    }
    setStep('generating')
    try {
      const { text, usage } = await generateScriptDocs(scriptContent)
      setGeneratedMd(text)
      setUsage(usage)
      setPreviewMode('edit')
      setStep('preview')
    } catch (e) {
      setError(e.message || 'Error al generar la documentación. Intentá nuevamente.')
      setStep('upload')
    }
  }

  const handlePublish = async () => {
    setSaving(true)
    try {
      const filename = `${title.trim().replace(/\s+/g, '_')}.md`
      await onUpload({
        title: title.trim(),
        desc: desc.trim(),
        tab: 'scripts',
        subtab,
        tags: [],
        status,
        content: generatedMd,
        filename,
        linea_negocio: lineaNegocio || null,
        responsable: responsable || null,
        frecuencia: frecuencia || null,
        criticidad: criticidad || null,
      })
      onClose()
    } catch (e) {
      setError('Error al publicar. Intentá nuevamente.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(11,28,73,0.55)',
      zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{
        background: 'var(--vs-white)', borderRadius: 'var(--vs-radius-lg)',
        padding: '28px', width: '100%',
        maxWidth: step === 'preview' ? '820px' : '540px',
        maxHeight: '92vh', overflowY: 'auto',
        transition: 'max-width 0.3s'
      }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div>
            <div style={{ fontFamily: 'var(--vs-font-title)', fontSize: '18px', fontWeight: 700, color: 'var(--vs-navy)' }}>
              Documentar script con IA
            </div>
            <div style={{ fontSize: '12px', color: 'var(--vs-gray-mid)', marginTop: '3px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              Sube tu script y Claude genera la documentación automáticamente
              {todayCount !== null && !UNLIMITED_USERS.includes(user?.email) && (
                <span style={{
                  fontSize: '11px', fontWeight: 700, padding: '2px 8px',
                  borderRadius: 'var(--vs-radius-pill)',
                  background: todayCount >= DAILY_LIMIT ? '#FEF2F2' : todayCount >= DAILY_LIMIT - 1 ? '#FFFBEB' : '#F0FDF4',
                  color: todayCount >= DAILY_LIMIT ? '#DC2626' : todayCount >= DAILY_LIMIT - 1 ? '#D97706' : '#16A34A'
                }}>
                  {todayCount >= DAILY_LIMIT
                    ? 'Límite diario alcanzado'
                    : `${DAILY_LIMIT - todayCount} generación${DAILY_LIMIT - todayCount !== 1 ? 'es' : ''} restante${DAILY_LIMIT - todayCount !== 1 ? 's' : ''} hoy`
                  }
                </span>
              )}
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--vs-gray-mid)', padding: '4px' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <StepIndicator step={step} />

        {/* STEP 1: UPLOAD */}
        {step === 'upload' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            <div>
              <label style={labelStyle}>
                Pegá tu script acá *
                <span style={{ fontWeight: 400, color: 'var(--vs-gray-mid)', marginLeft: '6px' }}>
                  (.py, .js, .sql, .sh, .go, o cualquier otro lenguaje)
                </span>
              </label>
              <textarea
                value={scriptContent}
                onChange={e => setScriptContent(e.target.value)}
                placeholder={`# Pegá el código de tu script acá\n# Funciona con Python, JavaScript, SQL, Shell, Go, Ruby, R y más...`}
                style={{
                  minHeight: '180px', resize: 'vertical',
                  fontFamily: 'monospace', fontSize: '12px', lineHeight: 1.65,
                  background: scriptContent ? '#F8F9FC' : 'transparent',
                  border: `1.5px solid ${scriptContent.trim() ? 'var(--vs-success)' : '#D0D5E8'}`,
                  borderRadius: 'var(--vs-radius-md)', padding: '14px',
                  color: 'var(--vs-navy)', boxSizing: 'border-box', width: '100%',
                  transition: 'border-color 0.2s'
                }}
              />
              {scriptContent.trim() && (
                <div style={{ fontSize: '11px', color: 'var(--vs-success)', marginTop: '5px', fontWeight: 600 }}>
                  ✓ {scriptContent.trim().split('\n').length} líneas listas para analizar
                </div>
              )}
            </div>

            <div>
              <label style={labelStyle}>Título del documento *</label>
              <input
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Ej: Script de cierre de caja"
              />
            </div>

            <div>
              <label style={labelStyle}>Descripción breve *</label>
              <textarea
                value={desc}
                onChange={e => setDesc(e.target.value)}
                placeholder="¿Qué hace este script? ¿Para qué área es útil?"
                style={{ minHeight: '70px', resize: 'vertical' }}
              />
            </div>

            {/* Fila: Área + Estado */}
            <div style={{ display: 'flex', gap: '12px' }}>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Área</label>
                <select value={subtab} onChange={e => setSubtab(e.target.value)}>
                  {AREA_SUBTABS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Estado</label>
                <select value={status} onChange={e => setStatus(e.target.value)}>
                  <option value="active">Activo</option>
                  <option value="dev">En desarrollo</option>
                  <option value="inactive">Inactivo</option>
                </select>
              </div>
            </div>

            {/* Fila: Línea de negocio + Responsable */}
            <div style={{ display: 'flex', gap: '12px' }}>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Línea de negocio</label>
                <select value={lineaNegocio} onChange={e => setLineaNegocio(e.target.value)}>
                  <option value="">Seleccionar...</option>
                  {LINEAS_NEGOCIO.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>
                  Responsable
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    value={responsable}
                    onChange={e => setResponsable(e.target.value)}
                    placeholder="Nombre y cargo"
                  />
                  {user && (
                    <button
                      type="button"
                      onClick={() => setResponsable(user.email?.split('@')[0] || '')}
                      style={{
                        position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)',
                        background: 'none', border: 'none', cursor: 'pointer',
                        fontSize: '10px', fontWeight: 600, color: 'var(--vs-navy-muted)',
                        padding: '2px 6px', borderRadius: 'var(--vs-radius-pill)',
                        background: 'var(--vs-navy-subtle)'
                      }}
                    >
                      Soy yo
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Fila: Frecuencia + Criticidad */}
            <div style={{ display: 'flex', gap: '12px' }}>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Frecuencia de ejecución</label>
                <select value={frecuencia} onChange={e => setFrecuencia(e.target.value)}>
                  <option value="">Seleccionar...</option>
                  {FRECUENCIAS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Criticidad ante fallos</label>
                <select
                  value={criticidad}
                  onChange={e => setCriticidad(e.target.value)}
                  style={criticidad ? {
                    color: CRITICIDADES.find(c => c.value === criticidad)?.color,
                    fontWeight: 700,
                    borderColor: CRITICIDADES.find(c => c.value === criticidad)?.color
                  } : {}}
                >
                  <option value="">Seleccionar...</option>
                  {CRITICIDADES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
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

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '4px' }}>
              <button className="btn-secondary" onClick={onClose}>Cancelar</button>
              <button
                className="btn-primary"
                onClick={handleGenerate}
                disabled={!scriptContent.trim() || !title.trim() || !desc.trim() || todayCount >= DAILY_LIMIT}
                style={{
                  opacity: (!scriptContent.trim() || !title.trim() || !desc.trim() || todayCount >= DAILY_LIMIT) ? 0.5 : 1,
                  display: 'flex', alignItems: 'center', gap: '8px'
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 3l1.88 5.47L19 10l-5.12 1.53L12 17l-1.88-5.47L5 10l5.12-1.53z"/>
                </svg>
                Generar con Claude
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: GENERATING */}
        {step === 'generating' && (
          <div style={{ textAlign: 'center', padding: '48px 20px' }}>
            <div style={{ marginBottom: '24px' }}>
              <div style={{
                width: '56px', height: '56px', borderRadius: '50%',
                background: 'var(--vs-navy-subtle)', margin: '0 auto 16px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                animation: 'pulse 1.5s ease-in-out infinite'
              }}>
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="var(--vs-navy)" strokeWidth="1.5">
                  <path d="M12 3l1.88 5.47L19 10l-5.12 1.53L12 17l-1.88-5.47L5 10l5.12-1.53z"/>
                </svg>
              </div>
              <div style={{ fontFamily: 'var(--vs-font-title)', fontSize: '17px', fontWeight: 700, color: 'var(--vs-navy)', marginBottom: '8px' }}>
                Claude está analizando tu script...
              </div>
              <div style={{ fontSize: '13px', color: 'var(--vs-gray-mid)', lineHeight: 1.6 }}>
                Esto puede tomar entre 15 y 40 segundos.<br />
                Claude lee el código completo y genera la documentación técnica.
              </div>
            </div>
            <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', marginTop: '24px' }}>
              {[0, 1, 2].map(i => (
                <div key={i} style={{
                  width: '8px', height: '8px', borderRadius: '50%',
                  background: 'var(--vs-navy)', opacity: 0.3,
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

        {/* STEP 3: PREVIEW */}
        {step === 'preview' && (
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
              Documentación generada. Revisá y editá antes de publicar.
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

            {/* Toggle Editar / Vista previa */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <label style={labelStyle}>Contenido generado</label>
              <div style={{ display: 'flex', background: 'var(--vs-navy-subtle)', borderRadius: 'var(--vs-radius-pill)', padding: '2px' }}>
                {[
                  { key: 'edit', label: '✏️  Editar' },
                  { key: 'preview', label: '👁  Vista previa' }
                ].map(m => (
                  <button
                    key={m.key}
                    onClick={() => setPreviewMode(m.key)}
                    style={{
                      fontSize: '11px', fontWeight: 600, padding: '4px 14px',
                      borderRadius: 'var(--vs-radius-pill)', border: 'none', cursor: 'pointer',
                      background: previewMode === m.key ? 'var(--vs-navy)' : 'transparent',
                      color: previewMode === m.key ? 'white' : 'var(--vs-navy-muted)',
                      transition: 'all 0.15s'
                    }}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            {previewMode === 'edit' ? (
              <textarea
                value={generatedMd}
                onChange={e => setGeneratedMd(e.target.value)}
                style={{
                  width: '100%', minHeight: '380px', resize: 'vertical',
                  fontFamily: 'monospace', fontSize: '12px', lineHeight: 1.65,
                  background: '#F8F9FC', border: '1px solid #D0D5E8',
                  borderRadius: 'var(--vs-radius-md)', padding: '14px',
                  color: 'var(--vs-navy)', boxSizing: 'border-box',
                  marginBottom: '12px'
                }}
              />
            ) : (
              <div
                className="md-content"
                style={{
                  minHeight: '380px', border: '1px solid #D0D5E8',
                  borderRadius: 'var(--vs-radius-md)', padding: '20px',
                  background: '#FAFBFE', marginBottom: '12px',
                  overflowY: 'auto'
                }}
              >
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{generatedMd}</ReactMarkdown>
              </div>
            )}

            {error && (
              <div style={{
                background: '#FEF2F2', border: '1px solid #FCA5A5',
                borderRadius: 'var(--vs-radius-md)', padding: '10px 14px',
                fontSize: '12px', color: '#DC2626', marginBottom: '12px'
              }}>
                {error}
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                className="btn-secondary"
                onClick={() => { setStep('upload'); setError('') }}
                disabled={saving}
              >
                Volver a subir
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
                    Publicar documento
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
