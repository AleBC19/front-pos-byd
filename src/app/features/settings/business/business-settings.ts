import { Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ApiError, extractApiError } from '../../../core/models/api';
import { BusinessProfileDto, SaveBusinessProfileRequest } from '../../../core/models/configuration';
import { ConfigurationService } from '../../../core/services/configuration-service';

// Datos fiscales y de contacto del negocio, conectados a
// /api/configuration/business (GET/PUT) y al logotipo (POST/DELETE /business/logo).
@Component({
  selector: 'app-business-settings',
  templateUrl: './business-settings.html',
  imports: [ReactiveFormsModule],
})
export class BusinessSettings {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly configuration = inject(ConfigurationService);

  protected readonly loading = signal(true);
  protected readonly saving = signal(false);
  protected readonly uploadingLogo = signal(false);
  protected readonly saved = signal(false);
  protected readonly apiError = signal<ApiError | null>(null);
  protected readonly profile = signal<BusinessProfileDto | null>(null);

  // Validadores espejo de SaveBusinessProfileRequestValidator (backend).
  protected readonly form = this.fb.group({
    commercialName: ['', [Validators.required, Validators.maxLength(200)]],
    legalName: ['', [Validators.required, Validators.maxLength(200)]],
    rfc: ['', [Validators.required, Validators.minLength(12), Validators.maxLength(13)]],
    phone: ['', [Validators.maxLength(30)]],
    email: ['', [Validators.email, Validators.maxLength(150)]],
    fiscalAddress: ['', [Validators.maxLength(500)]],
  });

  constructor() {
    this.load();
  }

  protected invalid(controlName: string): boolean {
    const control = this.form.get(controlName);
    return !!control && control.invalid && (control.touched || control.dirty);
  }

  protected save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    const body: SaveBusinessProfileRequest = {
      commercialName: value.commercialName.trim(),
      legalName: value.legalName.trim(),
      rfc: value.rfc.trim().toUpperCase(),
      phone: value.phone.trim() || null,
      email: value.email.trim() || null,
      fiscalAddress: value.fiscalAddress.trim() || null,
    };

    this.saving.set(true);
    this.saved.set(false);
    this.apiError.set(null);

    this.configuration.saveBusiness(body).subscribe({
      next: (profile) => {
        this.saving.set(false);
        this.saved.set(true);
        this.applyProfile(profile);
      },
      error: (err) => {
        this.saving.set(false);
        this.apiError.set(extractApiError(err));
      },
    });
  }

  protected onLogoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;

    this.uploadingLogo.set(true);
    this.apiError.set(null);

    this.configuration.uploadLogo(file).subscribe({
      next: (profile) => {
        this.uploadingLogo.set(false);
        this.profile.set(profile);
      },
      error: (err) => {
        this.uploadingLogo.set(false);
        this.apiError.set(extractApiError(err));
      },
    });
  }

  protected removeLogo(): void {
    this.uploadingLogo.set(true);
    this.apiError.set(null);

    this.configuration.deleteLogo().subscribe({
      next: (profile) => {
        this.uploadingLogo.set(false);
        this.profile.set(profile);
      },
      error: (err) => {
        this.uploadingLogo.set(false);
        this.apiError.set(extractApiError(err));
      },
    });
  }

  private load(): void {
    this.loading.set(true);
    this.apiError.set(null);

    this.configuration.getBusiness().subscribe({
      next: (profile) => {
        this.loading.set(false);
        this.applyProfile(profile);
      },
      error: (err) => {
        this.loading.set(false);
        this.apiError.set(extractApiError(err));
      },
    });
  }

  private applyProfile(profile: BusinessProfileDto): void {
    this.profile.set(profile);
    this.form.reset({
      commercialName: profile.commercialName,
      legalName: profile.legalName,
      rfc: profile.rfc,
      phone: profile.phone ?? '',
      email: profile.email ?? '',
      fiscalAddress: profile.fiscalAddress ?? '',
    });
  }
}
