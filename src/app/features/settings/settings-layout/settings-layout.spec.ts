import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { SettingsLayout } from './settings-layout';

describe('SettingsLayout', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SettingsLayout],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('renders only the requested navigation options', () => {
    const fixture = TestBed.createComponent(SettingsLayout);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    const labels = Array.from(element.querySelectorAll('nav a')).map((link) =>
      link.textContent?.replace(/\s+/g, ' ').trim(),
    );

    expect(labels).toHaveLength(5);
    expect(labels.join(' ')).toContain('Datos del negocio');
    expect(labels.join(' ')).toContain('Impuestos');
    expect(labels.join(' ')).toContain('Impresoras');
    expect(labels.join(' ')).toContain('Métodos de pago');
    expect(labels.join(' ')).toContain('Respaldo local');
    expect(labels.join(' ')).not.toContain('Apariencia');
    expect(labels.join(' ')).not.toContain('Avanzado');
  });
});
