import { Component } from '@angular/core';
import { RECENT_ACCESS } from '../data/users-mock';

// Tab "Accesos recientes": historial de inicios de sesión.
// Estructura tentativa (no hay mockup de esta vista) sobre datos de muestra.
@Component({
  selector: 'app-recent-access',
  templateUrl: './recent-access.html',
})
export class RecentAccess {
  protected readonly accesses = RECENT_ACCESS;
}
