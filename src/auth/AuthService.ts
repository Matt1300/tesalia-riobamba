/**
 * Servicio de autenticación.
 * Identifica al usuario actual usando su cuenta Google y la hoja Usuarios.
 * El email lo provee Google Apps Script automáticamente (no hay sesiones manuales).
 */
namespace AuthService {
  /**
   * Obtiene la sesión del usuario actualmente autenticado.
   * Lanza error si el usuario no está registrado o no está activo.
   */
  export function getCurrentSession(): Auth.UserSession {
    const email = Session.getActiveUser().getEmail();

    if (!email) {
      throw new Error('No se pudo obtener el email del usuario. Verifique que haya iniciado sesión con Google.');
    }

    const usuario = UsuariosRepository.findByEmail(email);

    if (!usuario) {
      throw new Error(`El usuario ${email} no tiene acceso al sistema. Contacte al administrador.`);
    }

    if (!usuario.activo) {
      throw new Error(`El usuario ${email} está desactivado. Contacte al administrador.`);
    }

    // Actualizar último acceso en background (no bloquea)
    try {
      UsuariosRepository.updateUltimoAcceso(usuario.usuarioId, new Date());
    } catch (e) {
      AppLogger.warn('AuthService', 'No se pudo actualizar UltimoAcceso', e);
    }

    AppLogger.info('AuthService', `Sesión iniciada: ${email} [${usuario.rol}]`);

    return {
      email: usuario.correo,
      rol: usuario.rol,
      choferId: usuario.choferId,
      usuarioId: usuario.usuarioId,
    };
  }

  /**
   * Versión que no actualiza el último acceso.
   * Útil para verificaciones rápidas de permisos.
   */
  export function getSessionSilent(): Auth.UserSession | null {
    try {
      const email = Session.getActiveUser().getEmail();
      if (!email) return null;

      const usuario = UsuariosRepository.findByEmail(email);
      if (!usuario || !usuario.activo) return null;

      return {
        email: usuario.correo,
        rol: usuario.rol,
        choferId: usuario.choferId,
        usuarioId: usuario.usuarioId,
      };
    } catch {
      return null;
    }
  }
}
