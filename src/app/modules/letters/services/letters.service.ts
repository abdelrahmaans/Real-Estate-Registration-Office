import { Injectable, inject } from '@angular/core';
import { SupabaseService } from '@core/services/supabase.service';
import { Letter, LetterCreatePayload } from '../models/letter.model';

@Injectable({ providedIn: 'root' })
export class LettersService {
    private supabase = inject(SupabaseService).getClient();

    async list(type?: string) {
        try {
            let q = this.supabase.from('letters').select('*').is('deleted_at', null).order('letter_date', { ascending: false });
            if (type) q = q.eq('type', type);
            const { data, error } = await q;
            if (error) throw error;
            return { data: (data ?? []) as Letter[], error: null };
        } catch (err: any) {
            return { data: [], error: err?.message || 'Failed to load letters' };
        }
    }

    async create(payload: LetterCreatePayload) {
        try {
            const cleanPayload: any = {
                letter_number: payload.letter_number,
                serial_number: payload.serial_number || null,
                type: payload.type,
                category: payload.category || 'general',
                letter_date: payload.letter_date,
                subject: payload.subject,
                summary: payload.summary || null,
                priority: payload.priority || 'normal',
                status: payload.status || 'new',
            };

            // attach created_by when available
            try {
                const userResp = await this.supabase.auth.getUser();
                const user = (userResp?.data as any)?.user;
                if (user) cleanPayload.created_by = user.id;
            } catch { }

            const { data, error } = await this.supabase.from('letters').insert([cleanPayload]).select().single();
            if (error) throw error;
            return { data: data as Letter, error: null };
        } catch (err: any) {
            return { data: null, error: err?.message || 'Failed to create letter' };
        }
    }
}
