# Real Estate Registration Office Management System

An enterprise-grade system for managing registration office operations including employees, incoming/outgoing letters, complaints, and office orders.

## 🏗️ Architecture Overview

### **Frontend Stack**

- **Framework**: Angular 21
- **UI Framework**: Angular Material + Tailwind CSS
- **State Management**: Angular Signals
- **HTTP Client**: RxJS + Axios
- **Routing**: Angular Router with Lazy Loading
- **RTL Support**: Full Arabic localization
- **Styling**: Tailwind CSS with Responsive Design

### **Backend Stack**

- **Backend Service**: Supabase
- **Database**: PostgreSQL
- **Authentication**: Supabase Auth (JWT-based)
- **File Storage**: Supabase Storage
- **Security**: Row Level Security (RLS) Policies
- **Real-time**: Supabase Realtime

## 📁 Project Structure

```
src/app/
├── core/                      # Core module (services, guards, interceptors)
│   ├── guards/                # Route protection (Auth guard)
│   ├── interceptors/          # HTTP interceptors (Auth, Error handling)
│   ├── services/              # Core services (Auth, Supabase, Storage)
│   └── models/                # Core interfaces
├── shared/                    # Reusable components and utilities
│   ├── components/            # Shared UI components
│   │   ├── navbar/            # Top navigation bar
│   │   ├── sidebar/           # Side navigation
│   │   ├── loading-spinner/   # Loading indicator
│   │   ├── empty-state/       # Empty state placeholder
│   │   └── data-table/        # Reusable data table
│   ├── pipes/                 # Custom pipes
│   └── directives/            # Custom directives
├── layouts/                   # Layout components
│   ├── main-layout/           # Main app layout
│   └── auth-layout/           # Auth pages layout
├── modules/                   # Feature modules (lazy-loaded)
│   ├── auth/                  # Authentication
│   ├── dashboard/             # Dashboard
│   ├── employees/             # Employee Management
│   ├── letters/               # Letters Management
│   ├── complaints/            # Complaints Management
│   ├── office-orders/         # Office Orders
│   ├── users/                 # User Management
│   └── settings/              # System Settings
├── services/                  # Application services
├── models/                    # Shared interfaces
└── environments/              # Environment configuration
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm 9+

### Installation

1. **Install Dependencies**

   ```bash
   npm install
   ```

2. **Configure Environment**
   Update `src/environments/environment.ts` with your Supabase credentials:

   ```typescript
   export const environment = {
     production: false,
     supabase: {
       url: 'YOUR_SUPABASE_URL',
       anonKey: 'YOUR_SUPABASE_ANON_KEY',
     },
   };
   ```

3. **Start Development Server**

   ```bash
   npm start
   ```

   Navigate to `http://localhost:4200/`

### Build

```bash
npm run build
```

### Run Tests

```bash
npm test
```

## 🔐 Authentication & Security

- **JWT-based Authentication** via Supabase Auth
- **Role-Based Access Control** (RBAC)
- **Route Guards** for protected routes
- **HTTP Interceptors** for token management
- **Row Level Security** policies on database

### User Roles

- **Admin**: Full system access
- **Assistant Secretary**: Administrative tasks
- **Technical Manager**: Technical operations
- **Data Entry**: Data input only

## 📦 Modules

### 1. **Auth Module**

- User login/logout
- Password reset
- Session management
- Protected routes

### 2. **Dashboard Module**

- System statistics
- Charts and analytics
- Recent activities
- Quick access

### 3. **Employees Module**

- Employee CRUD operations
- Advanced filtering and search
- Profile management
- Image uploads
- Export (PDF/Excel)

### 4. **Letters Module**

- Incoming/Outgoing letters management
- Document uploads
- Serial number generation
- Archive system
- Advanced filtering

### 5. **Complaints Module**

- Complaint registration
- Status tracking
- Employee assignment
- Attachment handling

### 6. **Office Orders Module**

- Order management
- Date range tracking
- Status management

### 7. **Users Module**

- User management
- Role assignment
- Permission control

### 8. **Settings Module**

- System configuration
- User preferences
- Audit logs

## 🛠️ Development Workflow

### Path Aliases

Use these convenient path aliases in imports:

```typescript
import { AuthService } from '@core/services/auth.service';
import { DataTableComponent } from '@shared/components/data-table';
import { CommonModel } from '@models/common.model';
```

### Adding a New Feature

1. Create feature folder under `modules/`
2. Generate pages, services, models
3. Create feature routing
4. Implement lazy loading in main routes
5. Add route guards if needed

### Code Standards

- **Standalone Components**: Use `standalone: true`
- **Strict Typing**: Avoid `any` type
- **Signals**: Use for local state management
- **RxJS**: Use for async operations
- **Change Detection**: Use `OnPush` strategy
- **Naming**: Use clear, descriptive names

## 🔄 Environment Variables

### Development

```
src/environments/environment.ts
```

### Production

```
src/environments/environment.prod.ts
```

Variables needed:

- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_ANON_KEY`: Supabase anonymous key

## 📚 Database Schema

### Main Tables

- `users` - User profiles and authentication
- `employees` - Employee records
- `letters` - Incoming/Outgoing letters
- `complaints` - Complaint records
- `office_orders` - Office order records
- `audit_logs` - System audit trail

See database documentation for detailed schema.

## 🌍 Internationalization (i18n)

- Full Arabic RTL support
- Locale switching
- Dynamic text direction
- RTL-aware components

## 🎨 Styling

- **Tailwind CSS** for utility-first styling
- **Angular Material** for component library
- **Dark Mode** support
- **Responsive** design patterns

## 📱 Responsive Breakpoints

- Mobile: < 640px
- Tablet: 640px - 1024px
- Desktop: > 1024px

## 🧪 Testing

- Unit tests with Vitest
- Integration tests
- E2E tests setup

```bash
npm test                 # Run unit tests
npm run test:watch      # Watch mode
```

## 📦 Deployment

### Frontend Deployment

- Vercel or Netlify
- GitHub Actions CI/CD

### Backend

- Supabase Hosting

See deployment documentation for detailed steps.

## 🤝 Contributing

1. Create feature branch
2. Follow code standards
3. Write tests
4. Create pull request

## 📄 License

All rights reserved.

## 📞 Support

For issues or questions, please contact the development team.

---

**Built with Angular 21, Tailwind CSS, and Supabase**
