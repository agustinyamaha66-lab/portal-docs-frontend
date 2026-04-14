import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { generateUpdateDocs } from '../services/claudeApi'

const STEPS = ['upload', 'generating', 'preview']

const labelStyle = {
  fontSize: '12px', fontWeight: 600, color: 'var(--vs-gray-dark)',
  display: 'block', marginBottom: '6px'
}

function StepIndicator({ step }) {
  const steps = [
    { key: 'upload', label: 'Nuevo script' },
    { key: 'generating', label: 'Comparando' },
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

/**
 * UpdateDocModal
 *
 * Props:
 *   doc           — documento actual (con doc.content y doc.version)
 *   onClose       — función para cerrar
 *   onUpdate      — función async ({ content, changelog, version, version_history }) => void
 */
export default function UpdateDocModal({ doc, onClose, onUpdate }) {
  const [step, setStep] = useState('upload')
  const [newScript, setNewScript] = useState('')
  const [updatedMd, setUpdatedMd] = useState('')
  const [changelog, setChangelog] = useState('')
  const [usage, setUsage] = useState(null)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [mdPreviewMode, setMdPreviewMode] = useState('edit')

  const currentVersion = doc.version || 1

  const handleCompare = async () => {
    if (!newScript.trim()) return
    setError('')
    setStep('generating')
    try {
      const result = await generateUpdateDocs(doc.content || '', newScript)
      setUpdatedMd(result.updatedMd)
      setChangelog(result.changelog)
      setUsage(result.usage)
      setMdPreviewMode('edit')
      setStep('preview')
    } catch (e) {
      setError(e.message || 'Error al generar la actualización. Intentá nuevamente.')
      setStep('upload')
    }
  }

  const handlePublish = async () => {
    setSaving(true)
    try {
      // Armar entrada del historial con la versión actual
      const historyEntry = {
        version: currentVersion,
        content: doc.content || '',
        changelog,
        updated_at: new Date().toISOString(),
        author: doc.author || null
      }
      const currentHistory = Array.isArray(doc.version_history) ? doc.version_history : []
      const newHistory = [...currentHistory, historyEntry]

      await onUpdate({
        content: updatedMd,
        changelog,
        version: currentVersion + 1,
        version_history: newHistory
      })
      onClose()
    } catch (e) {
      setError('Error al publicar la nueva versión. Intentá nuevamente.')
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
        maxWidth: step === 'preview' ? '860px' : '540px',
        maxHeight: '92vh', overflowY: 'auto',
        transition: 'max-width 0.3s'
      }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '8px' }}>
          <div>
            <div style={{ fontFamily: 'var(--vs-font-title)', fontSize: '18px', fontWeight: 700, color: 'var(--vs-navy)' }}>
              Actualizar documentación
            </div>
            <div style={{ fontSize: '12px', color: 'var(--vs-gray-mid)', marginTop: '3px' }}>
              Claude comparará el .md actual con tu nuevo script y generará la versión actualizada
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--vs-gray-mid)', padding: '4px' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Badge versión actual */}
        <div style={{ marginBottom: '20px' }}>
          <span style={{
            fontSize: '11px', fontWeight: 700, padding: '3px 10px',
            borderRadius: 'var(--vs-radius-pill)',
            background: 'var(--vs-navy-subtle)', color: 'var(--vs-navy-muted)'
          }}>
            Versión actual: v{currentVersion} → publicará v{currentVersion + 1}
          </span>
        </div>

        <StepIndicator step={step} />

        {/* STEP 1: UPLOAD NUEVO SCRIPT */}
        {step === 'upload' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            <div>
              <label style={labelStyle}>
                Pegá la nueva versión del script *
              </label>
              <textarea
                value={newScript}
                onChange={e => setNewScript(e.target.value)}
                placeholder="# Pegá aquí el código actualizado del script..."
                style={{
                  minHeight: '240px', resize: 'vertical',
                  fontFamily: 'monospace', fontSize: '12px', lineHeight: 1.65,
                  background: newScript ? '#F8F9FC' : 'transparent',
                  border: `1.5px solid ${newScript.trim() ? 'var(--vs-success)' : '#D0D5E8'}`,
                  borderRadius: 'var(--vs-radius-md)', padding: '14px',
                  color: 'var(--vs-navy)', boxSizing: 'border-box', width: '100%',
                  transition: 'border-color 0.2s'
                }}
              />
              {newScript.trim() && (
                <div style={{ fontSize: '11px', color: 'var(--vs-success)', marginTop: '5px', fontWeight: 600 }}>
                  ✓ {newScript.trim().split('\n').length} líneas listas para comparar
                </div>
              )}
            </div>

            {/* Info sobre el doc actual */}
            <div style={{
              background: 'var(--vs-navy-subtle)', borderRadius: 'var(--vs-radius-md)',
              padding: '12px 14px', fontSize: '12px', color: 'var(--vs-navy-muted)'
            }}>
              <div style={{ fontWeight: 600, marginBottom: '4px', color: 'var(--vs-navy)' }}>
                📄 Documento a actualizar: {doc.title}
              </div>
              <div>Claude comparará la documentación actual con tu nuevo script y generará:</div>
              <div style={{ marginTop: '4px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <span>• Documentación técnica actualizada</span>
                <span>• Registro de cambios (changelog)</span>
                <span>• La versión anterior quedará guardada en el historial</span>
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
                onClick={handleCompare}
                disabled={!newScript.trim()}
                style={{
                  opacity: !newScript.trim() ? 0.5 : 1,
                  display: 'flex', alignItems: 'center', gap: '8px'
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 3l1.88 5.47L19 10l-5.12 1.53L12 17l-1.88-5.47L5 10l5.12-1.53z"/>
                </svg>
                Comparar con Claude
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: GENERATING */}
        {step === 'generating' && (
          <div style={{ textAlign: 'center', padding: '48px 20px' }}>
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
              Claude está comparando versiones...
            </div>
            <div style={{ fontSize: '13px', color: 'var(--vs-gray-mid)', lineHeight: 1.6 }}>
              Analizando los cambios entre la documentación actual<br />y el nuevo script. Puede tomar 20–50 segundos.
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
              fontSize: '12px', color: '#15803D', marginBottom: '16px',
              display: 'flex', alignItems: 'center', gap: '8px'
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              Actualización generada. Revisá ambas secciones antes de publicar.
            </div>

            {usage && (
              <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                {[
                  { label: 'Entrada', value: usage.input_tokens.toLocaleString(), sub: 'tokens' },
                  { label: 'Salida', value: usage.output_tokens.toLocaleString(), sub: 'tokens' },
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

            {/* Changelog — siempre editable */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ ...labelStyle, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{
                  fontSize: '10px', fontWeight: 700, padding: '2px 8px',
                  borderRadius: 'var(--vs-radius-pill)',
                  background: '#FEF3C7', color: '#92400E'
                }}>
                  CHANGELOG v{currentVersion + 1}
                </span>
                Cambios detectados (editable)
              </label>
              <textarea
                value={changelog}
                onChange={e => setChangelog(e.target.value)}
                style={{
                  width: '100%', minHeight: '100px', resize: 'vertical',
                  fontFamily: 'monospace', fontSize: '12px', lineHeight: 1.65,
                  background: '#FFFBEB', border: '1.5px solid #FCD34D',
                  borderRadius: 'var(--vs-radius-md)', padding: '12px',
                  color: 'var(--vs-navy)', boxSizing: 'border-box'
                }}
              />
            </div>

            {/* Documentación actualizada — con toggle preview */}
            <div style={{ marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <label style={labelStyle}>Documentación actualizada</label>
                <div style={{ display: 'flex', background: 'var(--vs-navy-subtle)', borderRadius: 'var(--vs-radius-pill)', padding: '2px' }}>
                  {[
                    { key: 'edit', label: '✏️  Editar' },
                    { key: 'preview', label: '👁  Vista previa' }
                  ].map(m => (
                    <button
                      key={m.key}
                      onClick={() => setMdPreviewMode(m.key)}
                      style={{
                        fontSize: '11px', fontWeight: 600, padding: '4px 14px',
                        borderRadius: 'var(--vs-radius-pill)', border: 'none', cursor: 'pointer',
                        background: mdPreviewMode === m.key ? 'var(--vs-navy)' : 'transparent',
                        color: mdPreviewMode === m.key ? 'white' : 'var(--vs-navy-muted)',
                        transition: 'all 0.15s'
                      }}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              {mdPreviewMode === 'edit' ? (
                <textarea
                  value={updatedMd}
                  onChange={e => setUpdatedMd(e.target.value)}
                  style={{
                    width: '100%', minHeight: '380px', resize: 'vertical',
                    fontFamily: 'monospace', fontSize: '12px', lineHeight: 1.65,
                    background: '#F8F9FC', border: '1px solid #D0D5E8',
                    borderRadius: 'var(--vs-radius-md)', padding: '14px',
                    color: 'var(--vs-navy)', boxSizing: 'border-box'
                  }}
                />
              ) : (
                <div
                  className="md-content"
                  style={{
                    minHeight: '380px', border: '1px solid #D0D5E8',
                    borderRadius: 'var(--vs-radius-md)', padding: '20px',
                    background: '#FAFBFE', overflowY: 'auto'
                  }}
                >
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{updatedMd}</ReactMarkdown>
                </div>
              )}
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

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                className="btn-secondary"
                onClick={() => { setStep('upload'); setError('') }}
                disabled={saving}
              >
                Volver
              </button>
              <button
                className="btn-secondary"
                onClick={handleCompare}
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
                disabled={saving || !updatedMd.trim()}
                style={{
                  opacity: (!updatedMd.trim() || saving) ? 0.5 : 1,
                  display: 'flex', alignItems: 'center', gap: '8px',
                  background: 'var(--vs-navy)', borderColor: 'var(--vs-navy)'
                }}
              >
                {saving ? 'Publicando...' : (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="23 7 13 17 8 12 1 19"/>
                      <polyline points="17 7 23 7 23 13"/>
                    </svg>
                    Publicar v{currentVersion + 1}
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
