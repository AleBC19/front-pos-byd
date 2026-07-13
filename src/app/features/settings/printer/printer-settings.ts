import { Component, signal } from '@angular/core';

type PaperWidth = 58 | 80;

@Component({
  selector: 'app-printer-settings',
  templateUrl: './printer-settings.html',
})
export class PrinterSettings {
  protected readonly selectedPrinter = signal('POS-58 (USB)');
  protected readonly paperWidth = signal<PaperWidth>(58);
  protected readonly cashDrawerEnabled = signal(true);
  protected readonly autoCutEnabled = signal(true);
  protected readonly feedback = signal<string | null>(null);

  protected showFeedback(message: string): void {
    this.feedback.set(message);
  }
}
