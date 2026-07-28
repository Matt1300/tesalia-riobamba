/**
 * Controlador de reportes.
 */
namespace ReporteController {
  export function handle(method: string, payload: unknown): API.ApiResponse<unknown> {
    return AuthMiddleware.protectRaw(session => {
      const p = payload as Record<string, unknown>;
      const filtro = p as unknown as DTO.FiltroReporteDTO;

      switch (method) {
        case 'resumenPeriodo':
          return API.ok(ReporteService.getResumenPeriodo(filtro, session));

        case 'reporteChofer':
          return API.ok(
            ReporteService.getReporteChofer(p['choferId'] as string, filtro, session)
          );

        case 'exportarPdf':
          return API.ok(
            ExportService.exportarPdfChofer(p['choferId'] as string, filtro, session)
          );

        case 'exportarExcel':
          return API.ok(ExportService.exportarExcel(filtro, session));

        default:
          return API.fail(`Método de reportes desconocido: ${method}`);
      }
    });
  }
}
