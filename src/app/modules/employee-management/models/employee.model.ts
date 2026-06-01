export type EmploymentStatus = 'active' | 'retired' | 'resigned';

export interface Employee {
    id: string;
    employee_id: string;
    full_name: string;
    national_id: string | null;
    mobile_number: string;
    secondary_phone: string | null;
    email: string | null;
    address: string | null;
    department: string;
    office_code: string | null;
    office_name: string | null;
    job_title: string;
    employment_date: string | null;
    retirement_date: string | null;
    employment_status: EmploymentStatus;
    notes: string | null;
    profile_image_url: string | null;
    office_sort_order: number | null;
    office_employee_order: number | null;
    source_document: string | null;
    imported_at: string | null;
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
    created_by: string | null;
}

export type EmployeeCreatePayload = Omit<
    Employee,
    'id' | 'created_at' | 'updated_at' | 'deleted_at' | 'created_by' | 'imported_at'
> & {
    imported_at?: string | null;
};
