import { Component, signal } from '@angular/core';

@Component({
  selector: 'app-tax-settings',
  templateUrl: './tax-settings.html',
})
export class TaxSettings {
  protected readonly enabled = signal(true);
  protected readonly includedInPrices = signal(true);
  protected readonly rate = signal('16');
  protected readonly saved = signal(false);

  protected markChanged(): void {
    this.saved.set(false);
  }

  protected save(): void {
    this.saved.set(true);
  }
}
