import { Injectable, computed, inject, signal } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { AuthService } from './auth.service';
import { AppPermission, PermissionRow } from '@core/models/permission.model';
import { UserRole } from '@models/common.model';

@Injectable({
    providedIn: 'root',
})
export class PermissionService {
    private readonly supabase = inject(SupabaseService).getClient();
    private readonly auth = inject(AuthService);

    private readonly permissions = signal<PermissionRow[]>([]);
    private readonly loadedForUserId = signal<string | null>(null);
    private readonly loading = signal(false);
    private readonly loadFailed = signal(false);

    readonly hasConfiguredPermissions = computed(() => this.permissions().length > 0);

    async ensureLoaded(): Promise<void> {
        const user = this.auth.getCurrentUser();
        if (!user || this.loading() || this.loadedForUserId() === user.id) {
            return;
        }

        this.loading.set(true);
        this.loadFailed.set(false);

        try {
            const { data, error } = await this.supabase
                .from('user_permissions')
                .select('*')
                .eq('user_id', user.id)
                .eq('granted', true);

            if (error) {
                this.loadFailed.set(true);
                this.permissions.set([]);
                return;
            }

            this.permissions.set((data ?? []) as PermissionRow[]);
            this.loadedForUserId.set(user.id);
        } catch {
            this.loadFailed.set(true);
            this.permissions.set([]);
        } finally {
            this.loading.set(false);
        }
    }

    hasPermission(permission: AppPermission): boolean {
        const user = this.auth.getCurrentUser();
        if (!user) {
            return false;
        }

        if (user.role === UserRole.ADMIN) {
            return true;
        }

        // Backward-compatible fallback: before permissions are configured, keep existing UI working.
        if (this.loadFailed() || !this.hasConfiguredPermissions()) {
            return true;
        }

        return this.permissions().some(row => row.permission === permission && row.granted);
    }

    hasAny(permissions: AppPermission[]): boolean {
        return permissions.some(permission => this.hasPermission(permission));
    }
}
