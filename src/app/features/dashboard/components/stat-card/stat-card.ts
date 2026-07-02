import { Component, computed, input } from '@angular/core';
import { KpiCard } from '../../data/dashboard.view-models';

const ICON_PATHS: Record<KpiCard['icon'], string> = {
  currency:
    'M12 6v12m-3-2.82c.55.55 1.8.94 3 .94 1.79 0 3-.84 3-2.06 0-2.97-5.78-1.4-5.78-4.12C9.22 8.84 10.32 8 12 8c1.2 0 2.45.39 3 .94',
  ticket:
    'M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-13.5-2.55a2.7 2.7 0 0 0 0-4.9V7.5a1.5 1.5 0 0 1 1.5-1.5h15a1.5 1.5 0 0 1 1.5 1.5v3.05a2.7 2.7 0 0 0 0 4.9v3.05a1.5 1.5 0 0 1-1.5 1.5h-15a1.5 1.5 0 0 1-1.5-1.5v-3.05Z',
  user: 'M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.5 20.25a7.5 7.5 0 0 1 15 0',
  bag: 'M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.36-1.99 1.26 12a1.1 1.1 0 0 1-1.12 1.24H4.25a1.1 1.1 0 0 1-1.12-1.24l1.26-12a1.1 1.1 0 0 1 1.12-1.01h13.98a1.1 1.1 0 0 1 1.12 1.01Z',
};

const COLOR_CLASSES: Record<KpiCard['color'], string> = {
  blue: 'bg-blue-500',
  green: 'bg-green-500',
  purple: 'bg-purple-500',
  orange: 'bg-orange-500',
};

// Tarjeta KPI de la fila superior del dashboard.
@Component({
  selector: 'app-stat-card',
  templateUrl: './stat-card.html',
})
export class StatCard {
  readonly data = input.required<KpiCard>();

  protected readonly iconPath = computed(() => ICON_PATHS[this.data().icon]);
  protected readonly colorClass = computed(() => COLOR_CLASSES[this.data().color]);
}
