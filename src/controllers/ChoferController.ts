/**
 * Controlador de choferes.
 */
namespace ChoferController {
  export function handle(method: string, payload: unknown): API.ApiResponse<unknown> {
    return AuthMiddleware.protectRaw(session => {
      const p = payload as Record<string, unknown>;

      switch (method) {
        case 'getAll':
          return API.ok(ChoferService.getAll(session));

        case 'getById':
          return API.ok(ChoferService.getById(p['id'] as string, session));

        case 'crear':
          return API.ok(ChoferService.crear(p as unknown as DTO.CreateChoferDTO, session));

        case 'actualizar':
          return API.ok(
            ChoferService.actualizar(p['id'] as string, p as unknown as DTO.UpdateChoferDTO, session)
          );

        case 'desactivar':
          ChoferService.desactivar(p['id'] as string, session);
          return API.ok({ desactivado: true });

        default:
          return API.fail(`Método de choferes desconocido: ${method}`);
      }
    });
  }
}
