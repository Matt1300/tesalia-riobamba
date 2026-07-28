/**
 * Controlador de registros de rutas.
 */
namespace RegistroController {
  export function handle(method: string, payload: unknown): API.ApiResponse<unknown> {
    return AuthMiddleware.protectRaw(session => {
      const p = payload as Record<string, unknown>;

      switch (method) {
        case 'getAll':
          return API.ok(RegistroService.getAll(session));

        case 'getById':
          return API.ok(RegistroService.getById(p['id'] as string, session));

        case 'filtrar':
          return API.ok(RegistroService.getByFiltro(p as unknown as DTO.FiltroReporteDTO, session));

        case 'crear':
          return API.ok(RegistroService.crear(p as unknown as DTO.CreateRegistroDTO, session));

        case 'actualizar':
          return API.ok(
            RegistroService.actualizar(p['id'] as string, p as unknown as DTO.UpdateRegistroDTO, session)
          );

        case 'validar':
          return API.ok(RegistroService.validar(p as unknown as DTO.ValidarRegistroDTO, session));

        case 'eliminar':
          RegistroService.eliminar(p['id'] as string, session);
          return API.ok({ eliminado: true });

        default:
          return API.fail(`Método de registros desconocido: ${method}`);
      }
    });
  }
}
