# Quick Reference Guide

## 📂 KEY FILES IN YOUR PROJECT

### Configuration

- `src/environments/environment.ts` - Dev config with Supabase credentials
- `src/environments/environment.prod.ts` - Prod config
- `tsconfig.json` - TypeScript path aliases

### Backend Services

- `src/app/core/services/supabase.service.ts` - Supabase client
- `src/app/core/services/auth.service.ts` - Authentication logic
- `src/app/core/guards/auth.guard.ts` - Route guards

### Models & Interfaces

- `src/app/models/common.model.ts` - Shared interfaces
- `src/app/core/models/auth.model.ts` - Auth interfaces

### Documentation

- `DATABASE_SCHEMA.md` - SQL database setup (copy-paste SQL)
- `PHASE2_SUPABASE_SETUP.md` - Supabase setup checklist
- `PHASE2_SUMMARY.md` - Phase 2 overview
- `README_SETUP.md` - Project documentation

---

## 🎮 TERMINAL COMMANDS

### Development

```bash
npm start              # Start dev server (localhost:4200)
npm run build          # Build for production
npm test               # Run tests
```

### Package Management

```bash
npm install            # Install dependencies
npm list               # List installed packages
npm update             # Update packages
```

### Build & Lint

```bash
npm run build          # Production build
ng lint                # Lint code (if configured)
```

---

## 🔗 IMPORTANT URLS

### Your Application

- **Dev:** <http://localhost:4200>
- **Dashboard:** <https://supabase.com>

### Supabase Project

- **URL:** <https://yuceeevkutrekltzfhyp.supabase.co>
- **Dashboard:** <https://app.supabase.com>
- **Project Ref:** yuceeevkutrekltzfhyp

---

## 📊 PATH ALIASES (for imports)

Use these in your code for clean imports:

```typescript
// Instead of:
import { AuthService } from '../../../core/services/auth.service';

// Use:
import { AuthService } from '@core/services/auth.service';
```

Available aliases:

- `@app/*` → `src/app/*`
- `@core/*` → `src/app/core/*`
- `@shared/*` → `src/app/shared/*`
- `@modules/*` → `src/app/modules/*`
- `@services/*` → `src/app/services/*`
- `@models/*` → `src/app/models/*`
- `@environments/*` → `src/environments/*`
- `@layouts/*` → `src/app/layouts/*`

---

## 🏗️ PROJECT FOLDER STRUCTURE

```
d:\FullRoute\Frontend\Registry\Registry\
├── src/
│   ├── app/
│   │   ├── core/              # Services, guards, interceptors
│   │   ├── shared/            # Reusable components
│   │   ├── layouts/           # App layouts
│   │   ├── modules/           # Feature modules
│   │   ├── services/          # App services
│   │   ├── models/            # Shared interfaces
│   │   └── app.ts             # Root component
│   ├── environments/          # Config files
│   ├── main.ts                # Entry point
│   ├── index.html             # HTML template
│   └── styles.css             # Global styles
├── public/                    # Static assets
├── angular.json               # Angular config
├── tsconfig.json              # TypeScript config
├── package.json               # npm dependencies
└── README.md                  # Project readme
```

---

## 🗄️ DATABASE TABLES (Created in Phase 2)

```sql
-- Main tables
users                         # User profiles
employees                     # Employee records
letters                       # Incoming/outgoing letters
complaints                    # Complaint records
office_orders                 # Office orders

-- Attachment tables
letter_attachments            # Letter files
complaint_attachments         # Complaint files
office_order_attachments      # Order files

-- System tables
audit_logs                    # Change audit trail
user_permissions              # Role permissions
notifications                 # User notifications
```

---

## 👥 USER ROLES

```typescript
enum UserRole {
  ADMIN = 'admin',                          # Full access
  ASSISTANT_SECRETARY = 'assistant_secretary', # Admin tasks
  TECHNICAL_MANAGER = 'technical_manager',  # Tech operations
  DATA_ENTRY = 'data_entry',               # Input only
}
```

---

## 🔐 SUPABASE CREDENTIALS (DO NOT COMMIT)

```
Project URL:      https://yuceeevkutrekltzfhyp.supabase.co
Publishable Key:  sb_publishable_d_0guCUCb4K_hDm7HNNgvQ_YgM5RTEt
Service Role Key: [KEEP SECURE - IN ENVIRONMENT FILES ONLY]
```

**⚠️ SECURITY WARNING:**

- Never commit credentials to Git
- Never log credentials to console
- Use `.gitignore` to exclude environment files
- Use environment variables in production

---

## 📝 ANGULAR CODING STANDARDS

### Standalone Components

```typescript
import { Component } from '@angular/core';

@Component({
  selector: 'app-login',
  standalone: true,           // Always use standalone
  imports: [CommonModule],    // Import needed modules
  template: `<div>...</div>`,
})
export class LoginComponent {}
```

### Signals (State Management)

```typescript
import { signal, computed } from '@angular/core';

export class MyComponent {
  count = signal(0);
  doubled = computed(() => this.count() * 2);
  
  increment() {
    this.count.update(v => v + 1);
  }
}
```

### Services with Dependency Injection

```typescript
import { inject } from '@angular/core';

export class MyService {
  private auth = inject(AuthService);
  
  doSomething() {
    if (this.auth.isAuthenticated()) {
      // ...
    }
  }
}
```

### Templates - Modern Syntax

```html
<!-- Use @if instead of *ngIf -->
@if (user) {
  <p>{{ user.name }}</p>
}

<!-- Use @for instead of *ngFor -->
@for (item of items; track item.id) {
  <div>{{ item.name }}</div>
}

<!-- Use @switch instead of *ngSwitch -->
@switch (status) {
  @case ('active') {
    <span>Active</span>
  }
  @case ('inactive') {
    <span>Inactive</span>
  }
  @default {
    <span>Unknown</span>
  }
}
```

---

## 🎨 TAILWIND CSS CLASSES

### Common Classes

```html
<!-- Layout -->
<div class="flex items-center justify-between">

<!-- Spacing -->
<div class="p-4 m-2 gap-4">

<!-- Colors -->
<div class="bg-blue-500 text-white">

<!-- Responsive -->
<div class="md:text-lg lg:p-8">

<!-- Hover -->
<button class="hover:bg-blue-600">

<!-- Dark Mode -->
<div class="dark:bg-gray-800">
```

---

## 🧪 TESTING

### Run Tests

```bash
npm test
```

### Test File Naming

```
my.component.spec.ts    # Unit tests
my.service.spec.ts      # Service tests
```

---

## 🐛 DEBUGGING

### Chrome DevTools

1. Open app: `http://localhost:4200`
2. Press `F12` to open DevTools
3. Go to Sources tab
4. Set breakpoints in code
5. Step through execution

### Console Logging

```typescript
console.log('Value:', value);        // Info
console.error('Error:', error);      // Error
console.warn('Warning:', warning);   // Warning
```

---

## 📦 INSTALLED PACKAGES

### Core Angular

```
@angular/core
@angular/common
@angular/router
@angular/forms
@angular/platform-browser
```

### UI & Styling

```
@angular/material
@angular/cdk
tailwindcss
ng-zorro-antd
```

### Backend

```
@supabase/supabase-js
axios
rxjs
```

### Development

```
typescript
vitest
prettier
```

---

## 🚀 DEPLOYMENT CHECKLIST

### Before Production Build

- [ ] Update environment.prod.ts
- [ ] Remove console.log statements
- [ ] Test login flow
- [ ] Test all modules
- [ ] Check responsive design
- [ ] Test on different browsers

### Build for Production

```bash
npm run build --configuration production
```

### Deployment Options

- **Vercel** (Recommended)
- **Netlify**
- **Firebase Hosting**
- **GitHub Pages**

---

## 📞 COMMON ISSUES & SOLUTIONS

### Issue: Cannot find module

**Solution:** Check path aliases in tsconfig.json or verify file exists

### Issue: Port 4200 already in use

**Solution:** `ng serve --port 4201` or `netstat -ano | findstr :4200`

### Issue: Build errors

**Solution:**

```bash
rm -rf node_modules dist
npm install
npm run build
```

### Issue: Auth token expired

**Solution:** Check Supabase session refresh settings in environment.ts

---

## ✅ SUCCESS INDICATORS

- ✅ App builds without errors: `npm run build`
- ✅ Dev server runs: `npm start`
- ✅ All files have TypeScript types (no `any` type)
- ✅ Code follows Angular standards
- ✅ Path aliases work in imports
- ✅ Supabase connects successfully

---

**Last Updated:** Phase 2
**Next Phase:** Phase 3 - Authentication Module
