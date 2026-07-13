import { SETTINGS_ROUTES } from './settings.routes';

describe('SETTINGS_ROUTES', () => {
  it('redirects the settings root to printer', () => {
    const children = SETTINGS_ROUTES[0].children ?? [];
    const root = children.find((route) => route.path === '');

    expect(root?.redirectTo).toBe('printer');
    expect(root?.pathMatch).toBe('full');
  });

  it('exposes only the five requested settings sections', () => {
    const paths = (SETTINGS_ROUTES[0].children ?? [])
      .map((route) => route.path)
      .filter((path) => path !== '');

    expect(paths).toEqual(['business', 'taxes', 'printer', 'payment-methods', 'backup']);
  });
});
