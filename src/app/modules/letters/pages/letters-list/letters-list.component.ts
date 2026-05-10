import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatSelectModule } from '@angular/material/select';
import { LettersService } from '../../services/letters.service';
import { Letter } from '../../models/letter.model';

@Component({
    selector: 'app-letters-list',
    standalone: true,
    imports: [CommonModule, RouterModule, MatSelectModule],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
    <section class="letters-shell" dir="rtl">
      <div class="letters-header">
        <div>
          <p class="eyebrow">الخطابات</p>
          <h2>الوارد والصادر</h2>
          <p class="muted">عرض وتنظيم الخطابات بطريقة بسيطة وواضحة.</p>
        </div>
        <div class="header-actions">
          <mat-select class="simple-select" panelClass="solid-select-panel" [value]="filter()" (selectionChange)="onChange($any($event.value))">
            <mat-option value="">الكل</mat-option>
            <mat-option value="incoming">وارد</mat-option>
            <mat-option value="outgoing">صادر</mat-option>
          </mat-select>
          <a class="btn-primary" [routerLink]="['/letters/new']">خطاب جديد</a>
        </div>
      </div>

      <div class="letters-card">
        <table class="letters-table">
          <thead>
            <tr>
              <th>الرقم</th>
              <th>التاريخ</th>
              <th>الموضوع</th>
              <th>النوع</th>
              <th>إجراء</th>
            </tr>
          </thead>
          <tbody>
            @for (l of letters(); track l.id) {
              <tr>
                <td>{{ l.letter_number }}</td>
                <td>{{ l.letter_date }}</td>
                <td>{{ l.subject }}</td>
                <td>
                  <span class="type-pill" [class.type-pill--incoming]="l.type === 'incoming'" [class.type-pill--outgoing]="l.type === 'outgoing'">
                    {{ l.type === 'incoming' ? 'وارد' : 'صادر' }}
                  </span>
                </td>
                <td>
                  <a class="btn-secondary" [routerLink]="['/letters', l.id]">فتح</a>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>

      <p *ngIf="error()" class="error">{{ error() }}</p>
      <p *ngIf="!letters().length && !loading()" class="muted">لا توجد خطابات حالياً.</p>
    </section>
  `,
    styles: [
        `
      .letters-shell{padding:24px;background:#f7fafc;min-height:100vh;color:#0f172a}
      .letters-header{display:flex;justify-content:space-between;align-items:end;gap:16px;margin-bottom:16px;flex-wrap:wrap}
      .eyebrow{margin:0 0 6px;color:#2563eb;font-weight:700;letter-spacing:.06em;text-transform:uppercase;font-size:.78rem}
      .muted{margin:0;color:#475569}
      .header-actions{display:flex;gap:10px;align-items:center;flex-wrap:wrap}
      .simple-select{min-width:140px;background:#fff;border-radius:10px;padding:0 8px}
      .letters-card{background:#fff;border:1px solid rgba(15,23,42,.08);border-radius:16px;box-shadow:0 6px 24px rgba(15,23,42,.05);overflow:auto}
      .letters-table{width:100%;border-collapse:collapse;min-width:760px}
      .letters-table th,.letters-table td{padding:14px 12px;border-bottom:1px solid rgba(15,23,42,.06);text-align:right}
      .letters-table th{background:#f8fafc;color:#0f172a;font-size:.9rem}
      .btn-primary,.btn-secondary{display:inline-flex;align-items:center;justify-content:center;min-height:40px;padding:0 14px;border-radius:10px;font-weight:700;text-decoration:none}
      .btn-primary,.btn-secondary{transition:transform 160ms ease,box-shadow 160ms ease,border-color 160ms ease,background-color 160ms ease}
      .btn-primary{background:#2563eb;color:#fff;box-shadow:0 10px 20px rgba(37,99,235,.18)}
      .btn-secondary{background:#fff;color:#0f172a;border:1px solid rgba(15,23,42,.14)}
      .btn-primary:hover,.btn-primary:focus-visible,.btn-secondary:hover,.btn-secondary:focus-visible{transform:translateY(-1px)}
      .btn-primary:focus-visible,.btn-secondary:focus-visible{outline:2px solid rgba(37,99,235,.28);outline-offset:3px}
      .type-pill{display:inline-flex;padding:5px 10px;border-radius:999px;font-weight:700;font-size:.85rem}
      .type-pill--incoming{background:#eff6ff;color:#1d4ed8}
      .type-pill--outgoing{background:#f0fdf4;color:#166534}
      .error{color:#b91c1c;margin-top:12px}
      @media (max-width: 720px){.letters-header{align-items:start}.letters-shell{padding:16px}}
    `,
    ],
})
export class LettersListComponent {
    private svc = inject(LettersService);

    letters = signal<Letter[]>([]);
    filter = signal<string>('');
    loading = signal(false);
    error = signal<string | null>(null);

    constructor() {
        this.load();
    }

    async load() {
        this.loading.set(true);
        const res = await this.svc.list(this.filter());
        this.loading.set(false);
        if (res.error) {
            this.error.set(res.error);
            this.letters.set([]);
            return;
        }
        this.letters.set(res.data);
    }

    async onChange(v: string) {
        this.filter.set(v);
        await this.load();
    }
}
