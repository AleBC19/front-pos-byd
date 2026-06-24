// Modelos de roles y permisos (/api/roles, /api/permissions). El JSON viaja en
// camelCase. permissions son códigos de permiso (ver Permission en user.ts).

// Respuesta de GET /api/roles y GET /api/roles/{id}.
export interface RoleDto {
  id: number;
  name: string;
  description: string | null;
  permissions: string[];
}

// Catálogo de permisos disponibles: respuesta de GET /api/permissions.
export interface PermissionDto {
  code: string;
  name: string;
  description: string;
}

// Cuerpo de PUT /api/roles/{id}/permissions.
export interface SetRolePermissionsRequest {
  permissions: string[];
}
