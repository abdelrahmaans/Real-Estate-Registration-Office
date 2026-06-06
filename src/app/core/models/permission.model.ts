export type AppPermission =
    | 'employees.read'
    | 'employees.create'
    | 'employees.update'
    | 'employees.delete'
    | 'employee_documents.read'
    | 'employee_documents.create'
    | 'employee_documents.delete'
    | 'letters.read'
    | 'letters.create'
    | 'letters.update'
    | 'letters.delete'
    | 'complaints.read'
    | 'complaints.create'
    | 'reports.export';

export interface PermissionRow {
    id: string;
    user_id: string;
    permission: AppPermission;
    granted: boolean;
    created_at: string;
    updated_at: string;
}
