export interface DashboardSummary {
    total_employees: number;
    active_employees: number;
    retired_employees: number;
    total_letters: number;
    incoming_letters: number;
    outgoing_letters: number;
    open_complaints: number;
    active_office_orders: number;
}

export interface LettersByMonth {
    month_start: string;
    total_count: number;
    incoming_count: number;
    outgoing_count: number;
}

export interface EmployeesByOffice {
    office_name: string;
    office_code: string;
    employee_count: number;
}

export interface EmployeesByDepartment {
    department_name: string;
    employee_count: number;
}

export interface ComplaintsByStatus {
    status: string;
    complaint_count: number;
}

export interface OfficeOrdersByStatus {
    status: string;
    order_count: number;
}

export interface DashboardAnalytics {
    summary: DashboardSummary;
    lettersByMonth: LettersByMonth[];
    employeesByOffice: EmployeesByOffice[];
    employeesByDepartment: EmployeesByDepartment[];
    complaintsByStatus: ComplaintsByStatus[];
    officeOrdersByStatus: OfficeOrdersByStatus[];
}
