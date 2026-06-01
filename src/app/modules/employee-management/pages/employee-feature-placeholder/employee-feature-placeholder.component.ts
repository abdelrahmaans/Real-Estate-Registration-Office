import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

type PlaceholderData = {
    title?: string;
    icon?: string;
    subtitle?: string;
    summary?: string;
};

@Component({
    selector: 'app-employee-feature-placeholder',
    imports: [CommonModule, RouterLink, MatButtonModule, MatIconModule],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
    <section class="placeholder-shell" dir="rtl">
      <div class="backdrop backdrop--one"></div>
      <div class="backdrop backdrop--two"></div>

      <article class="placeholder-card">
        <span class="placeholder-card__badge">قيد البناء</span>
        <span class="placeholder-card__icon">
          <mat-icon>{{ icon }}</mat-icon>
        </span>
        <h1>{{ title }}</h1>
        <p class="subtitle">{{ subtitle }}</p>
        <p class="summary">{{ summary }}</p>

        <div class="placeholder-card__actions">
          <a mat-flat-button color="primary" routerLink="/employees">
            <mat-icon>arrow_forward</mat-icon>
            العودة إلى صفحة الموظفين
          </a>
          <a mat-stroked-button routerLink="/dashboard">
            <mat-icon>dashboard</mat-icon>
            إلى لوحة التحكم
          </a>
        </div>
      </article>
    </section>
  `,
    styleUrl: './employee-feature-placeholder.component.css',
})
export class EmployeeFeaturePlaceholderComponent {
    private readonly route = inject(ActivatedRoute);
    private readonly data = this.route.snapshot.data as PlaceholderData;

    readonly title = this.data.title ?? 'صفحة داخلية قيد التجهيز';
    readonly icon = this.data.icon ?? 'construction';
    readonly subtitle = this.data.subtitle ?? 'تم إعداد المسار والبنية الأولية بنجاح.';
    readonly summary =
        this.data.summary ?? 'سيتم استكمال هذه الصفحة لاحقا كجزء من موديول إدارة الموظفين.';
}
