import { Injectable, inject } from '@angular/core';
import { SupabaseService } from '@core/services/supabase.service';
import { Employee, EmployeeCreatePayload } from '../models/employee.model';

type EmployeeInsert = EmployeeCreatePayload & { created_by?: string | null };
type EmployeeRowPayload = Record<string, unknown>;

@Injectable({
    providedIn: 'root',
})
export class EmployeeService {
    private readonly supabase = inject(SupabaseService).getClient();

    async listEmployees(search = ''): Promise<{ data: Employee[]; error: string | null }> {
        try {
            let query = this.supabase
                .from('employees')
                .select('*')
                .is('deleted_at', null)
                .order('office_sort_order', { ascending: true, nullsFirst: false })
                .order('office_employee_order', { ascending: true, nullsFirst: false })
                .order('created_at', { ascending: false });

            const normalizedSearch = search.trim();
            if (normalizedSearch.length > 0) {
                query = query.or(
                    `full_name.ilike.%${normalizedSearch}%,employee_id.ilike.%${normalizedSearch}%,national_id.ilike.%${normalizedSearch}%,office_name.ilike.%${normalizedSearch}%,mobile_number.ilike.%${normalizedSearch}%`
                );
            }

            const { data, error } = await query;
            if (error) {
                return { data: [], error: error.message };
            }

            return { data: (data ?? []) as Employee[], error: null };
        } catch (_error) {
            return { data: [], error: 'تعذر تحميل الموظفين.' };
        }
    }

    async getEmployeeById(id: string): Promise<{ data: Employee | null; error: string | null }> {
        try {
            const { data, error } = await this.supabase
                .from('employees')
                .select('*')
                .eq('id', id)
                .is('deleted_at', null)
                .single();

            if (error) {
                return { data: null, error: error.message };
            }

            return { data: data as Employee, error: null };
        } catch (_error) {
            return { data: null, error: 'تعذر جلب بيانات الموظف.' };
        }
    }

    async createEmployee(payload: EmployeeCreatePayload): Promise<{ data: Employee | null; error: string | null }> {
        try {
            const insertPayload: EmployeeInsert = { ...payload };
            try {
                const userResp = await this.supabase.auth.getUser();
                const user = userResp?.data?.user;
                if (user && !insertPayload.created_by) {
                    insertPayload.created_by = user.id;
                }
            } catch {
                // If the user cannot be resolved, rely on the current JWT/RLS context.
            }

            const { data, error } = await this.supabase
                .from('employees')
                .insert([insertPayload as EmployeeRowPayload])
                .select()
                .single();

            if (error) {
                return { data: null, error: error.message };
            }

            return { data: data as Employee, error: null };
        } catch (_error) {
            return { data: null, error: 'تعذر إنشاء الموظف.' };
        }
    }

    async updateEmployee(
        id: string,
        payload: Partial<EmployeeCreatePayload>
    ): Promise<{ data: Employee | null; error: string | null }> {
        try {
            const { data, error } = await this.supabase
                .from('employees')
                .update(payload)
                .eq('id', id)
                .is('deleted_at', null)
                .select()
                .single();

            if (error) {
                return { data: null, error: error.message };
            }

            return { data: data as Employee, error: null };
        } catch (_error) {
            return { data: null, error: 'تعذر تحديث بيانات الموظف.' };
        }
    }

    async softDeleteEmployee(id: string): Promise<{ error: string | null }> {
        try {
            const { error } = await this.supabase
                .from('employees')
                .update({ deleted_at: new Date().toISOString() })
                .eq('id', id)
                .is('deleted_at', null);

            if (error) {
                return { error: error.message };
            }

            return { error: null };
        } catch (_error) {
            return { error: 'تعذر حذف الموظف.' };
        }
    }

    async list(search = ''): Promise<{ data: Employee[]; error: string | null }> {
        return this.listEmployees(search);
    }
}
