import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * One instance per surface, placed directly below the control that failed.
 *
 * It carries no styles of its own — `.error-banner` is defined once globally, so
 * the banner cannot drift into a second appearance on a second route.
 */
@Component({
  selector: 'lunch-error-banner',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<p class="error-banner" role="alert">{{ message() }}</p>`,
})
export class ErrorBanner {
  readonly message = input.required<string>();
}
