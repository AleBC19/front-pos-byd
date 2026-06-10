import {
  afterNextRender,
  Component,
  ElementRef,
  OnDestroy,
  viewChild,
} from '@angular/core';
import { Chart, registerables } from 'chart.js';
import { SALES_BY_DAY } from '../../data/dashboard-mock';

Chart.register(...registerables);

// Gráfica combinada de barras (ventas $) y línea (tickets) por día.
@Component({
  selector: 'app-sales-by-day-chart',
  templateUrl: './sales-by-day-chart.html',
})
export class SalesByDayChart implements OnDestroy {
  protected readonly data = SALES_BY_DAY;

  private readonly canvas = viewChild.required<ElementRef<HTMLCanvasElement>>('chartCanvas');
  private chart?: Chart;

  constructor() {
    afterNextRender(() => this.createChart());
  }

  ngOnDestroy(): void {
    this.chart?.destroy();
  }

  private createChart(): void {
    this.chart = new Chart(this.canvas().nativeElement, {
      data: {
        labels: this.data.labels,
        datasets: [
          {
            type: 'line',
            label: 'Tickets',
            data: this.data.tickets,
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
            data: this.data.sales,
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
            max: 25000,
            ticks: {
              stepSize: 5000,
              callback: (value) => '$' + Number(value).toLocaleString('en-US'),
              color: '#6b7280',
              font: { size: 10 },
            },
            grid: { color: '#f3f4f6' },
            border: { display: false },
          },
          yTickets: {
            position: 'right',
            min: 0,
            max: 150,
            ticks: { stepSize: 30, color: '#6b7280', font: { size: 10 } },
            grid: { display: false },
            border: { display: false },
          },
          x: {
            ticks: { color: '#6b7280', font: { size: 10 } },
            grid: { display: false },
            border: { display: false },
          },
        },
      },
    });
  }
}
