# Portal de Documentación Interna — Valdishopper

Portal web para centralizar proyectos, scripts y procesos internos del equipo.

## Stack

| Capa | Tecnología |
|------|-----------|
| Frontend | React + Vite |
| Auth | Firebase Auth (Google @valdishopper.com) |
| Backend | FastAPI (Cloud Run) — *próximo paso* |
| Storage | Cloud Storage (GCS) — *próximo paso* |
| Metadata | Firestore — *próximo paso* |
| Hosting | Cloud Run |

## Setup local

### 1. Instalar dependencias
```bash
npm install
```

### 2. Configurar Firebase
Editar `src/firebase.js` con las credenciales de `sigmc-5fae5`:
- Firebase Console → Project Settings → Your apps → Web app → SDK config

### 3. Configurar variables de entorno
```bash
cp .env.example .env
# Editar VITE_API_URL con la URL del backend
```

### 4. Levantar en desarrollo
```bash
npm run dev
# → http://localhost:3000
```

## Build para producción

```bash
npm run build
# Genera carpeta dist/
```

## Deploy en Cloud Run

```bash
# Desde la raíz del proyecto
gcloud run deploy portal-docs \
  --source=. \
  --region=us-central1 \
  --allow-unauthenticated \
  --project=sigmc-5fae5
```

Necesita un `Dockerfile` en la raíz (ver abajo).

## Dockerfile (para Cloud Run)

```dockerfile
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
```

## nginx.conf

```nginx
server {
    listen 8080;
    root /usr/share/nginx/html;
    index index.html;
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

## Próximos pasos

1. **Backend FastAPI** — endpoints `/documentos` GET/POST + `/documentos/{id}` GET
2. **Firestore** — colección `documentos` con metadata
3. **Cloud Storage** — bucket `portal-docs-files` para los `.md`
4. **Deploy completo** en Cloud Run (frontend + backend como servicios separados)

## Estructura del proyecto

```
src/
├── pages/
│   ├── Login.jsx       ← Login con Google
│   ├── Home.jsx        ← Grid de cards por pestaña
│   └── DocDetail.jsx   ← Vista detalle + renderizado .md
├── components/
│   ├── Navbar.jsx      ← Header con usuario y logout
│   ├── UploadModal.jsx ← Formulario de subida
│   └── Toast.jsx       ← Notificaciones
├── contexts/
│   └── AuthContext.jsx ← Firebase auth state
├── firebase.js         ← Config Firebase (completar credenciales)
└── index.css           ← Variables Valdishopper + estilos globales
```
