import {
  afterNextRender,
  Component,
  effect,
  ElementRef,
  input,
  OnDestroy,
  viewChild,
} from '@angular/core';
import { Chart, registerables } from 'chart.js';
import { BreakdownItem } from '../../data/dashboard.view-models';

Chart.register(...registerables);

// Tarjeta con dona (Chart.js) y leyenda con porcentaje y monto por rubro.
@Component({
  selector: 'app-sales-donut-card',
  templateUrl: './sales-donut-card.html',
})
export class SalesDonutCard implements OnDestroy {
  readonly title = input.required<string>();
  readonly items = input.required<BreakdownItem[]>();

  private readonly canvas = viewChild.required<ElementRef<HTMLCanvasElement>>('donutCanvas');
  private chart?: Chart<'doughnut'>;
  private viewReady = false;

  constructor() {
    afterNextRender(() => {
      this.viewReady = true;
      this.renderChart();
    });
    // Reconstruye la dona cuando cambian los datos (p. ej. al cambiar el período).
    effect(() => {
      this.items();
      this.renderChart();
    });
  }

  ngOnDestroy(): void {
    this.chart?.destroy();
  }

  private renderChart(): void {
    if (!this.viewReady) {
      return;
    }
    const items = this.items();
    this.chart?.destroy();
    this.chart = new Chart(this.canvas().nativeElement, {
      type: 'doughnut',
      data: {
        labels: items.map((item) => item.label),
        datasets: [
          {
            data: items.map((item) => parseFloat(item.percent)),
            backgroundColor: items.map((item) => item.color),
            borderWidth: 2,
            borderColor: '#ffffff',
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '65%',
        plugins: { legend: { display: false } },
      },
    });
  }
}
