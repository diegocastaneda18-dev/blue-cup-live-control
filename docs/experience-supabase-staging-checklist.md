# Las Marías Experience — Supabase staging checklist

Prueba **Database + Storage** sin Supabase Auth en el admin web.

## Prerrequisitos

1. Proyecto Supabase (staging) creado.
2. Ejecutar migración SQL en el SQL Editor de Supabase:

   `supabase/migrations/202506160001_experience_schema.sql`

3. Confirmar en Dashboard:
   - Tablas: `experience_applications`, `experience_documents`, `experience_status_history`
   - Buckets privados: `experience-documents`, `experience-licenses` (`public = false`)
   - Storage Policies: vacías (acceso solo vía API con service role)

4. Copiar plantillas de entorno:
   - `apps/api/.env.local.example` → `apps/api/.env.local`
   - Completar `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY`
   - `apps/web/.env.local` con API URL y claves anon (sin service role)

5. Reiniciar API y web:

```bash
pnpm --filter @bluecup/api dev
pnpm --filter @bluecup/web dev
```

6. En logs de API al arrancar debe aparecer:

```
Las Marías Experience — storage=supabase, adminAuth=password
[Experience Supabase] staging mode ready (Database + Storage)
```

## Variables (staging)

**API** (`apps/api/.env.local`):

```env
EXPERIENCE_STORAGE_DRIVER=supabase
ADMIN_AUTH_MODE=password
ADMIN_ACCESS_PASSWORD=admin123
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
EXPERIENCE_EMAIL_ENABLED=false
```

**Web** (`apps/web/.env.local`):

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

> No poner `SUPABASE_SERVICE_ROLE_KEY` en la web.

## Checklist de prueba manual

| # | Paso | Qué verificar | Logs esperados |
|---|------|---------------|----------------|
| A | Crear solicitud (formulario público) | Respuesta con folio `LME-...` | `[Experience Supabase] create application` |
| B | Subir documentos | Upload OK tras envío | `[Experience Supabase] upload document` |
| C | Admin → listar solicitudes | Aparece la solicitud | `[Experience Supabase] list applications` |
| D | Admin → abrir expediente | Datos + documentos listados | — |
| E | Aprobar documentos (PATCH status) | Estado `aprobado` | `[Experience Supabase] update document status` |
| F | Cambiar solicitud a `aprobada` | Status actualizado | `[Experience Supabase] update status` + `status history` |
| G | Generar licencia PDF | Botón admin OK | `[Experience Supabase] generate license` |
| H | Descargar licencia | PDF descargable | `[Experience Supabase] save license PDF` + `download file` |
| I | Abrir `/validar-licencia/[folio]` | JSON de validación público | — |
| J | Supabase → Table Editor | Filas en las 3 tablas + historial | — |
| K | Supabase → Storage | Archivos en buckets con rutas `{folio}/...` | — |

## Consultas SQL útiles (Table Editor / SQL)

```sql
select folio, status, created_at from experience_applications order by created_at desc limit 10;

select application_folio, type, status, storage_path from experience_documents order by uploaded_at desc;

select application_folio, from_status, to_status, changed_by, created_at
from experience_status_history order by created_at desc;
```

## Volver a modo local JSON

En `apps/api/.env.local`:

```env
EXPERIENCE_STORAGE_DRIVER=file
```

Reiniciar API. Los datos locales siguen en `apps/api/data/experience-applications/`.

## Siguiente fase (no hacer aún)

Cuando A–K pasen en staging:

- `ADMIN_AUTH_MODE=supabase`
- Login real del admin web con Supabase Auth
