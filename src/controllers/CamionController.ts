/**
 * Controlador de camiones.
 */
namespace CamionController {
  export function handle(method: string, payload: unknown): API.ApiResponse<unknown> {
    return AuthMiddleware.protectRaw(session => {
      const p = payload as Record<string, unknown>;

      switch (method) {
        case 'getAll':
          return API.ok(CamionService.getAll(session));

        case 'getById':
          return API.ok(CamionService.getById(p['id'] as string, session));

        case 'crear':
          return API.ok(CamionService.crear(p as unknown as DTO.CreateCamionDTO, session));

        case 'actualizar':
          return API.ok(
            CamionService.actualizar(p['id'] as string, p as unknown as DTO.UpdateCamionDTO, session)
          );

        case 'desactivar':
          CamionService.desactivar(p['id'] as string, session);
          return API.ok({ desactivado: true });

        default:
          return API.fail(`Método de camiones desconocido: ${method}`);
      }
    });
  }
}
