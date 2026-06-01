import { Injectable, inject } from '@angular/core';
import { SupabaseService } from '@core/services/supabase.service';
import { Employee, EmployeeCreatePayload } from '../models/employee.model';

export type EmployeeFilters = {
    search?: string;
    officeCode?: string;
    status?: Employee['employment_status'] | 'all';
    jobTitle?: string;
};

export type EmployeeFilterOptions = {
    offices: Array<{ code: string; name: string }>;
    jobTitles: string[];
};

type EmployeeInsert = EmployeeCreatePayload & { created_by?: string | null };
type EmployeeRowPayload = Record<string, unknown>;

@Injectable({
    providedIn: 'root',
})
export class EmployeeService {
    private readonly supabase = inject(SupabaseService).getClient();

    async listEmployees(filters: EmployeeFilters = {}): Promise<{ data: Employee[]; error: string | null }> {
        try {
            let query = this.supabase
                .from('employees')
                .select('*')
                .is('deleted_at', null)
                .order('office_sort_order', { ascending: true, nullsFirst: false })
                .order('office_employee_order', { ascending: true, nullsFirst: false })
                .order('full_name', { ascending: true });

            const normalizedSearch = filters.search?.trim() ?? '';
            if (normalizedSearch.length > 0) {
                const escapedSearch = normalizedSearch.replaceAll(',', '\\,');
                query = query.or(
                    `full_name.ilike.%${escapedSearch}%,employee_id.ilike.%${escapedSearch}%,national_id.ilike.%${escapedSearch}%,office_name.ilike.%${escapedSearch}%,mobile_number.ilike.%${escapedSearch}%,job_title.ilike.%${escapedSearch}%`
                );
            }

            if (filters.officeCode && filters.officeCode !== 'all') {
                query = query.eq('office_code', filters.officeCode);
            }

            if (filters.status && filters.status !== 'all') {
                query = query.eq('employment_status', filters.status);
            }

            if (filters.jobTitle && filters.jobTitle !== 'all') {
                query = query.eq('job_title', filters.jobTitle);
            }

            const { data, error } = await query;
            if (error) {
                return { data: [], error: error.message };
            }

            return { data: (data ?? []) as Employee[], error: null };
        } catch (_error) {
            return { data: [], error: 'تعذر تحميل الموظفين من قاعدة البيانات.' };
        }
    }

    async getFilterOptions(): Promise<{ data: EmployeeFilterOptions; error: string | null }> {
        try {
            const { data, error } = await this.supabase
                .from('employees')
                .select('office_code, office_name, office_sort_order, job_title')
                .is('deleted_at', null)
                .order('office_sort_order', { ascending: true, nullsFirst: false })
                .order('job_title', { ascending: true });

            if (error) {
                return { data: { offices: [], jobTitles: [] }, error: error.message };
            }

            const officeMap = new Map<string, { code: string; name: string; sort: number }>();
            const jobTitles = new Set<string>();

            for (const row of data ?? []) {
                const officeCode = String(row.office_code ?? '');
                const officeName = String(row.office_name ?? '');
                if (officeCode && officeName && !officeMap.has(officeCode)) {
                    officeMap.set(officeCode, {
                        code: officeCode,
                        name: officeName,
                        sort: Number(row.office_sort_order ?? 9999),
                    });
                }

                const jobTitle = String(row.job_title ?? '').trim();
                if (jobTitle) {
                    jobTitles.add(jobTitle);
                }
            }

            return {
                data: {
                    offices: [...officeMap.values()]
                        .sort((a, b) => a.sort - b.sort || a.name.localeCompare(b.name, 'ar'))
                        .map(({ code, name }) => ({ code, name })),
                    jobTitles: [...jobTitles].sort((a, b) => a.localeCompare(b, 'ar')),
                },
                error: null,
            };
        } catch (_error) {
            return { data: { offices: [], jobTitles: [] }, error: 'تعذر تحميل اختيارات الفلترة.' };
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
        return this.listEmployees({ search });
    }
}
