/**
 * Controlador de auditoría.
 * Solo lectura. Solo admins.
 */
namespace AuditoriaController {
  export function handle(method: string, payload: unknown): API.ApiResponse<unknown> {
    return AuthMiddleware.protectRaw(session => {
      RoleGuard.requirePermission(session, Auth.Permission.VER_AUDITORIA);
      const p = payload as Record<string, unknown>;

      const limite = typeof p['limite'] === 'number' ? p['limite'] : 200;

      switch (method) {
        case 'getAll':
          return API.ok(AuditoriaRepository.findRecent(limite));

        case 'getByUsuario':
          return API.ok(AuditoriaRepository.findByUsuario(p['email'] as string, limite));

        case 'getByEntidad':
          return API.ok(
            AuditoriaRepository.findByEntidad(
              p['entidad'] as string,
              p['entidadId'] as string
            )
          );

        default:
          return API.fail(`Método de auditoría desconocido: ${method}`);
      }
    });
  }
}
