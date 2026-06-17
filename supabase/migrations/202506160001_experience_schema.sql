-- Las Marías Experience — Supabase schema (FASE 2 + 3)

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- experience_applications
-- ---------------------------------------------------------------------------
create table if not exists public.experience_applications (
  id uuid primary key default gen_random_uuid(),
  folio text unique not null,
  status text not null,
  applicant jsonb not null default '{}'::jsonb,
  transport jsonb not null default '{}'::jsonb,
  itinerary jsonb not null default '{}'::jsonb,
  people_on_board jsonb not null default '{}'::jsonb,
  activities jsonb not null default '{}'::jsonb,
  lodging jsonb not null default '{}'::jsonb,
  food jsonb not null default '{}'::jsonb,
  requested_routes jsonb not null default '[]'::jsonb,
  observations text,
  attachments jsonb,
  terms_accepted boolean not null default false,
  responsible_signature text not null,
  budget_range text,
  internal_notes text,
  license_issued_at timestamptz,
  license_pdf_path text,
  license_url text,
  qr_validation_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_experience_applications_folio on public.experience_applications (folio);
create index if not exists idx_experience_applications_status on public.experience_applications (status);
create index if not exists idx_experience_applications_created_at on public.experience_applications (created_at desc);

-- ---------------------------------------------------------------------------
-- experience_documents
-- ---------------------------------------------------------------------------
create table if not exists public.experience_documents (
  id uuid primary key default gen_random_uuid(),
  application_folio text not null references public.experience_applications (folio) on delete cascade,
  type text not null,
  label text not null,
  file_name text not null,
  original_name text not null,
  mime_type text not null,
  size bigint not null,
  storage_path text not null,
  uploaded_at timestamptz not null default now(),
  status text not null default 'pendiente',
  admin_note text,
  reviewed_at timestamptz
);

create index if not exists idx_experience_documents_folio on public.experience_documents (application_folio);

-- ---------------------------------------------------------------------------
-- experience_status_history
-- ---------------------------------------------------------------------------
create table if not exists public.experience_status_history (
  id uuid primary key default gen_random_uuid(),
  application_folio text not null references public.experience_applications (folio) on delete cascade,
  from_status text,
  to_status text not null,
  note text,
  changed_by text not null default 'admin',
  created_at timestamptz not null default now()
);

create index if not exists idx_experience_status_history_folio on public.experience_status_history (application_folio);

-- ---------------------------------------------------------------------------
-- updated_at trigger
-- ---------------------------------------------------------------------------
create or replace function public.set_experience_applications_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_experience_applications_updated_at on public.experience_applications;
create trigger trg_experience_applications_updated_at
  before update on public.experience_applications
  for each row execute function public.set_experience_applications_updated_at();

-- ---------------------------------------------------------------------------
-- Storage buckets (private — API uses service role)
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  (
    'experience-documents',
    'experience-documents',
    false,
    10485760,
    array['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
  ),
  (
    'experience-licenses',
    'experience-licenses',
    false,
    20971520,
    array['application/pdf']
  )
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- RLS enabled on app tables. The Nest API uses SUPABASE_SERVICE_ROLE_KEY (bypasses RLS).
-- Do not add anon/authenticated policies unless you intentionally expose direct client access.
alter table public.experience_applications enable row level security;
alter table public.experience_documents enable row level security;
alter table public.experience_status_history enable row level security;

-- ---------------------------------------------------------------------------
-- Storage policies — private buckets (FASE 3)
-- ---------------------------------------------------------------------------
-- Buckets `experience-documents` and `experience-licenses` are created with public = false.
-- No SELECT/INSERT policies for anon or authenticated roles are defined on purpose.
-- All file access goes through the Nest API (service role bypasses Storage RLS).
--
-- Expected object paths:
--   experience-documents / {folio} / {documentId}-{safeFileName}
--   experience-licenses    / {folio} / license.pdf
--
-- Verify in Supabase Dashboard:
--   Storage → bucket → Policies → should be empty (or service-only if you add them later)
--
-- Public QR validation uses GET /api/experience-applications/:folio/license/validation
-- (reads DB only — never exposes signed bucket URLs to the browser).
