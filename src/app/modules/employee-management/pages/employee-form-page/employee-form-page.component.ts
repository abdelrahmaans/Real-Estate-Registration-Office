import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { Employee, EmploymentStatus } from '../../models/employee.model';
import { EmployeeService } from '../../services/employee.service';

@Component({
  selector: 'app-employee-form-page',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="form-shell" dir="rtl">
      <article class="panel">
        <header class="panel__header">
          <div>
            <p class="kicker">إدارة الموظفين</p>
            <h1>{{ pageTitle() }}</h1>
            <p>{{ pageSubtitle() }}</p>
          </div>

          <div class="panel__actions">
            <a class="nav-action" routerLink="/dashboard">
              <mat-icon>dashboard</mat-icon>
              الداشبورد
            </a>
            <a class="nav-action" routerLink="/employees">
              <mat-icon>arrow_forward</mat-icon>
              العودة للقائمة
            </a>
            @if (employeeId()) {
              <a class="nav-action" [routerLink]="['/employees/profile', employeeId(), 'documents']">
                <mat-icon>folder_open</mat-icon>
                ملفات الموظف
              </a>
            }
          </div>
        </header>

        @if (loading()) {
          <p class="message"><mat-icon>sync</mat-icon> جاري تحميل البيانات...</p>
        } @else {
          <form [formGroup]="form" (ngSubmit)="onSubmit()" class="employee-form">
            <mat-form-field appearance="outline">
              <mat-label>الكود الوظيفي</mat-label>
              <input matInput formControlName="employee_id" />
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>الاسم الكامل</mat-label>
              <input matInput formControlName="full_name" />
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>المكتب / المأمورية</mat-label>
              <input matInput formControlName="office_name" />
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>كود المكتب</mat-label>
              <input matInput formControlName="office_code" />
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>الوظيفة</mat-label>
              <input matInput formControlName="job_title" />
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>رقم الهاتف</mat-label>
              <input matInput formControlName="mobile_number" />
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>الرقم القومي</mat-label>
              <input matInput formControlName="national_id" />
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>البريد الإلكتروني</mat-label>
              <input matInput formControlName="email" type="email" />
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>تاريخ التعيين</mat-label>
              <input matInput formControlName="employment_date" type="date" />
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>حالة التوظيف</mat-label>
              <mat-select panelClass="solid-select-panel" formControlName="employment_status">
                <mat-option value="active">نشط</mat-option>
                <mat-option value="retired">متقاعد</mat-option>
                <mat-option value="resigned">مستقيل</mat-option>
              </mat-select>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>رقم داخلي / بديل</mat-label>
              <input matInput formControlName="secondary_phone" />
            </mat-form-field>

            <mat-form-field appearance="outline" class="full">
              <mat-label>العنوان</mat-label>
              <textarea matInput rows="2" formControlName="address"></textarea>
            </mat-form-field>

            <mat-form-field appearance="outline" class="full">
              <mat-label>ملاحظات</mat-label>
              <textarea matInput rows="3" formControlName="notes"></textarea>
            </mat-form-field>

            @if (error()) {
              <p class="error">{{ error() }}</p>
            }

            @if (success()) {
              <p class="success">{{ success() }}</p>
            }

            <div class="form-actions">
              <button class="submit-action" type="submit" [disabled]="submitting() || form.invalid">
                <mat-icon>save</mat-icon>
                {{ submitLabel() }}
              </button>
            </div>
          </form>
        }
      </article>
    </section>
  `,
  styleUrl: './employee-form-page.component.css',
})
export class EmployeeFormPageComponent {
  private readonly fb = inject(FormBuilder);
  private readonly employeeService = inject(EmployeeService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly employeeId = signal<string | null>(this.route.snapshot.paramMap.get('id'));
  readonly loading = signal(false);
  readonly submitting = signal(false);
  readonly error = signal<string | null>(null);
  readonly success = signal<string | null>(null);

  readonly pageTitle = computed(() => (this.employeeId() ? 'تعديل ملف موظف' : 'إضافة موظف جديد'));
  readonly pageSubtitle = computed(() =>
    this.employeeId()
      ? 'تحديث بيانات الموظف وحفظها مباشرة في قاعدة البيانات.'
      : 'إنشاء سجل موظف جديد ببيانات واضحة وقابلة للفلترة.'
  );
  readonly submitLabel = computed(() => (this.employeeId() ? 'حفظ التعديلات' : 'إنشاء الموظف'));

  form = this.fb.nonNullable.group({
    employee_id: ['', [Validators.required]],
    full_name: ['', [Validators.required]],
    national_id: [''],
    mobile_number: ['', [Validators.required]],
    secondary_phone: [''],
    email: ['', [Validators.email]],
    address: [''],
    department: [''],
    office_code: [''],
    office_name: ['', [Validators.required]],
    job_title: ['', [Validators.required]],
    employment_date: [''],
    retirement_date: [''],
    employment_status: this.fb.nonNullable.control<EmploymentStatus>('active'),
    notes: [''],
    profile_image_url: [''],
    office_sort_order: this.fb.control<number | null>(null),
    office_employee_order: this.fb.control<number | null>(null),
    source_document: [''],
  });

  constructor() {
    const id = this.employeeId();
    if (id) {
      this.loadEmployee(id);
    }
  }

  async onSubmit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.error.set(null);
    this.success.set(null);
    this.submitting.set(true);

    const value = this.form.getRawValue();
    const officeName = value.office_name.trim();
    const payload = {
      ...value,
      national_id: value.national_id || null,
      secondary_phone: value.secondary_phone || null,
      email: value.email || null,
      address: value.address || null,
      department: value.department || officeName,
      office_code: value.office_code || null,
      office_name: officeName,
      employment_date: value.employment_date || null,
      retirement_date: value.retirement_date || null,
      notes: value.notes || null,
      profile_image_url: value.profile_image_url || null,
      source_document: value.source_document || null,
      imported_at: null,
    };

    const id = this.employeeId();
    const response = id
      ? await this.employeeService.updateEmployee(id, payload)
      : await this.employeeService.createEmployee(payload);

    this.submitting.set(false);

    if (response.error) {
      this.error.set(response.error);
      return;
    }

    this.success.set(id ? 'تم حفظ التعديلات بنجاح.' : 'تم إنشاء الموظف بنجاح.');

    if (!id && response.data) {
      this.router.navigate(['/employees/profile', response.data.id]);
    }
  }

  private async loadEmployee(id: string): Promise<void> {
    this.loading.set(true);
    this.error.set(null);

    const response = await this.employeeService.getEmployeeById(id);
    this.loading.set(false);

    if (response.error || !response.data) {
      this.error.set(response.error || 'لم يتم العثور على الموظف المطلوب.');
      return;
    }

    this.patchForm(response.data);
  }

  private patchForm(employee: Employee): void {
    this.form.patchValue({
      employee_id: employee.employee_id,
      full_name: employee.full_name,
      national_id: employee.national_id ?? '',
      mobile_number: employee.mobile_number,
      secondary_phone: employee.secondary_phone ?? '',
      email: employee.email ?? '',
      address: employee.address ?? '',
      department: employee.department,
      office_code: employee.office_code ?? '',
      office_name: employee.office_name ?? employee.department,
      job_title: employee.job_title,
      employment_date: employee.employment_date ?? '',
      retirement_date: employee.retirement_date ?? '',
      employment_status: employee.employment_status,
      notes: employee.notes ?? '',
      profile_image_url: employee.profile_image_url ?? '',
      office_sort_order: employee.office_sort_order,
      office_employee_order: employee.office_employee_order,
      source_document: employee.source_document ?? '',
    });
  }
}
