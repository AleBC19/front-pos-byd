import { HttpInterceptorFn } from '@angular/common/http';

// TODO: agregar header Authorization: Bearer <token> a las peticiones a la API
export const authInterceptor: HttpInterceptorFn = (req, next) => next(req);
