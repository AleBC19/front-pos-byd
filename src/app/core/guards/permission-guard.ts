import { CanActivateFn } from '@angular/router';

// TODO: validar route.data['permission'] contra los permisos del usuario
export const permissionGuard: CanActivateFn = () => true;
