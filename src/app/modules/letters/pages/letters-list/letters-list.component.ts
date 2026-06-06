import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { Letter, LetterType } from '../../models/letter.model';
import { LettersService } from '../../services/letters.service';

type LetterTypeFilter = 'all' | LetterType;
type PriorityFilter = 'all' | 'low' | 'normal' | 'high' | 'urgent';

interface LetterFilters {
  search: string;
  type: LetterTypeFilter;
  status: string;
  priority: PriorityFilter;
  dateFrom: string;
  dateTo: string;
}

const DEFAULT_FILTERS: LetterFilters = {
  search: '',
  type: 'all',
  status: 'all',
  priority: 'all',
  dateFrom: '',
  dateTo: '',
};

@Component({
  selector: 'app-letters-list',
  imports: [RouterModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="letters-shell" dir="rtl">
      <header class="letters-header">
        <div>
          <p class="eyebrow">الخطابات</p>
          <h1>إدارة الخطابات</h1>
          <p class="muted">قائمة مخصصة للخطابات فقط مع بحث وفلترة وتعديل وحذف ناعم.</p>
        </div>
        <div class="header-actions">
          <a class="btn-secondary" routerLink="/dashboard">
            <mat-icon>arrow_back</mat-icon>
            القائمة الرئيسية
          </a>
          <a class="btn-primary" routerLink="/letters/new">
            <mat-icon>post_add</mat-icon>
            خطاب جديد
          </a>
        </div>
      </header>

      @if (loading()) {
        <p class="state"><mat-icon>sync</mat-icon> جاري تحميل الخطابات...</p>
      }

      @if (error()) {
        <p class="state state--error"><mat-icon>error_outline</mat-icon> {{ error() }}</p>
      }

      <section class="summary-grid" aria-label="ملخص الخطابات">
        <article class="summary-card">
          <mat-icon>mail</mat-icon>
          <span>إجمالي الخطابات</span>
          <strong>{{ filteredLetters().length }}</strong>
        </article>
        <article class="summary-card">
          <mat-icon>move_to_inbox</mat-icon>
          <span>وارد</span>
          <strong>{{ incomingCount() }}</strong>
        </article>
        <article class="summary-card">
          <mat-icon>outbox</mat-icon>
          <span>صادر</span>
          <strong>{{ outgoingCount() }}</strong>
        </article>
        <article class="summary-card">
          <mat-icon>priority_high</mat-icon>
          <span>عاجل</span>
          <strong>{{ urgentCount() }}</strong>
        </article>
      </section>

      <section class="filters-panel" aria-label="فلاتر الخطابات">
        <div class="field field--wide">
          <label for="lettersSearch">بحث</label>
          <div class="input-shell">
            <mat-icon>search</mat-icon>
            <input id="lettersSearch" type="search" [value]="filters().search" placeholder="رقم، موضوع، جهة، ملخص..."
              (input)="setFilter('search', eventValue($event))">
          </div>
        </div>

        <div class="field">
          <label for="letterType">النوع</label>
          <select id="letterType" [value]="filters().type" (change)="setFilter('type', eventValue($event))">
            <option value="all">الكل</option>
            <option value="incoming">وارد</option>
            <option value="outgoing">صادر</option>
          </select>
        </div>

        <div class="field">
          <label for="letterStatus">الحالة</label>
          <select id="letterStatus" [value]="filters().status" (change)="setFilter('status', eventValue($event))">
            <option value="all">كل الحالات</option>
            @for (status of statusOptions(); track status) {
              <option [value]="status">{{ statusLabel(status) }}</option>
            }
          </select>
        </div>

        <div class="field">
          <label for="letterPriority">الأولوية</label>
          <select id="letterPriority" [value]="filters().priority" (change)="setFilter('priority', eventValue($event))">
            <option value="all">كل الأولويات</option>
            <option value="low">منخفضة</option>
            <option value="normal">عادية</option>
            <option value="high">مرتفعة</option>
            <option value="urgent">عاجلة</option>
          </select>
        </div>

        <div class="field">
          <label for="dateFrom">من تاريخ</label>
          <input id="dateFrom" type="date" [value]="filters().dateFrom" (input)="setFilter('dateFrom', eventValue($event))">
        </div>

        <div class="field">
          <label for="dateTo">إلى تاريخ</label>
          <input id="dateTo" type="date" [value]="filters().dateTo" (input)="setFilter('dateTo', eventValue($event))">
        </div>

        <button class="btn-secondary" type="button" (click)="resetFilters()">
          <mat-icon>restart_alt</mat-icon>
          إعادة ضبط
        </button>
      </section>

      <section class="letters-grid" aria-label="قائمة الخطابات">
        @for (letter of filteredLetters(); track letter.id) {
          <article class="letter-card">
            <div class="letter-card__top">
              <span class="type-pill" [class.type-pill--incoming]="letter.type === 'incoming'" [class.type-pill--outgoing]="letter.type === 'outgoing'">
                {{ letter.type === 'incoming' ? 'وارد' : 'صادر' }}
              </span>
              <span class="priority-pill" [class.priority-pill--urgent]="letter.priority === 'urgent'">
                {{ priorityLabel(letter.priority || 'normal') }}
              </span>
            </div>

            <div class="letter-card__body">
              <h2>{{ letter.subject }}</h2>
              <p>{{ letter.summary || 'لا يوجد ملخص مسجل.' }}</p>
            </div>

            <dl class="letter-meta">
              <div><dt>رقم الخطاب</dt><dd>{{ letter.letter_number }}</dd></div>
              <div><dt>التاريخ</dt><dd>{{ displayDate(letter.letter_date) }}</dd></div>
              <div><dt>الحالة</dt><dd>{{ statusLabel(letter.status || 'new') }}</dd></div>
              <div><dt>الجهة</dt><dd>{{ letter.sender || letter.receiver || 'غير محدد' }}</dd></div>
            </dl>

            <div class="letter-actions">
              <a class="btn-secondary" [routerLink]="['/letters', letter.id]">
                <mat-icon>edit</mat-icon>
                تعديل
              </a>
              <button class="btn-danger" type="button" [disabled]="deletingId() === letter.id" (click)="requestDelete(letter)">
                <mat-icon>delete</mat-icon>
                حذف
              </button>
            </div>
          </article>
        } @empty {
          <p class="empty-state">لا توجد خطابات مطابقة للفلاتر الحالية.</p>
        }
      </section>

      @if (pendingDelete(); as letter) {
        <div class="modal-backdrop" role="presentation" (click)="cancelDelete()">
          <section class="confirm-modal" role="dialog" aria-modal="true" aria-labelledby="deleteLetterTitle" (click)="$event.stopPropagation()">
            <span class="confirm-modal__icon"><mat-icon>warning</mat-icon></span>
            <div>
              <h2 id="deleteLetterTitle">تأكيد حذف الخطاب</h2>
              <p>سيتم حذف الخطاب حذفًا ناعمًا من القائمة، ويمكن تتبع العملية في سجل التحديثات.</p>
              <strong>{{ letter.subject }}</strong>
            </div>
            <div class="confirm-modal__actions">
              <button class="btn-secondary" type="button" (click)="cancelDelete()">إلغاء</button>
              <button class="btn-danger" type="button" [disabled]="deletingId() === letter.id" (click)="confirmDelete()">
                <mat-icon>delete</mat-icon>
                تأكيد الحذف
              </button>
            </div>
          </section>
        </div>
      }
    </section>
  `,
  styles: [
    `
      .letters-shell{padding:24px;background:var(--page-bg);min-height:100vh;color:var(--text-primary)}
      .letters-header,.filters-panel,.summary-card,.letter-card{background:var(--surface-solid);border:1px solid var(--surface-border);box-shadow:var(--card-shadow)}
      .letters-header{display:flex;justify-content:space-between;align-items:end;gap:18px;padding:22px;border-radius:14px;margin-bottom:16px}
      .eyebrow{margin:0 0 6px;color:var(--accent);font-size:.78rem;font-weight:800;letter-spacing:0}
      h1,h2{margin:0;color:var(--text-primary);line-height:1.25}
      h1{font-size:2rem} h2{font-size:1.08rem}
      .muted{margin:8px 0 0;color:var(--text-secondary);line-height:1.7}
      .header-actions,.letter-actions{display:flex;flex-wrap:wrap;gap:10px}
      .btn-primary,.btn-secondary,.btn-danger{display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:42px;padding:0 14px;border-radius:10px;font-weight:800;text-decoration:none;cursor:pointer;border:1px solid var(--surface-border);transition:background-color 160ms ease,border-color 160ms ease,color 160ms ease,transform 160ms ease}
      .btn-primary{background:var(--accent);border-color:var(--accent);color:var(--accent-contrast)}
      .btn-secondary{background:var(--surface-solid);color:var(--text-primary)}
      .btn-danger{background:var(--danger-soft);border-color:transparent;color:var(--danger)}
      .btn-primary:hover,.btn-primary:focus-visible{background:var(--accent-strong)}
      .btn-secondary:hover,.btn-secondary:focus-visible{background:var(--surface-hover);color:var(--accent)}
      .btn-danger:hover,.btn-danger:focus-visible{filter:brightness(.97)}
      .btn-primary:focus-visible,.btn-secondary:focus-visible,.btn-danger:focus-visible{outline:2px solid var(--accent-border-strong);outline-offset:2px}
      .btn-danger:disabled{opacity:.55;cursor:not-allowed}
      .state{display:inline-flex;align-items:center;gap:8px;margin:0 0 16px;padding:12px 14px;border-radius:10px;background:var(--accent-soft);color:var(--accent);font-weight:800}
      .state--error{background:var(--danger-soft);color:var(--danger)}
      .summary-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin-bottom:16px}
      .summary-card{display:grid;gap:4px;padding:16px;border-radius:12px}
      .summary-card mat-icon{color:var(--accent)}
      .summary-card span{color:var(--text-secondary);font-weight:800}
      .summary-card strong{font-size:1.7rem}
      .filters-panel{display:grid;grid-template-columns:1.4fr repeat(5,minmax(140px,1fr)) auto;gap:12px;align-items:end;padding:16px;border-radius:14px;margin-bottom:16px}
      .field{display:grid;gap:6px;min-width:0}
      .field--wide{grid-column:span 2}
      label{color:var(--text-secondary);font-size:.84rem;font-weight:800}
      input,select{width:100%;min-height:42px;border-radius:10px;border:1px solid var(--surface-border);background:var(--surface-solid);color:var(--text-primary);padding:0 12px;font:inherit;outline:none}
      input:focus,select:focus{border-color:var(--accent-border-strong);box-shadow:0 0 0 3px var(--accent-soft)}
      .input-shell{display:grid;grid-template-columns:auto 1fr;align-items:center;gap:8px;min-height:42px;border-radius:10px;border:1px solid var(--surface-border);background:var(--surface-solid);padding:0 10px}
      .input-shell:focus-within{border-color:var(--accent-border-strong);box-shadow:0 0 0 3px var(--accent-soft)}
      .input-shell input{border:0;background:transparent;box-shadow:none;padding:0}
      .input-shell mat-icon{color:var(--text-tertiary)}
      .letters-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px}
      .letter-card{display:grid;gap:14px;padding:16px;border-radius:14px}
      .letter-card__top{display:flex;justify-content:space-between;align-items:center;gap:10px}
      .letter-card__body p{margin:8px 0 0;color:var(--text-secondary);line-height:1.7}
      .type-pill,.priority-pill{display:inline-flex;align-items:center;min-height:28px;padding:0 10px;border-radius:999px;font-weight:800;font-size:.84rem}
      .type-pill--incoming{background:var(--accent-soft);color:var(--accent)}
      .type-pill--outgoing{background:var(--success-soft);color:var(--success-dark)}
      .priority-pill{background:var(--surface-muted);color:var(--text-secondary)}
      .priority-pill--urgent{background:var(--danger-soft);color:var(--danger)}
      .letter-meta{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin:0}
      .letter-meta div{padding:10px;border-radius:10px;background:var(--surface-muted)}
      dt{color:var(--text-tertiary);font-size:.78rem;font-weight:800}
      dd{margin:4px 0 0;color:var(--text-primary);font-weight:800}
      .letter-actions{border-top:1px solid var(--surface-border);padding-top:12px}
      .empty-state{grid-column:1/-1;margin:0;color:var(--text-secondary);line-height:1.7;padding:16px;background:var(--surface-solid);border:1px solid var(--surface-border);border-radius:12px}
      .modal-backdrop{position:fixed;inset:0;z-index:1000;display:grid;place-items:center;padding:18px;background:rgba(15,23,42,.44);backdrop-filter:blur(8px)}
      .confirm-modal{width:min(100%,460px);display:grid;gap:14px;padding:18px;border-radius:14px;background:var(--surface-solid);border:1px solid var(--surface-border);box-shadow:0 24px 70px rgba(2,6,23,.32);color:var(--text-primary)}
      .confirm-modal__icon{display:grid;place-items:center;width:46px;height:46px;border-radius:12px;background:var(--danger-soft);color:var(--danger)}
      .confirm-modal h2{font-size:1.2rem}
      .confirm-modal p{margin:8px 0;color:var(--text-secondary);line-height:1.7}
      .confirm-modal strong{display:block;color:var(--text-primary)}
      .confirm-modal__actions{display:flex;justify-content:flex-start;gap:10px;flex-wrap:wrap}
      @media (max-width:1180px){.filters-panel{grid-template-columns:repeat(3,minmax(0,1fr))}.field--wide{grid-column:span 3}.letters-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.summary-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
      @media (max-width:760px){.letters-shell{padding:14px}.letters-header{align-items:stretch;flex-direction:column}.header-actions a{flex:1}.filters-panel,.letters-grid,.summary-grid{grid-template-columns:1fr}.field--wide{grid-column:auto}.letter-meta{grid-template-columns:1fr}.letter-actions a,.letter-actions button{flex:1}}
    `,
  ],
})
export class LettersListComponent {
  private readonly service = inject(LettersService);

  readonly letters = signal<Letter[]>([]);
  readonly filters = signal<LetterFilters>({ ...DEFAULT_FILTERS });
  readonly loading = signal(false);
  readonly deletingId = signal<string | null>(null);
  readonly pendingDelete = signal<Letter | null>(null);
  readonly error = signal<string | null>(null);

  readonly statusOptions = computed(() =>
    [...new Set(this.letters().map(letter => letter.status || 'new'))].sort((a, b) => a.localeCompare(b, 'ar'))
  );
  readonly filteredLetters = computed(() => {
    const filters = this.filters();
    return this.letters().filter(letter => {
      const haystack = [
        letter.letter_number,
        letter.serial_number,
        letter.subject,
        letter.summary,
        letter.sender,
        letter.receiver,
        letter.category,
        letter.status,
      ].join(' ');

      return this.matchesSearch(haystack, filters.search)
        && (filters.type === 'all' || letter.type === filters.type)
        && (filters.status === 'all' || (letter.status || 'new') === filters.status)
        && (filters.priority === 'all' || (letter.priority || 'normal') === filters.priority)
        && this.matchesDate(letter.letter_date || letter.created_at, filters.dateFrom, filters.dateTo);
    });
  });
  readonly incomingCount = computed(() => this.filteredLetters().filter(letter => letter.type === 'incoming').length);
  readonly outgoingCount = computed(() => this.filteredLetters().filter(letter => letter.type === 'outgoing').length);
  readonly urgentCount = computed(() => this.filteredLetters().filter(letter => letter.priority === 'urgent').length);

  constructor() {
    void this.load();
  }

  async load(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    const response = await this.service.list();
    this.loading.set(false);

    if (response.error) {
      this.error.set(response.error);
      this.letters.set([]);
      return;
    }

    this.letters.set(response.data);
  }

  eventValue(event: Event): string {
    return event.target instanceof HTMLInputElement || event.target instanceof HTMLSelectElement
      ? event.target.value
      : '';
  }

  setFilter(key: keyof LetterFilters, value: string): void {
    this.filters.update(filters => ({ ...filters, [key]: value } as LetterFilters));
  }

  resetFilters(): void {
    this.filters.set({ ...DEFAULT_FILTERS });
  }

  requestDelete(letter: Letter): void {
    this.pendingDelete.set(letter);
  }

  cancelDelete(): void {
    if (this.deletingId()) return;
    this.pendingDelete.set(null);
  }

  async confirmDelete(): Promise<void> {
    const letter = this.pendingDelete();
    if (!letter) return;

    this.deletingId.set(letter.id);
    this.error.set(null);
    const response = await this.service.delete(letter.id);
    this.deletingId.set(null);

    if (response.error) {
      this.error.set(response.error);
      return;
    }

    this.letters.update(letters => letters.filter(item => item.id !== letter.id));
    this.pendingDelete.set(null);
  }

  displayDate(value: string): string {
    return new Date(value).toLocaleDateString('ar-EG', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  statusLabel(value: string): string {
    const labels: Record<string, string> = {
      new: 'جديد',
      pending: 'قيد المتابعة',
      completed: 'مكتمل',
      closed: 'مغلق',
    };
    return labels[value] ?? value;
  }

  priorityLabel(value: string): string {
    const labels: Record<string, string> = {
      low: 'منخفضة',
      normal: 'عادية',
      high: 'مرتفعة',
      urgent: 'عاجلة',
    };
    return labels[value] ?? value;
  }

  private matchesSearch(value: string, search: string): boolean {
    const normalizedSearch = search.trim().toLowerCase();
    if (!normalizedSearch) return true;
    return value.toLowerCase().includes(normalizedSearch);
  }

  private matchesDate(value: string, from: string, to: string): boolean {
    if (!value) return !from && !to;
    const day = value.slice(0, 10);
    return (!from || day >= from) && (!to || day <= to);
  }
}
