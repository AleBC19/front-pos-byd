import { DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ApiError, extractApiError } from '../../../core/models/api';
import { BackupFileDto, SaveBackupSettingsRequest } from '../../../core/models/configuration';
import { ConfigurationService } from '../../../core/services/configuration-service';

interface Feedback {
  message: string;
  ok: boolean;
}

// Respaldos locales conectados a /api/configuration/backups: ajustes (GET/PUT
// /backups/settings), creación (POST /backups) y listado (GET /backups).
@Component({
  selector: 'app-backup-settings',
  templateUrl: './backup-settings.html',
  imports: [ReactiveFormsModule, DatePipe],
})
export class BackupSettings {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly configuration = inject(ConfigurationService);

  protected readonly loading = signal(true);
  protected readonly saving = signal(false);
  protected readonly saved = signal(false);
  protected readonly creating = signal(false);
  protected readonly apiError = signal<ApiError | null>(null);
  protected readonly feedback = signal<Feedback | null>(null);
  protected readonly lastRunAt = signal<string | null>(null);
  protected readonly backups = signal<BackupFileDto[]>([]);

  // Validadores espejo de SaveBackupSettingsRequestValidator (backend).
  protected readonly form = this.fb.group({
    destinationDirectory: ['', [Validators.required, Validators.maxLength(260)]],
    autoEnabled: [false],
    dailyTime: ['02:00', [Validators.required]],
    retentionCount: [7, [Validators.required, Validators.min(1), Validators.max(365)]],
  });

  constructor() {
    this.load();
  }

  protected toggleAuto(): void {
    const control = this.form.controls.autoEnabled;
    control.setValue(!control.value);
    this.markChanged();
  }

  protected invalid(controlName: string): boolean {
    const control = this.form.get(controlName);
    return !!control && control.invalid && (control.touched || control.dirty);
  }

  protected markChanged(): void {
    this.saved.set(false);
  }

  protected save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    const body: SaveBackupSettingsRequest = {
      destinationDirectory: value.destinationDirectory.trim(),
      autoEnabled: value.autoEnabled,
      dailyTime: value.dailyTime,
      retentionCount: value.retentionCount,
    };

    this.saving.set(true);
    this.saved.set(false);
    this.apiError.set(null);

    this.configuration.saveBackupSettings(body).subscribe({
      next: (settings) => {
        this.saving.set(false);
        this.saved.set(true);
        this.lastRunAt.set(settings.lastRunAt);
      },
      error: (err) => {
        this.saving.set(false);
        this.apiError.set(extractApiError(err));
      },
    });
  }

  protected createBackup(): void {
    this.creating.set(true);
    this.feedback.set(null);

    this.configuration.createBackup().subscribe({
      next: (file) => {
        this.creating.set(false);
        this.backups.update((current) => [file, ...current]);
        this.lastRunAt.set(file.createdAt);
        this.feedback.set({ message: `Respaldo creado: ${file.name}`, ok: true });
      },
      error: (err) => {
        this.creating.set(false);
        this.feedback.set({ message: extractApiError(err).message, ok: false });
      },
    });
  }

  protected formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    return `${(kb / 1024).toFixed(1)} MB`;
  }

  private load(): void {
    this.loading.set(true);
    this.apiError.set(null);

    this.configuration.getBackupSettings().subscribe({
      next: (settings) => {
        this.loading.set(false);
        this.lastRunAt.set(settings.lastRunAt);
        this.form.reset({
          destinationDirectory: settings.destinationDirectory,
          autoEnabled: settings.autoEnabled,
          dailyTime: settings.dailyTime,
          retentionCount: settings.retentionCount,
        });
      },
      error: (err) => {
        this.loading.set(false);
        this.apiError.set(extractApiError(err));
      },
    });

    this.configuration.listBackups().subscribe({
      next: (files) => this.backups.set(files),
      error: () => this.backups.set([]),
    });
  }
}
