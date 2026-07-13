import { Component, signal } from '@angular/core';

@Component({
  selector: 'app-backup-settings',
  templateUrl: './backup-settings.html',
})
export class BackupSettings {
  protected readonly location = signal('C:\\DDVC\\Respaldos');
  protected readonly frequency = signal('Diario');
  protected readonly autoBackup = signal(true);
  protected readonly feedback = signal<string | null>(null);

  protected createBackup(): void {
    this.feedback.set('Respaldo local simulado correctamente.');
  }
}
