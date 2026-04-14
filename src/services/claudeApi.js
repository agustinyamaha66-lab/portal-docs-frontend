// Servicio de integración con Claude API
// Las llamadas van a través del proxy de Vite (/api/anthropic → https://api.anthropic.com)
// para evitar restricciones de CORS en el navegador.
// NOTA: Para producción, mover esta lógica al backend FastAPI.

const API_URL = 'https://api.anthropic.com/v1/messages'
const MODEL = 'claude-sonnet-4-20250514'
const API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY

// ─── PROMPT PARA DOCUMENTACIÓN DE SCRIPTS ──────────────────────────────────
// Optimizado para cualquier IA (Claude, ChatGPT, Gemini, etc.)
// Genera documentación técnica completa, estructurada y en español.
const SCRIPT_DOC_PROMPT = `Eres un experto en documentación técnica de software. Tu tarea es analizar el script que te voy a proporcionar y generar un documento de referencia técnica completo en formato Markdown, escrito en español.

El documento debe ser:
- Técnicamente preciso y basado exclusivamente en el código real
- Claro para desarrolladores y analistas de negocio
- Estructurado con la siguiente jerarquía obligatoria

---

# [Nombre descriptivo del script]

## Descripción General
Explicación concisa de qué hace el script, cuál es su propósito principal y en qué contexto se utiliza dentro del sistema.

## Información Técnica
| Campo | Detalle |
|-------|---------|
| Lenguaje | |
| Versión mínima requerida | |
| Sistema operativo | |
| Modo de ejecución | (script / módulo / servicio / etc.) |

## Dependencias y Requisitos
Lista de todas las librerías, paquetes o módulos externos que necesita. Para cada uno indicar nombre, versión y cómo instalar si aplica.

## Fuentes de Datos
Descripción detallada de las fuentes que el script consume:
- Bases de datos (nombre de la BD, tablas que consulta o modifica)
- APIs externas (endpoints, métodos, autenticación)
- Archivos de entrada (formato, estructura esperada, ubicación)
- Servicios externos (S3, GCS, queues, etc.)

## Estructura de Datos
Esquema de los datos de entrada y salida del script:
- Formato esperado de entrada
- Estructura de tablas o esquemas relevantes
- Estructura de respuesta o salida generada

## Funciones y Módulos Principales
Documentación de cada función, clase o módulo relevante:

### \`nombre_funcion(param1, param2)\`
| Campo | Detalle |
|-------|---------|
| Propósito | |
| Parámetros | \`param1\`: tipo y descripción / \`param2\`: tipo y descripción |
| Retorna | tipo y descripción |

**Flujo interno:** descripción paso a paso de lo que hace la función.

## Flujo de Ejecución
Diagrama de texto del flujo completo del script usando flechas (→, ↓, ↪):

\`\`\`
Inicio
  ↓
[Paso 1: ...]
  ↓
[Paso 2: ...]
  ↓
Fin
\`\`\`

## Variables de Entorno y Configuración
Lista de todas las variables de entorno, archivos de configuración o parámetros que el script necesita para ejecutarse correctamente.

| Variable | Descripción | Requerida | Valor de ejemplo |
|----------|-------------|-----------|------------------|
| | | Sí / No | |

## Manejo de Errores
Descripción de cómo el script maneja errores, excepciones y casos borde. Incluir qué hace ante fallos de conexión, datos inesperados, etc.

## Ejemplos de Uso
\`\`\`bash
# Ejemplo de ejecución básica
\`\`\`

Con ejemplos de parámetros y resultados esperados si aplica.

## Notas y Consideraciones
- Advertencias importantes sobre el uso
- Limitaciones conocidas
- Consideraciones de rendimiento o seguridad
- Dependencias con otros scripts o sistemas

---

INSTRUCCIONES CRÍTICAS PARA GENERAR EL DOCUMENTO:
1. Responde ÚNICAMENTE con el contenido Markdown del documento
2. NO incluyas texto introductorio ni explicaciones fuera del documento
3. NO envuelvas el documento completo en un bloque de código
4. Si algo no está claro en el código, usa la nota [A confirmar con el equipo]
5. Sé específico con el código real analizado, nunca genérico

SCRIPT A DOCUMENTAR:
`

// ─── PROMPT PARA DOCUMENTACIÓN DE PROCESOS ─────────────────────────────────
// Optimizado para cualquier IA. Genera análisis de proceso con estructura estándar.
export const buildProcessPrompt = ({ nombre, area, frecuencia, responsable, herramientas, descripcion, problema }) =>
  `Eres un consultor experto en análisis y mejora de procesos organizacionales.

Voy a describirte un proceso de nuestra empresa. Tu tarea es generar un documento de análisis completo en formato Markdown (.md), en español, que sirva tanto como referencia operativa como insumo para futuras mejoras.

El documento debe ser claro, estructurado y accionable. Incluye tablas, listas numeradas y recomendaciones concretas.

---
**Proceso:** ${nombre}
**Área / Departamento:** ${area || 'No especificada'}
**Frecuencia:** ${frecuencia || 'No especificada'}
**Responsable(s):** ${responsable || 'No especificado'}
**Herramientas utilizadas:** ${herramientas || 'No especificadas'}
**Descripción actual del proceso:** ${descripcion}
**Problemas o cuellos de botella identificados:** ${problema || 'No identificados aún'}
---

Genera el documento con la siguiente estructura obligatoria:

# ${nombre}

## Resumen del Proceso
Descripción concisa de qué es el proceso, para qué existe y qué valor genera (2-3 párrafos).

## Información General
| Campo | Detalle |
|-------|---------|
| Área | |
| Frecuencia | |
| Responsable principal | |
| Sistemas involucrados | |
| Tiempo estimado | |

## Participantes y Responsabilidades
Tabla con cada persona o rol que interviene y qué hace exactamente.

## Pasos del Proceso Actual
Lista numerada y detallada de cada paso del proceso tal como se ejecuta hoy.

## Herramientas y Recursos Utilizados
| Herramienta | Tipo | Para qué se usa |
|-------------|------|-----------------|
| | | |

## Problemas Identificados
Lista de problemas, fricciones o cuellos de botella actuales, con impacto estimado de cada uno.

## Oportunidades de Mejora
Al menos 3-5 mejoras concretas y accionables, ordenadas por prioridad (alta/media/baja).

## Indicadores Clave (KPIs Sugeridos)
Métricas recomendadas para medir la salud y eficiencia del proceso.

| KPI | Descripción | Meta sugerida |
|-----|-------------|---------------|
| | | |

## Próximos Pasos Recomendados
Lista de acciones concretas con responsable sugerido y prioridad para mejorar el proceso.

## Notas y Consideraciones
Información adicional, riesgos, dependencias con otros procesos o sistemas, o cualquier dato relevante para entender el contexto.

---

INSTRUCCIONES CRÍTICAS:
1. Responde ÚNICAMENTE con el contenido Markdown del documento
2. NO incluyas texto introductorio ni cierres fuera del documento
3. NO envuelvas el documento en bloques de código
4. Sé específico con la información proporcionada, no genérico
5. Si hay información faltante, usa [A definir con el equipo] en lugar de inventar`

// ─── FUNCIÓN PRINCIPAL DE LLAMADA A CLAUDE ─────────────────────────────────
async function callClaude(userMessage, maxTokens = 4096) {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': API_KEY,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true'
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: maxTokens,
      messages: [{ role: 'user', content: userMessage }]
    })
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error?.message || `Error ${res.status}: ${res.statusText}`)
  }

  const data = await res.json()
  const { input_tokens, output_tokens } = data.usage
  const total = input_tokens + output_tokens
  // claude-sonnet-4: $3 / MTok input · $15 / MTok output
  const costUSD = (input_tokens / 1_000_000) * 3 + (output_tokens / 1_000_000) * 15

  console.info(
    `[Claude] input: ${input_tokens.toLocaleString()} · output: ${output_tokens.toLocaleString()} · total: ${total.toLocaleString()} tokens · costo estimado: $${costUSD.toFixed(4)} USD`
  )

  return { text: data.content[0].text, usage: { input_tokens, output_tokens, total, costUSD } }
}

// ─── PROMPT PARA ACTUALIZAR DOCUMENTACIÓN DE SCRIPTS ───────────────────────
// Compara documentación existente con nuevo script y genera versión actualizada + changelog
const buildUpdateDocPrompt = (oldContent, newScript) =>
  `Eres un experto en documentación técnica. Tu tarea es actualizar la documentación existente de un script basándote en la nueva versión del código.

DOCUMENTACIÓN ACTUAL:
\`\`\`markdown
${oldContent}
\`\`\`

NUEVO SCRIPT A DOCUMENTAR:
\`\`\`
${newScript}
\`\`\`

Genera una respuesta en formato JSON con la siguiente estructura EXACTA:
{
  "updated_md": "documentación actualizada completa en Markdown",
  "changelog": "lista de cambios en Markdown (bullets con lo que cambió, agregó o eliminó)"
}

INSTRUCCIONES CRÍTICAS:
1. Responde ÚNICAMENTE con el JSON, sin texto adicional antes ni después
2. El JSON debe ser válido y parseable
3. En "updated_md": documentación técnica completa actualizada, manteniendo estructura y estilo
4. En "changelog": lista de bullets (- texto) con cambios específicos detectados
5. Si no detectás cambios significativos, indicarlo en el changelog
6. Sé específico con los cambios reales, nunca genérico`

// ─── PROMPT PARA DOCUMENTACIÓN DE PROYECTOS MULTI-ARCHIVO ──────────────────
// Recibe un array de {name, content} y construye el prompt con todos los archivos
const buildMultiScriptPrompt = (files) => {
  const filesBlock = files
    .map(f => `--- ${f.name} ---\n${f.content}`)
    .join('\n\n')

  return `${SCRIPT_DOC_PROMPT}Este proyecto está compuesto por ${files.length} archivo${files.length !== 1 ? 's' : ''}. Analizá el conjunto completo y generá una documentación técnica unificada que cubra el proyecto como un todo, mencionando el rol de cada archivo.

${filesBlock}`
}

// ─── EXPORTS ────────────────────────────────────────────────────────────────

export async function generateScriptDocs(scriptContent) {
  return callClaude(SCRIPT_DOC_PROMPT + scriptContent, 4096)
}

export async function generateMultiScriptDocs(files) {
  return callClaude(buildMultiScriptPrompt(files), 6000)
}

export async function generateProcessDocs(formData) {
  return callClaude(buildProcessPrompt(formData), 3500)
}

export async function generateUpdateDocs(oldContent, newScript) {
  const result = await callClaude(buildUpdateDocPrompt(oldContent, newScript), 6000)
  // Extraer JSON de la respuesta (puede venir con texto extra en casos límite)
  const jsonMatch = result.text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('Claude no devolvió un JSON válido. Intentá nuevamente.')
  const parsed = JSON.parse(jsonMatch[0])
  if (!parsed.updated_md || !parsed.changelog) throw new Error('Respuesta incompleta de Claude.')
  return {
    updatedMd: parsed.updated_md,
    changelog: parsed.changelog,
    usage: result.usage
  }
}
