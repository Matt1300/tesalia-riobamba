/**
 * Controlador de errores del formulario.
 * Admin ve todos. Chofer ve solo los propios.
 */
namespace FormErroresController {
  export function handle(method: string, payload: unknown): API.ApiResponse<unknown> {
    return AuthMiddleware.protectRaw(session => {
      const p = payload as Record<string, unknown>;
      const isAdmin = session.rol === Models.Rol.ADMIN;

      switch (method) {
        case 'getAll': {
          if (isAdmin) {
            const errores = FormErroresRepository.findAll();
            return API.ok(errores.map(e => ({
              ...e,
              usuarioRegistrado: e.emailChofer ? !!UsuariosRepository.findByEmail(e.emailChofer) : false,
            })));
          }
          // Chofer solo ve los suyos
          return API.ok(FormErroresRepository.findByEmail(session.email));
        }

        case 'ignorar': {
          RoleGuard.requireAdmin(session);
          const errorId = p['errorId'] as string;
          FormErroresRepository.updateEstado(errorId, Models.EstadoFormError.IGNORADO, session.email, null);
          return API.ok(null);
        }

        case 'marcarResuelto': {
          RoleGuard.requireAdmin(session);
          const errorId = p['errorId'] as string;
          const registroId = (p['registroId'] as string) ?? null;
          FormErroresRepository.updateEstado(errorId, Models.EstadoFormError.RESUELTO, session.email, registroId);
          return API.ok(null);
        }

        default:
          return API.fail(`Método de formErrores desconocido: ${method}`);
      }
    });
  }
}
