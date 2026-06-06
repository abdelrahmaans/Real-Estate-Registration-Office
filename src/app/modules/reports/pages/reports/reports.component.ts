import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { Employee, EmploymentStatus } from '../../../employee-management/models/employee.model';
import { EmployeeService } from '../../../employee-management/services/employee.service';
import { Letter, LetterType } from '../../../letters/models/letter.model';
import { LettersService } from '../../../letters/services/letters.service';

type ReportScope = 'all' | 'employees' | 'letters';
type PriorityFilter = 'all' | 'low' | 'normal' | 'high' | 'urgent';
type EmployeeStatusFilter = 'all' | EmploymentStatus;
type LetterTypeFilter = 'all' | LetterType;

interface ReportFilters {
  scope: ReportScope;
  search: string;
  dateFrom: string;
  dateTo: string;
  employeeStatus: EmployeeStatusFilter;
  office: string;
  department: string;
  letterType: LetterTypeFilter;
  letterStatus: string;
  priority: PriorityFilter;
}

interface SummaryCard {
  label: string;
  value: number;
  hint: string;
  icon: string;
  tone: 'blue' | 'green' | 'amber' | 'red' | 'cyan';
}

interface ReportRecord {
  id: string;
  kind: 'employee' | 'letter';
  title: string;
  description: string;
  date: string;
  status: string;
  statusLabel: string;
  meta: string;
  route: string;
}

const DEFAULT_FILTERS: ReportFilters = {
  scope: 'all',
  search: '',
  dateFrom: '',
  dateTo: '',
  employeeStatus: 'all',
  office: 'all',
  department: 'all',
  letterType: 'all',
  letterStatus: 'all',
  priority: 'all',
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
          <h1>مركز التقارير والتحليل</h1>
          <p class="muted">فلترة مباشرة للموظفين والخطابات حسب التاريخ، البحث، الحالة، المكتب، ونوع الخطاب.</p>
        </div>
        <div class="header-actions">
          <a class="btn-secondary" routerLink="/dashboard">
            <mat-icon>arrow_back</mat-icon>
            القائمة الرئيسية
          </a>
          <button class="btn-primary" type="button" (click)="printReport()">
            <mat-icon>print</mat-icon>
            طباعة التقرير
          </button>
        </div>
      </header>

      @if (loading()) {
        <p class="state"><mat-icon>sync</mat-icon> جاري تحميل بيانات التقرير...</p>
      }

      @if (error()) {
        <p class="state state--error"><mat-icon>error_outline</mat-icon> {{ error() }}</p>
      }

      <section class="filters-panel" aria-label="فلاتر التقارير">
        <div class="field field--wide">
          <label for="reportSearch">بحث عام</label>
          <div class="input-shell">
            <mat-icon>search</mat-icon>
            <input id="reportSearch" type="search" [value]="filters().search" placeholder="اسم موظف، رقم خطاب، جهة، موضوع..."
              (input)="setFilter('search', eventValue($event))">
          </div>
        </div>

        <div class="field">
          <label for="scopeFilter">نوع البيانات</label>
          <select id="scopeFilter" [value]="filters().scope" (change)="setFilter('scope', eventValue($event))">
            <option value="all">الكل</option>
            <option value="employees">الموظفون</option>
            <option value="letters">الخطابات</option>
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

        <div class="field">
          <label for="employeeStatus">حالة الموظف</label>
          <select id="employeeStatus" [value]="filters().employeeStatus" (change)="setFilter('employeeStatus', eventValue($event))">
            <option value="all">كل الحالات</option>
            <option value="active">نشط</option>
            <option value="retired">متقاعد</option>
            <option value="resigned">مستقيل</option>
          </select>
        </div>

        <div class="field">
          <label for="officeFilter">المكتب</label>
          <select id="officeFilter" [value]="filters().office" (change)="setFilter('office', eventValue($event))">
            <option value="all">كل المكاتب</option>
            @for (office of officeOptions(); track office) {
              <option [value]="office">{{ office }}</option>
            }
          </select>
        </div>

        <div class="field">
          <label for="departmentFilter">الإدارة</label>
          <select id="departmentFilter" [value]="filters().department" (change)="setFilter('department', eventValue($event))">
            <option value="all">كل الإدارات</option>
            @for (department of departmentOptions(); track department) {
              <option [value]="department">{{ department }}</option>
            }
          </select>
        </div>

        <div class="field">
          <label for="letterType">نوع الخطاب</label>
          <select id="letterType" [value]="filters().letterType" (change)="setFilter('letterType', eventValue($event))">
            <option value="all">كل الخطابات</option>
            <option value="incoming">وارد</option>
            <option value="outgoing">صادر</option>
          </select>
        </div>

        <div class="field">
          <label for="letterStatus">حالة الخطاب</label>
          <select id="letterStatus" [value]="filters().letterStatus" (change)="setFilter('letterStatus', eventValue($event))">
            <option value="all">كل الحالات</option>
            @for (status of letterStatusOptions(); track status) {
              <option [value]="status">{{ statusLabel(status) }}</option>
            }
          </select>
        </div>

        <div class="field">
          <label for="priorityFilter">الأولوية</label>
          <select id="priorityFilter" [value]="filters().priority" (change)="setFilter('priority', eventValue($event))">
            <option value="all">كل الأولويات</option>
            <option value="low">منخفضة</option>
            <option value="normal">عادية</option>
            <option value="high">مرتفعة</option>
            <option value="urgent">عاجلة</option>
          </select>
        </div>

        <button class="btn-secondary" type="button" (click)="resetFilters()">
          <mat-icon>restart_alt</mat-icon>
          إعادة ضبط
        </button>
      </section>

      <section class="summary-grid" aria-label="ملخص التقرير">
        @for (card of summaryCards(); track card.label) {
          <article class="summary-card">
            <span class="summary-card__icon" [class]="'summary-card__icon summary-card__icon--' + card.tone">
              <mat-icon>{{ card.icon }}</mat-icon>
            </span>
            <span>{{ card.label }}</span>
            <strong>{{ card.value }}</strong>
            <small>{{ card.hint }}</small>
          </article>
        }
      </section>

      <section class="content-grid">
        <article class="panel">
          <div class="panel-heading">
            <div>
              <p class="section-kicker">نشاط الفترة</p>
              <h2>آخر النتائج المطابقة</h2>
            </div>
            <mat-icon>timeline</mat-icon>
          </div>
          <div class="activity-list">
            @for (record of recentRecords(); track record.kind + record.id) {
              <a class="activity-item" [routerLink]="record.route">
                <span class="activity-icon"><mat-icon>{{ record.kind === 'employee' ? 'badge' : 'mail' }}</mat-icon></span>
                <div>
                  <strong>{{ record.title }}</strong>
                  <small>{{ record.meta }} - {{ displayDate(record.date) }}</small>
                </div>
              </a>
            } @empty {
              <p class="empty-state">لا توجد نتائج مطابقة للفلاتر الحالية.</p>
            }
          </div>
        </article>

        <article class="panel">
          <div class="panel-heading">
            <div>
              <p class="section-kicker">توزيع سريع</p>
              <h2>الخطابات حسب النوع</h2>
            </div>
            <mat-icon>donut_large</mat-icon>
          </div>
          <div class="bar-list">
            <div class="bar-row">
              <span>وارد</span>
              <i><b [style.width.%]="barPercent(filteredIncomingLetters(), maxFilteredLetters())"></b></i>
              <strong>{{ filteredIncomingLetters() }}</strong>
            </div>
            <div class="bar-row">
              <span>صادر</span>
              <i><b [style.width.%]="barPercent(filteredOutgoingLetters(), maxFilteredLetters())"></b></i>
              <strong>{{ filteredOutgoingLetters() }}</strong>
            </div>
            <div class="bar-row">
              <span>عاجل</span>
              <i><b [style.width.%]="barPercent(filteredUrgentLetters(), maxFilteredLetters())"></b></i>
              <strong>{{ filteredUrgentLetters() }}</strong>
            </div>
          </div>
        </article>
      </section>

      <section class="results-panel">
        <div class="panel-heading">
          <div>
            <p class="section-kicker">نتائج التقرير</p>
            <h2>{{ reportRecords().length }} نتيجة</h2>
          </div>
          <mat-icon>table_view</mat-icon>
        </div>

        <div class="results-table">
          <div class="table-head">
            <span>البيان</span>
            <span>النوع</span>
            <span>الحالة</span>
            <span>التاريخ</span>
            <span>فتح</span>
          </div>
          @for (record of reportRecords(); track record.kind + record.id) {
            <div class="table-row">
              <span>
                <strong>{{ record.title }}</strong>
                <small>{{ record.description }}</small>
              </span>
              <span>{{ record.meta }}</span>
              <span><i class="status-pill">{{ record.statusLabel }}</i></span>
              <span>{{ displayDate(record.date) }}</span>
              <a class="icon-link" [routerLink]="record.route" aria-label="فتح السجل">
                <mat-icon>open_in_new</mat-icon>
              </a>
            </div>
          } @empty {
            <p class="empty-state empty-state--table">لا توجد نتائج مطابقة. جرّب تقليل الفلاتر أو تغيير التاريخ.</p>
          }
        </div>
      </section>
    </section>
  `,
  styles: [
    `
      .reports-shell{padding:24px;min-height:100vh;background:var(--page-bg);color:var(--text-primary)}
      .reports-header,.filters-panel,.summary-card,.panel,.results-panel{background:var(--surface-solid);border:1px solid var(--surface-border);box-shadow:var(--card-shadow)}
      .reports-header{display:flex;justify-content:space-between;align-items:end;gap:18px;padding:22px;border-radius:14px;margin-bottom:16px}
      .eyebrow,.section-kicker{margin:0 0 6px;color:var(--accent);font-size:.78rem;font-weight:800;letter-spacing:0}
      h1,h2{margin:0;color:var(--text-primary);line-height:1.25}
      h1{font-size:2rem} h2{font-size:1.12rem}
      .muted{margin:8px 0 0;color:var(--text-secondary);line-height:1.7}
      .header-actions{display:flex;flex-wrap:wrap;gap:10px}
      .btn-primary,.btn-secondary,.icon-link{display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:42px;border-radius:10px;font-weight:800;text-decoration:none;cursor:pointer;border:1px solid var(--surface-border);transition:background-color 160ms ease,border-color 160ms ease,color 160ms ease,transform 160ms ease}
      .btn-primary,.btn-secondary{padding:0 14px}
      .btn-primary{background:var(--accent);border-color:var(--accent);color:var(--accent-contrast)}
      .btn-secondary{background:var(--surface-solid);color:var(--text-primary)}
      .btn-primary:hover,.btn-primary:focus-visible{background:var(--accent-strong)}
      .btn-secondary:hover,.btn-secondary:focus-visible,.icon-link:hover,.icon-link:focus-visible{background:var(--surface-hover);color:var(--accent)}
      .btn-primary:focus-visible,.btn-secondary:focus-visible,.icon-link:focus-visible{outline:2px solid var(--accent-border-strong);outline-offset:2px}
      .state{display:inline-flex;align-items:center;gap:8px;margin:0 0 16px;padding:12px 14px;border-radius:10px;background:var(--accent-soft);color:var(--accent);font-weight:800}
      .state--error{background:var(--danger-soft);color:var(--danger)}
      .filters-panel{display:grid;grid-template-columns:1.5fr repeat(4,minmax(150px,1fr));gap:12px;align-items:end;padding:16px;border-radius:14px;margin-bottom:16px}
      .field{display:grid;gap:6px;min-width:0}
      .field--wide{grid-column:span 2}
      label{color:var(--text-secondary);font-size:.84rem;font-weight:800}
      input,select{width:100%;min-height:42px;border-radius:10px;border:1px solid var(--surface-border);background:var(--surface-solid);color:var(--text-primary);padding:0 12px;font:inherit;outline:none}
      input:focus,select:focus{border-color:var(--accent-border-strong);box-shadow:0 0 0 3px var(--accent-soft)}
      .input-shell{display:grid;grid-template-columns:auto 1fr;align-items:center;gap:8px;min-height:42px;border-radius:10px;border:1px solid var(--surface-border);background:var(--surface-solid);padding:0 10px}
      .input-shell:focus-within{border-color:var(--accent-border-strong);box-shadow:0 0 0 3px var(--accent-soft)}
      .input-shell input{border:0;background:transparent;box-shadow:none;padding:0}
      .input-shell mat-icon{color:var(--text-tertiary)}
      .summary-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin-bottom:16px}
      .summary-card{display:grid;grid-template-columns:auto 1fr;gap:6px 12px;align-items:center;padding:16px;border-radius:12px}
      .summary-card__icon{display:grid;grid-row:span 3;place-items:center;width:42px;height:42px;border-radius:12px}
      .summary-card__icon--blue{background:var(--accent-soft);color:var(--accent)}
      .summary-card__icon--green{background:var(--success-soft);color:var(--success-dark)}
      .summary-card__icon--amber{background:var(--warning-soft);color:#b45309}
      .summary-card__icon--red{background:var(--danger-soft);color:var(--danger)}
      .summary-card__icon--cyan{background:rgba(14,165,233,.12);color:#0284c7}
      .summary-card span{color:var(--text-secondary);font-size:.9rem;font-weight:800}
      .summary-card strong{font-size:1.65rem}
      .summary-card small{color:var(--text-tertiary)}
      .content-grid{display:grid;grid-template-columns:1.1fr .9fr;gap:16px;margin-bottom:16px}
      .panel,.results-panel{padding:16px;border-radius:14px}
      .panel-heading{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:14px}
      .panel-heading mat-icon{color:var(--accent)}
      .activity-list{display:grid;gap:10px}
      .activity-item{display:grid;grid-template-columns:auto 1fr;gap:10px;align-items:start;padding:10px;border-radius:12px;background:var(--surface-muted);border:1px solid var(--surface-border);color:var(--text-primary);text-decoration:none}
      .activity-item:hover,.activity-item:focus-visible{border-color:var(--accent-border-strong)}
      .activity-icon{display:grid;place-items:center;width:36px;height:36px;border-radius:10px;background:var(--accent-soft);color:var(--accent)}
      .activity-item strong,.table-row strong{display:block;color:var(--text-primary);line-height:1.45}
      .activity-item small,.table-row small{display:block;margin-top:4px;color:var(--text-secondary);line-height:1.5}
      .bar-list{display:grid;gap:12px}
      .bar-row{display:grid;grid-template-columns:70px 1fr auto;gap:10px;align-items:center;color:var(--text-secondary)}
      .bar-row i{display:block;height:12px;border-radius:999px;background:var(--accent-soft);overflow:hidden}
      .bar-row b{display:block;min-width:4px;height:100%;border-radius:999px;background:linear-gradient(90deg,var(--accent),var(--accent-strong))}
      .bar-row strong{color:var(--text-primary)}
      .results-table{display:grid;gap:0;overflow:hidden;border-radius:12px;border:1px solid var(--surface-border)}
      .table-head,.table-row{display:grid;grid-template-columns:1.6fr .8fr .7fr .7fr 52px;gap:12px;align-items:center;padding:12px}
      .table-head{background:var(--surface-muted);color:var(--text-secondary);font-weight:900}
      .table-row{border-top:1px solid var(--surface-border)}
      .status-pill{display:inline-flex;align-items:center;justify-content:center;min-height:28px;padding:0 10px;border-radius:999px;background:var(--accent-soft);color:var(--accent);font-style:normal;font-weight:800}
      .icon-link{width:40px;height:40px;color:var(--text-primary)}
      .empty-state{margin:0;color:var(--text-secondary);line-height:1.7}
      .empty-state--table{padding:16px}
      @media print{.header-actions,.filters-panel{display:none}.reports-shell{padding:0;background:#fff}.reports-header,.summary-card,.panel,.results-panel{box-shadow:none;border-color:#ddd}.content-grid{grid-template-columns:1fr}}
      @media (max-width:1180px){.filters-panel{grid-template-columns:repeat(3,minmax(0,1fr))}.field--wide{grid-column:span 3}.summary-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.content-grid{grid-template-columns:1fr}}
      @media (max-width:760px){.reports-shell{padding:14px}.reports-header{align-items:stretch;flex-direction:column}.header-actions a,.header-actions button{flex:1}.filters-panel,.summary-grid{grid-template-columns:1fr}.field--wide{grid-column:auto}.table-head{display:none}.table-row{grid-template-columns:1fr;gap:8px}.icon-link{width:100%}}
    `,
  ],
})
export class ReportsComponent {
  private readonly employeeSvc = inject(EmployeeService);
  private readonly lettersSvc = inject(LettersService);

  readonly employees = signal<Employee[]>([]);
  readonly letters = signal<Letter[]>([]);
  readonly filters = signal<ReportFilters>({ ...DEFAULT_FILTERS });
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  readonly officeOptions = computed(() => this.uniqueValues(this.employees().map(employee => employee.office_name || employee.department)));
  readonly departmentOptions = computed(() => this.uniqueValues(this.employees().map(employee => employee.department)));
  readonly letterStatusOptions = computed(() => this.uniqueValues(this.letters().map(letter => letter.status || 'new')));

  readonly filteredEmployees = computed(() => {
    const filters = this.filters();
    if (filters.scope === 'letters') return [];

    return this.employees().filter(employee => {
      const date = employee.updated_at || employee.created_at;
      const office = employee.office_name || employee.department || '';
      const haystack = [
        employee.employee_id,
        employee.full_name,
        employee.mobile_number,
        employee.job_title,
        employee.department,
        employee.office_name,
        employee.notes,
      ].join(' ');

      return this.matchesSearch(haystack, filters.search)
        && this.matchesDate(date, filters.dateFrom, filters.dateTo)
        && (filters.employeeStatus === 'all' || employee.employment_status === filters.employeeStatus)
        && (filters.office === 'all' || office === filters.office)
        && (filters.department === 'all' || employee.department === filters.department);
    });
  });

  readonly filteredLetters = computed(() => {
    const filters = this.filters();
    if (filters.scope === 'employees') return [];

    return this.letters().filter(letter => {
      const haystack = [
        letter.letter_number,
        letter.serial_number,
        letter.subject,
        letter.summary,
        letter.sender,
        letter.receiver,
        letter.category,
        letter.status,
      ].join(' ');

      return this.matchesSearch(haystack, filters.search)
        && this.matchesDate(letter.letter_date || letter.created_at, filters.dateFrom, filters.dateTo)
        && (filters.letterType === 'all' || letter.type === filters.letterType)
        && (filters.letterStatus === 'all' || (letter.status || 'new') === filters.letterStatus)
        && (filters.priority === 'all' || (letter.priority || 'normal') === filters.priority);
    });
  });

  readonly filteredIncomingLetters = computed(() => this.filteredLetters().filter(letter => letter.type === 'incoming').length);
  readonly filteredOutgoingLetters = computed(() => this.filteredLetters().filter(letter => letter.type === 'outgoing').length);
  readonly filteredUrgentLetters = computed(() => this.filteredLetters().filter(letter => letter.priority === 'urgent').length);
  readonly maxFilteredLetters = computed(() => Math.max(1, this.filteredLetters().length));

  readonly reportRecords = computed<ReportRecord[]>(() => {
    const employeeRecords = this.filteredEmployees().map(employee => this.employeeRecord(employee));
    const letterRecords = this.filteredLetters().map(letter => this.letterRecord(letter));

    return [...employeeRecords, ...letterRecords].sort((a, b) => b.date.localeCompare(a.date));
  });

  readonly recentRecords = computed(() => this.reportRecords().slice(0, 6));

  readonly summaryCards = computed<SummaryCard[]>(() => [
    {
      label: 'الموظفون',
      value: this.filteredEmployees().length,
      hint: 'مطابقون للفلاتر الحالية',
      icon: 'groups',
      tone: 'blue',
    },
    {
      label: 'نشط',
      value: this.filteredEmployees().filter(employee => employee.employment_status === 'active').length,
      hint: 'موظفون بحالة نشطة',
      icon: 'verified_user',
      tone: 'green',
    },
    {
      label: 'الخطابات',
      value: this.filteredLetters().length,
      hint: 'وارد وصادر داخل الفترة',
      icon: 'mail',
      tone: 'cyan',
    },
    {
      label: 'عاجل',
      value: this.filteredUrgentLetters(),
      hint: 'خطابات بأولوية عاجلة',
      icon: 'priority_high',
      tone: 'red',
    },
    {
      label: 'وارد',
      value: this.filteredIncomingLetters(),
      hint: 'خطابات واردة',
      icon: 'move_to_inbox',
      tone: 'blue',
    },
    {
      label: 'صادر',
      value: this.filteredOutgoingLetters(),
      hint: 'خطابات صادرة',
      icon: 'outbox',
      tone: 'green',
    },
    {
      label: 'المكاتب',
      value: new Set(this.filteredEmployees().map(employee => employee.office_name || employee.department).filter(Boolean)).size,
      hint: 'مكاتب ظاهرة في النتائج',
      icon: 'business',
      tone: 'amber',
    },
    {
      label: 'إجمالي النتائج',
      value: this.reportRecords().length,
      hint: 'كل السجلات المعروضة',
      icon: 'fact_check',
      tone: 'cyan',
    },
  ]);

  constructor() {
    void this.loadData();
  }

  eventValue(event: Event): string {
    return event.target instanceof HTMLInputElement || event.target instanceof HTMLSelectElement
      ? event.target.value
      : '';
  }

  setFilter(key: keyof ReportFilters, value: string): void {
    this.filters.update(filters => ({ ...filters, [key]: value } as ReportFilters));
  }

  resetFilters(): void {
    this.filters.set({ ...DEFAULT_FILTERS });
  }

  printReport(): void {
    window.print();
  }

  barPercent(value: number, max: number): number {
    return Math.max(4, Math.round((value / Math.max(1, max)) * 100));
  }

  displayDate(value: string): string {
    if (!value) return 'غير محدد';
    return new Date(value).toLocaleDateString('ar-EG', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  statusLabel(value: string): string {
    const labels: Record<string, string> = {
      active: 'نشط',
      retired: 'متقاعد',
      resigned: 'مستقيل',
      new: 'جديد',
      pending: 'قيد المتابعة',
      completed: 'مكتمل',
      closed: 'مغلق',
      incoming: 'وارد',
      outgoing: 'صادر',
    };
    return labels[value] ?? value;
  }

  private async loadData(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);

    const [employeesResponse, lettersResponse] = await Promise.all([
      this.employeeSvc.list(),
      this.lettersSvc.list(),
    ]);

    this.loading.set(false);

    if (employeesResponse.error || lettersResponse.error) {
      this.error.set(employeesResponse.error || lettersResponse.error || 'تعذر تحميل بيانات التقارير.');
    }

    this.employees.set(employeesResponse.data || []);
    this.letters.set(lettersResponse.data || []);
  }

  private employeeRecord(employee: Employee): ReportRecord {
    return {
      id: employee.id,
      kind: 'employee',
      title: employee.full_name,
      description: `${employee.job_title || 'بدون وظيفة'} - ${employee.office_name || employee.department || 'غير محدد'}`,
      date: employee.updated_at || employee.created_at,
      status: employee.employment_status,
      statusLabel: this.statusLabel(employee.employment_status),
      meta: 'موظف',
      route: `/employees/profile/${employee.id}`,
    };
  }

  private letterRecord(letter: Letter): ReportRecord {
    return {
      id: letter.id,
      kind: 'letter',
      title: letter.subject || letter.letter_number,
      description: `${letter.letter_number || 'بدون رقم'} - ${letter.sender || letter.receiver || 'غير محدد'}`,
      date: letter.letter_date || letter.created_at,
      status: letter.status || 'new',
      statusLabel: this.statusLabel(letter.status || 'new'),
      meta: letter.type === 'incoming' ? 'خطاب وارد' : 'خطاب صادر',
      route: `/letters/${letter.id}`,
    };
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

  private uniqueValues(values: (string | null | undefined)[]): string[] {
    return [...new Set(values.map(value => value?.trim()).filter((value): value is string => Boolean(value)))]
      .sort((a, b) => a.localeCompare(b, 'ar'));
  }
}
