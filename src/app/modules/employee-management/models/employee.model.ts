export type EmploymentStatus = 'active' | 'retired' | 'resigned';

export interface Employee {
    id: string;
    employee_id: string;
    full_name: string;
    national_id: string;
    mobile_number: string;
    secondary_phone: string | null;
    email: string;
    address: string | null;
    department: string;
    job_title: string;
    employment_date: string;
    retirement_date: string | null;
    employment_status: EmploymentStatus;
    notes: string | null;
    profile_image_url: string | null;
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
    created_by: string | null;
}

export type EmployeeCreatePayload = Omit<
    Employee,
    'id' | 'created_at' | 'updated_at' | 'deleted_at' | 'created_by'
>;
