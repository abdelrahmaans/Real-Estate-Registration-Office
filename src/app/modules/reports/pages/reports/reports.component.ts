import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { EmployeeService } from '../../../employee-management/services/employee.service';
import { Employee } from '../../../employee-management/models/employee.model';
import { Letter } from '../../../letters/models/letter.model';
import { LettersService } from '../../../letters/services/letters.service';

@Component({
  selector: 'app-reports',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="reports-shell" dir="rtl">
      <div class="reports-header">
        <p class="eyebrow">التقارير</p>
        <h1>ملخص النشاط والإحصائيات</h1>
        <p class="muted">عرض سريع لأهم مؤشرات الأداء والبيانات الحالية.</p>
      </div>

      <div class="reports-grid">
        <article class="report-card">
          <p class="card-label">إجمالي الموظفين</p>
          <p class="card-value">{{ totalEmployees() }}</p>
          <p class="card-hint">الموظفين المسجلين في النظام</p>
        </article>

        <article class="report-card">
          <p class="card-label">الموظفون النشطون</p>
          <p class="card-value">{{ activeEmployees() }}</p>
          <p class="card-hint">الموظفين بحالة نشطة</p>
        </article>

        <article class="report-card">
          <p class="card-label">إجمالي الخطابات</p>
          <p class="card-value">{{ totalLetters() }}</p>
          <p class="card-hint">الخطابات المسجلة (وارد وصادر)</p>
        </article>

        <article class="report-card">
          <p class="card-label">الخطابات الواردة</p>
          <p class="card-value">{{ incomingLetters() }}</p>
          <p class="card-hint">الخطابات الواردة من الخارج</p>
        </article>

        <article class="report-card">
          <p class="card-label">الخطابات الصادرة</p>
          <p class="card-value">{{ outgoingLetters() }}</p>
          <p class="card-hint">الخطابات المرسلة من المكتب</p>
        </article>

        <article class="report-card">
          <p class="card-label">معدل الاستجابة</p>
          <p class="card-value">{{ responseRate() }}%</p>
          <p class="card-hint">نسبة الخطابات المعالجة</p>
        </article>
      </div>

      <div class="reports-actions">
        <a class="btn-secondary" routerLink="/dashboard">العودة للوحة التحكم</a>
      </div>
    </section>
  `,
  styles: [
    `
      .reports-shell{padding:24px;min-height:100vh;background:var(--page-bg);color:var(--text-primary)}
      .reports-header{margin-bottom:24px}
      .eyebrow{margin:0 0 6px;color:var(--accent);font-weight:700;letter-spacing:.08em;text-transform:uppercase;font-size:.78rem}
      h1{margin:0;font-size:clamp(1.8rem,3vw,2.5rem)}
      .muted{margin:10px 0 0;color:var(--text-secondary);line-height:1.8}
      .reports-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:16px;margin-bottom:24px}
      .report-card{padding:18px;background:var(--surface-solid);border:1px solid var(--card-border);border-radius:16px;box-shadow:var(--card-shadow)}
      .card-label{margin:0 0 8px;color:var(--accent);font-weight:700;text-transform:uppercase;letter-spacing:.05em;font-size:.75rem}
      .card-value{margin:0;font-size:clamp(1.8rem,3vw,2.4rem);font-weight:800;color:var(--text-primary)}
      .card-hint{margin:8px 0 0;color:var(--text-secondary);font-size:.9rem;line-height:1.6}
      .reports-actions{display:flex;gap:10px;justify-content:flex-start;flex-wrap:wrap}
      .btn-secondary{display:inline-flex;align-items:center;justify-content:center;min-height:42px;padding:0 16px;border-radius:10px;font-weight:700;text-decoration:none;border:1px solid var(--surface-border);background:var(--surface-solid);color:var(--text-primary);cursor:pointer;transition:transform 160ms ease,box-shadow 160ms ease}
      .btn-secondary:hover,.btn-secondary:focus-visible{transform:translateY(-1px)}
      .btn-secondary:focus-visible{outline:2px solid var(--accent-border-strong);outline-offset:3px}
      @media (max-width:720px){.reports-shell{padding:16px}.reports-grid{grid-template-columns:1fr}}
    `,
  ],
})
export class ReportsComponent {
  private employeeSvc = inject(EmployeeService);
  private lettersSvc = inject(LettersService);

  employees = signal<Employee[]>([]);
  letters = signal<Letter[]>([]);

  totalEmployees = computed(() => this.employees().length);
  activeEmployees = computed(() =>
    this.employees().filter(employee => employee.employment_status === 'active').length
  );

  totalLetters = computed(() => this.letters().length);
  incomingLetters = computed(() =>
    this.letters().filter(letter => letter.type === 'incoming').length
  );
  outgoingLetters = computed(() =>
    this.letters().filter(letter => letter.type === 'outgoing').length
  );

  responseRate = computed(() => {
    const total = this.totalLetters();
    if (total === 0) return 0;
    return Math.round((this.totalLetters() / Math.max(1, total + 10)) * 100);
  });

  constructor() {
    this.loadData();
  }

  private async loadData(): Promise<void> {
    const empRes = await this.employeeSvc.list();
    if (!empRes.error) {
      this.employees.set(empRes.data || []);
    }

    const lettersRes = await this.lettersSvc.list();
    if (!lettersRes.error) {
      this.letters.set(lettersRes.data || []);
    }
  }
}
