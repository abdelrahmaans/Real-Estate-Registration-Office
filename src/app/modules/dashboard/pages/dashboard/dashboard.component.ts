import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { DashboardAnalyticsService } from '../../services/dashboard-analytics.service';
import { DashboardAnalytics } from '../../models/dashboard-analytics.model';

type StatCard = {
  label: string;
  value: number;
  hint: string;
  icon: string;
  tone: 'blue' | 'green' | 'amber' | 'red' | 'cyan';
};

@Component({
  selector: 'app-dashboard',
  imports: [RouterLink, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="dashboard-shell" dir="rtl">
      <header class="dashboard-header">
        <div>
          <p class="eyebrow">القائمة الرئيسية</p>
          <h1>مؤشرات مكتب الشهر العقاري</h1>
          <p class="muted">متابعة مباشرة للموظفين والخطابات والملفات التشغيلية من قاعدة البيانات.</p>
        </div>

        <div class="header-actions">
          <a class="action-secondary" routerLink="/employees">
            <mat-icon>groups</mat-icon>
            الموظفون
          </a>
          <a class="action-secondary" routerLink="/letters">
            <mat-icon>mark_email_unread</mat-icon>
            الخطابات
          </a>
          <a class="action-primary" routerLink="/reports">
            <mat-icon>analytics</mat-icon>
            التقارير
          </a>
        </div>
      </header>

      @if (loading()) {
        <p class="state"><mat-icon>sync</mat-icon> جاري تحميل المؤشرات...</p>
      }

      @if (error()) {
        <p class="state state--error">{{ error() }}</p>
      }

      <section class="stats-grid" aria-label="ملخص المؤشرات">
        @for (card of statCards(); track card.label) {
          <article class="stat-card">
            <span class="stat-card__icon" [class]="'stat-card__icon stat-card__icon--' + card.tone">
              <mat-icon>{{ card.icon }}</mat-icon>
            </span>
            <span class="stat-card__label">{{ card.label }}</span>
            <strong>{{ card.value }}</strong>
            <small>{{ card.hint }}</small>
          </article>
        }
      </section>

      <section class="quick-grid" aria-label="اختصارات العمل">
        <a class="quick-card quick-card--primary" routerLink="/employees">
          <mat-icon>person_search</mat-icon>
          <strong>إدارة الموظفين</strong>
          <span>بحث، فلترة، تعديل، وفتح ملفات الموظف.</span>
        </a>
        <a class="quick-card" routerLink="/letters/new">
          <mat-icon>post_add</mat-icon>
          <strong>خطاب جديد</strong>
          <span>تسجيل خطاب وارد أو صادر بسرعة.</span>
        </a>
        <a class="quick-card" routerLink="/reports">
          <mat-icon>summarize</mat-icon>
          <strong>ملخص التقارير</strong>
          <span>عرض المؤشرات الحالية وتحليل النشاط.</span>
        </a>
      </section>

      <section class="analytics-grid" aria-label="رسوم الداشبورد">
        <article class="chart-panel chart-panel--wide">
          <div class="panel-heading">
            <div>
              <p class="section-kicker">الخطابات</p>
              <h2>الوارد والصادر حسب الشهر</h2>
            </div>
            <mat-icon>stacked_bar_chart</mat-icon>
          </div>

          @if (analytics().lettersByMonth.length === 0) {
            <p class="empty-state">لا توجد بيانات خطابات كافية لعرض الرسم.</p>
          } @else {
            <div class="month-chart">
              @for (item of analytics().lettersByMonth; track item.month_start) {
                <div class="month-chart__row">
                  <span>{{ monthLabel(item.month_start) }}</span>
                  <div class="month-chart__track" aria-hidden="true">
                    <i class="month-chart__bar month-chart__bar--incoming" [style.width.%]="barPercent(item.incoming_count, maxLettersCount())"></i>
                    <i class="month-chart__bar month-chart__bar--outgoing" [style.width.%]="barPercent(item.outgoing_count, maxLettersCount())"></i>
                  </div>
                  <strong>{{ item.total_count }}</strong>
                </div>
              }
            </div>
            <div class="legend">
              <span><i class="dot dot--incoming"></i> وارد</span>
              <span><i class="dot dot--outgoing"></i> صادر</span>
            </div>
          }
        </article>

        <article class="chart-panel">
          <div class="panel-heading">
            <div>
              <p class="section-kicker">التحديثات</p>
              <h2>آخر ما حدث في النظام</h2>
            </div>
            <mat-icon>notifications_active</mat-icon>
          </div>
          <div class="updates-list">
            @for (item of analytics().recentUpdates; track item.update_id) {
              <div class="update-item">
                <span class="update-item__icon"><mat-icon>{{ updateIcon(item.entity_type) }}</mat-icon></span>
                <div>
                  <strong>{{ item.title }}</strong>
                  <small>{{ updateLabel(item.action, item.entity_type) }} - {{ shortDate(item.happened_at) }}</small>
                </div>
              </div>
            } @empty {
              <p class="empty-state">لا توجد تحديثات حديثة.</p>
            }
          </div>
        </article>

        <article class="chart-panel">
          <div class="panel-heading">
            <div>
              <p class="section-kicker">الإدارات</p>
              <h2>الموظفون حسب الإدارة</h2>
            </div>
            <mat-icon>account_tree</mat-icon>
          </div>
          <div class="rank-list">
            @for (item of analytics().employeesByDepartment; track item.department_name) {
              <div class="rank-item">
                <span>{{ item.department_name }}</span>
                <div class="rank-item__bar"><i [style.width.%]="barPercent(item.employee_count, maxDepartmentEmployees())"></i></div>
                <strong>{{ item.employee_count }}</strong>
              </div>
            } @empty {
              <p class="empty-state">لا توجد بيانات إدارات.</p>
            }
          </div>
        </article>

        <article class="chart-panel">
          <div class="panel-heading">
            <div>
              <p class="section-kicker">الشكاوى</p>
              <h2>الحالة الحالية</h2>
            </div>
            <mat-icon>support_agent</mat-icon>
          </div>
          <div class="status-grid">
            @for (item of analytics().complaintsByStatus; track item.status) {
              <span class="status-pill">{{ statusLabel(item.status) }} <strong>{{ item.complaint_count }}</strong></span>
            } @empty {
              <p class="empty-state">لا توجد شكاوى مسجلة.</p>
            }
          </div>
        </article>

        <article class="chart-panel">
          <div class="panel-heading">
            <div>
              <p class="section-kicker">الأوامر الإدارية</p>
              <h2>حالة الأوامر</h2>
            </div>
            <mat-icon>assignment_turned_in</mat-icon>
          </div>
          <div class="status-grid">
            @for (item of analytics().officeOrdersByStatus; track item.status) {
              <span class="status-pill">{{ statusLabel(item.status) }} <strong>{{ item.order_count }}</strong></span>
            } @empty {
              <p class="empty-state">لا توجد أوامر إدارية مسجلة.</p>
            }
          </div>
        </article>
      </section>
    </section>
  `,
  styles: [
    `
      .dashboard-shell{padding:24px;min-height:100vh;background:var(--page-bg);color:var(--text-primary)}
      .dashboard-header,.stat-card,.quick-card,.chart-panel{background:var(--surface-solid);border:1px solid var(--surface-border);box-shadow:var(--card-shadow)}
      .dashboard-header{display:flex;justify-content:space-between;align-items:end;gap:18px;padding:22px;border-radius:14px;margin-bottom:16px}
      .eyebrow,.section-kicker{margin:0 0 6px;color:var(--accent);font-size:.78rem;font-weight:800;letter-spacing:0}
      h1,h2{margin:0;color:var(--text-primary);line-height:1.25}
      h1{font-size:2rem} h2{font-size:1.12rem}
      .muted{margin:8px 0 0;color:var(--text-secondary);line-height:1.7}
      .header-actions{display:flex;flex-wrap:wrap;gap:10px}
      .action-primary,.action-secondary{display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:42px;padding:0 14px;border-radius:10px;font-weight:800;text-decoration:none;border:1px solid var(--surface-border);transition:background-color 160ms ease,border-color 160ms ease,color 160ms ease}
      .action-primary{background:var(--accent);border-color:var(--accent);color:var(--accent-contrast)}
      .action-secondary{background:var(--surface-solid);color:var(--text-primary)}
      .action-primary:hover,.action-primary:focus-visible{background:var(--accent-strong);color:var(--accent-contrast)}
      .action-secondary:hover,.action-secondary:focus-visible{background:var(--surface-hover);color:var(--accent)}
      .action-primary:focus-visible,.action-secondary:focus-visible,.quick-card:focus-visible{outline:2px solid var(--accent-border-strong);outline-offset:2px}
      .state{display:inline-flex;align-items:center;gap:8px;margin:0 0 16px;padding:12px 14px;border-radius:10px;background:var(--accent-soft);color:var(--accent);font-weight:800}
      .state--error{background:var(--danger-soft);color:var(--danger)}
      .stats-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin-bottom:16px}
      .stat-card{display:grid;grid-template-columns:auto 1fr;gap:6px 12px;align-items:center;padding:16px;border-radius:12px}
      .stat-card__icon{display:inline-grid;grid-row:span 3;place-items:center;width:42px;height:42px;border-radius:12px}
      .stat-card__icon--blue{background:var(--accent-soft);color:var(--accent)}
      .stat-card__icon--green{background:var(--success-soft);color:var(--success-dark)}
      .stat-card__icon--amber{background:var(--warning-soft);color:#b45309}
      .stat-card__icon--red{background:var(--danger-soft);color:var(--danger)}
      .stat-card__icon--cyan{background:rgba(14,165,233,.12);color:#0284c7}
      .stat-card__label{color:var(--text-secondary);font-size:.9rem;font-weight:800}
      .stat-card strong{font-size:1.65rem}
      .stat-card small{color:var(--text-tertiary)}
      .quick-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin-bottom:16px}
      .quick-card{display:grid;gap:8px;min-height:118px;padding:16px;border-radius:12px;text-decoration:none;color:var(--text-primary);transition:transform 160ms ease,border-color 160ms ease}
      .quick-card mat-icon{color:var(--accent)}
      .quick-card--primary{background:var(--accent);border-color:var(--accent);color:var(--accent-contrast)}
      .quick-card--primary mat-icon{color:var(--accent-contrast)}
      .quick-card span{color:inherit;opacity:.78;line-height:1.6}
      .quick-card:hover,.quick-card:focus-visible{transform:translateY(-2px);border-color:var(--accent-border-strong)}
      .analytics-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}
      .chart-panel{padding:16px;border-radius:14px;min-height:250px}
      .chart-panel--wide{grid-column:span 2}
      .panel-heading{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:14px}
      .panel-heading mat-icon{color:var(--accent)}
      .month-chart,.rank-list{display:grid;gap:10px}
      .month-chart__row,.rank-item{display:grid;grid-template-columns:minmax(86px,.5fr) minmax(120px,1fr) auto;align-items:center;gap:10px;color:var(--text-secondary)}
      .month-chart__track,.rank-item__bar{position:relative;display:flex;gap:2px;height:12px;border-radius:999px;background:var(--accent-soft);overflow:hidden}
      .month-chart__bar,.rank-item__bar i{display:block;min-width:4px;height:100%;border-radius:999px}
      .month-chart__bar--incoming{background:var(--accent)}
      .month-chart__bar--outgoing{background:var(--success)}
      .rank-item__bar i{background:linear-gradient(90deg,var(--accent),var(--accent-strong))}
      .rank-item span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
      .rank-item strong,.month-chart__row strong{color:var(--text-primary)}
      .legend{display:flex;gap:14px;margin-top:12px;color:var(--text-secondary);font-weight:700}
      .legend span{display:inline-flex;align-items:center;gap:6px}
      .dot{width:10px;height:10px;border-radius:999px}.dot--incoming{background:var(--accent)}.dot--outgoing{background:var(--success)}
      .status-grid{display:flex;flex-wrap:wrap;gap:10px}
      .status-pill{display:inline-flex;align-items:center;gap:8px;padding:8px 10px;border-radius:999px;background:var(--accent-soft);color:var(--accent);font-weight:800}
      .status-pill strong{color:var(--text-primary)}
      .updates-list{display:grid;gap:10px}
      .update-item{display:grid;grid-template-columns:auto 1fr;gap:10px;align-items:start;padding:10px;border-radius:12px;background:var(--surface-muted);border:1px solid var(--surface-border)}
      .update-item__icon{display:grid;place-items:center;width:36px;height:36px;border-radius:10px;background:var(--accent-soft);color:var(--accent)}
      .update-item strong{display:block;color:var(--text-primary);line-height:1.45}
      .update-item small{display:block;margin-top:4px;color:var(--text-secondary);line-height:1.5}
      .empty-state{margin:0;color:var(--text-secondary);line-height:1.7}
      @media (max-width:1100px){.stats-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.analytics-grid{grid-template-columns:1fr}.chart-panel--wide{grid-column:auto}}
      @media (max-width:720px){.dashboard-shell{padding:14px}.dashboard-header{align-items:stretch;flex-direction:column}.header-actions a{flex:1}.stats-grid,.quick-grid{grid-template-columns:1fr}.month-chart__row,.rank-item{grid-template-columns:1fr auto}.month-chart__track,.rank-item__bar{grid-column:1/-1}}
    `,
  ],
})
export class DashboardComponent {
  private readonly analyticsService = inject(DashboardAnalyticsService);

  readonly analytics = signal<DashboardAnalytics>({
    summary: {
      total_employees: 0,
      active_employees: 0,
      retired_employees: 0,
      total_letters: 0,
      incoming_letters: 0,
      outgoing_letters: 0,
      open_complaints: 0,
      active_office_orders: 0,
    },
    lettersByMonth: [],
    employeesByOffice: [],
    employeesByDepartment: [],
    complaintsByStatus: [],
    officeOrdersByStatus: [],
    recentUpdates: [],
  });
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  readonly statCards = computed<StatCard[]>(() => {
    const summary = this.analytics().summary;
    return [
      { label: 'إجمالي الموظفين', value: summary.total_employees, hint: 'كل السجلات النشطة', icon: 'groups', tone: 'blue' },
      { label: 'الموظفون النشطون', value: summary.active_employees, hint: 'حالة التوظيف نشط', icon: 'verified_user', tone: 'green' },
      { label: 'المتقاعدون', value: summary.retired_employees, hint: 'حالة التوظيف متقاعد', icon: 'elderly', tone: 'amber' },
      { label: 'إجمالي الخطابات', value: summary.total_letters, hint: 'وارد وصادر', icon: 'mail', tone: 'cyan' },
      { label: 'الخطابات الواردة', value: summary.incoming_letters, hint: 'وارد', icon: 'move_to_inbox', tone: 'blue' },
      { label: 'الخطابات الصادرة', value: summary.outgoing_letters, hint: 'صادر', icon: 'outbox', tone: 'green' },
      { label: 'الشكاوى المفتوحة', value: summary.open_complaints, hint: 'غير مغلقة', icon: 'support_agent', tone: 'red' },
      { label: 'الأوامر النشطة', value: summary.active_office_orders, hint: 'أوامر إدارية سارية', icon: 'assignment', tone: 'amber' },
    ];
  });

  readonly maxLettersCount = computed(() => Math.max(1, ...this.analytics().lettersByMonth.map(item => item.total_count)));
  readonly maxDepartmentEmployees = computed(() => Math.max(1, ...this.analytics().employeesByDepartment.map(item => item.employee_count)));

  constructor() {
    void this.loadAnalytics();
  }

  barPercent(value: number, max: number): number {
    return Math.max(4, Math.round((value / Math.max(1, max)) * 100));
  }

  monthLabel(value: string): string {
    return new Date(value).toLocaleDateString('ar-EG', { month: 'short', year: 'numeric' });
  }

  statusLabel(value: string): string {
    const labels: Record<string, string> = {
      open: 'مفتوح',
      active: 'نشط',
      closed: 'مغلق',
      resolved: 'تم الحل',
      cancelled: 'ملغي',
      inactive: 'غير نشط',
      pending: 'قيد المتابعة',
    };
    return labels[value] ?? value;
  }

  updateIcon(entityType: string): string {
    const icons: Record<string, string> = {
      employee: 'badge',
      auth: 'login',
      letter: 'mail',
      complaint: 'support_agent',
      office_order: 'assignment',
      employee_document: 'description',
      report: 'analytics',
    };
    return icons[entityType] ?? 'notifications';
  }

  updateLabel(action: string, entityType: string): string {
    const actionLabels: Record<string, string> = {
      create: 'إضافة',
      insert: 'إضافة',
      update: 'تحديث',
      delete: 'حذف',
      login: 'تسجيل دخول',
      logout: 'تسجيل خروج',
      file_upload: 'رفع ملف',
      file_delete: 'حذف ملف',
      upload: 'رفع ملف',
    };
    const entityLabels: Record<string, string> = {
      employee: 'موظف',
      auth: 'دخول وخروج',
      letter: 'خطاب',
      complaint: 'شكوى',
      office_order: 'أمر إداري',
      employee_document: 'ملف موظف',
      report: 'تقرير',
    };
    return `${actionLabels[action] ?? action} ${entityLabels[entityType] ?? entityType}`;
  }

  shortDate(value: string): string {
    return new Date(value).toLocaleDateString('ar-EG', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  private async loadAnalytics(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);

    const response = await this.analyticsService.loadAnalytics();
    this.loading.set(false);

    if (response.error) {
      this.error.set(response.error);
      return;
    }

    this.analytics.set(response.data);
  }
}
