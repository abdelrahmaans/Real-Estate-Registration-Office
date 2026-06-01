import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { LettersService } from '../../services/letters.service';
import { LetterCreatePayload } from '../../models/letter.model';

@Component({
  selector: 'app-letters-form',
  imports: [ReactiveFormsModule, RouterLink, MatFormFieldModule, MatInputModule, MatSelectModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="form-shell" dir="rtl">
      <div class="form-header">
        <p class="eyebrow">الخطابات</p>
        <h2>إضافة خطاب جديد</h2>
        <p class="muted">سجل بيانات الخطاب الأساسية بوضوح وسرعة.</p>
      </div>

      <form class="form-card" [formGroup]="form" (ngSubmit)="onSubmit()">
        <mat-form-field appearance="outline">
          <mat-label>الرقم</mat-label>
          <input matInput formControlName="letter_number" />
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>التاريخ</mat-label>
          <input matInput type="date" formControlName="letter_date" />
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>الموضوع</mat-label>
          <input matInput formControlName="subject" />
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>النوع</mat-label>
          <mat-select panelClass="solid-select-panel" formControlName="type">
            <mat-option value="incoming">وارد</mat-option>
            <mat-option value="outgoing">صادر</mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>الفئة</mat-label>
          <input matInput formControlName="category" />
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>الملخص</mat-label>
          <textarea matInput rows="4" formControlName="summary"></textarea>
        </mat-form-field>

        <div class="form-actions">
          <a class="btn-secondary" routerLink="/letters">رجوع</a>
          <button class="btn-primary" type="submit" [disabled]="form.invalid || submitting()">حفظ الخطاب</button>
        </div>
      </form>

      @if (error()) {
        <p class="error">{{ error() }}</p>
      }

      @if (success()) {
        <p class="success">{{ success() }}</p>
      }
    </section>
  `,
  styles: [
    `
      .form-shell{padding:24px;max-width:860px;margin:0 auto;background:var(--page-bg);min-height:100vh;color:var(--text-primary)}
      .form-header{margin-bottom:16px}
      .eyebrow{margin:0 0 6px;color:var(--accent);font-weight:700;letter-spacing:.06em;text-transform:uppercase;font-size:.78rem}
      .muted{margin:0;color:var(--text-secondary)}
      .form-card{display:grid;gap:14px;padding:20px;background:var(--surface-solid);border:1px solid var(--card-border);border-radius:16px;box-shadow:var(--card-shadow)}
      .form-actions{display:flex;gap:10px;justify-content:flex-start;flex-wrap:wrap;margin-top:6px}
      .btn-primary,.btn-secondary{display:inline-flex;align-items:center;justify-content:center;min-height:42px;padding:0 16px;border-radius:10px;font-weight:700;text-decoration:none;border:none;cursor:pointer;transition:transform 160ms ease,box-shadow 160ms ease,border-color 160ms ease,background-color 160ms ease}
      .btn-primary{background:var(--accent);color:var(--accent-contrast);box-shadow:0 10px 20px rgba(37,99,235,.18)}
      .btn-primary:disabled{opacity:.55;cursor:not-allowed}
      .btn-secondary{background:var(--surface-solid);color:var(--text-primary);border:1px solid var(--surface-border)}
      .btn-primary:hover:not(:disabled),.btn-primary:focus-visible,.btn-secondary:hover,.btn-secondary:focus-visible{transform:translateY(-1px)}
      .btn-primary:focus-visible,.btn-secondary:focus-visible{outline:2px solid var(--accent-border-strong);outline-offset:3px}
      .error{color:var(--danger);margin:12px 0 0}
      .success{color:var(--success-dark);margin:12px 0 0}
      @media (max-width: 720px){.form-shell{padding:16px}}
    `,
  ],
})
export class LettersFormComponent {
  private fb = inject(FormBuilder);
  private svc = inject(LettersService);
  private router = inject(Router);

  submitting = signal(false);
  error = signal<string | null>(null);
  success = signal<string | null>(null);

  form = this.fb.nonNullable.group({
    letter_number: ['', Validators.required],
    serial_number: [''],
    type: ['incoming' as const, Validators.required],
    category: ['general'],
    letter_date: [new Date().toISOString().slice(0, 10)],
    subject: ['', Validators.required],
    summary: [''],
    priority: ['normal'],
    status: ['new'],
  });

  async onSubmit(): Promise<void> {
    if (this.form.invalid) return;
    this.submitting.set(true);
    this.error.set(null);

    const payload = this.form.getRawValue() as LetterCreatePayload;
    const res = await this.svc.create(payload);

    this.submitting.set(false);
    if (res.error) {
      this.error.set(res.error);
      return;
    }

    this.success.set('تم الحفظ');
    setTimeout(() => this.router.navigate(['/letters']), 700);
  }
}
