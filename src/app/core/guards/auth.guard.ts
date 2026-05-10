// ============================================
// Authentication Guard
// ============================================

import { inject, Injectable } from '@angular/core';
import {
    CanActivate,
    ActivatedRouteSnapshot,
    RouterStateSnapshot,
    Router,
    CanActivateFn,
    UrlTree,
} from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Functional guard using Angular's `inject` (recommended for standalone routes)
 */
export const authGuard: CanActivateFn = (
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    return authService.whenReady().then(() => {
        if (authService.isAuthenticated()) {
            return true;
        }

        return router.createUrlTree(['/auth/login'], {
            queryParams: { returnUrl: state.url },
        }) as UrlTree;
    });
};

/**
 * Guard to prevent authenticated users from accessing auth pages
 */
export const noAuthGuard: CanActivateFn = (
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    return authService.whenReady().then(() => {
        if (!authService.isAuthenticated()) {
            return true;
        }

        return router.createUrlTree(['/dashboard']);
    });
};

/**
 * Class-based guard for compatibility with non-standalone route definitions
 */
@Injectable({
    providedIn: 'root',
})
export class AuthGuard implements CanActivate {
    constructor(private authService: AuthService, private router: Router) { }

    canActivate(
        route: ActivatedRouteSnapshot,
        state: RouterStateSnapshot
    ): boolean {
        if (this.authService.isAuthenticated()) {
            return true;
        }

        this.router.navigate(['/auth/login'], {
            queryParams: { returnUrl: state.url },
        });

        return false;
    }
}
