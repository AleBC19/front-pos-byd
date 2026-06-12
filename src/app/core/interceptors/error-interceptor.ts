import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth-service';

// Manejo global de errores HTTP: ante un 401 (token inválido o expirado)
// cierra la sesión y redirige al login. El 401 de /auth/login se excluye
// porque significa credenciales incorrectas y lo maneja el formulario.
// El match por substring también cubre /auth/login-pin a propósito:
// no cambiar a comparación exacta.
// TODO: notificar 403/5xx/0 cuando exista NotificationService.
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && !req.url.includes('/auth/login')) {
        auth.clearSession();
        router.navigate(['/login']);
      }

      return throwError(() => error);
    }),
  );
};
