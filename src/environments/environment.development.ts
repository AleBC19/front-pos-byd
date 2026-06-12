// Configuración de desarrollo: las peticiones /api se redirigen al API
// (http://localhost:5224) mediante el proxy de ng serve (proxy.conf.json).
export const environment = {
  production: false,
  apiBaseUrl: '/api',
};
