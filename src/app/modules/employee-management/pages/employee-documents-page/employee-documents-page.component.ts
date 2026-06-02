import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { Employee } from '../../models/employee.model';
import {
    EmployeeDocument,
    EmployeeDocumentType,
} from '../../models/employee-document.model';
import { EmployeeService } from '../../services/employee.service';
import { EmployeeDocumentService } from '../../services/employee-document.service';

type FileInputEvent = Event & { target: HTMLInputElement };

@Component({
    selector: 'app-employee-documents-page',
    imports: [ReactiveFormsModule, RouterLink, MatIconModule],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
    <section class="documents-shell" dir="rtl">
      <header class="documents-header">
        <div>
          <p class="eyebrow">ملفات الموظف</p>
          <h1>{{ employee()?.full_name || 'تحميل بيانات الموظف' }}</h1>
          <p class="summary">
            رفع وحفظ أوراق الموظف مثل الإجازات، قرارات التعيين، التقارير الطبية، وأي مستندات إدارية.
          </p>
        </div>

        <div class="header-actions">
          <a class="action-secondary" routerLink="/dashboard">
            <mat-icon>dashboard</mat-icon>
            الداشبورد
          </a>
          <a class="action-secondary" routerLink="/employees">
            <mat-icon>arrow_forward</mat-icon>
            قائمة الموظفين
          </a>
          <a class="action-primary" [routerLink]="['/employees/profile', employeeId()]">
            <mat-icon>badge</mat-icon>
            بيانات الموظف
          </a>
        </div>
      </header>

      @if (employee()) {
        <section class="employee-strip" aria-label="بيانات الموظف المختصرة">
          <span class="avatar">{{ employeeInitial() }}</span>
          <div>
            <strong>{{ employee()?.employee_id }}</strong>
            <span>{{ employee()?.office_name || employee()?.department }}</span>
          </div>
          <div>
            <strong>{{ employee()?.job_title }}</strong>
            <span dir="ltr">{{ employee()?.mobile_number }}</span>
          </div>
          <div>
            <strong>{{ documents().length }}</strong>
            <span>ملف محفوظ</span>
          </div>
        </section>
      }

      <main class="documents-grid">
        <section class="upload-panel" aria-label="رفع ملف جديد">
          <div class="panel-heading">
            <span class="heading-icon"><mat-icon>upload_file</mat-icon></span>
            <div>
              <p class="section-kicker">إضافة مستند</p>
              <h2>ارفع ورق الموظف</h2>
            </div>
          </div>

          <form [formGroup]="form" (ngSubmit)="uploadDocument()" class="upload-form">
            <label class="field">
              <span>عنوان الملف</span>
              <input formControlName="title" placeholder="مثال: طلب إجازة سنوية" />
            </label>

            <label class="field">
              <span>نوع الملف</span>
              <select formControlName="document_type">
                <option value="leave">إجازة</option>
                <option value="appointment">تعيين / قرار إداري</option>
                <option value="national_id">رقم قومي</option>
                <option value="medical">طبي</option>
                <option value="disciplinary">جزاء / تحقيق</option>
                <option value="other">أخرى</option>
              </select>
            </label>

            <label class="field">
              <span>تاريخ المستند</span>
              <input type="date" formControlName="issued_at" />
            </label>

            <label class="file-drop">
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx"
                (change)="selectFile($event)"
              />
              <mat-icon>scanner</mat-icon>
              <strong>{{ selectedFile()?.name || 'اختار ملف من السكانر أو الجهاز' }}</strong>
              <span>PDF أو صورة أو ملف Word. يمكن فتح الملف وطباعته بعد الرفع.</span>
            </label>

            <label class="field field--full">
              <span>ملاحظات</span>
              <textarea rows="3" formControlName="notes" placeholder="أي تفاصيل إضافية عن الملف"></textarea>
            </label>

            @if (error()) {
              <p class="state state--error">{{ error() }}</p>
            }

            @if (success()) {
              <p class="state state--success">{{ success() }}</p>
            }

            <button class="action-primary action-submit" type="submit" [disabled]="uploading() || form.invalid || !selectedFile()">
              <mat-icon>cloud_upload</mat-icon>
              {{ uploading() ? 'جاري الرفع...' : 'حفظ الملف' }}
            </button>
          </form>
        </section>

        <section class="files-panel" aria-label="ملفات الموظف المحفوظة">
          <div class="panel-heading">
            <span class="heading-icon heading-icon--green"><mat-icon>folder_managed</mat-icon></span>
            <div>
              <p class="section-kicker">الأرشيف</p>
              <h2>ملفات الموظف</h2>
            </div>
          </div>

          @if (loading()) {
            <p class="state"><mat-icon>sync</mat-icon> جاري تحميل الملفات...</p>
          } @else if (documents().length === 0) {
            <p class="state">لا توجد ملفات محفوظة لهذا الموظف حتى الآن.</p>
          } @else {
            <div class="document-list">
              @for (document of documents(); track document.id) {
                <article class="document-card">
                  <span class="document-card__icon"><mat-icon>{{ iconFor(document) }}</mat-icon></span>
                  <div class="document-card__body">
                    <div>
                      <strong>{{ document.title }}</strong>
                      <span>{{ typeLabel(document.document_type) }} • {{ sizeLabel(document.file_size) }}</span>
                    </div>
                    <p>{{ document.notes || 'بدون ملاحظات' }}</p>
                    <small>
                      {{ document.issued_at || 'بدون تاريخ مستند' }} |
                      {{ uploadedLabel(document.uploaded_at) }}
                    </small>
                  </div>
                  <div class="document-card__actions">
                    <button class="icon-action" type="button" (click)="openDocument(document)" aria-label="فتح الملف">
                      <mat-icon>open_in_new</mat-icon>
                    </button>
                    <button class="icon-action" type="button" (click)="printDocument(document)" aria-label="طباعة الملف">
                      <mat-icon>print</mat-icon>
                    </button>
                    <button class="icon-action icon-action--danger" type="button" (click)="deleteDocument(document.id)" aria-label="حذف الملف">
                      <mat-icon>delete</mat-icon>
                    </button>
                  </div>
                </article>
              }
            </div>
          }
        </section>
      </main>
    </section>
  `,
    styleUrl: './employee-documents-page.component.css',
})
export class EmployeeDocumentsPageComponent {
    private readonly fb = inject(FormBuilder);
    private readonly route = inject(ActivatedRoute);
    private readonly employeeService = inject(EmployeeService);
    private readonly documentService = inject(EmployeeDocumentService);

    readonly employeeId = signal(this.route.snapshot.paramMap.get('id') ?? '');
    readonly employee = signal<Employee | null>(null);
    readonly documents = signal<EmployeeDocument[]>([]);
    readonly selectedFile = signal<File | null>(null);
    readonly loading = signal(false);
    readonly uploading = signal(false);
    readonly error = signal<string | null>(null);
    readonly success = signal<string | null>(null);

    readonly employeeInitial = computed(() => this.employee()?.full_name.charAt(0) ?? 'م');

    readonly form = this.fb.nonNullable.group({
        title: ['', [Validators.required, Validators.minLength(3)]],
        document_type: this.fb.nonNullable.control<EmployeeDocumentType>('leave'),
        issued_at: [''],
        notes: [''],
    });

    constructor() {
        this.loadEmployee();
        this.loadDocuments();
    }

    selectFile(event: Event): void {
        const file = (event as FileInputEvent).target.files?.[0] ?? null;
        this.selectedFile.set(file);
    }

    async uploadDocument(): Promise<void> {
        if (this.form.invalid || !this.selectedFile()) {
            this.form.markAllAsTouched();
            return;
        }

        this.error.set(null);
        this.success.set(null);
        this.uploading.set(true);

        const value = this.form.getRawValue();
        const response = await this.documentService.uploadDocument({
            employeeId: this.employeeId(),
            title: value.title,
            documentType: value.document_type,
            issuedAt: value.issued_at || null,
            notes: value.notes || null,
            file: this.selectedFile() as File,
        });

        this.uploading.set(false);

        if (response.error) {
            this.error.set(response.error);
            return;
        }

        this.success.set('تم حفظ الملف وربطه بالموظف بنجاح.');
        this.selectedFile.set(null);
        this.form.reset({ title: '', document_type: 'leave', issued_at: '', notes: '' });
        await this.loadDocuments();
    }

    async openDocument(document: EmployeeDocument): Promise<void> {
        const url = await this.getDocumentUrl(document.file_path);
        if (!url) return;
        window.open(url, '_blank', 'noopener,noreferrer');
    }

    async printDocument(document: EmployeeDocument): Promise<void> {
        const url = await this.getDocumentUrl(document.file_path);
        if (!url) return;
        const popup = window.open(url, '_blank', 'noopener,noreferrer');
        if (!popup) {
            this.error.set('افتح الملف ثم اطبعه من المتصفح. المتصفح منع نافذة الطباعة.');
        }
    }

    async deleteDocument(id: string): Promise<void> {
        const confirmed = window.confirm('هل أنت متأكد من حذف هذا الملف من أرشيف الموظف؟');
        if (!confirmed) return;

        const response = await this.documentService.softDeleteDocument(id);
        if (response.error) {
            this.error.set(response.error);
            return;
        }

        await this.loadDocuments();
    }

    typeLabel(type: EmployeeDocumentType): string {
        const labels: Record<EmployeeDocumentType, string> = {
            leave: 'إجازة',
            appointment: 'تعيين / قرار إداري',
            national_id: 'رقم قومي',
            medical: 'طبي',
            disciplinary: 'جزاء / تحقيق',
            other: 'أخرى',
        };
        return labels[type];
    }

    iconFor(document: EmployeeDocument): string {
        if (document.mime_type?.includes('pdf')) return 'picture_as_pdf';
        if (document.mime_type?.startsWith('image/')) return 'image';
        return 'description';
    }

    sizeLabel(size: number | null): string {
        if (!size) return 'حجم غير معروف';
        if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`;
        return `${(size / 1024 / 1024).toFixed(1)} MB`;
    }

    uploadedLabel(value: string): string {
        return new Date(value).toLocaleDateString('ar-EG');
    }

    private async loadEmployee(): Promise<void> {
        const response = await this.employeeService.getEmployeeById(this.employeeId());
        if (response.error || !response.data) {
            this.error.set(response.error || 'تعذر العثور على الموظف المطلوب.');
            return;
        }
        this.employee.set(response.data);
    }

    private async loadDocuments(): Promise<void> {
        this.loading.set(true);
        const response = await this.documentService.listByEmployee(this.employeeId());
        this.loading.set(false);

        if (response.error) {
            this.error.set(response.error);
            this.documents.set([]);
            return;
        }

        this.documents.set(response.data);
    }

    private async getDocumentUrl(filePath: string): Promise<string | null> {
        const response = await this.documentService.createSignedUrl(filePath);
        if (response.error || !response.data) {
            this.error.set(response.error || 'تعذر فتح الملف.');
            return null;
        }
        return response.data;
    }
}
