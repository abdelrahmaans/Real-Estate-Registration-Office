import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="dashboard-shell" dir="rtl">
      <div class="hero-card">
        <p class="eyebrow">لوحة التحكم</p>
        <h1>مرحباً بك في نظام السجل العقاري</h1>
        <p class="muted">واجهة بسيطة وواضحة للوصول السريع إلى الوظائف الأساسية.</p>
      </div>

      <div class="quick-grid">
        <a class="quick-card quick-card--primary" [routerLink]="['/employees']">
          <span class="quick-card__title">الموظفين</span>
          <span class="quick-card__text">إدارة بيانات العاملين والعمليات اليومية.</span>
        </a>
        <a class="quick-card" [routerLink]="['/letters']">
          <span class="quick-card__title">الخطابات</span>
          <span class="quick-card__text">عرض الوارد والصادر وإنشاء خطاب جديد.</span>
        </a>
        <a class="quick-card" [routerLink]="['/reports']">
          <span class="quick-card__title">التقارير</span>
          <span class="quick-card__text">مؤشرات وملخصات سريعة على الشاشة الرئيسية.</span>
        </a>
      </div>
    </section>
  `,
  styles: [
    `
      .dashboard-shell{padding:24px;min-height:100vh;background:var(--page-bg);color:var(--text-primary)}
      .hero-card{padding:24px;margin-bottom:16px;background:var(--surface-solid);border:1px solid var(--card-border);border-radius:16px;box-shadow:var(--card-shadow)}
      .eyebrow{margin:0 0 6px;color:var(--accent);font-weight:700;letter-spacing:.06em;text-transform:uppercase;font-size:.78rem}
      .muted{margin:10px 0 0;color:var(--text-secondary);line-height:1.8}
      h1{margin:0;font-size:clamp(1.8rem, 3vw, 3rem)}
      .quick-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px}
      .quick-card{display:grid;gap:10px;padding:18px;border-radius:16px;background:var(--surface-solid);border:1px solid var(--card-border);box-shadow:var(--card-shadow);text-decoration:none;color:var(--text-primary);min-height:132px;transition:transform 160ms ease,box-shadow 160ms ease,border-color 160ms ease}
      .quick-card--primary{background:linear-gradient(180deg,var(--accent),#1d4ed8);color:var(--accent-contrast);box-shadow:0 10px 24px rgba(37,99,235,.18)}
      .quick-card__title{font-size:1.05rem;font-weight:700}
      .quick-card__text{color:inherit;opacity:.82;line-height:1.7}
      .quick-card:hover,.quick-card:focus-visible{transform:translateY(-2px);border-color:var(--accent-border)}
      .quick-card:focus-visible{outline:2px solid var(--accent-border-strong);outline-offset:3px}
      @media (max-width: 900px){.quick-grid{grid-template-columns:1fr}.dashboard-shell{padding:16px}}
    `,
  ]
})
export class DashboardComponent { }
