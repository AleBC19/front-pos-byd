import { Component, HostListener, input, model, output } from '@angular/core';

// Panel lateral (drawer) base anclado a la derecha: solo controla
// visibilidad, backdrop y header. El contenido se proyecta vía ng-content.
@Component({
  selector: 'app-side-panel',
  templateUrl: './side-panel.html',
})
export class SidePanel {
  readonly open = model(false);
  readonly title = input('');
  readonly width = input('max-w-[400px]');
  readonly closed = output<void>();

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
