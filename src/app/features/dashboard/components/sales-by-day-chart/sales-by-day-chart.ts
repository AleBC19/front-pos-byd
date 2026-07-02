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
import { SalesByDay } from '../../data/dashboard.view-models';

Chart.register(...registerables);

// Gráfica combinada de barras (ventas $) y línea (tickets) por día.
@Component({
  selector: 'app-sales-by-day-chart',
  templateUrl: './sales-by-day-chart.html',
})
export class SalesByDayChart implements OnDestroy {
  readonly data = input.required<SalesByDay>();

  private readonly canvas = viewChild.required<ElementRef<HTMLCanvasElement>>('chartCanvas');
  private chart?: Chart;
  private viewReady = false;

  constructor() {
    afterNextRender(() => {
      this.viewReady = true;
      this.renderChart();
    });
    // Reconstruye la gráfica cuando cambian los datos (p. ej. al cambiar el período).
    effect(() => {
      this.data();
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
    const data = this.data();
    this.chart?.destroy();
    this.chart = new Chart(this.canvas().nativeElement, {
      data: {
        labels: data.labels,
        datasets: [
          {
            type: 'line',
            label: 'Tickets',
            data: data.tickets,
            yAxisID: 'yTickets',
            borderColor: '#1e40af',
            backgroundColor: '#1e40af',
            pointBackgroundColor: '#1e40af',
            pointRadius: 3.5,
            borderWidth: 2,
            tension: 0,
          },
          {
            type: 'bar',
            label: 'Ventas ($)',
            data: data.sales,
            yAxisID: 'ySales',
            backgroundColor: '#3b82f6',
            borderRadius: 4,
            barPercentage: 0.55,
            categoryPercentage: 0.8,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          ySales: {
            position: 'left',
            min: 0,
            ticks: {
              callback: (value) => '$' + Number(value).toLocaleString('en-US'),
              color: '#6b7280',
              font: { size: 12 },
            },
            grid: { color: '#f3f4f6' },
            border: { display: false },
          },
          yTickets: {
            position: 'right',
            min: 0,
            ticks: { color: '#6b7280', font: { size: 12 } },
            grid: { display: false },
            border: { display: false },
          },
          x: {
            ticks: { color: '#6b7280', font: { size: 12 } },
            grid: { display: false },
            border: { display: false },
          },
        },
      },
    });
  }
}
