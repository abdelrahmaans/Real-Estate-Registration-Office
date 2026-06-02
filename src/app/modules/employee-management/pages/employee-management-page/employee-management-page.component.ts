import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import {
  EmployeeFilterOptions,
  EmployeeFilters,
  EmployeeService,
} from '../../services/employee.service';
import { Employee } from '../../models/employee.model';

type FilterEvent = Event & { target: HTMLInputElement | HTMLSelectElement };

@Component({
  selector: 'app-employee-management-page',
  imports: [RouterLink, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="page-shell" dir="rtl">
      <header class="admin-header">
        <div>
          <p class="eyebrow">إدارة الموظفين</p>
          <h1>سجل العاملين 2026</h1>
          <p class="summary">بحث وفلترة وتعديل مباشر على بيانات الموظفين المتصلة بقاعدة بيانات Supabase.</p>
        </div>

        <div class="header-actions">
          <a class="action-secondary" routerLink="/dashboard">
            <mat-icon>dashboard</mat-icon>
            الداشبورد
          </a>
          <a class="action-primary" routerLink="/employees/new">
            <mat-icon>person_add_alt_1</mat-icon>
            إضافة موظف
          </a>
        </div>
      </header>

      <section class="metrics-strip" aria-label="ملخص الموظفين">
        <article class="metric-card">
          <span class="metric-card__icon metric-card__icon--blue"><mat-icon>groups</mat-icon></span>
          <span class="metric-card__label">إجمالي النتائج</span>
          <strong>{{ employees().length }}</strong>
        </article>
        <article class="metric-card">
          <span class="metric-card__icon metric-card__icon--green"><mat-icon>verified_user</mat-icon></span>
          <span class="metric-card__label">نشط</span>
          <strong>{{ activeCount() }}</strong>
        </article>
        <article class="metric-card">
          <span class="metric-card__icon metric-card__icon--cyan"><mat-icon>business</mat-icon></span>
          <span class="metric-card__label">مكاتب ظاهرة</span>
          <strong>{{ visibleOfficeCount() }}</strong>
        </article>
        <article class="metric-card">
          <span class="metric-card__icon metric-card__icon--amber"><mat-icon>sync</mat-icon></span>
          <span class="metric-card__label">آخر تحديث</span>
          <strong>{{ lastUpdatedLabel() }}</strong>
        </article>
      </section>

      <section class="filters-panel" aria-label="فلاتر الموظفين">
        <label class="filter-field filter-field--wide">
          <span>بحث عام</span>
          <span class="input-shell">
            <mat-icon>manage_search</mat-icon>
            <input
              [value]="filters().search ?? ''"
              (input)="updateTextFilter('search', $event)"
              placeholder="الاسم، الكود، الهاتف، الوظيفة، المكتب"
            />
          </span>
        </label>

        <label class="filter-field">
          <span>المكتب / المأمورية</span>
          <select [value]="filters().officeCode ?? 'all'" (change)="updateTextFilter('officeCode', $event)">
            <option value="all">كل المكاتب</option>
            @for (office of filterOptions().offices; track office.code) {
              <option [value]="office.code">{{ office.name }}</option>
            }
          </select>
        </label>

        <label class="filter-field">
          <span>الوظيفة</span>
          <select [value]="filters().jobTitle ?? 'all'" (change)="updateTextFilter('jobTitle', $event)">
            <option value="all">كل الوظائف</option>
            @for (jobTitle of filterOptions().jobTitles; track jobTitle) {
              <option [value]="jobTitle">{{ jobTitle }}</option>
            }
          </select>
        </label>

        <label class="filter-field">
          <span>الحالة</span>
          <select [value]="filters().status ?? 'all'" (change)="updateTextFilter('status', $event)">
            <option value="all">كل الحالات</option>
            <option value="active">نشط</option>
            <option value="retired">متقاعد</option>
            <option value="resigned">مستقيل</option>
          </select>
        </label>

        <button class="action-secondary" type="button" (click)="resetFilters()">
          <mat-icon>restart_alt</mat-icon>
          تصفير
        </button>
      </section>

      @if (error()) {
        <p class="state state--error">{{ error() }}</p>
      }

      <section class="table-panel" aria-label="جدول الموظفين">
        <div class="table-toolbar">
          <div>
            <p class="section-kicker">البيانات المباشرة</p>
            <h2>قائمة الموظفين</h2>
          </div>
          @if (loading()) {
            <span class="loading-pill"><mat-icon>sync</mat-icon> جاري التحديث...</span>
          } @else {
            <span class="loading-pill loading-pill--ready"><mat-icon>cloud_done</mat-icon> متصل بالباك</span>
          }
        </div>

        @if (employees().length === 0 && !loading()) {
          <p class="state">لا توجد نتائج مطابقة للفلاتر الحالية.</p>
        } @else {
          <div class="employee-table-wrap">
            <table class="employee-table">
              <thead>
                <tr>
                  <th>الموظف</th>
                  <th>الكود</th>
                  <th>المكتب / المأمورية</th>
                  <th>الوظيفة</th>
                  <th>الهاتف</th>
                  <th>ملاحظات</th>
                  <th>الحالة</th>
                  <th>إجراءات</th>
                </tr>
              </thead>
              <tbody>
                @for (employee of employees(); track employee.id) {
                  <tr>
                    <td>
                      <div class="employee-cell">
                        <span class="avatar">{{ employee.full_name.charAt(0) }}</span>
                        <span>
                          <strong>{{ employee.full_name }}</strong>
                          <small>{{ employee.source_document || 'سجل يدوي' }}</small>
                        </span>
                      </div>
                    </td>
                    <td>{{ employee.employee_id }}</td>
                    <td>{{ employee.office_name || employee.department }}</td>
                    <td>{{ employee.job_title }}</td>
                    <td dir="ltr">{{ employee.mobile_number }}</td>
                    <td class="notes-cell">{{ employee.notes || '-' }}</td>
                    <td>
                      <span class="status-chip" [class]="'status-chip status-chip--' + employee.employment_status">
                        {{ statusLabel(employee.employment_status) }}
                      </span>
                    </td>
                    <td class="actions-cell">
                      <a class="icon-action" [routerLink]="['/employees/profile', employee.id, 'documents']" aria-label="ملفات الموظف">
                        <mat-icon>folder_open</mat-icon>
                      </a>
                      <a class="icon-action" [routerLink]="['/employees/profile', employee.id]" aria-label="تعديل الموظف">
                        <mat-icon>edit_square</mat-icon>
                      </a>
                      <button class="icon-action icon-action--danger" type="button" (click)="deleteEmployee(employee.id)" aria-label="حذف الموظف">
                        <mat-icon>delete</mat-icon>
                      </button>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      </section>
    </section>
  `,
  styleUrl: './employee-management-page.component.css',
})
export class EmployeeManagementPageComponent {
  private readonly employeeService = inject(EmployeeService);

  readonly employees = signal<Employee[]>([]);
  readonly filters = signal<EmployeeFilters>({ search: '', officeCode: 'all', status: 'all', jobTitle: 'all' });
  readonly filterOptions = signal<EmployeeFilterOptions>({ offices: [], jobTitles: [] });
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly lastUpdated = signal<Date | null>(null);

  readonly activeCount = computed(() =>
    this.employees().filter((employee) => employee.employment_status === 'active').length
  );
  readonly visibleOfficeCount = computed(() => {
    const offices = new Set(this.employees().map((employee) => employee.office_code || employee.office_name));
    offices.delete(null);
    offices.delete('');
    return offices.size;
  });
  readonly lastUpdatedLabel = computed(() => {
    const value = this.lastUpdated();
    if (!value) return '-';
    return value.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
  });

  constructor() {
    this.loadFilterOptions();
    this.loadEmployees();
  }

  updateTextFilter(key: keyof EmployeeFilters, event: Event): void {
    const value = (event as FilterEvent).target.value;
    this.filters.update((current) => ({ ...current, [key]: value }));
    this.loadEmployees();
  }

  resetFilters(): void {
    this.filters.set({ search: '', officeCode: 'all', status: 'all', jobTitle: 'all' });
    this.loadEmployees();
  }

  async deleteEmployee(id: string): Promise<void> {
    const isConfirmed = window.confirm('هل أنت متأكد من حذف هذا الموظف؟');
    if (!isConfirmed) {
      return;
    }

    const response = await this.employeeService.softDeleteEmployee(id);
    if (response.error) {
      this.error.set(response.error);
      return;
    }

    await this.loadEmployees();
  }

  statusLabel(status: Employee['employment_status']): string {
    if (status === 'active') return 'نشط';
    if (status === 'retired') return 'متقاعد';
    return 'مستقيل';
  }

  private async loadEmployees(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);

    const response = await this.employeeService.listEmployees(this.filters());
    this.loading.set(false);

    if (response.error) {
      this.error.set(response.error);
      this.employees.set([]);
      return;
    }

    this.employees.set(response.data);
    this.lastUpdated.set(new Date());
  }

  private async loadFilterOptions(): Promise<void> {
    const response = await this.employeeService.getFilterOptions();
    if (response.error) {
      this.error.set(response.error);
      return;
    }

    this.filterOptions.set(response.data);
  }
}
