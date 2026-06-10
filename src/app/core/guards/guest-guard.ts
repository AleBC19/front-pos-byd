import { CanActivateFn } from '@angular/router';

// TODO: redirigir a /dashboard si ya hay sesión activa (para /login)
export const guestGuard: CanActivateFn = () => true;
