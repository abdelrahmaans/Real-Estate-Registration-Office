import { Injectable, inject } from '@angular/core';
import { SupabaseService } from '@core/services/supabase.service';
import { AuditService } from '@core/services/audit.service';
import { Letter, LetterCreatePayload } from '../models/letter.model';

function getErrorMessage(err: unknown, fallback: string): string {
    if (err instanceof Error) return err.message;
    if (err && typeof err === 'object' && 'message' in err) {
        const message = (err as { message?: unknown }).message;
        if (typeof message === 'string' && message.trim()) return message;
    }
    return fallback;
}

@Injectable({ providedIn: 'root' })
export class LettersService {
    private supabase = inject(SupabaseService).getClient();
    private audit = inject(AuditService);

    async list(type?: string) {
        try {
            let q = this.supabase.from('letters').select('*').is('deleted_at', null).order('letter_date', { ascending: false });
            if (type) q = q.eq('type', type);
            const { data, error } = await q;
            if (error) throw error;
            return { data: (data ?? []) as Letter[], error: null };
        } catch (err: unknown) {
            return { data: [], error: getErrorMessage(err, 'Failed to load letters') };
        }
    }

    async get(id: string) {
        try {
            const { data, error } = await this.supabase
                .from('letters')
                .select('*')
                .eq('id', id)
                .is('deleted_at', null)
                .single();
            if (error) throw error;
            return { data: data as Letter, error: null };
        } catch (err: unknown) {
            return { data: null, error: getErrorMessage(err, 'Failed to load letter') };
        }
    }

    async create(payload: LetterCreatePayload) {
        try {
            const cleanPayload: Record<string, unknown> = {
                letter_number: payload.letter_number,
                serial_number: payload.serial_number || null,
                type: payload.type,
                category: payload.category || 'general',
                letter_date: payload.letter_date,
                sender: payload.sender || null,
                receiver: payload.receiver || null,
                subject: payload.subject,
                summary: payload.summary || null,
                priority: payload.priority || 'normal',
                status: payload.status || 'new',
                notes: payload.notes || null,
            };

            // attach created_by when available
            try {
                const userResp = await this.supabase.auth.getUser();
                const user = userResp?.data?.user;
                if (user) cleanPayload['created_by'] = user.id;
            } catch { }

            const { data, error } = await this.supabase.from('letters').insert([cleanPayload]).select().single();
            if (error) throw error;
            await this.audit.log({
                action: 'create',
                entityType: 'letter',
                entityId: (data as Letter).id,
                newValues: data as unknown as Record<string, unknown>,
            });
            return { data: data as Letter, error: null };
        } catch (err: unknown) {
            return { data: null, error: getErrorMessage(err, 'Failed to create letter') };
        }
    }

    async update(id: string, payload: LetterCreatePayload) {
        try {
            const oldRecord = await this.get(id);
            const cleanPayload: Record<string, unknown> = {
                letter_number: payload.letter_number,
                serial_number: payload.serial_number || null,
                type: payload.type,
                category: payload.category || 'general',
                letter_date: payload.letter_date,
                sender: payload.sender || null,
                receiver: payload.receiver || null,
                subject: payload.subject,
                summary: payload.summary || null,
                priority: payload.priority || 'normal',
                status: payload.status || 'new',
                notes: payload.notes || null,
            };

            let updatePayload: Record<string, unknown> = {
                ...cleanPayload,
                updated_at: new Date().toISOString(),
            };
            let response = await this.supabase
                .from('letters')
                .update(updatePayload)
                .eq('id', id)
                .select()
                .single();

            if (response.error && response.error.message.toLowerCase().includes('updated_at')) {
                updatePayload = { ...cleanPayload };
                response = await this.supabase
                    .from('letters')
                    .update(updatePayload)
                    .eq('id', id)
                    .select()
                    .single();
            }

            const { data, error } = response;
            if (error) throw error;
            await this.audit.log({
                action: 'update',
                entityType: 'letter',
                entityId: id,
                oldValues: oldRecord.data as unknown as Record<string, unknown> | null,
                newValues: data as unknown as Record<string, unknown>,
            });
            return { data: data as Letter, error: null };
        } catch (err: unknown) {
            return { data: null, error: getErrorMessage(err, 'Failed to update letter') };
        }
    }

    async delete(id: string) {
        try {
            const oldRecord = await this.get(id);
            const deletedAt = new Date().toISOString();
            let response = await this.supabase
                .from('letters')
                .update({ deleted_at: deletedAt, updated_at: deletedAt })
                .eq('id', id);

            if (response.error && response.error.message.toLowerCase().includes('updated_at')) {
                response = await this.supabase
                    .from('letters')
                    .update({ deleted_at: deletedAt })
                    .eq('id', id);
            }

            const { error } = response;
            if (error) throw error;
            await this.audit.log({
                action: 'delete',
                entityType: 'letter',
                entityId: id,
                oldValues: oldRecord.data as unknown as Record<string, unknown> | null,
                newValues: { deleted_at: deletedAt },
            });
            return { error: null };
        } catch (err: unknown) {
            return { error: getErrorMessage(err, 'Failed to delete letter') };
        }
    }
}
