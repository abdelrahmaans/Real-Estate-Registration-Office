// ============================================
// Common Models & Interfaces
// ============================================

/**
 * Pagination parameters
 */
export interface PaginationParams {
    page: number;
    pageSize: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}

/**
 * Paginated response wrapper
 */
export interface PaginatedResponse<T> {
    data: T[];
    total: number;
    page: number;
    pageSize: number;
}

/**
 * API Error Response
 */
export interface ApiErrorResponse {
    statusCode: number;
    message: string;
    error?: string;
    details?: Record<string, any>;
}

/**
 * Standard API Response
 */
export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    message?: string;
    error?: ApiErrorResponse;
}

/**
 * User role enumeration
 */
export enum UserRole {
    ADMIN = 'admin',
    ASSISTANT_SECRETARY = 'assistant_secretary',
    TECHNICAL_MANAGER = 'technical_manager',
    DATA_ENTRY = 'data_entry',
}

/**
 * User permission interface
 */
export interface UserPermission {
    id: string;
    userId: string;
    module: string;
    action: string;
    createdAt: Date;
}

/**
 * User profile interface
 */
export interface UserProfile {
    id: string;
    email: string;
    fullName: string;
    phone?: string;
    role: UserRole;
    department?: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

/**
 * Audit log interface
 */
export interface AuditLog {
    id: string;
    userId: string;
    action: string;
    module: string;
    recordId: string;
    oldValue?: Record<string, any>;
    newValue?: Record<string, any>;
    timestamp: Date;
    ipAddress?: string;
}

/**
 * Notification interface
 */
export interface Notification {
    id: string;
    userId: string;
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
    read: boolean;
    createdAt: Date;
}

/**
 * File upload response
 */
export interface FileUploadResponse {
    id: string;
    filename: string;
    url: string;
    size: number;
    mimeType: string;
    uploadedAt: Date;
}

/**
 * Base entity model with common fields
 */
export interface BaseEntity {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    createdBy: string;
    deletedAt?: Date | null;
}
