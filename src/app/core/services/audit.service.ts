import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { AuditPayload } from '@core/models/audit.model';

@Injectable({
    providedIn: 'root',
})
export class AuditService {
    private readonly supabase = inject(SupabaseService).getClient();

    async log(payload: AuditPayload): Promise<void> {
        try {
            const userId = payload.userId ?? await this.resolveCurrentUserId();
            await this.supabase.from('audit_logs').insert([
                {
                    user_id: userId,
                    action: payload.action,
                    entity_type: payload.entityType,
                    entity_id: payload.entityId ?? null,
                    old_values: payload.oldValues ?? null,
                    new_values: payload.newValues ?? null,
                    ip_address: null,
                },
            ]);
        } catch {
            // Audit logging must never block the business operation.
        }
    }

    private async resolveCurrentUserId(): Promise<string | null> {
        try {
            const response = await this.supabase.auth.getUser();
            return response.data.user?.id ?? null;
        } catch {
            return null;
        }
    }
}
