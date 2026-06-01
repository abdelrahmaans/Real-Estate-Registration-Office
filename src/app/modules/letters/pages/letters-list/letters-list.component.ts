import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MatSelectModule } from '@angular/material/select';
import { LettersService } from '../../services/letters.service';
import { Letter } from '../../models/letter.model';

@Component({
  selector: 'app-letters-list',
  imports: [RouterModule, MatSelectModule],
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

      @if (error()) {
        <p class="error">{{ error() }}</p>
      }

      @if (!letters().length && !loading()) {
        <p class="muted">لا توجد خطابات حالياً.</p>
      }
    </section>
  `,
  styles: [
    `
      .letters-shell{padding:24px;background:var(--page-bg);min-height:100vh;color:var(--text-primary)}
      .letters-header{display:flex;justify-content:space-between;align-items:end;gap:16px;margin-bottom:16px;flex-wrap:wrap}
      .eyebrow{margin:0 0 6px;color:var(--accent);font-weight:700;letter-spacing:.06em;text-transform:uppercase;font-size:.78rem}
      .muted{margin:0;color:var(--text-secondary)}
      .header-actions{display:flex;gap:10px;align-items:center;flex-wrap:wrap}
      .simple-select{min-width:140px;background:var(--surface-solid);border-radius:10px;padding:0 8px}
      .letters-card{background:var(--surface-solid);border:1px solid var(--card-border);border-radius:16px;box-shadow:var(--card-shadow);overflow:auto}
      .letters-table{width:100%;border-collapse:collapse;min-width:760px}
      .letters-table th,.letters-table td{padding:14px 12px;border-bottom:1px solid var(--table-row-border);text-align:right}
      .letters-table th{background:var(--table-head-bg);color:var(--text-primary);font-size:.9rem}
      .btn-primary,.btn-secondary{display:inline-flex;align-items:center;justify-content:center;min-height:40px;padding:0 14px;border-radius:10px;font-weight:700;text-decoration:none}
      .btn-primary,.btn-secondary{transition:transform 160ms ease,box-shadow 160ms ease,border-color 160ms ease,background-color 160ms ease}
      .btn-primary{background:var(--accent);color:var(--accent-contrast);box-shadow:0 10px 20px rgba(37,99,235,.18)}
      .btn-secondary{background:var(--surface-solid);color:var(--text-primary);border:1px solid var(--surface-border)}
      .btn-primary:hover,.btn-primary:focus-visible,.btn-secondary:hover,.btn-secondary:focus-visible{transform:translateY(-1px)}
      .btn-primary:focus-visible,.btn-secondary:focus-visible{outline:2px solid var(--accent-border-strong);outline-offset:3px}
      .type-pill{display:inline-flex;padding:5px 10px;border-radius:999px;font-weight:700;font-size:.85rem}
      .type-pill--incoming{background:var(--accent-soft);color:var(--accent)}
      .type-pill--outgoing{background:rgba(34,197,94,.12);color:var(--success-dark)}
      .error{color:var(--danger);margin-top:12px}
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

  async load(): Promise<void> {
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

  async onChange(v: string): Promise<void> {
    this.filter.set(v);
    await this.load();
  }
}
