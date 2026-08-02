/**
 * Tipos relacionados con autenticación y autorización (RBAC).
 */
namespace Auth {
  /** Sesión activa del usuario autenticado. */
  export interface UserSession {
    email: string;
    rol: Models.Rol;
    choferId: string | null;
    usuarioId: string;
  }

  /** Permisos granulares del sistema. */
  export enum Permission {
    // Registros
    VER_TODOS_REGISTROS = 'VER_TODOS_REGISTROS',
    VER_PROPIOS_REGISTROS = 'VER_PROPIOS_REGISTROS',
    CREAR_REGISTRO = 'CREAR_REGISTRO',
    EDITAR_REGISTRO = 'EDITAR_REGISTRO',
    ELIMINAR_REGISTRO = 'ELIMINAR_REGISTRO',
    MARCAR_PAGADO = 'MARCAR_PAGADO',

    // Choferes
    VER_CHOFERES = 'VER_CHOFERES',
    CREAR_CHOFER = 'CREAR_CHOFER',
    EDITAR_CHOFER = 'EDITAR_CHOFER',
    ELIMINAR_CHOFER = 'ELIMINAR_CHOFER',

    // Camiones
    VER_CAMIONES = 'VER_CAMIONES',
    CREAR_CAMION = 'CREAR_CAMION',
    EDITAR_CAMION = 'EDITAR_CAMION',
    ELIMINAR_CAMION = 'ELIMINAR_CAMION',

    // Tarifas
    VER_TARIFAS = 'VER_TARIFAS',
    CREAR_TARIFA = 'CREAR_TARIFA',

    // Reportes
    VER_REPORTES_GLOBALES = 'VER_REPORTES_GLOBALES',
    VER_REPORTE_PROPIO = 'VER_REPORTE_PROPIO',

    // Exportacion
    EXPORTAR = 'EXPORTAR',

    // Usuarios
    ADMINISTRAR_USUARIOS = 'ADMINISTRAR_USUARIOS',

    // Auditoria
    VER_AUDITORIA = 'VER_AUDITORIA',

    // Configuracion
    VER_CONFIGURACION = 'VER_CONFIGURACION',
    EDITAR_CONFIGURACION = 'EDITAR_CONFIGURACION',
  }

  /**
   * Retorna el mapa de permisos por rol.
   * Es una función (no una constante) para evitar errores de orden de carga
   * en GAS: Models debe estar inicializado antes de que se evalúe esto.
   */
  export function getRolePermissions(): Record<Models.Rol, Permission[]> {
    return {
      [Models.Rol.ADMIN]: [
        Permission.VER_TODOS_REGISTROS,
        Permission.CREAR_REGISTRO,
        Permission.EDITAR_REGISTRO,
        Permission.ELIMINAR_REGISTRO,
        Permission.MARCAR_PAGADO,
        Permission.VER_CHOFERES,
        Permission.CREAR_CHOFER,
        Permission.EDITAR_CHOFER,
        Permission.ELIMINAR_CHOFER,
        Permission.VER_CAMIONES,
        Permission.CREAR_CAMION,
        Permission.EDITAR_CAMION,
        Permission.ELIMINAR_CAMION,
        Permission.VER_TARIFAS,
        Permission.CREAR_TARIFA,
        Permission.VER_REPORTES_GLOBALES,
        Permission.EXPORTAR,
        Permission.ADMINISTRAR_USUARIOS,
        Permission.VER_AUDITORIA,
        Permission.VER_CONFIGURACION,
        Permission.EDITAR_CONFIGURACION,
      ],
      [Models.Rol.CHOFER]: [
        Permission.VER_PROPIOS_REGISTROS,
        Permission.CREAR_REGISTRO,
        Permission.EDITAR_REGISTRO,
        Permission.VER_REPORTE_PROPIO,
        Permission.EXPORTAR,
        Permission.VER_CHOFERES,  // solo sus propios datos (filtrado en el servicio)
        Permission.VER_CAMIONES,  // solo sus propios datos (filtrado en el servicio)
      ],
    };
  }
}
