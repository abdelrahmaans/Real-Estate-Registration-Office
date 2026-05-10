import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { noAuthGuard } from '@core/guards/auth.guard';

export const authRoutes: Routes = [
    {
        path: 'auth',
        children: [
            { path: 'login', component: LoginComponent, canActivate: [noAuthGuard] },
            { path: '', redirectTo: 'login', pathMatch: 'full' },
        ],
    },
];
