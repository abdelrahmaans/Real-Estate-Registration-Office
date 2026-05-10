# Phase 2: Supabase Configuration Checklist

## ✅ COMPLETED STEPS (Frontend Setup)

- ✅ Environment files configured with your credentials
- ✅ Supabase service created (`src/app/core/services/supabase.service.ts`)
- ✅ Authentication service created (`src/app/core/services/auth.service.ts`)
- ✅ Auth guard created (`src/app/core/guards/auth.guard.ts`)
- ✅ Database schema document created (`DATABASE_SCHEMA.md`)

---

## 📋 TASKS YOU NEED TO COMPLETE IN SUPABASE

### TASK 1: Create Database Schema ⚠️

**IMPORTANT:** Execute database schema in this order:

1. **Open Your Supabase Dashboard**
   - Go to: `https://supabase.com`
   - Sign in with your account

2. **Navigate to SQL Editor**
   - In left sidebar, click "SQL Editor"
   - Click "New Query"

3. **Execute Schema Sections One By One**

   From the `DATABASE_SCHEMA.md` file in your project root:

   - **SECTION 1:** Extensions (Execute first)
     - Copy all content from "Enable Extensions"
     - Run it
     - Wait for success ✓

   - **SECTION 2:** Core Tables
     - Copy each subsection (2.1, 2.2, 2.3, 2.4, 2.5)
     - Run each one separately
     - Wait for success ✓

   - **SECTION 3:** Attachment Tables
     - Copy all content
     - Run it
     - Wait for success ✓

   - **SECTION 4:** Audit & Permission Tables
     - Copy all content
     - Run it
     - Wait for success ✓

   - **SECTION 5:** Create Views
     - Copy all content
     - Run it
     - Wait for success ✓

   - **SECTION 6:** Enable Row Level Security (RLS)
     - Copy subsection 6.1 (Enable RLS)
     - Run it
     - Wait for success ✓
     - Then copy subsection 6.2 (Create Policies)
     - Run it
     - Wait for success ✓

---

### TASK 2: Create Storage Buckets

After schema is created, create storage buckets for file uploads:

**In Supabase Dashboard:**

1. Go to **Storage** (left sidebar)
2. Click **Create New Bucket** button
3. Create these buckets:

   - **Bucket Name:** `employees-profiles`
     - Private ✓
     - Purpose: Employee profile images

   - **Bucket Name:** `letter-attachments`
     - Private ✓
     - Purpose: Letter documents and files

   - **Bucket Name:** `complaint-attachments`
     - Private ✓
     - Purpose: Complaint documents

   - **Bucket Name:** `office-order-attachments`
     - Private ✓
     - Purpose: Office order documents

For each bucket:

- Set to **Private** (not public)
- Click **Create bucket**

---

### TASK 3: Create Test User for Development

In Supabase Auth:

1. Go to **Authentication** → **Users** (left sidebar)
2. Click **Add User** button
3. Fill in:
   - Email: `admin@registry.test`
   - Password: `TempPassword123!` (change after testing)
4. Click **Create User**

**Note:** You'll use this user to test login in the app

---

### TASK 4: Update User Role (SQL Query)

After creating the test user, you need to set its role. Run this SQL:

```sql
UPDATE users 
SET role = 'admin', 
    full_name = 'Admin User',
    department = 'Administration'
WHERE email = 'admin@registry.test';
```

**Note:** You need the UUID of the user. Get it from:

- Auth → Users → Find your user → Copy the UUID

Replace the UUID in:

```sql
UPDATE auth.users 
SET user_metadata = jsonb_set(
  COALESCE(user_metadata, '{}'::jsonb),
  '{role}',
  '"admin"'
) 
WHERE email = 'admin@registry.test';
```

---

## ⏳ EXECUTION TIMELINE

**Estimated time to complete all tasks: 15-20 minutes**

---

## 🎯 VERIFICATION STEPS

After completing all Supabase tasks:

1. **Verify Schema**
   - Go to Database → Tables
   - You should see: users, employees, letters, complaints, office_orders, etc.

2. **Verify Buckets**
   - Go to Storage
   - You should see: employees-profiles, letter-attachments, complaint-attachments, office-order-attachments

3. **Verify Test User**
   - Go to Authentication → Users
   - You should see: <admin@registry.test>

4. **Verify RLS**
   - Go to Database → Tables
   - Click any table → Policies tab
   - You should see multiple policies listed

---

## 🚀 NEXT PHASE

After completing all Supabase tasks, we'll:

✅ Test the connection from Angular app  
✅ Build the Login page  
✅ Build the Dashboard  
✅ Build Employee Management module  
✅ And continue with all other modules...

---

## 📞 COMMON ISSUES & SOLUTIONS

### Issue: "Permission denied" on RLS policies

**Solution:** Make sure you're an admin user in Supabase and have proper permissions

### Issue: Tables not showing in Database view

**Solution:** Refresh the page (F5) or click on different section and come back

### Issue: Storage bucket creation fails

**Solution:** Check bucket name is unique (no special characters except hyphens)

---

**⏳ Please complete all Supabase tasks, then let me know you're done so we can move to Phase 3!** ✋
