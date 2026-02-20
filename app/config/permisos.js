/* -------------------------------------------------------------------------- */
/* ARCHIVO: app/config/permisos.js (VERSIÓN FINAL - OPERATIVOS COMPLETOS)     */
/* -------------------------------------------------------------------------- */

// 1. DICCIONARIO DE PUESTOS (TRADUCCIÓN: DROPWOWN -> ROL TÉCNICO)
export const ROLES = {
  // --- ALTA DIRECCIÓN (NIVEL 3) ---
  'GERENTE GENERAL':         'GERENTE_GENERAL',
  'SOPORTE GENERAL':         'SOPORTE_GENERAL',
  'DIRECTOR':                'DIRECTOR', 

  // --- GERENCIAS (NIVEL 2) ---
  'GERENTE MARKETING':       'GERENTE_MKT',
  'GERENTE ADMINISTRATIVO':  'GERENTE_ADMINISTRATIVO',
  'GERENTE TÉCNICO':         'GERENTE_TECNICO', // Variantes para seguridad
  'GERENTE TECNICO':         'GERENTE_TECNICO', 
  'GERENTE RRHH':            'GERENTE_RRHH',

  // --- MANDOS MEDIOS (NIVEL 1) ---
  'ADMINISTRADOR':           'ADMINISTRADOR',
  'LÍDER TÉCNICO':           'LIDER_TECNICO', 
  'LIDER TECNICO':           'LIDER_TECNICO', 

  // --- OPERATIVOS (NIVEL 0) ---
  'COMMUNITY MANAGER':       'COMMUNITY_MANAGER',
  'CREADOR DE CONTENIDO':    'CREADOR_CONTENIDO',
  'ATENCIÓN AL CLIENTE':     'ATENCION_CLIENTE',
  'ATENCION AL CLIENTE':     'ATENCION_CLIENTE',
  'TÉCNICO':                 'TECNICO',
  'TECNICO':                 'TECNICO',
  'CONTROL VEHICULAR':       'CONTROL_VEHICULAR',
  'COBRANZA':                'COBRANZA',
  'VENDEDOR':                'VENDEDOR',
  'OTRO PERSONAL':           'COLABORADOR'
};

// 2. JERARQUÍAS DE APROBACIÓN
export const ROLES_LIDERES = [
  'GERENTE_GENERAL', 'GERENTE_MKT', 'GERENTE_ADMINISTRATIVO', 
  'GERENTE_TECNICO', 'GERENTE_RRHH', 'LIDER_TECNICO', 'SOPORTE_GENERAL', 'DIRECTOR'
];

export const ROLES_RRHH = [
  'GERENTE_RRHH', 'DIRECTOR', 'SOPORTE_GENERAL'
];

// 3. MATRIZ DE ACCESOS (FINAL)
const ACCESOS = {
  // === ACCESO TOTAL ===
  'GERENTE_GENERAL':        ['*'],
  'SOPORTE_GENERAL':        ['*'],
  'DIRECTOR':               ['*'],

  // === GERENCIAS ===
  'GERENTE_MKT': [
      'marketing_dashboard',
      'marketing_ventas', 'marketing_cobertura', 'marketing_mesa',         
      'marketing_solicitudes', 'marketing_social', 'marketing_promociones',
      'marketing_colaboradores', 'marketing_importar', 'marketing_estudios',
      'likestore', 'rrhh_incidencias', 'rrhh_mural' 
  ],

  'GERENTE_ADMINISTRATIVO': [
      'marketing_dashboard', 'almacen_operativo',      
      'marketing_ventas', 'marketing_cobertura', 'marketing_mesa',
      'marketing_solicitudes', 'likestore', 'rrhh_incidencias', 'rrhh_mural'
  ],

  'GERENTE_TECNICO': [
      'marketing_dashboard',
      'marketing_ventas', 'marketing_cobertura', 'marketing_mesa',         
      'marketing_solicitudes', 'likestore', 'rrhh_incidencias', 'rrhh_mural'
  ],

  'GERENTE_RRHH': [
      'marketing_dashboard', 'marketing_colaboradores', 'marketing_solicitudes',
      'likestore', 'rrhh_hub', 'rrhh_mural', 'rrhh_incidencias', 'rrhh_nomina'              
  ],

  // === MANDOS MEDIOS ===
  'ADMINISTRADOR': [
      'marketing_dashboard', 'marketing_mesa', 'marketing_cobertura', 
      'almacen_operativo', 'marketing_solicitudes', 'likestore',
      'rrhh_incidencias', 'rrhh_mural'
  ],

  'LIDER_TECNICO': [
      'marketing_dashboard', 'marketing_ventas', 'marketing_mesa', 
      'marketing_cobertura', 'marketing_solicitudes', 'soporte_tickets', 
      'likestore', 'rrhh_incidencias', 'rrhh_mural'
  ],

  // === OPERATIVOS ===
  
  // 1. COMMUNITY MANAGER: Ventas, Mesa, Colaboradores, Estudios
  'COMMUNITY_MANAGER': [
      'marketing_dashboard', 
      'marketing_social', 'marketing_importar', // Core
      'marketing_ventas',        // <--- NUEVO
      'marketing_mesa',          // <--- NUEVO
      'marketing_colaboradores', // <--- NUEVO
      'marketing_estudios',      // <--- NUEVO
      'marketing_solicitudes', 
      'likestore', 'rrhh_incidencias', 'rrhh_mural'
  ],

  // 2. CREADOR CONTENIDO: Colaboradores, Estudios
  'CREADOR_CONTENIDO': [
      'marketing_dashboard', 
      'marketing_solicitudes', 'marketing_importar', 'marketing_social', // Core
      'marketing_colaboradores', // <--- NUEVO
      'marketing_estudios',      // <--- NUEVO
      'likestore', 'rrhh_incidencias', 'rrhh_mural'
  ],

  // 3. VENDEDOR: Diseño, Estudios, Likestore
  'VENDEDOR': [
      'marketing_dashboard', 
      'marketing_ventas', 'marketing_cobertura', 'marketing_mesa', // Core
      'marketing_solicitudes',   // (Ya lo tenía, confirmado)
      'marketing_estudios',      // <--- NUEVO
      'likestore',               // <--- NUEVO
      'rrhh_incidencias', 'rrhh_mural'
  ],

  // 4. ATENCIÓN AL CLIENTE: Likestore
  'ATENCION_CLIENTE': [
      'marketing_dashboard', 
      'marketing_ventas', 'marketing_cobertura', 'marketing_mesa', // Core
      'likestore',               // <--- NUEVO
      'rrhh_incidencias', 'rrhh_mural'
  ],

  // 5. COBRANZA: Ventas, Cobertura, Mesa, Likestore
  'COBRANZA': [
      'marketing_dashboard', 
      'marketing_ventas',        // <--- NUEVO
      'marketing_cobertura',     // <--- NUEVO
      'marketing_mesa',          // <--- NUEVO
      'likestore',               // <--- NUEVO
      'rrhh_incidencias', 'rrhh_mural'
  ],

  // 6. TÉCNICO: Likestore
  'TECNICO': [
      'marketing_dashboard', 
      'marketing_ventas', 'marketing_cobertura', 'marketing_mesa', // Core
      'likestore',               // <--- NUEVO
      'rrhh_incidencias', 'rrhh_mural'
  ],

  'CONTROL_VEHICULAR':      ['marketing_dashboard', 'likestore', 'rrhh_incidencias', 'rrhh_mural'],
  
  // 7. OTRO PERSONAL: Likestore
  'COLABORADOR':            ['marketing_dashboard', 'likestore', 'rrhh_incidencias', 'rrhh_mural']
};

// 4. FUNCIONES LÓGICAS
export function normalizarRol(puestoOriginal) {
  if (!puestoOriginal) return 'COLABORADOR';
  let puesto = String(puestoOriginal).toUpperCase().trim();
  puesto = puesto.replace('Á', 'A').replace('É', 'E').replace('Í', 'I').replace('Ó', 'O').replace('Ú', 'U');
  
  if (ROLES[puesto]) return ROLES[puesto];

  if (puesto.includes('DIRECTOR')) return 'DIRECTOR';
  if (puesto.includes('MARKETING') || puesto.includes('MKT')) return 'GERENTE_MKT';
  if (puesto.includes('ADMINISTRATIVO')) return 'GERENTE_ADMINISTRATIVO';
  if (puesto.includes('RRHH')) return 'GERENTE_RRHH';
  
  if (puesto.includes('TECNICO') && puesto.includes('GERENTE')) return 'GERENTE_TECNICO';
  if (puesto.includes('TECNICO') && puesto.includes('LIDER')) return 'LIDER_TECNICO';
  
  return 'COLABORADOR';
}

export function tienePermiso(usuario, modulo) {
  if (!usuario) return false;
  const rolKey = usuario.rol || normalizarRol(usuario.puesto);
  const permisos = ACCESOS[rolKey] || ACCESOS['COLABORADOR'];
  if (permisos.includes('*')) return true;
  return permisos.includes(modulo);
}