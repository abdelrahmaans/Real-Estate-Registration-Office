import { Routes } from '@angular/router';
import { noAuthGuard } from '@core/guards/auth.guard';

export const authRoutes: Routes = [
    {
        path: 'auth',
        children: [
            {
                path: 'login',
                canActivate: [noAuthGuard],
                loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent),
            },
            { path: '', redirectTo: 'login', pathMatch: 'full' },
        ],
    },
];
