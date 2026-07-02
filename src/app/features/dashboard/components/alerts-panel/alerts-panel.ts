import { Component, input } from '@angular/core';
import { StockAlert } from '../../data/dashboard.view-models';

// Panel de alertas de stock bajo/crítico con acción de reabastecer.
@Component({
  selector: 'app-alerts-panel',
  templateUrl: './alerts-panel.html',
})
export class AlertsPanel {
  readonly alerts = input.required<StockAlert[]>();
  readonly totalAlerts = input.required<number>();
}
