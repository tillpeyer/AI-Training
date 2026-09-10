import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  FormField,
  form,
  maxLength,
  min,
  required,
  submit,
  validate,
} from '@angular/forms/signals';

import { LunchApi, apiErrorMessage } from '../../api/lunch-api';
import { ErrorBanner } from '../../components/error-banner/error-banner';

/**
 * Adding a menu item.
 *
 * This route is deliberately not guarded. The interceptor attaches
 * `X-Admin: true` because the router is under `/admin`, and the backend answers
 * `403 NOT_ADMIN` if that is not enough. The UI does not pretend to gate it.
 */
@Component({
  selector: 'lunch-admin-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormField, ErrorBanner],
  templateUrl: './admin-page.html',
  styleUrl: './admin-page.css',
})
export class AdminPage {
  private readonly api = inject(LunchApi);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly submitting = signal(false);
  protected readonly errorMessage = signal('');
  protected readonly confirmation = signal('');

  private readonly itemModel = signal({ name: '', priceChf: 0 });

  // Every bound restates a backend constraint rather than inventing one:
  // CreateMenuItemRequest is @NotBlank @Size(max = 100) on name and
  // @NotNull @PositiveOrZero on priceChf. A free item is therefore legal.
  protected readonly itemForm = form(this.itemModel, (path) => {
    required(path.name, { message: 'Name is required.' });
    maxLength(path.name, 100, { message: 'Name must be 100 characters or fewer.' });
    validate(path.name, ({ value }) =>
      value().trim() === '' ? { kind: 'blank', message: 'Name is required.' } : undefined,
    );
    // `required` is not redundant next to `min`: min short-circuits on an empty
    // value, and clearing a number input writes null.
    required(path.priceChf, { message: 'Price is required.' });
    min(path.priceChf, 0, { message: 'Price cannot be negative.' });
  });

  protected firstError(errors: readonly { message?: string }[]): string {
    return errors.find((e) => e.message)?.message ?? 'This value is not valid.';
  }

  protected onSubmit(): void {
    this.errorMessage.set('');
    this.confirmation.set('');

    submit(this.itemForm, async () => {
      this.submitting.set(true);
      try {
        await new Promise<void>((resolve, reject) => {
          this.api
            .addMenuItem({ ...this.itemModel(), name: this.itemModel().name.trim() })
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({ next: () => resolve(), error: (err) => reject(err) });
        });
        this.itemModel.set({ name: '', priceChf: 0 });
        this.itemForm().reset();
        this.confirmation.set('Menu item added.');
      } catch (err) {
        this.errorMessage.set(apiErrorMessage(err));
      } finally {
        this.submitting.set(false);
      }
    });
  }
}
