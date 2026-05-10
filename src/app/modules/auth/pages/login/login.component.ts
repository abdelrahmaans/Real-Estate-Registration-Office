import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '@core/services/auth.service';

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        RouterModule,
        MatCardModule,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        MatIconModule,
    ],
    template: `
      <section class="login-page" dir="rtl">
        <div class="login-card">
          <p class="eyebrow">نظام السجل العقاري</p>
          <h2>تسجيل الدخول</h2>
          <p class="muted">ادخل بحسابك للوصول إلى لوحة التحكم وإدارة البيانات.</p>

          <form [formGroup]="form" (ngSubmit)="onSubmit()" class="login-form">
            <mat-form-field appearance="outline">
              <mat-label>البريد الإلكتروني</mat-label>
              <input matInput formControlName="email" type="email" autocomplete="email" />
              @if (form.controls.email.invalid && (form.controls.email.dirty || form.controls.email.touched)) {
                <mat-hint class="error-hint">الرجاء إدخال بريد إلكتروني صحيح</mat-hint>
              }
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>كلمة المرور</mat-label>
              <input matInput formControlName="password" type="password" autocomplete="current-password" />
              @if (form.controls.password.invalid && (form.controls.password.dirty || form.controls.password.touched)) {
                <mat-hint class="error-hint">كلمة المرور مطلوبة</mat-hint>
              }
            </mat-form-field>

            <button class="btn-primary" type="submit" [disabled]="loading()">
              {{ loading() ? 'جاري تسجيل الدخول...' : 'تسجيل الدخول' }}
            </button>

            @if (error()) {
              <p class="error-message">{{ error() }}</p>
            }
          </form>
        </div>
      </section>
    `,
    styles: [
        `
          .login-page{min-height:100vh;display:grid;place-items:center;padding:24px;background:linear-gradient(180deg,#f8fafc 0%,#eef4fb 100%)}
          .login-card{width:min(100%,440px);padding:28px;background:#fff;border:1px solid rgba(15,23,42,.08);border-radius:20px;box-shadow:0 16px 40px rgba(15,23,42,.08)}
          .eyebrow{margin:0 0 8px;color:#2563eb;font-weight:700;letter-spacing:.08em;text-transform:uppercase;font-size:.78rem}
          h2{margin:0;color:#0f172a;font-size:1.8rem}
          .muted{margin:10px 0 0;color:#475569;line-height:1.8}
          .login-form{display:grid;gap:14px;margin-top:20px}
          .btn-primary{display:inline-flex;align-items:center;justify-content:center;min-height:44px;padding:0 18px;border:none;border-radius:12px;background:#2563eb;color:#fff;font-weight:700;cursor:pointer;box-shadow:0 10px 20px rgba(37,99,235,.18);transition:transform 160ms ease,box-shadow 160ms ease,background-color 160ms ease}
          .btn-primary:hover:not(:disabled),.btn-primary:focus-visible{transform:translateY(-1px)}
          .btn-primary:focus-visible{outline:2px solid rgba(37,99,235,.28);outline-offset:3px}
          .btn-primary:disabled{opacity:.65;cursor:not-allowed;box-shadow:none}
          .error-message{margin:0;color:#b91c1c;font-weight:600}
          .error-hint{color:#b91c1c}
        `,
    ],
})
export class LoginComponent {
    private readonly fb = inject(FormBuilder);
    private readonly auth = inject(AuthService);
    private readonly router = inject(Router);
    private readonly route = inject(ActivatedRoute);

    form = this.fb.nonNullable.group({
        email: ['', [Validators.required, Validators.email]],
        password: ['', [Validators.required]],
    });

    loading = signal(false);
    error = signal('');

    async onSubmit() {
        if (this.form.invalid) return;
        this.loading.set(true);
        this.error.set('');

        const { email, password } = this.form.getRawValue();
        try {
            const result = await this.auth.login({
                email: email.trim(),
                password,
            });
            if (result.success) {
                const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') || '/dashboard';
                await this.router.navigateByUrl(returnUrl);
            } else {
                this.error.set(result.error || 'فشل تسجيل الدخول');
            }
        } catch (err: any) {
            this.error.set(err?.message || 'فشل تسجيل الدخول');
        } finally {
            this.loading.set(false);
        }
    }
}
