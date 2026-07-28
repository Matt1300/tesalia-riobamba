/**
 * Servicio de exportación.
 * Genera archivos PDF y Excel desde los datos del sistema.
 * Se expande en la Fase 10.
 */
namespace ExportService {
  /**
   * Genera un PDF del reporte de un chofer para un período.
   * Retorna la URL del archivo generado en Google Drive.
   */
  export function exportarPdfChofer(
    choferId: string,
    filtro: DTO.FiltroReporteDTO,
    session: Auth.UserSession
  ): string {
    RoleGuard.requirePermission(session, Auth.Permission.EXPORTAR);
    RoleGuard.requireOwnDataOrAdmin(session, choferId);

    // TODO Fase 10: Implementar generación de PDF usando DriveApp y HtmlService
    AppLogger.info('ExportService', `PDF solicitado para chofer ${choferId}`);

    AuditoriaService.log({
      session,
      accion: Models.AccionAuditoria.EXPORTAR,
      entidad: Constants.SHEETS.REGISTROS,
      entidadId: choferId,
      detalle: `PDF período: ${JSON.stringify(filtro)}`,
    });

    throw new Error('Exportación PDF disponible en la próxima versión.');
  }

  /**
   * Genera un Excel (Spreadsheet) con los registros filtrados.
   * Retorna la URL del archivo en Google Drive.
   */
  export function exportarExcel(
    filtro: DTO.FiltroReporteDTO,
    session: Auth.UserSession
  ): string {
    RoleGuard.requirePermission(session, Auth.Permission.EXPORTAR);

    // TODO Fase 10: Implementar creación de Spreadsheet temporal con DriveApp
    AppLogger.info('ExportService', 'Excel solicitado');

    AuditoriaService.log({
      session,
      accion: Models.AccionAuditoria.EXPORTAR,
      entidad: Constants.SHEETS.REGISTROS,
      entidadId: 'bulk',
      detalle: `Excel filtro: ${JSON.stringify(filtro)}`,
    });

    throw new Error('Exportación Excel disponible en la próxima versión.');
  }
}
