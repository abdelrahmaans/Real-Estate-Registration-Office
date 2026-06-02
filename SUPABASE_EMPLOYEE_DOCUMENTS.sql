BEGIN;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

CREATE TABLE IF NOT EXISTS public.employee_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  document_type VARCHAR(50) NOT NULL DEFAULT 'other',
  file_name VARCHAR(255) NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT,
  mime_type VARCHAR(150),
  issued_at DATE,
  notes TEXT,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  CONSTRAINT employee_documents_type_check CHECK (
    document_type IN ('leave', 'appointment', 'national_id', 'medical', 'disciplinary', 'other')
  )
);

CREATE INDEX IF NOT EXISTS idx_employee_documents_employee_id
  ON public.employee_documents(employee_id);

CREATE INDEX IF NOT EXISTS idx_employee_documents_type
  ON public.employee_documents(document_type);

CREATE INDEX IF NOT EXISTS idx_employee_documents_uploaded_at
  ON public.employee_documents(uploaded_at DESC);

CREATE INDEX IF NOT EXISTS idx_employee_documents_deleted_at
  ON public.employee_documents(deleted_at);

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'employee-documents',
  'employee-documents',
  false,
  52428800,
  ARRAY[
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

ALTER TABLE public.employee_documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view employee documents"
  ON public.employee_documents;
CREATE POLICY "Authenticated users can view employee documents"
  ON public.employee_documents
  FOR SELECT
  TO authenticated
  USING (deleted_at IS NULL);

DROP POLICY IF EXISTS "Authenticated users can create employee documents"
  ON public.employee_documents;
CREATE POLICY "Authenticated users can create employee documents"
  ON public.employee_documents
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can update employee documents"
  ON public.employee_documents;
CREATE POLICY "Authenticated users can update employee documents"
  ON public.employee_documents
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can read employee document files"
  ON storage.objects;
CREATE POLICY "Authenticated users can read employee document files"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (bucket_id = 'employee-documents');

DROP POLICY IF EXISTS "Authenticated users can upload employee document files"
  ON storage.objects;
CREATE POLICY "Authenticated users can upload employee document files"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'employee-documents');

DROP POLICY IF EXISTS "Authenticated users can update employee document files"
  ON storage.objects;
CREATE POLICY "Authenticated users can update employee document files"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'employee-documents')
  WITH CHECK (bucket_id = 'employee-documents');

DROP POLICY IF EXISTS "Authenticated users can delete employee document files"
  ON storage.objects;
CREATE POLICY "Authenticated users can delete employee document files"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'employee-documents');

CREATE OR REPLACE VIEW public.active_employee_documents AS
SELECT
  d.*,
  e.employee_id AS employee_code,
  e.full_name AS employee_name,
  e.office_code,
  e.office_name,
  e.job_title
FROM public.employee_documents d
JOIN public.employees e ON e.id = d.employee_id
WHERE d.deleted_at IS NULL
  AND e.deleted_at IS NULL
ORDER BY d.uploaded_at DESC;

COMMIT;
