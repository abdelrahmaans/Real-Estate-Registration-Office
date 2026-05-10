import { Component, inject } from '@angular/core';
import { RouterOutlet, Router } from '@angular/router';
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
          <button class="topbar__logout" type="button" (click)="onLogout()" title="تسجيل الخروج">
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
  styleUrl: './app.css'
})
export class App {
  private auth = inject(AuthService);
  private router = inject(Router);

  async onLogout(): Promise<void> {
    await this.auth.logout();
    await this.router.navigate(['/auth/login']);
  }
}
