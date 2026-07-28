/**
 * Controlador de tarifas.
 */
namespace TarifaController {
  export function handle(method: string, payload: unknown): API.ApiResponse<unknown> {
    return AuthMiddleware.protectRaw(session => {
      const p = payload as Record<string, unknown>;

      switch (method) {
        case 'getActivas':
          return API.ok(TarifaService.getTarifasActivas());

        case 'getHistorial':
          return API.ok(TarifaService.getHistorial());

        case 'crear':
          return API.ok(TarifaService.crear(p as unknown as DTO.CreateTarifaDTO, session));

        default:
          return API.fail(`Método de tarifas desconocido: ${method}`);
      }
    });
  }
}
