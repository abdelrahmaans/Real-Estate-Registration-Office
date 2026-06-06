import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { SupabaseService } from '@core/services/supabase.service';
import { Employee } from '../../../employee-management/models/employee.model';
import { EmployeeService } from '../../../employee-management/services/employee.service';
import { Letter } from '../../../letters/models/letter.model';
import { LettersService } from '../../../letters/services/letters.service';

type EntityFilter = 'all' | 'employee' | 'letter' | 'complaint' | 'office_order' | 'report';
type ActionFilter = 'all' | 'create' | 'update' | 'delete' | 'upload';
type SearchScope = 'all' | 'updates' | 'employees' | 'letters';

interface DashboardUpdateRow {
  update_id: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  title: string;
  happened_at: string;
}

interface GlobalSearchRecord {
  id: string;
  scope: 'update' | 'employee' | 'letter';
  title: string;
  subtitle: string;
  meta: string;
  date: string;
  route: string;
  icon: string;
}

interface ReportsFilters {
  search: string;
  scope: SearchScope;
  entity: EntityFilter;
  action: ActionFilter;
  dateFrom: string;
  dateTo: string;
}

const DEFAULT_FILTERS: ReportsFilters = {
  search: '',
  scope: 'all',
  entity: 'all',
  action: 'all',
  dateFrom: '',
  dateTo: '',
};

@Component({
  selector: 'app-reports',
  imports: [RouterLink, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="reports-shell" dir="rtl">
      <header class="reports-header">
        <div>
          <p class="eyebrow">التقارير</p>
          <h1>متابعة التحديثات والبحث العام</h1>
          <p class="muted">مكان واحد لمتابعة ما يحدث في النظام والوصول السريع لأي بيانات مسجلة.</p>
        </div>
        <a class="btn-secondary" routerLink="/dashboard">
          <mat-icon>arrow_back</mat-icon>
          القائمة الرئيسية
        </a>
      </header>

      @if (loading()) {
        <p class="state"><mat-icon>sync</mat-icon> جاري تحميل التحديثات والبيانات...</p>
      }

      @if (error()) {
        <p class="state state--error"><mat-icon>error_outline</mat-icon> {{ error() }}</p>
      }

      <section class="filters-panel" aria-label="بحث وفلاتر عامة">
        <div class="field field--wide">
          <label for="globalSearch">بحث في كل النظام</label>
          <div class="input-shell">
            <mat-icon>search</mat-icon>
            <input id="globalSearch" type="search" [value]="filters().search"
              placeholder="اسم موظف، رقم خطاب، موضوع، نوع تحديث..."
              (input)="setFilter('search', eventValue($event))">
          </div>
        </div>

        <div class="field">
          <label for="scopeFilter">نطاق البحث</label>
          <select id="scopeFilter" [value]="filters().scope" (change)="setFilter('scope', eventValue($event))">
            <option value="all">كل الداتا</option>
            <option value="updates">التحديثات فقط</option>
            <option value="employees">الموظفون فقط</option>
            <option value="letters">الخطابات فقط</option>
          </select>
        </div>

        <div class="field">
          <label for="entityFilter">نوع التحديث</label>
          <select id="entityFilter" [value]="filters().entity" (change)="setFilter('entity', eventValue($event))">
            <option value="all">كل الأنواع</option>
            <option value="employee">موظف</option>
            <option value="letter">خطاب</option>
            <option value="complaint">شكوى</option>
            <option value="office_order">أمر إداري</option>
            <option value="report">تقرير</option>
          </select>
        </div>

        <div class="field">
          <label for="actionFilter">الإجراء</label>
          <select id="actionFilter" [value]="filters().action" (change)="setFilter('action', eventValue($event))">
            <option value="all">كل الإجراءات</option>
            <option value="create">إضافة</option>
            <option value="update">تحديث</option>
            <option value="delete">حذف</option>
            <option value="upload">رفع ملف</option>
          </select>
        </div>

        <div class="field">
          <label for="dateFrom">من تاريخ</label>
          <input id="dateFrom" type="date" [value]="filters().dateFrom" (input)="setFilter('dateFrom', eventValue($event))">
        </div>

        <div class="field">
          <label for="dateTo">إلى تاريخ</label>
          <input id="dateTo" type="date" [value]="filters().dateTo" (input)="setFilter('dateTo', eventValue($event))">
        </div>

        <button class="btn-secondary" type="button" (click)="resetFilters()">
          <mat-icon>restart_alt</mat-icon>
          إعادة ضبط
        </button>
      </section>

      <section class="overview-grid" aria-label="ملخص المتابعة">
        <article class="overview-card">
          <mat-icon>notifications_active</mat-icon>
          <span>تحديثات مطابقة</span>
          <strong>{{ filteredUpdates().length }}</strong>
        </article>
        <article class="overview-card">
          <mat-icon>manage_search</mat-icon>
          <span>نتائج البحث</span>
          <strong>{{ globalResults().length }}</strong>
        </article>
        <article class="overview-card">
          <mat-icon>today</mat-icon>
          <span>تحديثات اليوم</span>
          <strong>{{ todayUpdates() }}</strong>
        </article>
      </section>

      <section class="content-grid">
        <article class="panel">
          <div class="panel-heading">
            <div>
              <p class="section-kicker">التحديثات</p>
              <h2>سجل آخر الأحداث</h2>
            </div>
            <mat-icon>history</mat-icon>
          </div>

          <div class="updates-list">
            @for (update of filteredUpdates(); track update.update_id) {
              <div class="update-item">
                <span class="item-icon"><mat-icon>{{ entityIcon(update.entity_type) }}</mat-icon></span>
                <div>
                  <strong>{{ update.title }}</strong>
                  <small>{{ actionLabel(update.action) }} - {{ entityLabel(update.entity_type) }} - {{ displayDate(update.happened_at) }}</small>
                </div>
              </div>
            } @empty {
              <p class="empty-state">لا توجد تحديثات مطابقة للفلاتر الحالية.</p>
            }
          </div>
        </article>

        <article class="panel">
          <div class="panel-heading">
            <div>
              <p class="section-kicker">الوصول السريع</p>
              <h2>نتائج البحث العامة</h2>
            </div>
            <mat-icon>travel_explore</mat-icon>
          </div>

          <div class="results-list">
            @for (record of globalResults(); track record.scope + record.id) {
              <a class="result-item" [routerLink]="record.route">
                <span class="item-icon"><mat-icon>{{ record.icon }}</mat-icon></span>
                <div>
                  <strong>{{ record.title }}</strong>
                  <small>{{ record.subtitle }}</small>
                </div>
                <em>{{ record.meta }}</em>
              </a>
            } @empty {
              <p class="empty-state">اكتب كلمة بحث أو غيّر الفلاتر للوصول للبيانات المطلوبة.</p>
            }
          </div>
        </article>
      </section>
    </section>
  `,
  styles: [
    `
      .reports-shell{padding:24px;min-height:100vh;background:var(--page-bg);color:var(--text-primary)}
      .reports-header,.filters-panel,.overview-card,.panel{background:var(--surface-solid);border:1px solid var(--surface-border);box-shadow:var(--card-shadow)}
      .reports-header{display:flex;justify-content:space-between;align-items:end;gap:18px;padding:22px;border-radius:14px;margin-bottom:16px}
      .eyebrow,.section-kicker{margin:0 0 6px;color:var(--accent);font-size:.78rem;font-weight:800;letter-spacing:0}
      h1,h2{margin:0;color:var(--text-primary);line-height:1.25}
      h1{font-size:2rem} h2{font-size:1.12rem}
      .muted{margin:8px 0 0;color:var(--text-secondary);line-height:1.7}
      .btn-secondary{display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:42px;padding:0 14px;border-radius:10px;font-weight:800;text-decoration:none;cursor:pointer;border:1px solid var(--surface-border);background:var(--surface-solid);color:var(--text-primary);transition:background-color 160ms ease,border-color 160ms ease,color 160ms ease}
      .btn-secondary:hover,.btn-secondary:focus-visible{background:var(--surface-hover);color:var(--accent)}
      .btn-secondary:focus-visible{outline:2px solid var(--accent-border-strong);outline-offset:2px}
      .state{display:inline-flex;align-items:center;gap:8px;margin:0 0 16px;padding:12px 14px;border-radius:10px;background:var(--accent-soft);color:var(--accent);font-weight:800}
      .state--error{background:var(--danger-soft);color:var(--danger)}
      .filters-panel{display:grid;grid-template-columns:1.5fr repeat(5,minmax(130px,1fr)) auto;gap:12px;align-items:end;padding:16px;border-radius:14px;margin-bottom:16px}
      .field{display:grid;gap:6px;min-width:0}
      .field--wide{grid-column:span 2}
      label{color:var(--text-secondary);font-size:.84rem;font-weight:800}
      input,select{width:100%;min-height:42px;border-radius:10px;border:1px solid var(--surface-border);background:var(--surface-solid);color:var(--text-primary);padding:0 12px;font:inherit;outline:none}
      input:focus,select:focus{border-color:var(--accent-border-strong);box-shadow:0 0 0 3px var(--accent-soft)}
      .input-shell{display:grid;grid-template-columns:auto 1fr;align-items:center;gap:8px;min-height:42px;border-radius:10px;border:1px solid var(--surface-border);background:var(--surface-solid);padding:0 10px}
      .input-shell:focus-within{border-color:var(--accent-border-strong);box-shadow:0 0 0 3px var(--accent-soft)}
      .input-shell input{border:0;background:transparent;box-shadow:none;padding:0}
      .input-shell mat-icon{color:var(--text-tertiary)}
      .overview-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin-bottom:16px}
      .overview-card{display:grid;gap:4px;padding:16px;border-radius:12px}
      .overview-card mat-icon{color:var(--accent)}
      .overview-card span{color:var(--text-secondary);font-weight:800}
      .overview-card strong{font-size:1.8rem}
      .content-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px}
      .panel{padding:16px;border-radius:14px;min-height:360px}
      .panel-heading{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:14px}
      .panel-heading mat-icon{color:var(--accent)}
      .updates-list,.results-list{display:grid;gap:10px}
      .update-item,.result-item{display:grid;grid-template-columns:auto 1fr auto;gap:10px;align-items:start;padding:10px;border-radius:12px;background:var(--surface-muted);border:1px solid var(--surface-border);color:var(--text-primary);text-decoration:none}
      .update-item{grid-template-columns:auto 1fr}
      .result-item:hover,.result-item:focus-visible{border-color:var(--accent-border-strong)}
      .item-icon{display:grid;place-items:center;width:38px;height:38px;border-radius:10px;background:var(--accent-soft);color:var(--accent)}
      .update-item strong,.result-item strong{display:block;color:var(--text-primary);line-height:1.45}
      .update-item small,.result-item small{display:block;margin-top:4px;color:var(--text-secondary);line-height:1.5}
      .result-item em{font-style:normal;color:var(--accent);font-weight:800;white-space:nowrap}
      .empty-state{margin:0;color:var(--text-secondary);line-height:1.7}
      @media (max-width:1180px){.filters-panel{grid-template-columns:repeat(3,minmax(0,1fr))}.field--wide{grid-column:span 3}.content-grid{grid-template-columns:1fr}}
      @media (max-width:760px){.reports-shell{padding:14px}.reports-header{align-items:stretch;flex-direction:column}.filters-panel,.overview-grid{grid-template-columns:1fr}.field--wide{grid-column:auto}.result-item{grid-template-columns:auto 1fr}.result-item em{grid-column:2}}
    `,
  ],
})
export class ReportsComponent {
  private readonly supabase = inject(SupabaseService).getClient();
  private readonly employeeService = inject(EmployeeService);
  private readonly lettersService = inject(LettersService);

  readonly updates = signal<DashboardUpdateRow[]>([]);
  readonly employees = signal<Employee[]>([]);
  readonly letters = signal<Letter[]>([]);
  readonly filters = signal<ReportsFilters>({ ...DEFAULT_FILTERS });
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  readonly filteredUpdates = computed(() => {
    const filters = this.filters();
    if (filters.scope === 'employees' || filters.scope === 'letters') return [];

    return this.updates().filter(update =>
      (filters.entity === 'all' || update.entity_type === filters.entity)
      && (filters.action === 'all' || update.action === filters.action)
      && this.matchesSearch(`${update.title} ${update.action} ${update.entity_type}`, filters.search)
      && this.matchesDate(update.happened_at, filters.dateFrom, filters.dateTo)
    );
  });

  readonly globalResults = computed<GlobalSearchRecord[]>(() => {
    const filters = this.filters();
    const updateRecords = filters.scope === 'employees' || filters.scope === 'letters'
      ? []
      : this.filteredUpdates().map(update => this.updateRecord(update));
    const employeeRecords = filters.scope === 'updates' || filters.scope === 'letters'
      ? []
      : this.employees()
          .filter(employee => this.matchesSearch([
            employee.employee_id,
            employee.full_name,
            employee.mobile_number,
            employee.office_name,
            employee.department,
            employee.job_title,
            employee.notes,
          ].join(' '), filters.search))
          .map(employee => this.employeeRecord(employee));
    const letterRecords = filters.scope === 'updates' || filters.scope === 'employees'
      ? []
      : this.letters()
          .filter(letter => this.matchesSearch([
            letter.letter_number,
            letter.serial_number,
            letter.subject,
            letter.summary,
            letter.sender,
            letter.receiver,
            letter.category,
          ].join(' '), filters.search))
          .map(letter => this.letterRecord(letter));

    return [...updateRecords, ...employeeRecords, ...letterRecords]
      .filter(record => this.matchesDate(record.date, filters.dateFrom, filters.dateTo))
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 80);
  });

  readonly todayUpdates = computed(() => {
    const today = new Date().toISOString().slice(0, 10);
    return this.updates().filter(update => update.happened_at.slice(0, 10) === today).length;
  });

  constructor() {
    void this.loadData();
  }

  eventValue(event: Event): string {
    return event.target instanceof HTMLInputElement || event.target instanceof HTMLSelectElement
      ? event.target.value
      : '';
  }

  setFilter(key: keyof ReportsFilters, value: string): void {
    this.filters.update(filters => ({ ...filters, [key]: value } as ReportsFilters));
  }

  resetFilters(): void {
    this.filters.set({ ...DEFAULT_FILTERS });
  }

  entityIcon(entityType: string): string {
    const icons: Record<string, string> = {
      employee: 'badge',
      letter: 'mail',
      complaint: 'support_agent',
      office_order: 'assignment',
      report: 'analytics',
    };
    return icons[entityType] ?? 'notifications';
  }

  entityLabel(entityType: string): string {
    const labels: Record<string, string> = {
      employee: 'موظف',
      letter: 'خطاب',
      complaint: 'شكوى',
      office_order: 'أمر إداري',
      report: 'تقرير',
    };
    return labels[entityType] ?? entityType;
  }

  actionLabel(action: string): string {
    const labels: Record<string, string> = {
      create: 'إضافة',
      insert: 'إضافة',
      update: 'تحديث',
      delete: 'حذف',
      upload: 'رفع ملف',
    };
    return labels[action] ?? action;
  }

  displayDate(value: string): string {
    return new Date(value).toLocaleDateString('ar-EG', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  private async loadData(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);

    const [updatesResponse, employeesResponse, lettersResponse] = await Promise.all([
      this.supabase.from('dashboard_recent_updates').select('*').order('happened_at', { ascending: false }).limit(200),
      this.employeeService.list(),
      this.lettersService.list(),
    ]);

    this.loading.set(false);

    if (updatesResponse.error || employeesResponse.error || lettersResponse.error) {
      this.error.set(updatesResponse.error?.message || employeesResponse.error || lettersResponse.error || 'تعذر تحميل بيانات المتابعة.');
    }

    this.updates.set((updatesResponse.data ?? []) as DashboardUpdateRow[]);
    this.employees.set(employeesResponse.data || []);
    this.letters.set(lettersResponse.data || []);
  }

  private updateRecord(update: DashboardUpdateRow): GlobalSearchRecord {
    return {
      id: update.update_id,
      scope: 'update',
      title: update.title,
      subtitle: `${this.actionLabel(update.action)} - ${this.entityLabel(update.entity_type)}`,
      meta: 'تحديث',
      date: update.happened_at,
      route: this.entityRoute(update.entity_type, update.entity_id),
      icon: this.entityIcon(update.entity_type),
    };
  }

  private employeeRecord(employee: Employee): GlobalSearchRecord {
    return {
      id: employee.id,
      scope: 'employee',
      title: employee.full_name,
      subtitle: `${employee.employee_id} - ${employee.job_title || 'بدون وظيفة'}`,
      meta: 'موظف',
      date: employee.updated_at || employee.created_at,
      route: `/employees/profile/${employee.id}`,
      icon: 'badge',
    };
  }

  private letterRecord(letter: Letter): GlobalSearchRecord {
    return {
      id: letter.id,
      scope: 'letter',
      title: letter.subject || letter.letter_number,
      subtitle: `${letter.letter_number || 'بدون رقم'} - ${letter.type === 'incoming' ? 'وارد' : 'صادر'}`,
      meta: 'خطاب',
      date: letter.updated_at || letter.letter_date || letter.created_at,
      route: `/letters/${letter.id}`,
      icon: 'mail',
    };
  }

  private entityRoute(entityType: string, entityId: string | null): string {
    if (entityType === 'employee' && entityId) return `/employees/profile/${entityId}`;
    if (entityType === 'letter' && entityId) return `/letters/${entityId}`;
    return '/reports';
  }

  private matchesSearch(value: string, search: string): boolean {
    const normalizedSearch = search.trim().toLowerCase();
    if (!normalizedSearch) return true;
    return value.toLowerCase().includes(normalizedSearch);
  }

  private matchesDate(value: string, from: string, to: string): boolean {
    if (!value) return !from && !to;
    const day = value.slice(0, 10);
    return (!from || day >= from) && (!to || day <= to);
  }
}
