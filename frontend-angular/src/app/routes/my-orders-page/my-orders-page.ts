import { httpResource } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  computed,
  effect,
  inject,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { Identity } from '../../api/identity';
import { LunchApi, apiErrorMessage } from '../../api/lunch-api';
import { API_BASE, Order } from '../../api/models';
import { ErrorBanner } from '../../components/error-banner/error-banner';

/** Shown while a name lookup is still outstanding. */
const NAME_LOADING = '…';
/** Cached when a name lookup fails, so the placeholder is bounded. */
const NAME_UNKNOWN = 'Unknown dish';

@Component({
  selector: 'lunch-my-orders-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ErrorBanner],
  templateUrl: './my-orders-page.html',
  styleUrl: './my-orders-page.css',
  // Bound on the document, not the table: a <table> is not focusable, so a
  // handler on it stops working the moment focus leaves the row.
  host: { '(document:keydown.escape)': 'disarm()' },
})
export class MyOrdersPage {
  private readonly api = inject(LunchApi);
  private readonly destroyRef = inject(DestroyRef);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  protected readonly identity = inject(Identity);

  /**
   * Keyed on the settled id, not every keystroke. Returning `undefined` skips
   * the request entirely: with no employee id there is nothing to ask for, and a
   * header-less request would only be answered `400 MISSING_USER`.
   */
  protected readonly orders = httpResource<Order[]>(() =>
    this.identity.settledUserId() ? `${API_BASE}/orders/me` : undefined,
  );

  protected readonly signedIn = computed(() => this.identity.settledUserId() !== '');

  /**
   * Rendered exactly as received. The server already returns newest-first and
   * owns ordering; a client-side sort would be a second mechanism that agrees
   * only while the backend's timestamp serialization stays lexicographically
   * sortable.
   */
  protected readonly rows = computed(() => (this.orders.hasValue() ? this.orders.value() : []));

  /**
   * Only the very first load blanks the table. A `reload()` keeps the previous
   * value renderable, so refreshing after a cancel does not unmount the rows
   * and throw the keyboard user's focus to <body>.
   */
  protected readonly firstLoad = computed(() => !this.orders.hasValue() && this.orders.isLoading());

  /** Component-local, in-memory, one entry per distinct menu item id. */
  private readonly names = signal<Record<string, string>>({});
  private readonly inFlight = new Set<string>();

  protected readonly armedId = signal('');
  protected readonly cancellingId = signal('');
  protected readonly errorMessage = signal('');
  protected readonly confirmation = signal('');

  /** A cancel in flight blocks every row's actions, not only its own. */
  protected readonly busy = computed(() => this.cancellingId() !== '');

  private readonly confirmButton = viewChild<ElementRef<HTMLButtonElement>>('confirmButton');
  private readonly heading = viewChild<ElementRef<HTMLElement>>('heading');
  private readonly restoreFocusTo = signal('');

  constructor() {
    this.resolveNames();
    this.focusConfirmOnArm();
    this.clearTransientStateOnIdentityChange();
    this.disarmWhenRowGone();
    this.clearConfirmationOnReadError();
    this.restoreFocusAfterDisarm();
  }

  protected dishName(order: Order): string {
    return this.names()[order.menuItemId] ?? NAME_LOADING;
  }

  /** Names the row, not just the verb — "Cancel order" alone is ambiguous in a table. */
  protected cancelLabel(order: Order): string {
    const name = this.names()[order.menuItemId];
    return name && name !== NAME_UNKNOWN
      ? `Cancel order of ${name}`
      : `Cancel this order of ${order.quantity} (dish name unavailable)`;
  }

  protected arm(orderId: string): void {
    if (this.busy()) {
      return;
    }
    this.errorMessage.set('');
    this.confirmation.set('');
    this.armedId.set(orderId);
  }

  protected disarm(): void {
    const wasArmed = untracked(this.armedId);
    if (!wasArmed) {
      return;
    }
    this.armedId.set('');
    this.restoreFocusTo.set(wasArmed);
  }

  protected confirmCancel(order: Order): void {
    const issuedFor = this.identity.settledUserId();

    this.errorMessage.set('');
    this.cancellingId.set(order.id);

    this.api
      .cancelOrder(order.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.cancellingId.set('');
          this.armedId.set('');
          this.restoreFocusTo.set('heading');
          // The response belongs to whoever it was issued for. If the employee
          // id changed while it was open, the list on screen is someone else's.
          if (this.identity.settledUserId() !== issuedFor) {
            return;
          }
          this.orders.reload();
          this.confirmation.set('Order cancelled.');
        },
        error: (err) => {
          this.cancellingId.set('');
          this.armedId.set('');
          this.restoreFocusTo.set(order.id);
          if (this.identity.settledUserId() !== issuedFor) {
            return;
          }
          this.errorMessage.set(apiErrorMessage(err));
          // A 404 or a 409 both mean the local copy is wrong, so refetch rather
          // than leaving a row that keeps offering an action that can only fail.
          this.orders.reload();
        },
      });
  }

  /** One lookup per distinct menu item id, via the only availability-bypassing read. */
  private resolveNames(): void {
    effect(() => {
      if (!this.orders.hasValue()) {
        return;
      }

      // Read the cache untracked: this reacts to the order list, not to its own
      // writes, so N resolved names do not cause N re-runs.
      const known = untracked(this.names);

      for (const order of this.orders.value()) {
        const id = order.menuItemId;
        if (known[id] !== undefined || this.inFlight.has(id)) {
          continue;
        }

        this.inFlight.add(id);
        this.api
          .getMenuItem(id)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: (item) => this.names.update((cache) => ({ ...cache, [id]: item.name })),
            error: () => {
              // Cache a real value rather than leaving the row on the loading
              // placeholder for ever, which is indistinguishable from pending
              // and degrades the confirm button's accessible name.
              this.inFlight.delete(id);
              this.names.update((cache) => ({ ...cache, [id]: NAME_UNKNOWN }));
            },
          });
      }
    });
  }

  private focusConfirmOnArm(): void {
    effect(() => {
      if (this.armedId() === '') {
        return;
      }
      this.confirmButton()?.nativeElement.focus();
    });
  }

  /** A different employee's list must not inherit the previous one's banners. */
  private clearTransientStateOnIdentityChange(): void {
    let seen = untracked(this.identity.settledUserId);
    effect(() => {
      const current = this.identity.settledUserId();
      if (current === seen) {
        return;
      }
      seen = current;
      this.armedId.set('');
      this.errorMessage.set('');
      this.confirmation.set('');
      this.names.set({});
      this.inFlight.clear();
    });
  }

  /** Without this the live region keeps announcing a row that is no longer rendered. */
  private disarmWhenRowGone(): void {
    effect(() => {
      const armed = this.armedId();
      if (armed === '') {
        return;
      }
      const stillCancellable = this.rows().some(
        (order) => order.id === armed && order.status === 'SUBMITTED',
      );
      if (!stillCancellable) {
        this.armedId.set('');
      }
    });
  }

  private clearConfirmationOnReadError(): void {
    effect(() => {
      if (this.orders.error()) {
        this.confirmation.set('');
      }
    });
  }

  private restoreFocusAfterDisarm(): void {
    effect(() => {
      const target = this.restoreFocusTo();
      if (target === '') {
        return;
      }
      this.restoreFocusTo.set('');

      const fallback = this.heading()?.nativeElement;
      if (target === 'heading') {
        fallback?.focus();
        return;
      }

      const armButton = this.host.nativeElement.querySelector<HTMLButtonElement>(
        `[data-arm-id="${target}"]`,
      );
      (armButton ?? fallback)?.focus();
    });
  }
}
