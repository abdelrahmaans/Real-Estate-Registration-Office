// ============================================
// Supabase Client Service
// ============================================

import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '@environments/environment';

type QueryOptions = {
    select?: string;
    limit?: number;
    offset?: number;
    orderBy?: string;
    ascending?: boolean;
};

type FilterOption = {
    column: string;
    operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'in';
    value: unknown;
};

/**
 * Service for initializing and managing Supabase client
 * This is a singleton service that provides access to Supabase throughout the app
 */
@Injectable({
    providedIn: 'root',
})
export class SupabaseService {
    private supabaseClient: SupabaseClient;

    constructor() {
        this.supabaseClient = createClient(
            environment.supabase.url,
            environment.supabase.anonKey,
            {
                auth: {
                    autoRefreshToken: true,
                    persistSession: true,
                    detectSessionInUrl: true,
                },
            }
        );
    }

    /**
     * Get Supabase client instance
     */
    getClient(): SupabaseClient {
        return this.supabaseClient;
    }

    /**
     * Generic query method
     */
    async query(table: string) {
        return this.supabaseClient.from(table);
    }

    /**
     * Get all records from a table
     */
    async getAll(table: string, options?: QueryOptions) {
        try {
            let query = this.supabaseClient.from(table).select('*');

            if (options?.select) {
                query = this.supabaseClient.from(table).select(options.select);
            }

            if (options?.limit) {
                query = query.limit(options.limit);
            }

            if (options?.offset) {
                query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
            }

            if (options?.orderBy) {
                query = query.order(options.orderBy, { ascending: options.ascending !== false });
            }

            const { data, error } = await query;

            if (error) throw error;
            return { data, error: null };
        } catch (error) {
            return { data: null, error };
        }
    }

    /**
     * Get single record by ID
     */
    async getById(table: string, id: string) {
        try {
            const { data, error } = await this.supabaseClient
                .from(table)
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;
            return { data, error: null };
        } catch (error) {
            return { data: null, error };
        }
    }

    /**
     * Insert record(s)
     */
    async insert(table: string, payload: Record<string, unknown>) {
        try {
            const { data, error } = await this.supabaseClient
                .from(table)
                .insert([payload])
                .select();

            if (error) throw error;
            return { data: data?.[0], error: null };
        } catch (error) {
            return { data: null, error };
        }
    }

    /**
     * Update record
     */
    async update(table: string, id: string, payload: Record<string, unknown>) {
        try {
            const { data, error } = await this.supabaseClient
                .from(table)
                .update(payload)
                .eq('id', id)
                .select();

            if (error) throw error;
            return { data: data?.[0], error: null };
        } catch (error) {
            return { data: null, error };
        }
    }

    /**
     * Delete record (soft delete - set deleted_at)
     */
    async softDelete(table: string, id: string) {
        try {
            const { data, error } = await this.supabaseClient
                .from(table)
                .update({ deleted_at: new Date().toISOString() })
                .eq('id', id)
                .select();

            if (error) throw error;
            return { data: data?.[0], error: null };
        } catch (error) {
            return { data: null, error };
        }
    }

    /**
     * Hard delete record
     */
    async hardDelete(table: string, id: string) {
        try {
            const { error } = await this.supabaseClient.from(table).delete().eq('id', id);

            if (error) throw error;
            return { error: null };
        } catch (error) {
            return { error };
        }
    }

    /**
     * Search records
     */
    async search(table: string, column: string, value: string) {
        try {
            const { data, error } = await this.supabaseClient
                .from(table)
                .select('*')
                .ilike(column, `%${value}%`);

            if (error) throw error;
            return { data, error: null };
        } catch (error) {
            return { data: null, error };
        }
    }

    /**
     * Filter records
     */
    async filter(table: string, filters: FilterOption[]) {
        try {
            let query = this.supabaseClient.from(table).select('*');

            for (const filter of filters) {
                if (filter.operator === 'eq') {
                    query = query.eq(filter.column, filter.value);
                } else if (filter.operator === 'neq') {
                    query = query.neq(filter.column, filter.value);
                } else if (filter.operator === 'gt') {
                    query = query.gt(filter.column, filter.value);
                } else if (filter.operator === 'gte') {
                    query = query.gte(filter.column, filter.value);
                } else if (filter.operator === 'lt') {
                    query = query.lt(filter.column, filter.value);
                } else if (filter.operator === 'lte') {
                    query = query.lte(filter.column, filter.value);
                } else if (filter.operator === 'in' && Array.isArray(filter.value)) {
                    query = query.in(filter.column, filter.value);
                }
            }

            const { data, error } = await query;

            if (error) throw error;
            return { data, error: null };
        } catch (error) {
            return { data: null, error };
        }
    }

    /**
     * Get auth instance
     */
    getAuth() {
        return this.supabaseClient.auth;
    }

    /**
     * Get storage instance
     */
    getStorage() {
        return this.supabaseClient.storage;
    }
}
