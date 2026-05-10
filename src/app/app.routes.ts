import { Routes } from '@angular/router';
import { authRoutes } from '@modules/auth/auth.routes';
import { DashboardComponent } from './modules/dashboard/pages/dashboard/dashboard.component';
import { authGuard } from '@core/guards/auth.guard';
import { lettersRoutes } from './modules/letters/letters.routes';

export const routes: Routes = [
    ...authRoutes,
    { path: 'dashboard', component: DashboardComponent, canActivate: [authGuard] },
    {
        path: 'employees',
        canActivate: [authGuard],
        loadChildren: () => import('./modules/employee-management/employee-management.routes').then(m => m.employeeManagementRoutes),
    },
    {
        path: 'letters',
        canActivate: [authGuard],
        children: lettersRoutes,
    },
    {
        path: 'reports',
        canActivate: [authGuard],
        loadComponent: () => import('./modules/reports/pages/reports/reports.component').then(m => m.ReportsComponent),
    },
    { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
    { path: '**', redirectTo: '/dashboard' },
];
