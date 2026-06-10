import { Component, HostListener, input, model, output } from '@angular/core';

// Modal base centrado: solo controla visibilidad, backdrop y header.
// El contenido específico se proyecta como hijo vía ng-content.
@Component({
  selector: 'app-modal',
  templateUrl: './modal.html',
})
export class Modal {
  readonly open = model(false);
  readonly title = input('');
  readonly size = input<'sm' | 'md' | 'lg'>('md');
  readonly closed = output<void>();

  protected sizeClass(): string {
    switch (this.size()) {
      case 'sm':
        return 'max-w-sm';
      case 'lg':
        return 'max-w-3xl';
      default:
        return 'max-w-xl';
    }
  }

  @HostListener('document:keydown.escape')
  protected onEscape(): void {
    if (this.open()) {
      this.close();
    }
  }

  protected close(): void {
    this.open.set(false);
    this.closed.emit();
  }
}
