export type EmployeeDocumentType =
    | 'leave'
    | 'appointment'
    | 'national_id'
    | 'medical'
    | 'disciplinary'
    | 'other';

export interface EmployeeDocument {
    id: string;
    employee_id: string;
    title: string;
    document_type: EmployeeDocumentType;
    file_name: string;
    file_path: string;
    file_size: number | null;
    mime_type: string | null;
    issued_at: string | null;
    notes: string | null;
    uploaded_at: string;
    uploaded_by: string | null;
    deleted_at: string | null;
}

export type EmployeeDocumentCreatePayload = Pick<
    EmployeeDocument,
    | 'employee_id'
    | 'title'
    | 'document_type'
    | 'file_name'
    | 'file_path'
    | 'file_size'
    | 'mime_type'
    | 'issued_at'
    | 'notes'
> & {
    uploaded_by?: string | null;
};
