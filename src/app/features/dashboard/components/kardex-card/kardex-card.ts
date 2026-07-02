import { Component, input } from '@angular/core';
import { KardexMovement } from '../../data/dashboard.view-models';

// Tabla de movimientos recientes de inventario (kardex).
@Component({
  selector: 'app-kardex-card',
  templateUrl: './kardex-card.html',
})
export class KardexCard {
  readonly movements = input.required<KardexMovement[]>();
}
