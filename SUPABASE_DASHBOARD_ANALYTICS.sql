BEGIN;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action VARCHAR(80),
  entity_type VARCHAR(100),
  entity_id TEXT,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.complaints (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255),
  status VARCHAR(50) DEFAULT 'open',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
);

CREATE TABLE IF NOT EXISTS public.office_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255),
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
);

ALTER TABLE public.complaints ADD COLUMN IF NOT EXISTS title VARCHAR(255);
ALTER TABLE public.complaints ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'open';
ALTER TABLE public.complaints ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE public.complaints ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE public.complaints ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

ALTER TABLE public.office_orders ADD COLUMN IF NOT EXISTS title VARCHAR(255);
ALTER TABLE public.office_orders ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'active';
ALTER TABLE public.office_orders ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE public.office_orders ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE public.office_orders ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS action VARCHAR(80);
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS entity_type VARCHAR(100);
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS entity_id TEXT;
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS old_values JSONB;
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS new_values JSONB;
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS ip_address INET;
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

ALTER TABLE public.letters ADD COLUMN IF NOT EXISTS sender VARCHAR(255);
ALTER TABLE public.letters ADD COLUMN IF NOT EXISTS receiver VARCHAR(255);
ALTER TABLE public.letters ADD COLUMN IF NOT EXISTS priority VARCHAR(50) DEFAULT 'normal';
ALTER TABLE public.letters ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'new';
ALTER TABLE public.letters ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE public.letters ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE public.letters ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

CREATE INDEX IF NOT EXISTS idx_complaints_status ON public.complaints(status);
CREATE INDEX IF NOT EXISTS idx_complaints_deleted_at ON public.complaints(deleted_at);
CREATE INDEX IF NOT EXISTS idx_office_orders_status ON public.office_orders(status);
CREATE INDEX IF NOT EXISTS idx_office_orders_deleted_at ON public.office_orders(deleted_at);
CREATE INDEX IF NOT EXISTS idx_letters_type_date ON public.letters(type, letter_date);
CREATE INDEX IF NOT EXISTS idx_letters_status ON public.letters(status);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON public.audit_logs(entity_type, entity_id);

CREATE OR REPLACE VIEW public.dashboard_summary AS
SELECT
  (SELECT COUNT(*) FROM public.employees WHERE deleted_at IS NULL) AS total_employees,
  (SELECT COUNT(*) FROM public.employees WHERE deleted_at IS NULL AND employment_status = 'active') AS active_employees,
  (SELECT COUNT(*) FROM public.employees WHERE deleted_at IS NULL AND employment_status = 'retired') AS retired_employees,
  (SELECT COUNT(*) FROM public.letters WHERE deleted_at IS NULL) AS total_letters,
  (SELECT COUNT(*) FROM public.letters WHERE deleted_at IS NULL AND type = 'incoming') AS incoming_letters,
  (SELECT COUNT(*) FROM public.letters WHERE deleted_at IS NULL AND type = 'outgoing') AS outgoing_letters,
  (SELECT COUNT(*) FROM public.complaints WHERE deleted_at IS NULL AND COALESCE(status, 'open') NOT IN ('closed', 'resolved')) AS open_complaints,
  (SELECT COUNT(*) FROM public.office_orders WHERE deleted_at IS NULL AND COALESCE(status, 'active') NOT IN ('closed', 'cancelled', 'inactive')) AS active_office_orders;

CREATE OR REPLACE VIEW public.dashboard_letters_by_month AS
SELECT
  DATE_TRUNC('month', letter_date)::DATE AS month_start,
  COUNT(*) AS total_count,
  COUNT(*) FILTER (WHERE type = 'incoming') AS incoming_count,
  COUNT(*) FILTER (WHERE type = 'outgoing') AS outgoing_count
FROM public.letters
WHERE deleted_at IS NULL
  AND letter_date IS NOT NULL
GROUP BY DATE_TRUNC('month', letter_date)
ORDER BY month_start DESC
LIMIT 12;

CREATE OR REPLACE VIEW public.dashboard_employees_by_office AS
SELECT
  COALESCE(o.name, NULLIF(BTRIM(e.office_name), ''), NULLIF(BTRIM(e.department), ''), 'غير محدد') AS office_name,
  COALESCE(o.code, NULLIF(BTRIM(e.office_code), ''), 'N/A') AS office_code,
  COUNT(*) AS employee_count
FROM public.employees e
LEFT JOIN public.offices o ON o.id = e.office_id
WHERE e.deleted_at IS NULL
GROUP BY
  COALESCE(o.name, NULLIF(BTRIM(e.office_name), ''), NULLIF(BTRIM(e.department), ''), 'غير محدد'),
  COALESCE(o.code, NULLIF(BTRIM(e.office_code), ''), 'N/A')
ORDER BY employee_count DESC, office_name
LIMIT 12;

CREATE OR REPLACE VIEW public.dashboard_employees_by_department AS
SELECT
  COALESCE(d.name, NULLIF(BTRIM(e.department), ''), 'غير محدد') AS department_name,
  COUNT(*) AS employee_count
FROM public.employees e
LEFT JOIN public.departments d ON d.id = e.department_id
WHERE e.deleted_at IS NULL
GROUP BY COALESCE(d.name, NULLIF(BTRIM(e.department), ''), 'غير محدد')
ORDER BY employee_count DESC, department_name
LIMIT 12;

CREATE OR REPLACE VIEW public.dashboard_complaints_by_status AS
SELECT
  COALESCE(status, 'open') AS status,
  COUNT(*) AS complaint_count
FROM public.complaints
WHERE deleted_at IS NULL
GROUP BY COALESCE(status, 'open')
ORDER BY complaint_count DESC, status;

CREATE OR REPLACE VIEW public.dashboard_office_orders_by_status AS
SELECT
  COALESCE(status, 'active') AS status,
  COUNT(*) AS order_count
FROM public.office_orders
WHERE deleted_at IS NULL
GROUP BY COALESCE(status, 'active')
ORDER BY order_count DESC, status;

CREATE OR REPLACE VIEW public.dashboard_recent_updates AS
SELECT
  id::TEXT AS update_id,
  action,
  entity_type,
  entity_id,
  COALESCE(
    new_values ->> 'full_name',
    new_values ->> 'subject',
    new_values ->> 'title',
    new_values ->> 'letter_number',
    new_values ->> 'file_name',
    old_values ->> 'full_name',
    old_values ->> 'subject',
    old_values ->> 'title',
    old_values ->> 'letter_number',
    old_values ->> 'file_name',
    entity_type
  ) AS title,
  created_at AS happened_at
FROM public.audit_logs
ORDER BY created_at DESC
LIMIT 200;

ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.office_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.letters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view complaints" ON public.complaints;
CREATE POLICY "Authenticated users can view complaints"
  ON public.complaints FOR SELECT TO authenticated
  USING (deleted_at IS NULL);

DROP POLICY IF EXISTS "Authenticated users can view office orders" ON public.office_orders;
CREATE POLICY "Authenticated users can view office orders"
  ON public.office_orders FOR SELECT TO authenticated
  USING (deleted_at IS NULL);

DROP POLICY IF EXISTS "Authenticated users can view letters" ON public.letters;
CREATE POLICY "Authenticated users can view letters"
  ON public.letters FOR SELECT TO authenticated
  USING (deleted_at IS NULL);

DROP POLICY IF EXISTS "Authenticated users can create letters" ON public.letters;
CREATE POLICY "Authenticated users can create letters"
  ON public.letters FOR INSERT TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can update letters" ON public.letters;
CREATE POLICY "Authenticated users can update letters"
  ON public.letters FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can view audit logs" ON public.audit_logs;
CREATE POLICY "Authenticated users can view audit logs"
  ON public.audit_logs FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can create audit logs" ON public.audit_logs;
CREATE POLICY "Authenticated users can create audit logs"
  ON public.audit_logs FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() OR user_id IS NULL);

GRANT SELECT ON public.dashboard_summary TO authenticated;
GRANT SELECT ON public.dashboard_letters_by_month TO authenticated;
GRANT SELECT ON public.dashboard_employees_by_office TO authenticated;
GRANT SELECT ON public.dashboard_employees_by_department TO authenticated;
GRANT SELECT ON public.dashboard_complaints_by_status TO authenticated;
GRANT SELECT ON public.dashboard_office_orders_by_status TO authenticated;
GRANT SELECT ON public.dashboard_recent_updates TO authenticated;
GRANT SELECT ON public.audit_logs TO authenticated;
GRANT INSERT ON public.audit_logs TO authenticated;

COMMIT;
