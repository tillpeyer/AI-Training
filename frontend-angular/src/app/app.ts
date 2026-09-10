import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { Identity } from './api/identity';

@Component({
  selector: 'lunch-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  private readonly identity = inject(Identity);

  /** Read once. The input is uncontrolled from here on, so the caret is never moved. */
  protected readonly initialUserId = this.identity.initialValue();

  protected onIdentityInput(event: Event): void {
    this.identity.type((event.target as HTMLInputElement).value);
  }
}
