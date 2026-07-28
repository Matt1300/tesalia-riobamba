/**
 * Verificador de permisos basado en roles (RBAC).
 * Centraliza toda la lógica de autorización.
 */
namespace RoleGuard {
  /**
   * Verifica si una sesión tiene un permiso específico.
   */
  export function hasPermission(session: Auth.UserSession, permission: Auth.Permission): boolean {
    const permisos = Auth.getRolePermissions()[session.rol] ?? [];
    return permisos.includes(permission);
  }

  /**
   * Verifica el permiso y lanza error si no lo tiene.
   */
  export function requirePermission(session: Auth.UserSession, permission: Auth.Permission): void {
    if (!hasPermission(session, permission)) {
      AppLogger.warn('RoleGuard', `Acceso denegado: ${session.email} intentó [${permission}]`);
      throw new Error(`No tiene permiso para realizar esta acción: ${permission}`);
    }
  }

  /** Verifica que la sesión es de un ADMIN. */
  export function requireAdmin(session: Auth.UserSession): void {
    if (session.rol !== Models.Rol.ADMIN) {
      throw new Error('Esta acción requiere rol ADMIN.');
    }
  }

  /**
   * Para recursos de choferes: verifica que el CHOFER solo accede a sus propios datos.
   * ADMIN puede acceder a cualquier choferId.
   */
  export function requireOwnDataOrAdmin(session: Auth.UserSession, choferId: string): void {
    if (session.rol === Models.Rol.ADMIN) return;

    if (session.choferId !== choferId) {
      AppLogger.warn('RoleGuard', `${session.email} intentó acceder a datos de choferId: ${choferId}`);
      throw new Error('Solo puede acceder a sus propios datos.');
    }
  }

  /** Retorna la lista de permisos del rol actual. */
  export function getPermissions(session: Auth.UserSession): Auth.Permission[] {
    return Auth.getRolePermissions()[session.rol] ?? [];
  }
}
