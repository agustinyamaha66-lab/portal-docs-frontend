# Portal Docs - VALDISHOPPER

## Stack
- React + Vite (puerto 3000 en local)
- Supabase (auth + base de datos)
- Vercel (hosting)
- Claude API (generación de documentación con IA)

## URLs importantes
- **Producción**: `https://portal-docs-frontend.vercel.app`
- **Supabase proyecto**: `https://hkoxfkslvyefkbkxwmso.supabase.co`

---

## Configuración Supabase

### Authentication → URL Configuration
- **Site URL**: `https://portal-docs-frontend.vercel.app` (con `https://`)
- **Redirect URLs**: `https://portal-docs-frontend.vercel.app`

> IMPORTANTE: Si el Site URL no tiene `https://`, Supabase redirige al dominio de Vercel como si fuera un path de su propia URL, rompiendo el login.

### Tabla `documentos`
```sql
create table documentos (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  descripcion text,
  tab text not null,
  subtab text,
  tags jsonb,
  status text default 'active',
  author text,
  content text,
  file_url text,
  created_at timestamptz default now()
);
```
> La columna `content` fue agregada posteriormente con `alter table documentos add column content text;`
> La columna se llama `descripcion` (en español), NO `desc` ni `description`.
> `tags` es tipo `jsonb`, no `text[]`.

### RLS Policies
```sql
alter table documentos enable row level security;
create policy "read" on documentos for select to authenticated using (true);
create policy "insert" on documentos for insert to authenticated with check (true);
create policy "update" on documentos for update to authenticated using (true);
```

---

## Configuración Vercel

### Environment Variables (todas en All Environments)
| Variable | Valor |
|----------|-------|
| `VITE_SUPABASE_URL` | `https://hkoxfkslvyefkbkxwmso.supabase.co` |
| `VITE_SUPABASE_KEY` | `sb_publishable_...` (key de Supabase) |
| `VITE_ANTHROPIC_API_KEY` | `sk-ant-api03-...` (key de Anthropic) |

> `ANTHROPIC_API_KEY` sin el prefijo `VITE_` NO funciona — Vite solo expone al browser variables que empiecen con `VITE_`.
> NO agregar `VITE_API_URL` — ya no hay backend.

### vercel.json
Necesario para que el routing de React funcione (SPA):
```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

---

## Arquitectura actual

### Antes (roto en producción)
```
Frontend → Backend FastAPI (localhost:8000) → Supabase
```
El backend nunca fue deployado, por lo que en Vercel todas las llamadas fallaban.

### Ahora (funciona)
```
Frontend → Supabase directo
Frontend → Claude API directo (con anthropic-dangerous-direct-browser-access: true)
```

---

## Cambios realizados

### `src/supabase.js`
- Credenciales movidas a variables de entorno (`VITE_SUPABASE_URL`, `VITE_SUPABASE_KEY`)
- Mantiene fallback a los valores hardcodeados

### `src/pages/Home.jsx`
- Eliminada dependencia de `API_BASE` / backend
- `fetchDocs` → usa `supabase.from('documentos').select()`
- `handleUpload` → usa `supabase.from('documentos').insert()`
- Columna `desc` del payload se mapea a `descripcion` en Supabase

### `src/pages/DocDetail.jsx`
- Eliminada dependencia de `API_BASE` / backend
- Carga documento con `supabase.from('documentos').select('*').eq('id', id).single()`
- `handleEdit` → usa `supabase.from('documentos').update()`
- Descarga `.md` → genera blob desde `content` en memoria
- Descarga PDF → usa `html2canvas` + `jsPDF` (client-side, sin backend)
- Botones `.md` y `PDF` visibles cuando `content` tiene valor

### `src/components/UploadModal.jsx`
- Al editar, descripción se inicializa con `editDoc?.descripcion` (nombre real de columna)

### `src/pages/Login.jsx`
- Lee `error_code` de la URL al volver de OAuth y muestra mensaje en español

---

## Problemas comunes y soluciones

### `bad_oauth_state`
- **Causa**: El servidor no estaba corriendo cuando Google redirigió de vuelta, o hay cache viejo
- **Solución**: Limpiar cache del browser (cookies + archivos en caché) → "Todo el tiempo"

### `requested path is invalid` (JSON en pantalla)
- **Causa**: Site URL en Supabase sin `https://`
- **Solución**: Corregir Site URL en Supabase → Authentication → URL Configuration

### App carga bundle viejo (`index-Brzv1Nr-.js`)
- **Causa**: Browser cacheó el HTML viejo que referencia el bundle anterior
- **Solución**: Limpiar cache del browser o usar ventana incógnito

### Documentos no aparecen / Error 404 al cargar
- **Causa**: `VITE_API_URL` apuntaba al backend que no existe
- **Solución**: Eliminada esa variable, app ahora va directo a Supabase

### URL de Vercel que cambia con cada deploy
- **Causa**: URLs de preview (`portal-docs-frontend-[hash]-...vercel.app`) cambian siempre
- **Solución**: Usar siempre `https://portal-docs-frontend.vercel.app` (URL estable de producción)
