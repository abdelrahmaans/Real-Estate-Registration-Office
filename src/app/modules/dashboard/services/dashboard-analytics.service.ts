import { Injectable, inject } from '@angular/core';
import { SupabaseService } from '@core/services/supabase.service';
import { Employee } from '../../employee-management/models/employee.model';
import { Letter } from '../../letters/models/letter.model';
import {
    ComplaintsByStatus,
    DashboardAnalytics,
    DashboardSummary,
    DashboardUpdate,
    EmployeesByDepartment,
    EmployeesByOffice,
    LettersByMonth,
    OfficeOrdersByStatus,
} from '../models/dashboard-analytics.model';

const EMPTY_SUMMARY: DashboardSummary = {
    total_employees: 0,
    active_employees: 0,
    retired_employees: 0,
    total_letters: 0,
    incoming_letters: 0,
    outgoing_letters: 0,
    open_complaints: 0,
    active_office_orders: 0,
};

@Injectable({
    providedIn: 'root',
})
export class DashboardAnalyticsService {
    private readonly supabase = inject(SupabaseService).getClient();

    async loadAnalytics(): Promise<{ data: DashboardAnalytics; error: string | null }> {
        const response = await this.loadFromViews();
        if (!response.error) {
            return response;
        }

        return this.loadFallback(response.error);
    }

    private async loadFromViews(): Promise<{ data: DashboardAnalytics; error: string | null }> {
        try {
            const [
                summary,
                lettersByMonth,
                employeesByOffice,
                employeesByDepartment,
                complaintsByStatus,
                officeOrdersByStatus,
                recentUpdates,
            ] = await Promise.all([
                this.supabase.from('dashboard_summary').select('*').maybeSingle(),
                this.supabase.from('dashboard_letters_by_month').select('*').order('month_start', { ascending: true }),
                this.supabase.from('dashboard_employees_by_office').select('*'),
                this.supabase.from('dashboard_employees_by_department').select('*'),
                this.supabase.from('dashboard_complaints_by_status').select('*'),
                this.supabase.from('dashboard_office_orders_by_status').select('*'),
                this.supabase.from('dashboard_recent_updates').select('*').order('happened_at', { ascending: false }).limit(10),
            ]);

            const firstError =
                summary.error ||
                lettersByMonth.error ||
                employeesByOffice.error ||
                employeesByDepartment.error ||
                complaintsByStatus.error ||
                officeOrdersByStatus.error ||
                recentUpdates.error;

            if (firstError) {
                return { data: this.emptyAnalytics(), error: firstError.message };
            }

            return {
                data: {
                    summary: (summary.data as DashboardSummary | null) ?? EMPTY_SUMMARY,
                    lettersByMonth: (lettersByMonth.data ?? []) as LettersByMonth[],
                    employeesByOffice: (employeesByOffice.data ?? []) as EmployeesByOffice[],
                    employeesByDepartment: (employeesByDepartment.data ?? []) as EmployeesByDepartment[],
                    complaintsByStatus: (complaintsByStatus.data ?? []) as ComplaintsByStatus[],
                    officeOrdersByStatus: (officeOrdersByStatus.data ?? []) as OfficeOrdersByStatus[],
                    recentUpdates: (recentUpdates.data ?? []) as DashboardUpdate[],
                },
                error: null,
            };
        } catch (error) {
            return { data: this.emptyAnalytics(), error: error instanceof Error ? error.message : 'تعذر تحميل التحليلات.' };
        }
    }

    private async loadFallback(reason: string): Promise<{ data: DashboardAnalytics; error: string | null }> {
        try {
            const [employeesResponse, lettersResponse, auditResponse] = await Promise.all([
                this.supabase
                    .from('employees')
                    .select('id, employee_id, full_name, employment_status, office_code, office_name, department, job_title, created_at, updated_at, deleted_at')
                    .is('deleted_at', null),
                this.supabase
                    .from('letters')
                    .select('id, letter_number, type, letter_date, subject, created_at, updated_at, deleted_at')
                    .is('deleted_at', null),
                this.supabase
                    .from('audit_logs')
                    .select('id, action, entity_type, entity_id, old_values, new_values, created_at')
                    .order('created_at', { ascending: false })
                    .limit(10),
            ]);

            if (employeesResponse.error || lettersResponse.error) {
                return {
                    data: this.emptyAnalytics(),
                    error: employeesResponse.error?.message || lettersResponse.error?.message || reason,
                };
            }

            const employees = (employeesResponse.data ?? []) as Pick<
                Employee,
                'id' | 'employee_id' | 'full_name' | 'employment_status' | 'office_code' | 'office_name' | 'department' | 'job_title' | 'created_at' | 'updated_at' | 'deleted_at'
            >[];
            const letters = (lettersResponse.data ?? []) as Pick<Letter, 'id' | 'letter_number' | 'type' | 'letter_date' | 'subject' | 'created_at' | 'updated_at' | 'deleted_at'>[];

            return {
                data: {
                    summary: {
                        total_employees: employees.length,
                        active_employees: employees.filter(employee => employee.employment_status === 'active').length,
                        retired_employees: employees.filter(employee => employee.employment_status === 'retired').length,
                        total_letters: letters.length,
                        incoming_letters: letters.filter(letter => letter.type === 'incoming').length,
                        outgoing_letters: letters.filter(letter => letter.type === 'outgoing').length,
                        open_complaints: 0,
                        active_office_orders: 0,
                    },
                    lettersByMonth: this.groupLettersByMonth(letters),
                    employeesByOffice: this.groupEmployeesByOffice(employees),
                    employeesByDepartment: this.groupEmployeesByDepartment(employees),
                    complaintsByStatus: [],
                    officeOrdersByStatus: [],
                    recentUpdates: auditResponse.error
                        ? this.buildFallbackUpdates(employees, letters)
                        : (auditResponse.data ?? []).map(row => ({
                            update_id: String(row.id),
                            action: String(row.action ?? ''),
                            entity_type: String(row.entity_type ?? ''),
                            entity_id: row.entity_id ? String(row.entity_id) : null,
                            title: this.resolveAuditTitle(row.new_values, row.old_values, String(row.entity_type ?? '')),
                            happened_at: String(row.created_at ?? ''),
                        })),
                },
                error: null,
            };
        } catch (error) {
            return { data: this.emptyAnalytics(), error: error instanceof Error ? error.message : reason };
        }
    }

    private groupLettersByMonth(letters: Pick<Letter, 'type' | 'letter_date'>[]): LettersByMonth[] {
        const map = new Map<string, LettersByMonth>();
        for (const letter of letters) {
            if (!letter.letter_date) continue;
            const key = letter.letter_date.slice(0, 7);
            const row = map.get(key) ?? {
                month_start: `${key}-01`,
                total_count: 0,
                incoming_count: 0,
                outgoing_count: 0,
            };
            row.total_count += 1;
            if (letter.type === 'incoming') row.incoming_count += 1;
            if (letter.type === 'outgoing') row.outgoing_count += 1;
            map.set(key, row);
        }

        return [...map.values()]
            .sort((a, b) => a.month_start.localeCompare(b.month_start))
            .slice(-12);
    }

    private groupEmployeesByOffice(
        employees: Pick<Employee, 'office_code' | 'office_name' | 'department'>[]
    ): EmployeesByOffice[] {
        const map = new Map<string, EmployeesByOffice>();
        for (const employee of employees) {
            const officeName = employee.office_name || employee.department || 'غير محدد';
            const officeCode = employee.office_code || 'N/A';
            const row = map.get(officeName) ?? { office_name: officeName, office_code: officeCode, employee_count: 0 };
            row.employee_count += 1;
            map.set(officeName, row);
        }

        return [...map.values()]
            .sort((a, b) => b.employee_count - a.employee_count || a.office_name.localeCompare(b.office_name, 'ar'))
            .slice(0, 12);
    }

    private groupEmployeesByDepartment(employees: Pick<Employee, 'department'>[]): EmployeesByDepartment[] {
        const map = new Map<string, EmployeesByDepartment>();
        for (const employee of employees) {
            const departmentName = employee.department || 'غير محدد';
            const row = map.get(departmentName) ?? { department_name: departmentName, employee_count: 0 };
            row.employee_count += 1;
            map.set(departmentName, row);
        }

        return [...map.values()]
            .sort((a, b) => b.employee_count - a.employee_count || a.department_name.localeCompare(b.department_name, 'ar'))
            .slice(0, 12);
    }

    private buildFallbackUpdates(
        employees: Pick<Employee, 'id' | 'employee_id' | 'full_name' | 'updated_at' | 'created_at'>[],
        letters: Pick<Letter, 'id' | 'letter_number' | 'subject' | 'updated_at' | 'created_at'>[]
    ): DashboardUpdate[] {
        const employeeUpdates: DashboardUpdate[] = employees.map(employee => ({
            update_id: `employee-${employee.id}`,
            action: 'update',
            entity_type: 'employee',
            entity_id: employee.id,
            title: `تحديث بيانات ${employee.full_name || employee.employee_id}`,
            happened_at: employee.updated_at || employee.created_at,
        }));
        const letterUpdates: DashboardUpdate[] = letters.map(letter => ({
            update_id: `letter-${letter.id}`,
            action: 'update',
            entity_type: 'letter',
            entity_id: letter.id,
            title: `تحديث خطاب ${letter.letter_number || letter.subject}`,
            happened_at: letter.updated_at || letter.created_at,
        }));

        return [...employeeUpdates, ...letterUpdates]
            .filter(update => Boolean(update.happened_at))
            .sort((a, b) => b.happened_at.localeCompare(a.happened_at))
            .slice(0, 10);
    }

    private resolveAuditTitle(newValues: unknown, oldValues: unknown, fallback: string): string {
        const newRecord = this.asRecord(newValues);
        const oldRecord = this.asRecord(oldValues);
        return String(
            newRecord['full_name'] ||
            newRecord['subject'] ||
            newRecord['title'] ||
            newRecord['letter_number'] ||
            newRecord['file_name'] ||
            newRecord['email'] ||
            oldRecord['full_name'] ||
            oldRecord['subject'] ||
            oldRecord['title'] ||
            oldRecord['letter_number'] ||
            oldRecord['file_name'] ||
            oldRecord['email'] ||
            fallback
        );
    }

    private asRecord(value: unknown): Record<string, unknown> {
        return value && typeof value === 'object' ? value as Record<string, unknown> : {};
    }

    private emptyAnalytics(): DashboardAnalytics {
        return {
            summary: EMPTY_SUMMARY,
            lettersByMonth: [],
            employeesByOffice: [],
            employeesByDepartment: [],
            complaintsByStatus: [],
            officeOrdersByStatus: [],
            recentUpdates: [],
        };
    }
}
