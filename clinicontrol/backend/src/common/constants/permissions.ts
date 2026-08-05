/**
 * Mapa centralizado de permisos por rol.
 * Usado por AuthDomainService y JwtTokenAdapter.
 * SIEMPRE editar aquí para mantener consistencia.
 */
export const ROLE_PERMISSIONS: Record<string, string[]> = {
  admin: ['*'],
  gerente: [
    'pacientes:read',
    'citas:read',
    'consultas:read',
    'reportes:read',
    'usuarios:read',
    'sucursales:read',
    'audit:read',

  ],
  secretaria: [
    'pacientes:read',
    'pacientes:write',
    'citas:read',
    'citas:write',
    'consultas:read',
    'recetas:read',
    'alergias:read',
    'vacunas:read',
  ],
  medico: [
    'pacientes:read',
    'pacientes:write',
    'consultas:read',
    'consultas:write',
    'diagnosticos:write',
    'recetas:write',
    'citas:read',
    'historial:read',
    'vacunas:write',
    'alergias:write',
    'notas_evolucion:write',
  ],
  enfermeria: [
    'pacientes:read',
    'signos_vitales:write',
    'consultas:read',
    'citas:read',
    'triaje:write',
    'hospitalizacion:read',
    'vacunas:write',
  ],
  recepcionista: [
    'pacientes:read',
    'pacientes:write',
    'citas:read',
    'citas:write',
    'consultas:read',
    'turnos:read',
  ],
  paciente: ['mis_citas:read', 'mis_recetas:read', 'mi_historial:read'],
};

export function getPermissionsForRole(rol?: string): string[] {
  return ROLE_PERMISSIONS[rol || 'usuario'] || [];
}
