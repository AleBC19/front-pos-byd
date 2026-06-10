import { HttpInterceptorFn } from '@angular/common/http';

// TODO: manejar errores HTTP (401 → logout, 403/5xx/0 → notificación)
export const errorInterceptor: HttpInterceptorFn = (req, next) => next(req);
