import { httpResource } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormField, form, max, min, required, submit } from '@angular/forms/signals';

import { Identity } from '../../api/identity';
import { LunchApi, apiErrorMessage } from '../../api/lunch-api';
import { API_BASE, MenuItem } from '../../api/models';
import { ErrorBanner } from '../../components/error-banner/error-banner';

@Component({
  selector: 'lunch-menu-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormField, ErrorBanner],
  templateUrl: './menu-page.html',
  styleUrl: './menu-page.css',
})
export class MenuPage {
  private readonly api = inject(LunchApi);
  private readonly identity = inject(Identity);
  private readonly destroyRef = inject(DestroyRef);

  /** `GET /menu` returns available items only, so no availability state is renderable. */
  protected readonly menu = httpResource<MenuItem[]>(() => `${API_BASE}/menu`);

  protected readonly items = computed(() => (this.menu.hasValue() ? this.menu.value() : []));

  protected readonly submitting = signal(false);
  protected readonly errorMessage = signal('');
  protected readonly confirmation = signal('');

  private readonly orderModel = signal({ menuItemId: '', quantity: 1 });

  protected readonly orderForm = form(this.orderModel, (path) => {
    required(path.menuItemId, { message: 'Choose a dish.' });
    // `required` is not redundant next to the range: min and max both
    // short-circuit on an empty value, and clearing a number input writes null.
    // Without this, an empty field is "valid" and posts null.
    required(path.quantity, { message: 'Quantity must be between 1 and 10.' });
    min(path.quantity, 1, { message: 'Quantity must be between 1 and 10.' });
    max(path.quantity, 10, { message: 'Quantity must be between 1 and 10.' });
  });

  protected firstError(errors: readonly { message?: string }[]): string {
    return errors.find((e) => e.message)?.message ?? 'This value is not valid.';
  }

  protected onSubmit(): void {
    this.errorMessage.set('');
    this.confirmation.set('');

    // Pre-empted client-side. Without an employee id the backend answers
    // 400 MISSING_USER with a framework message naming the HTTP header, which
    // is not something to show someone choosing lunch.
    if (this.identity.userId() === '') {
      this.errorMessage.set('Enter an employee id in "Sign in as" above to order.');
      return;
    }

    submit(this.orderForm, async () => {
      this.submitting.set(true);
      try {
        await new Promise<void>((resolve, reject) => {
          this.api
            .submitOrder(this.orderModel())
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({ next: () => resolve(), error: (err) => reject(err) });
        });
        // Ordering does not change the menu, so the menu resource is not reloaded.
        this.orderModel.set({ menuItemId: '', quantity: 1 });
        this.orderForm().reset();
        this.confirmation.set('Order submitted.');
      } catch (err) {
        this.errorMessage.set(apiErrorMessage(err));
      } finally {
        this.submitting.set(false);
      }
    });
  }
}
