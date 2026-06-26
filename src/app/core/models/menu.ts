// Ítem de menú que entrega la API en el login (árbol anidado, ya filtrado por permisos).
// El JSON viaja en camelCase. Los grupos contenedores tienen route en null y children con ítems;
// las hojas tienen route y children vacío. El campo icon ya es un path SVG listo para pintar.
export interface MenuItem {
  id: number;
  label: string;
  icon: string | null;
  route: string | null;
  children: MenuItem[];
}
