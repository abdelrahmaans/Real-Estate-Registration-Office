import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { LetterCreatePayload, LetterType } from '../../models/letter.model';
import { LettersService } from '../../services/letters.service';

type LetterPriority = NonNullable<LetterCreatePayload['priority']>;

@Component({
  selector: 'app-letters-form',
  imports: [ReactiveFormsModule, RouterLink, MatFormFieldModule, MatInputModule, MatSelectModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="form-shell" dir="rtl">
      <header class="form-header">
        <div>
          <p class="eyebrow">الخطابات</p>
          <h1>{{ isEditMode() ? 'تعديل خطاب' : 'إضافة خطاب جديد' }}</h1>
          <p class="muted">سجل بيانات الخطاب الأساسية والمتابعة الخاصة به بوضوح.</p>
        </div>
        <a class="btn-secondary" routerLink="/letters">
          <mat-icon>arrow_back</mat-icon>
          رجوع للخطابات
        </a>
      </header>

      @if (loading()) {
        <p class="state"><mat-icon>sync</mat-icon> جاري تحميل الخطاب...</p>
      }

      <form class="form-card" [formGroup]="form" (ngSubmit)="onSubmit()">
        <mat-form-field appearance="outline">
          <mat-label>رقم الخطاب</mat-label>
          <input matInput formControlName="letter_number" />
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>الرقم المسلسل</mat-label>
          <input matInput formControlName="serial_number" />
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>التاريخ</mat-label>
          <input matInput type="date" formControlName="letter_date" />
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
          <mat-label>الأولوية</mat-label>
          <mat-select panelClass="solid-select-panel" formControlName="priority">
            <mat-option value="low">منخفضة</mat-option>
            <mat-option value="normal">عادية</mat-option>
            <mat-option value="high">مرتفعة</mat-option>
            <mat-option value="urgent">عاجلة</mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>الحالة</mat-label>
          <mat-select panelClass="solid-select-panel" formControlName="status">
            <mat-option value="new">جديد</mat-option>
            <mat-option value="pending">قيد المتابعة</mat-option>
            <mat-option value="completed">مكتمل</mat-option>
            <mat-option value="closed">مغلق</mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>المرسل</mat-label>
          <input matInput formControlName="sender" />
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>المستلم</mat-label>
          <input matInput formControlName="receiver" />
        </mat-form-field>

        <mat-form-field appearance="outline" class="field-wide">
          <mat-label>الموضوع</mat-label>
          <input matInput formControlName="subject" />
        </mat-form-field>

        <mat-form-field appearance="outline" class="field-wide">
          <mat-label>الملخص</mat-label>
          <textarea matInput rows="4" formControlName="summary"></textarea>
        </mat-form-field>

        <mat-form-field appearance="outline" class="field-wide">
          <mat-label>ملاحظات</mat-label>
          <textarea matInput rows="3" formControlName="notes"></textarea>
        </mat-form-field>

        <div class="form-actions">
          <a class="btn-secondary" routerLink="/letters">رجوع</a>
          <button class="btn-primary" type="submit" [disabled]="form.invalid || submitting()">
            <mat-icon>{{ isEditMode() ? 'save' : 'add_circle' }}</mat-icon>
            {{ isEditMode() ? 'حفظ التعديل' : 'حفظ الخطاب' }}
          </button>
        </div>
      </form>

      @if (error()) {
        <p class="state state--error"><mat-icon>error_outline</mat-icon> {{ error() }}</p>
      }

      @if (success()) {
        <p class="state state--success"><mat-icon>check_circle</mat-icon> {{ success() }}</p>
      }
    </section>
  `,
  styles: [
    `
      .form-shell{padding:24px;max-width:1020px;margin:0 auto;background:var(--page-bg);min-height:100vh;color:var(--text-primary)}
      .form-header,.form-card{background:var(--surface-solid);border:1px solid var(--surface-border);box-shadow:var(--card-shadow)}
      .form-header{display:flex;justify-content:space-between;align-items:end;gap:16px;padding:22px;border-radius:14px;margin-bottom:16px}
      .eyebrow{margin:0 0 6px;color:var(--accent);font-size:.78rem;font-weight:800;letter-spacing:0}
      h1{margin:0;color:var(--text-primary);font-size:2rem;line-height:1.25}
      .muted{margin:8px 0 0;color:var(--text-secondary);line-height:1.7}
      .form-card{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px;padding:18px;border-radius:14px}
      .field-wide{grid-column:1/-1}
      .form-actions{grid-column:1/-1;display:flex;gap:10px;justify-content:flex-start;flex-wrap:wrap;margin-top:4px}
      .btn-primary,.btn-secondary{display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:42px;padding:0 16px;border-radius:10px;font-weight:800;text-decoration:none;border:1px solid var(--surface-border);cursor:pointer;transition:background-color 160ms ease,border-color 160ms ease,color 160ms ease,transform 160ms ease}
      .btn-primary{background:var(--accent);border-color:var(--accent);color:var(--accent-contrast)}
      .btn-primary:disabled{opacity:.55;cursor:not-allowed}
      .btn-secondary{background:var(--surface-solid);color:var(--text-primary)}
      .btn-primary:hover:not(:disabled),.btn-primary:focus-visible{background:var(--accent-strong)}
      .btn-secondary:hover,.btn-secondary:focus-visible{background:var(--surface-hover);color:var(--accent)}
      .btn-primary:focus-visible,.btn-secondary:focus-visible{outline:2px solid var(--accent-border-strong);outline-offset:2px}
      .state{display:inline-flex;align-items:center;gap:8px;margin:0 0 16px;padding:12px 14px;border-radius:10px;background:var(--accent-soft);color:var(--accent);font-weight:800}
      .state--error{background:var(--danger-soft);color:var(--danger)}
      .state--success{background:var(--success-soft);color:var(--success-dark)}
      @media (max-width:900px){.form-card{grid-template-columns:1fr}.form-header{align-items:stretch;flex-direction:column}}
      @media (max-width:720px){.form-shell{padding:14px}.form-actions a,.form-actions button{flex:1}}
    `,
  ],
})
export class LettersFormComponent {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(LettersService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly letterId = signal<string | null>(this.route.snapshot.paramMap.get('id'));
  readonly isEditMode = computed(() => Boolean(this.letterId()));
  readonly loading = signal(false);
  readonly submitting = signal(false);
  readonly error = signal<string | null>(null);
  readonly success = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    letter_number: ['', Validators.required],
    serial_number: [''],
    type: ['incoming' as LetterType, Validators.required],
    category: ['general'],
    letter_date: [new Date().toISOString().slice(0, 10), Validators.required],
    sender: [''],
    receiver: [''],
    subject: ['', Validators.required],
    summary: [''],
    priority: ['normal' as LetterPriority],
    status: ['new'],
    notes: [''],
  });

  constructor() {
    if (this.isEditMode()) {
      void this.loadLetter();
    }
  }

  async onSubmit(): Promise<void> {
    if (this.form.invalid) return;

    this.submitting.set(true);
    this.error.set(null);
    this.success.set(null);

    const payload = this.form.getRawValue() as LetterCreatePayload;
    const id = this.letterId();
    const response = id
      ? await this.service.update(id, payload)
      : await this.service.create(payload);

    this.submitting.set(false);
    if (response.error) {
      this.error.set(response.error);
      return;
    }

    this.success.set(id ? 'تم حفظ التعديل' : 'تم حفظ الخطاب');
    setTimeout(() => this.router.navigate(['/letters']), 700);
  }

  private async loadLetter(): Promise<void> {
    const id = this.letterId();
    if (!id) return;

    this.loading.set(true);
    this.error.set(null);
    const response = await this.service.get(id);
    this.loading.set(false);

    if (response.error || !response.data) {
      this.error.set(response.error || 'تعذر تحميل الخطاب.');
      return;
    }

    this.form.patchValue({
      letter_number: response.data.letter_number,
      serial_number: response.data.serial_number || '',
      type: response.data.type,
      category: response.data.category || 'general',
      letter_date: response.data.letter_date,
      sender: response.data.sender || '',
      receiver: response.data.receiver || '',
      subject: response.data.subject,
      summary: response.data.summary || '',
      priority: response.data.priority || 'normal',
      status: response.data.status || 'new',
      notes: response.data.notes || '',
    });
  }
}
