import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { EmployeeService } from '../../services/employee.service';
import { Employee } from '../../models/employee.model';

type MetricCard = {
  label: string;
  value: string;
  hint: string;
  accent: string;
};

type QuickAction = {
  title: string;
  description: string;
  icon: string;
  link: string;
};

@Component({
  selector: 'app-employee-management-page',
  imports: [CommonModule, RouterLink, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="page-shell" dir="rtl">
      <div class="ambient ambient--one"></div>
      <div class="ambient ambient--two"></div>

      <header class="hero panel">
        <div class="hero__copy">
          <p class="eyebrow">إدارة الموظفين</p>
          <h1>واجهة واضحة وسريعة لإدارة ملفات الفريق والعمليات اليومية</h1>
          <p class="summary">
            تصميم عملي يركز على الرؤية السريعة، تنظيم البيانات، والوصول المباشر لأهم الإجراءات.
          </p>

          <div class="hero__actions">
            <a class="action-primary" routerLink="/employees/new">
              <mat-icon>person_add_alt_1</mat-icon>
              إضافة موظف
            </a>
            <a class="action-secondary" routerLink="/dashboard">
              <mat-icon>dashboard</mat-icon>
              العودة للوحة التحكم
            </a>
          </div>
        </div>

        <div class="hero__stats">
          @for (metric of metrics(); track metric.label) {
            <article class="metric-card" [style.--metric-accent]="metric.accent">
              <p class="metric-card__value">{{ metric.value }}</p>
              <p class="metric-card__label">{{ metric.label }}</p>
              <p class="metric-card__hint">{{ metric.hint }}</p>
            </article>
          }
        </div>
      </header>

      <section class="layout-grid">
        <article class="panel panel--wide">
          <div class="section-head">
            <div>
              <p class="section-kicker">اختصارات</p>
              <h2>أقسام تشغيلية جاهزة للتوسع</h2>
            </div>
            <p class="section-copy">كل بطاقة هنا تمثل نقطة دخول سريعة يمكن ربطها لاحقًا بصفحات CRUD الفعلية.</p>
          </div>

          <div class="quick-actions">
            @for (action of quickActions; track action.title) {
              <a class="action-card" [routerLink]="action.link">
                <span class="action-card__icon">
                  <mat-icon>{{ action.icon }}</mat-icon>
                </span>
                <span class="action-card__body">
                  <strong>{{ action.title }}</strong>
                  <span>{{ action.description }}</span>
                </span>
                <mat-icon class="action-card__chevron">chevron_left</mat-icon>
              </a>
            }
          </div>
        </article>

        <article class="panel panel--stack">
          <div class="section-head section-head--compact">
            <div>
              <p class="section-kicker">بحث مباشر</p>
              <h2>ابحث عن موظف</h2>
            </div>
          </div>

          <label class="search-box">
            <mat-icon>search</mat-icon>
            <input
              [value]="searchTerm()"
              (input)="onSearch($any($event.target).value)"
              placeholder="ابحث بالاسم أو الرقم الوظيفي أو الرقم القومي"
            />
          </label>

          <p class="result-count">عدد النتائج: {{ employees().length }}</p>

          @if (error()) {
            <p class="state state--error">{{ error() }}</p>
          }

          @if (loading()) {
            <p class="state">جاري تحميل الموظفين...</p>
          }
        </article>

        <article class="panel panel--wide panel--accent">
          <div class="section-head">
            <div>
              <p class="section-kicker">سجلات الموظفين</p>
              <h2>قائمة الموظفين الفعلية</h2>
            </div>
          </div>

          @if (employees().length === 0 && !loading()) {
            <p class="state">لا توجد بيانات موظفين حالياً. ابدأ بإضافة موظف جديد.</p>
          } @else {
            <div class="employee-table-wrap">
              <table class="employee-table">
                <thead>
                  <tr>
                    <th>صورة</th>
                    <th>الرقم الوظيفي</th>
                    <th>الاسم</th>
                    <th>القسم</th>
                    <th>المسمى</th>
                    <th>الحالة</th>
                    <th>إجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  @for (employee of employees(); track employee.id) {
                    <tr>
                      <td class="avatar-cell">
                        <div class="avatar">
                          <img *ngIf="employee.profile_image_url" src="{{ employee.profile_image_url }}" alt="{{ employee.full_name }}" />
                          <span *ngIf="!employee.profile_image_url">{{ employee.full_name.charAt(0) }}</span>
                        </div>
                      </td>
                      <td>{{ employee.employee_id }}</td>
                      <td>{{ employee.full_name }}</td>
                      <td>{{ employee.department }}</td>
                      <td>{{ employee.job_title }}</td>
                      <td>
                        <span class="status-chip" [class]="'status-chip status-chip--' + employee.employment_status">
                          {{ statusLabel(employee.employment_status) }}
                        </span>
                      </td>
                      <td class="actions-cell">
                        <a class="btn-edit" [routerLink]="['/employees/profile', employee.id]">تعديل</a>
                        <button class="btn-delete" type="button" (click)="deleteEmployee(employee.id)">حذف</button>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }
        </article>
      </section>
    </section>
  `,
  styleUrl: './employee-management-page.component.css',
})
export class EmployeeManagementPageComponent {
  private readonly employeeService = inject(EmployeeService);

  readonly employees = signal<Employee[]>([]);
  readonly searchTerm = signal('');
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  readonly metrics = computed<MetricCard[]>(() => {
    const items = this.employees();
    const activeCount = items.filter((item) => item.employment_status === 'active').length;
    const retiredCount = items.filter((item) => item.employment_status === 'retired').length;
    const resignedCount = items.filter((item) => item.employment_status === 'resigned').length;

    return [
      {
        label: 'الموظفون النشطون',
        value: String(activeCount),
        hint: 'إجمالي الموظفين بالحالة النشطة',
        accent: '#38bdf8',
      },
      {
        label: 'المتقاعدون',
        value: String(retiredCount),
        hint: 'موظفون تم إنهاء الخدمة بالتقاعد',
        accent: '#f59e0b',
      },
      {
        label: 'المستقيلون',
        value: String(resignedCount),
        hint: 'سجلات ترك الخدمة بالاستقالة',
        accent: '#22c55e',
      },
    ];
  });

  readonly quickActions: QuickAction[] = [
    {
      title: 'إضافة موظف جديد',
      description: 'بدء نموذج الإضافة مع بيانات التوظيف الأساسية.',
      icon: 'person_add',
      link: '/employees/new',
    },
    {
      title: 'عرض الملف الوظيفي',
      description: 'اختيار موظف من القائمة ثم فتح صفحة التعديل.',
      icon: 'badge',
      link: '/employees',
    },
    {
      title: 'مراجعة الطلبات',
      description: 'متابعة الموافقات والتعديلات والطلبات الداخلية.',
      icon: 'task_alt',
      link: '/employees/requests',
    },
    {
      title: 'أرشيف السجلات',
      description: 'الوصول السريع إلى الملفات المؤرشفة والقديمة.',
      icon: 'archive',
      link: '/employees/archive',
    },
  ];

  constructor() {
    this.loadEmployees();
  }

  async onSearch(value: string): Promise<void> {
    this.searchTerm.set(value);
    await this.loadEmployees();
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

  private async loadEmployees(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);

    const response = await this.employeeService.listEmployees(this.searchTerm());
    this.loading.set(false);

    if (response.error) {
      this.error.set(response.error);
      this.employees.set([]);
      return;
    }

    this.employees.set(response.data);
  }

  statusLabel(status: Employee['employment_status']): string {
    if (status === 'active') {
      return 'نشط';
    }

    if (status === 'retired') {
      return 'متقاعد';
    }

    return 'مستقيل';
  }
}
