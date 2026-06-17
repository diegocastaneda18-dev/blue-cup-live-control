# Las Marías Experience — Producción (Supabase)

Auditoría del flujo MVP local y guía de migración a Supabase Database + Storage + Auth.

## Flujo actual (MVP local)

| Método | Ruta API | Auth | Descripción |
|--------|----------|------|-------------|
| POST | `/api/experience-applications` | Público | Crea solicitud, genera folio `LME-{año}-{seq}` |
| POST | `/api/experience-applications/:folio/documents` | Público | Sube documento (multipart) |
| GET | `/api/experience-applications` | Admin | Lista solicitudes |
| GET | `/api/experience-applications/:folio` | Admin | Detalle / expediente |
| PATCH | `/api/experience-applications/:folio/status` | Admin | Cambia estatus de solicitud |
| GET | `/api/experience-applications/:folio/documents/:documentId/download` | Admin | Descarga documento |
| PATCH | `/api/experience-applications/:folio/documents/:documentId/status` | Admin | Revisa documento |
| POST | `/api/experience-applications/:folio/license` | Admin | Genera PDF + QR |
| GET | `/api/experience-applications/:folio/license/download` | Admin | Descarga licencia PDF |
| GET | `/api/experience-applications/:folio/license/validation` | Público | Validación QR (JSON) |
| POST | `/api/admin/verify-access` | Dev | Verifica `x-admin-password` |

### Persistencia local (fallback)

- `apps/api/data/experience-applications/applications.json`
- `apps/api/data/experience-applications/uploads/{folio}/`
- `apps/api/data/experience-applications/licenses/{folio}/license.pdf`

### Proxies Next.js (web)

La web en `apps/web` reenvía al Nest API vía rutas bajo `src/app/api/`.

## Variables de entorno

### Desarrollo (JSON local)

```env
EXPERIENCE_STORAGE_DRIVER=file
ADMIN_AUTH_MODE=password
ADMIN_ACCESS_PASSWORD=admin123
EXPERIENCE_EMAIL_ENABLED=false
```

### Producción (Supabase)

```env
EXPERIENCE_STORAGE_DRIVER=supabase
ADMIN_AUTH_MODE=supabase
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=...
SUPABASE_ANON_KEY=...          # web admin login
EXPERIENCE_EMAIL_ENABLED=true
RESEND_API_KEY=...
EXPERIENCE_EMAIL_FROM=...
EXPERIENCE_EMAIL_INTERNAL_TO=...
EXPERIENCE_WEB_BASE_URL=https://...
```

## Respaldo antes de migrar

```powershell
.\scripts\backup-experience-data.ps1
```

Copia `applications.json`, `uploads/` y `licenses/` a `backups/experience-applications-{timestamp}/`.

## Staging Supabase (Database + Storage, sin Auth admin)

Ver checklist paso a paso: [`docs/experience-supabase-staging-checklist.md`](./experience-supabase-staging-checklist.md)

Plantilla API: `apps/api/.env.local.example` → copiar a `apps/api/.env.local`

## Supabase

1. Ejecutar migración: `supabase/migrations/202506160001_experience_schema.sql`
2. Buckets privados: `experience-documents`, `experience-licenses`
3. La API usa **service role**; acceso público solo vía endpoints controlados.

## Deploy (FASE 7)

| Componente | Plataforma sugerida |
|------------|---------------------|
| `apps/web` | Vercel |
| `apps/api` | Railway / Render / Fly.io |

Separar variables por entorno. HTTPS obligatorio. Programar backups de Supabase (PITR / export).

## Criterios de aceptación

1. Local con `EXPERIENCE_STORAGE_DRIVER=file` sin regresiones.
2. Supabase crea filas en `experience_applications`.
3. Documentos en bucket `experience-documents`.
4. Admin lista desde Supabase.
5. PDF en bucket `experience-licenses`.
6. QR valida licencia emitida.
7. Flujo completo intacto.
