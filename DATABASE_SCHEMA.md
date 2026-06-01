# Database Schema Setup Guide

This document contains all SQL commands to set up your Supabase PostgreSQL database for the Real Estate Registration Office Management System.

> Latest employee roster updates are maintained in `SUPABASE_IMPORT_EMPLOYEES_2026.sql`. Run that import after this base schema to add the 2026 office fields and employee records.

## Steps to Execute

1. Open your Supabase dashboard
2. Go to SQL Editor
3. Create a new query
4. Copy and paste each section below
5. Execute each section one by one

---

## SECTION 1: Enable Extensions

```sql
-- Enable UUID extension for generating UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable Full-text search
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
```

**Execute this first**, then proceed to SECTION 2.

---

## SECTION 2: Create Core Tables

### 2.1 Users Table

```sql
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  department VARCHAR(100),
  role VARCHAR(50) NOT NULL DEFAULT 'data_entry',
  is_active BOOLEAN DEFAULT true,
  profile_image_url VARCHAR(500),
  last_login_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP DEFAULT NULL,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL
);

-- Create index on email for faster lookups
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_is_active ON users(is_active);
CREATE INDEX idx_users_deleted_at ON users(deleted_at);
```

### 2.2 Employees Table

```sql
CREATE TABLE IF NOT EXISTS employees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id VARCHAR(50) UNIQUE NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  national_id VARCHAR(20) UNIQUE NOT NULL,
  mobile_number VARCHAR(20) NOT NULL,
  secondary_phone VARCHAR(20),
  email VARCHAR(255) NOT NULL,
  address TEXT,
  department VARCHAR(100) NOT NULL,
  job_title VARCHAR(100) NOT NULL,
  employment_date DATE NOT NULL,
  retirement_date DATE,
  employment_status VARCHAR(50) DEFAULT 'active', -- active, retired, resigned
  notes TEXT,
  profile_image_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP DEFAULT NULL,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL
);

-- Create indexes
CREATE INDEX idx_employees_employee_id ON employees(employee_id);
CREATE INDEX idx_employees_national_id ON employees(national_id);
CREATE INDEX idx_employees_full_name ON employees(full_name);
CREATE INDEX idx_employees_department ON employees(department);
CREATE INDEX idx_employees_status ON employees(employment_status);
CREATE INDEX idx_employees_deleted_at ON employees(deleted_at);

-- Enable full-text search on name
CREATE INDEX idx_employees_name_trgm ON employees USING gin(full_name gin_trgm_ops);
```

### 2.3 Letters Table (Incoming & Outgoing)

```sql
CREATE TABLE IF NOT EXISTS letters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  letter_number VARCHAR(50) UNIQUE NOT NULL,
  serial_number VARCHAR(100) UNIQUE NOT NULL,
  type VARCHAR(50) NOT NULL, -- 'incoming', 'outgoing'
  category VARCHAR(50) NOT NULL, -- 'general', 'authority'
  letter_date DATE NOT NULL,
  sender VARCHAR(255),
  receiver VARCHAR(255),
  subject VARCHAR(500) NOT NULL,
  summary TEXT,
  priority VARCHAR(20) DEFAULT 'normal', -- low, normal, high, urgent
  status VARCHAR(50) DEFAULT 'new', -- new, processing, completed, archived
  attachments_count INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP DEFAULT NULL,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL
);

-- Create indexes
CREATE INDEX idx_letters_number ON letters(letter_number);
CREATE INDEX idx_letters_serial_number ON letters(serial_number);
CREATE INDEX idx_letters_type ON letters(type);
CREATE INDEX idx_letters_category ON letters(category);
CREATE INDEX idx_letters_date ON letters(letter_date);
CREATE INDEX idx_letters_status ON letters(status);
CREATE INDEX idx_letters_priority ON letters(priority);
CREATE INDEX idx_letters_deleted_at ON letters(deleted_at);

-- Enable full-text search
CREATE INDEX idx_letters_subject_trgm ON letters USING gin(subject gin_trgm_ops);
```

### 2.4 Complaints Table

```sql
CREATE TABLE IF NOT EXISTS complaints (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  complaint_number VARCHAR(50) UNIQUE NOT NULL,
  complainant_name VARCHAR(255) NOT NULL,
  national_id VARCHAR(20),
  phone VARCHAR(20) NOT NULL,
  address TEXT,
  complaint_reason VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'new', -- new, under_review, resolved, closed
  attachments_count INTEGER DEFAULT 0,
  assigned_employee_id UUID REFERENCES employees(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP DEFAULT NULL,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL
);

-- Create indexes
CREATE INDEX idx_complaints_number ON complaints(complaint_number);
CREATE INDEX idx_complaints_status ON complaints(status);
CREATE INDEX idx_complaints_date ON complaints(created_at);
CREATE INDEX idx_complaints_assigned_employee ON complaints(assigned_employee_id);
CREATE INDEX idx_complaints_deleted_at ON complaints(deleted_at);
```

### 2.5 Office Orders Table

```sql
CREATE TABLE IF NOT EXISTS office_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number VARCHAR(50) UNIQUE NOT NULL,
  order_date DATE NOT NULL,
  subject VARCHAR(500) NOT NULL,
  description TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE,
  status VARCHAR(50) DEFAULT 'active', -- active, completed, cancelled
  attachments_count INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP DEFAULT NULL,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL
);

-- Create indexes
CREATE INDEX idx_office_orders_number ON office_orders(order_number);
CREATE INDEX idx_office_orders_date ON office_orders(order_date);
CREATE INDEX idx_office_orders_status ON office_orders(status);
CREATE INDEX idx_office_orders_deleted_at ON office_orders(deleted_at);
```

---

## SECTION 3: Create Attachment Tables

### 3.1 Letter Attachments

```sql
CREATE TABLE IF NOT EXISTS letter_attachments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  letter_id UUID NOT NULL REFERENCES letters(id) ON DELETE CASCADE,
  filename VARCHAR(500) NOT NULL,
  file_url VARCHAR(1000) NOT NULL,
  file_size BIGINT NOT NULL,
  mime_type VARCHAR(100),
  uploaded_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_letter_attachments_letter_id ON letter_attachments(letter_id);
```

### 3.2 Complaint Attachments

```sql
CREATE TABLE IF NOT EXISTS complaint_attachments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  complaint_id UUID NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
  filename VARCHAR(500) NOT NULL,
  file_url VARCHAR(1000) NOT NULL,
  file_size BIGINT NOT NULL,
  mime_type VARCHAR(100),
  uploaded_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_complaint_attachments_complaint_id ON complaint_attachments(complaint_id);
```

### 3.3 Office Order Attachments

```sql
CREATE TABLE IF NOT EXISTS office_order_attachments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  office_order_id UUID NOT NULL REFERENCES office_orders(id) ON DELETE CASCADE,
  filename VARCHAR(500) NOT NULL,
  file_url VARCHAR(1000) NOT NULL,
  file_size BIGINT NOT NULL,
  mime_type VARCHAR(100),
  uploaded_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_office_order_attachments_office_order_id ON office_order_attachments(office_order_id);
```

---

## SECTION 4: Create Audit & Permission Tables

### 4.1 Audit Logs Table

```sql
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  module VARCHAR(100) NOT NULL,
  record_id UUID,
  old_value JSONB,
  new_value JSONB,
  ip_address VARCHAR(45),
  user_agent TEXT,
  timestamp TIMESTAMP DEFAULT NOW()
);

-- Create indexes for audit searches
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_module ON audit_logs(module);
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp);
```

### 4.2 User Permissions Table

```sql
CREATE TABLE IF NOT EXISTS user_permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  module VARCHAR(100) NOT NULL,
  action VARCHAR(100) NOT NULL, -- create, read, update, delete, export
  granted_at TIMESTAMP DEFAULT NOW(),
  granted_by UUID REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_user_permissions_user_id ON user_permissions(user_id);
CREATE INDEX idx_user_permissions_module_action ON user_permissions(module, action);
```

### 4.3 Notifications Table

```sql
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50) DEFAULT 'info', -- info, success, warning, error
  related_module VARCHAR(100),
  related_record_id UUID,
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);
```

---

## SECTION 5: Create Views for Common Queries

### 5.1 Active Employees View

```sql
CREATE OR REPLACE VIEW active_employees AS
SELECT * FROM employees
WHERE deleted_at IS NULL AND employment_status = 'active'
ORDER BY full_name;
```

### 5.2 Pending Complaints View

```sql
CREATE OR REPLACE VIEW pending_complaints AS
SELECT * FROM complaints
WHERE deleted_at IS NULL 
  AND status IN ('new', 'under_review')
ORDER BY created_at DESC;
```

### 5.3 Active Letters View

```sql
CREATE OR REPLACE VIEW active_letters AS
SELECT * FROM letters
WHERE deleted_at IS NULL AND status != 'archived'
ORDER BY letter_date DESC;
```

---

## SECTION 6: Enable Row Level Security (RLS)

This is crucial for security - it ensures users can only see data they should see.

### 6.1 Enable RLS on all tables

```sql
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE letters ENABLE ROW LEVEL SECURITY;
ALTER TABLE complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE office_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE letter_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE complaint_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE office_order_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
```

### 6.2 Create RLS Policies

#### Users Table Policies

```sql
-- Users can view their own profile
CREATE POLICY "Users can view own profile"
ON users FOR SELECT
USING (auth.uid() = id);

-- Admin can view all users
CREATE POLICY "Admin can view all users"
ON users FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Admin can update users
CREATE POLICY "Admin can update users"
ON users FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Admin can delete users (soft delete)
CREATE POLICY "Admin can soft delete users"
ON users FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
  )
);
```

#### Employees Table Policies

```sql
-- All authenticated users can view active employees
CREATE POLICY "Authenticated users can view active employees"
ON employees FOR SELECT
USING (
  auth.role() = 'authenticated' AND deleted_at IS NULL
);

-- Managers and Admin can view all employees
CREATE POLICY "Managers can view all employees"
ON employees FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND (role = 'admin' OR role = 'technical_manager')
  )
);

-- Only admins can create employees
CREATE POLICY "Admins can create employees"
ON employees FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Only admins and creators can update employees
CREATE POLICY "Admins can update employees"
ON employees FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
  )
  OR created_by = auth.uid()
);
```

#### Letters Table Policies

```sql
-- All authenticated users can view active letters
CREATE POLICY "Users can view active letters"
ON letters FOR SELECT
USING (
  auth.role() = 'authenticated' AND deleted_at IS NULL
);

-- Data entry users can create letters
CREATE POLICY "Data entry users can create letters"
ON letters FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND (role = 'data_entry' OR role = 'admin' OR role = 'assistant_secretary')
  )
);

-- Creators and admins can update letters
CREATE POLICY "Users can update own letters"
ON letters FOR UPDATE
USING (
  created_by = auth.uid() 
  OR EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
  )
);
```

#### Complaints Table Policies

```sql
-- All authenticated users can view complaints
CREATE POLICY "Users can view complaints"
ON complaints FOR SELECT
USING (
  auth.role() = 'authenticated' AND deleted_at IS NULL
);

-- Data entry can create complaints
CREATE POLICY "Data entry can create complaints"
ON complaints FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND role = 'data_entry'
  )
);

-- Admins and assigned users can update
CREATE POLICY "Admins and assigned can update complaints"
ON complaints FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
  )
  OR assigned_employee_id = auth.uid()
);
```

#### Office Orders Table Policies

```sql
-- All authenticated users can view
CREATE POLICY "Users can view office orders"
ON office_orders FOR SELECT
USING (
  auth.role() = 'authenticated' AND deleted_at IS NULL
);

-- Only admins can manage
CREATE POLICY "Admins can manage office orders"
ON office_orders FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
  )
);
```

#### Attachments Table Policies

```sql
-- Users can view attachments for letters they can see
CREATE POLICY "Users can view letter attachments"
ON letter_attachments FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM letters 
    WHERE letters.id = letter_attachments.letter_id 
    AND auth.role() = 'authenticated'
  )
);

-- Similar for complaints and orders...
```

#### Notifications Table Policies

```sql
-- Users can only view their own notifications
CREATE POLICY "Users can view own notifications"
ON notifications FOR SELECT
USING (user_id = auth.uid());

-- Users can update their own notifications
CREATE POLICY "Users can update own notifications"
ON notifications FOR UPDATE
USING (user_id = auth.uid());
```

---

## How to Execute

1. **Open Supabase Dashboard**
2. **Go to SQL Editor**
3. **Copy each SECTION** (one at a time)
4. **Paste into the SQL Editor**
5. **Click "Run" or press Ctrl+Enter**
6. **Wait for success message**
7. **Move to next section**

---

## Important Notes

- Execute sections in order (1 → 2 → 3 → 4 → 5 → 6)
- Sections 1, 2, 3, 4, 5 can be executed together, but SECTION 6 (RLS) should be executed last
- RLS policies are critical for security
- Soft delete strategy is used (deleted_at field instead of actual deletion)

---

## Next Steps

After the database is set up:

1. Create storage buckets for files
2. Create authentication users
3. Test connections from Angular app
4. Begin building the authentication module
