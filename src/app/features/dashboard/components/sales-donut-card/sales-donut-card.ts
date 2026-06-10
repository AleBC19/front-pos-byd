import {
  afterNextRender,
  Component,
  ElementRef,
  input,
  OnDestroy,
  viewChild,
} from '@angular/core';
import { Chart, registerables } from 'chart.js';
import { BreakdownItem } from '../../data/dashboard-mock';

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

  constructor() {
    afterNextRender(() => this.createChart());
  }

  ngOnDestroy(): void {
    this.chart?.destroy();
  }

  private createChart(): void {
    const items = this.items();
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
