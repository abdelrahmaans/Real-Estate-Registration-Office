import { Routes } from '@angular/router';
import { authRoutes } from '@modules/auth/auth.routes';
import { authGuard } from '@core/guards/auth.guard';

export const routes: Routes = [
    ...authRoutes,
    {
        path: 'dashboard',
        canActivate: [authGuard],
        loadComponent: () =>
            import('./modules/dashboard/pages/dashboard/dashboard.component').then(
                m => m.DashboardComponent
            ),
    },
    {
        path: 'employees',
        canActivate: [authGuard],
        loadChildren: () =>
            import('./modules/employee-management/employee-management.routes').then(
                m => m.employeeManagementRoutes
            ),
    },
    {
        path: 'letters',
        canActivate: [authGuard],
        loadChildren: () => import('./modules/letters/letters.routes').then(m => m.lettersRoutes),
    },
    {
        path: 'reports',
        canActivate: [authGuard],
        loadComponent: () =>
            import('./modules/reports/pages/reports/reports.component').then(m => m.ReportsComponent),
    },
    { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
    { path: '**', redirectTo: '/dashboard' },
];
