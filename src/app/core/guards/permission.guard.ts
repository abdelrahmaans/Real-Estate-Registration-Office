import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { PermissionService } from '@core/services/permission.service';
import { AppPermission } from '@core/models/permission.model';

export const permissionGuard: CanActivateFn = async (route) => {
    const permissions = inject(PermissionService);
    const router = inject(Router);
    await permissions.ensureLoaded();

    const required = route.data['permission'] as AppPermission | AppPermission[] | undefined;
    if (!required) {
        return true;
    }

    const allowed = Array.isArray(required)
        ? permissions.hasAny(required)
        : permissions.hasPermission(required);

    return allowed ? true : router.createUrlTree(['/dashboard']);
};
