-- Combined RLS fix + public.users upsert
-- Run this in Supabase SQL Editor once as a project owner.

BEGIN;

-- 0) Ensure the test auth user has role metadata set (safe update)
UPDATE auth.users
SET raw_app_meta_data = jsonb_set(COALESCE(raw_app_meta_data, '{}'::jsonb), '{role}', '"admin"'),
    raw_user_meta_data = jsonb_set(COALESCE(raw_user_meta_data, '{}'::jsonb), '{role}', '"admin"')
WHERE email = 'admin@registry.test';

-- 0.5) Upsert a matching row in public.users using the auth user id
WITH a AS (
  SELECT id, email FROM auth.users WHERE email = 'admin@registry.test' LIMIT 1
)
INSERT INTO public.users (id, email, full_name, role, created_at, updated_at)
SELECT id, email, 'Admin User', 'admin', NOW(), NOW() FROM a
ON CONFLICT (id) DO UPDATE
  SET email = EXCLUDED.email,
      role = EXCLUDED.role,
      full_name = EXCLUDED.full_name,
      updated_at = NOW();

-- 1) Drop any existing recursive/old policies (schema-qualified)
DROP POLICY IF EXISTS "Admin can view all users" ON auth.users;
DROP POLICY IF EXISTS "Admin can update users" ON auth.users;
DROP POLICY IF EXISTS "Admin can soft delete users" ON auth.users;
DROP POLICY IF EXISTS "Users can view own profile" ON auth.users;

DROP POLICY IF EXISTS "Managers can view all employees" ON public.employees;
DROP POLICY IF EXISTS "Admins can create employees" ON public.employees;
DROP POLICY IF EXISTS "Admins can update employees" ON public.employees;

-- 2) Recreate safe auth.users policies using JWT role claims (no self-query)
CREATE POLICY "Users can view own profile"
ON auth.users FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Admins can view all users"
ON auth.users FOR SELECT
USING (
  COALESCE(
    auth.jwt() -> 'app_metadata' ->> 'role',
    auth.jwt() -> 'user_metadata' ->> 'role',
    ''
  ) = 'admin'
);

CREATE POLICY "Admins can update users"
ON auth.users FOR UPDATE
USING (
  COALESCE(
    auth.jwt() -> 'app_metadata' ->> 'role',
    auth.jwt() -> 'user_metadata' ->> 'role',
    ''
  ) = 'admin'
)
WITH CHECK (
  COALESCE(
    auth.jwt() -> 'app_metadata' ->> 'role',
    auth.jwt() -> 'user_metadata' ->> 'role',
    ''
  ) = 'admin'
);

CREATE POLICY "Admins can soft delete users"
ON auth.users FOR UPDATE
USING (
  COALESCE(
    auth.jwt() -> 'app_metadata' ->> 'role',
    auth.jwt() -> 'user_metadata' ->> 'role',
    ''
  ) = 'admin'
)
WITH CHECK (
  COALESCE(
    auth.jwt() -> 'app_metadata' ->> 'role',
    auth.jwt() -> 'user_metadata' ->> 'role',
    ''
  ) = 'admin'
);

-- 3) Employees policies (allow insert when created_by == auth.uid() OR admin)
CREATE POLICY "Managers can view all employees"
ON public.employees FOR SELECT
USING (
  COALESCE(
    auth.jwt() -> 'app_metadata' ->> 'role',
    auth.jwt() -> 'user_metadata' ->> 'role',
    ''
  ) IN ('admin', 'technical_manager')
  OR (auth.role() = 'authenticated' AND deleted_at IS NULL)
);

CREATE POLICY "Admins can create employees"
ON public.employees FOR INSERT
WITH CHECK (
  COALESCE(
    auth.jwt() -> 'app_metadata' ->> 'role',
    auth.jwt() -> 'user_metadata' ->> 'role',
    ''
  ) = 'admin'
  OR created_by = auth.uid()
);

CREATE POLICY "Admins can update employees"
ON public.employees FOR UPDATE
USING (
  COALESCE(
    auth.jwt() -> 'app_metadata' ->> 'role',
    auth.jwt() -> 'user_metadata' ->> 'role',
    ''
  ) = 'admin'
  OR created_by = auth.uid()
)
WITH CHECK (
  COALESCE(
    auth.jwt() -> 'app_metadata' ->> 'role',
    auth.jwt() -> 'user_metadata' ->> 'role',
    ''
  ) = 'admin'
  OR created_by = auth.uid()
);

COMMIT;
