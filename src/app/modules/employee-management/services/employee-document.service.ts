import { Injectable, inject } from '@angular/core';
import { SupabaseService } from '@core/services/supabase.service';
import {
    EmployeeDocument,
    EmployeeDocumentCreatePayload,
    EmployeeDocumentType,
} from '../models/employee-document.model';

type UploadDocumentInput = {
    employeeId: string;
    title: string;
    documentType: EmployeeDocumentType;
    file: File;
    issuedAt?: string | null;
    notes?: string | null;
};

const BUCKET_NAME = 'employee-documents';

@Injectable({
    providedIn: 'root',
})
export class EmployeeDocumentService {
    private readonly supabase = inject(SupabaseService).getClient();

    async listByEmployee(employeeId: string): Promise<{ data: EmployeeDocument[]; error: string | null }> {
        try {
            const { data, error } = await this.supabase
                .from('employee_documents')
                .select('*')
                .eq('employee_id', employeeId)
                .is('deleted_at', null)
                .order('uploaded_at', { ascending: false });

            if (error) {
                return { data: [], error: error.message };
            }

            return { data: (data ?? []) as EmployeeDocument[], error: null };
        } catch {
            return { data: [], error: 'تعذر تحميل ملفات الموظف من قاعدة البيانات.' };
        }
    }

    async uploadDocument(input: UploadDocumentInput): Promise<{ data: EmployeeDocument | null; error: string | null }> {
        try {
            const userResp = await this.supabase.auth.getUser();
            const userId = userResp.data.user?.id ?? null;
            const safeFileName = this.normalizeFileName(input.file.name);
            const filePath = `${input.employeeId}/${Date.now()}-${safeFileName}`;

            const upload = await this.supabase.storage
                .from(BUCKET_NAME)
                .upload(filePath, input.file, {
                    cacheControl: '3600',
                    upsert: false,
                });

            if (upload.error) {
                return { data: null, error: upload.error.message };
            }

            const payload: EmployeeDocumentCreatePayload = {
                employee_id: input.employeeId,
                title: input.title.trim(),
                document_type: input.documentType,
                file_name: input.file.name,
                file_path: filePath,
                file_size: input.file.size,
                mime_type: input.file.type || null,
                issued_at: input.issuedAt || null,
                notes: input.notes?.trim() || null,
                uploaded_by: userId,
            };

            const { data, error } = await this.supabase
                .from('employee_documents')
                .insert([payload])
                .select()
                .single();

            if (error) {
                await this.supabase.storage.from(BUCKET_NAME).remove([filePath]);
                return { data: null, error: error.message };
            }

            return { data: data as EmployeeDocument, error: null };
        } catch {
            return { data: null, error: 'تعذر رفع الملف وحفظ بياناته.' };
        }
    }

    async createSignedUrl(filePath: string): Promise<{ data: string | null; error: string | null }> {
        try {
            const { data, error } = await this.supabase.storage
                .from(BUCKET_NAME)
                .createSignedUrl(filePath, 60 * 10);

            if (error) {
                return { data: null, error: error.message };
            }

            return { data: data.signedUrl, error: null };
        } catch {
            return { data: null, error: 'تعذر تجهيز رابط الملف.' };
        }
    }

    async softDeleteDocument(id: string): Promise<{ error: string | null }> {
        try {
            const { error } = await this.supabase
                .from('employee_documents')
                .update({ deleted_at: new Date().toISOString() })
                .eq('id', id)
                .is('deleted_at', null);

            if (error) {
                return { error: error.message };
            }

            return { error: null };
        } catch {
            return { error: 'تعذر حذف الملف.' };
        }
    }

    private normalizeFileName(fileName: string): string {
        const parts = fileName.split('.');
        const extension = parts.length > 1 ? `.${parts.pop() ?? 'file'}` : '';
        const baseName = parts.join('.').trim() || 'document';
        const normalizedBase = baseName
            .replace(/[^\p{L}\p{N}-]+/gu, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '')
            .slice(0, 80);

        return `${normalizedBase || 'document'}${extension}`.toLowerCase();
    }
}
