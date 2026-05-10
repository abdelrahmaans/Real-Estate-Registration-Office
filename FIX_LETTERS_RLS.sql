-- Fix Letters Table RLS policies to use JWT claims instead of recursive queries
-- Run this in Supabase SQL Editor once as a project owner

BEGIN;

-- Drop all policies on letters table
DROP POLICY IF EXISTS "Users can view active letters" ON letters;
DROP POLICY IF EXISTS "Data entry users can create letters" ON letters;
DROP POLICY IF EXISTS "Users can update own letters" ON letters;
DROP POLICY IF EXISTS "Authenticated users can create letters" ON letters;

-- 1) SELECT: All authenticated users can view active letters
CREATE POLICY "Users can view active letters"
ON letters FOR SELECT
USING (
  auth.role() = 'authenticated' AND deleted_at IS NULL
);

-- 2) INSERT: Allow authenticated users to create letters (no role check, based on JWT)
CREATE POLICY "Authenticated users can create letters"
ON letters FOR INSERT
WITH CHECK (
  auth.role() = 'authenticated'
);

-- 3) UPDATE: Creators or admins can update letters
CREATE POLICY "Users can update own letters"
ON letters FOR UPDATE
USING (
  created_by = auth.uid() 
  OR COALESCE(
    auth.jwt() -> 'app_metadata' ->> 'role',
    auth.jwt() -> 'user_metadata' ->> 'role',
    ''
  ) = 'admin'
)
WITH CHECK (
  created_by = auth.uid() 
  OR COALESCE(
    auth.jwt() -> 'app_metadata' ->> 'role',
    auth.jwt() -> 'user_metadata' ->> 'role',
    ''
  ) = 'admin'
);

COMMIT;
