import { Component } from '@angular/core';
import { STOCK_ALERTS, TOTAL_ALERTS } from '../../data/dashboard-mock';

// Panel de alertas de stock bajo/crítico con acción de reabastecer.
@Component({
  selector: 'app-alerts-panel',
  templateUrl: './alerts-panel.html',
})
export class AlertsPanel {
  protected readonly alerts = STOCK_ALERTS;
  protected readonly totalAlerts = TOTAL_ALERTS;
}
