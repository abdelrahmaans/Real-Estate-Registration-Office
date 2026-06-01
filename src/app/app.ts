import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { AuthService } from '@core/services/auth.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  template: `
    <div class="app-shell" dir="rtl">
      <div class="app-shell__glow app-shell__glow--one"></div>
      <div class="app-shell__glow app-shell__glow--two"></div>

      <header class="topbar">
        <div class="brand">
          <div class="brand__mark">R</div>
          <div class="brand__text">
            <p class="brand__eyebrow">Real Estate Registration Office</p>
            <h1>نظام إدارة السجل العقاري</h1>
          </div>
        </div>

        <div class="topbar__actions">
          <div class="topbar__status">
            <span class="topbar__dot"></span>
            <span>المنصة جاهزة للعمل</span>
          </div>

          <button
            class="topbar__theme-toggle"
            type="button"
            (click)="toggleTheme()"
            [attr.aria-pressed]="isDark()"
            [attr.aria-label]="isDark() ? 'تفعيل الوضع الفاتح' : 'تفعيل الوضع الداكن'"
            title="تبديل الوضع"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" [hidden]="isDark()">
              <circle cx="12" cy="12" r="4"></circle>
              <line x1="12" y1="2" x2="12" y2="4"></line>
              <line x1="12" y1="20" x2="12" y2="22"></line>
              <line x1="4.93" y1="4.93" x2="6.34" y2="6.34"></line>
              <line x1="17.66" y1="17.66" x2="19.07" y2="19.07"></line>
              <line x1="2" y1="12" x2="4" y2="12"></line>
              <line x1="20" y1="12" x2="22" y2="12"></line>
              <line x1="4.93" y1="19.07" x2="6.34" y2="17.66"></line>
              <line x1="17.66" y1="6.34" x2="19.07" y2="4.93"></line>
            </svg>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" [hidden]="!isDark()">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
            </svg>
          </button>

          <button class="topbar__logout" type="button" (click)="onLogout()" title="تسجيل الخروج" aria-label="تسجيل الخروج">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
          </button>
        </div>
      </header>

      <main class="app-shell__main">
        <router-outlet></router-outlet>
      </main>
    </div>
  `,
  styleUrl: './app.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  private auth = inject(AuthService);
  private router = inject(Router);
  readonly isDark = signal(false);
  private readonly themeKey = 'registry.theme';

  constructor() {
    this.loadTheme();
  }

  private loadTheme(): void {
    try {
      const stored = localStorage.getItem(this.themeKey);
      if (stored === 'dark' || stored === 'light') {
        this.isDark.set(stored === 'dark');
      } else {
        this.isDark.set(window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false);
      }
    } catch {
      this.isDark.set(false);
    }

    this.applyTheme();
  }

  toggleTheme(): void {
    this.isDark.update(current => !current);

    try {
      localStorage.setItem(this.themeKey, this.isDark() ? 'dark' : 'light');
    } catch {
      // Ignore storage failures.
    }

    this.applyTheme();
  }

  private applyTheme(): void {
    const root = document.documentElement;
    root.classList.toggle('dark-theme', this.isDark());
    root.setAttribute('data-theme', this.isDark() ? 'dark' : 'light');
  }

  async onLogout(): Promise<void> {
    await this.auth.logout();
    await this.router.navigate(['/auth/login']);
  }
}
