export type AuditAction =
    | 'create'
    | 'update'
    | 'delete'
    | 'login'
    | 'logout'
    | 'file_upload'
    | 'file_delete';

export type AuditEntityType =
    | 'auth'
    | 'employee'
    | 'employee_document'
    | 'letter'
    | 'complaint'
    | 'office_order'
    | 'permission';

export type AuditPayload = {
    action: AuditAction;
    entityType: AuditEntityType;
    entityId?: string | null;
    oldValues?: Record<string, unknown> | null;
    newValues?: Record<string, unknown> | null;
    userId?: string | null;
};
