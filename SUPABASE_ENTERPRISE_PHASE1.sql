BEGIN;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

CREATE TABLE IF NOT EXISTS public.departments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(150) NOT NULL UNIQUE,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
);

CREATE TABLE IF NOT EXISTS public.offices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(50) UNIQUE,
  name VARCHAR(255) NOT NULL UNIQUE,
  sort_order INTEGER,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
);

CREATE TABLE IF NOT EXISTS public.job_titles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(150) NOT NULL UNIQUE,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
);

CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50) DEFAULT 'info',
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  read_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  CONSTRAINT notifications_type_check CHECK (type IN ('info', 'success', 'warning', 'error'))
);

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action VARCHAR(80) NOT NULL,
  entity_type VARCHAR(100) NOT NULL,
  entity_id TEXT,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.user_permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  permission VARCHAR(120) NOT NULL,
  granted BOOLEAN DEFAULT true,
  granted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (user_id, permission)
);

ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL;
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS office_id UUID REFERENCES public.offices(id) ON DELETE SET NULL;
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS job_title_id UUID REFERENCES public.job_titles(id) ON DELETE SET NULL;

INSERT INTO public.departments (name)
SELECT DISTINCT NULLIF(BTRIM(department), '') AS name
FROM public.employees
WHERE deleted_at IS NULL
  AND NULLIF(BTRIM(department), '') IS NOT NULL
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.offices (code, name, sort_order)
SELECT DISTINCT ON (COALESCE(NULLIF(BTRIM(office_name), ''), NULLIF(BTRIM(department), '')))
  NULLIF(BTRIM(office_code), '') AS code,
  COALESCE(NULLIF(BTRIM(office_name), ''), NULLIF(BTRIM(department), '')) AS name,
  MIN(office_sort_order) OVER (
    PARTITION BY COALESCE(NULLIF(BTRIM(office_name), ''), NULLIF(BTRIM(department), ''))
  ) AS sort_order
FROM public.employees
WHERE deleted_at IS NULL
  AND COALESCE(NULLIF(BTRIM(office_name), ''), NULLIF(BTRIM(department), '')) IS NOT NULL
ORDER BY COALESCE(NULLIF(BTRIM(office_name), ''), NULLIF(BTRIM(department), '')), office_sort_order NULLS LAST
ON CONFLICT (name) DO UPDATE SET
  code = COALESCE(public.offices.code, EXCLUDED.code),
  sort_order = COALESCE(public.offices.sort_order, EXCLUDED.sort_order),
  updated_at = NOW();

INSERT INTO public.job_titles (title)
SELECT DISTINCT NULLIF(BTRIM(job_title), '') AS title
FROM public.employees
WHERE deleted_at IS NULL
  AND NULLIF(BTRIM(job_title), '') IS NOT NULL
ON CONFLICT (title) DO NOTHING;

UPDATE public.employees e
SET department_id = d.id
FROM public.departments d
WHERE e.department_id IS NULL
  AND NULLIF(BTRIM(e.department), '') = d.name;

UPDATE public.employees e
SET office_id = o.id
FROM public.offices o
WHERE e.office_id IS NULL
  AND COALESCE(NULLIF(BTRIM(e.office_name), ''), NULLIF(BTRIM(e.department), '')) = o.name;

UPDATE public.employees e
SET job_title_id = j.id
FROM public.job_titles j
WHERE e.job_title_id IS NULL
  AND NULLIF(BTRIM(e.job_title), '') = j.title;

CREATE INDEX IF NOT EXISTS idx_departments_name_trgm ON public.departments USING GIN (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_offices_code ON public.offices(code);
CREATE INDEX IF NOT EXISTS idx_offices_name_trgm ON public.offices USING GIN (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_job_titles_title_trgm ON public.job_titles USING GIN (title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_employees_department_id ON public.employees(department_id);
CREATE INDEX IF NOT EXISTS idx_employees_office_id ON public.employees(office_id);
CREATE INDEX IF NOT EXISTS idx_employees_job_title_id ON public.employees(job_title_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON public.audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_permissions_user_permission ON public.user_permissions(user_id, permission);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON public.notifications(user_id, is_read, created_at DESC);

ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_titles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_permissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view departments" ON public.departments;
CREATE POLICY "Authenticated users can view departments"
  ON public.departments FOR SELECT TO authenticated
  USING (deleted_at IS NULL);

DROP POLICY IF EXISTS "Authenticated users can view offices" ON public.offices;
CREATE POLICY "Authenticated users can view offices"
  ON public.offices FOR SELECT TO authenticated
  USING (deleted_at IS NULL);

DROP POLICY IF EXISTS "Authenticated users can view job titles" ON public.job_titles;
CREATE POLICY "Authenticated users can view job titles"
  ON public.job_titles FOR SELECT TO authenticated
  USING (deleted_at IS NULL);

DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
CREATE POLICY "Users can view own notifications"
  ON public.notifications FOR SELECT TO authenticated
  USING (user_id = auth.uid() AND deleted_at IS NULL);

DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Authenticated users can create audit logs" ON public.audit_logs;
CREATE POLICY "Authenticated users can create audit logs"
  ON public.audit_logs FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() OR user_id IS NULL);

DROP POLICY IF EXISTS "Users can view own permissions" ON public.user_permissions;
CREATE POLICY "Users can view own permissions"
  ON public.user_permissions FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE OR REPLACE VIEW public.employee_directory AS
SELECT
  e.*,
  d.name AS normalized_department_name,
  o.code AS normalized_office_code,
  o.name AS normalized_office_name,
  j.title AS normalized_job_title
FROM public.employees e
LEFT JOIN public.departments d ON d.id = e.department_id
LEFT JOIN public.offices o ON o.id = e.office_id
LEFT JOIN public.job_titles j ON j.id = e.job_title_id
WHERE e.deleted_at IS NULL;

COMMIT;
