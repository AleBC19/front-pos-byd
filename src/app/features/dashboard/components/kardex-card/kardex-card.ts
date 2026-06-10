import { Component } from '@angular/core';
import { KARDEX_MOVEMENTS } from '../../data/dashboard-mock';

// Tabla de movimientos recientes de inventario (kardex).
@Component({
  selector: 'app-kardex-card',
  templateUrl: './kardex-card.html',
})
export class KardexCard {
  protected readonly movements = KARDEX_MOVEMENTS;
}
