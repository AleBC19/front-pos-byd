import { CanActivateFn } from '@angular/router';

// TODO: redirigir a /login si no hay sesión activa
export const authGuard: CanActivateFn = () => true;
