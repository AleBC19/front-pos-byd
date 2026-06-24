import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth-service';

// Restringe la ruta al permiso declarado en route.data['permission']. Si la ruta
// no declara permiso, no restringe. Los permisos del usuario los entrega el API
// en el login (User.permissions). Inerte hasta que una ruta declare 'permission'.
export const permissionGuard: CanActivateFn = (route) => {
  const required = route.data['permission'] as string | undefined;
  if (!required) {
    return true;
  }

  const auth = inject(AuthService);
  const router = inject(Router);
  const allowed = auth.currentUser()?.permissions.includes(required) ?? false;

  return allowed ? true : router.parseUrl('/');
};
