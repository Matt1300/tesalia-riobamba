/**
 * Servicio de exportación.
 * Genera archivos PDF y Excel (base64) desde los datos del sistema.
 * Crea un Spreadsheet temporal, lo convierte y lo elimina.
 */
namespace ExportService {
  export interface ExportResult {
    base64: string;
    filename: string;
    mimeType: string;
  }

  /** PDF del detalle de un chofer en un período. */
  export function exportarPdfChofer(
    choferId: string,
    filtro: DTO.FiltroReporteDTO,
    session: Auth.UserSession
  ): ExportResult {
    RoleGuard.requirePermission(session, Auth.Permission.EXPORTAR);
    RoleGuard.requireOwnDataOrAdmin(session, choferId);

    const detalle = ReporteService.getDetalleChofer(choferId, filtro, session);
    const titulo = _sanitizeTitle(`Reporte_${detalle.chofer.nombre}_${detalle.periodo}`);
    const ss = SpreadsheetApp.create(titulo);
    const ssId = ss.getId();

    try {
      _buildChoferSheet(ss.getActiveSheet(), detalle);
      SpreadsheetApp.flush();

      const blob = DriveApp.getFileById(ssId).getAs('application/pdf');
      const base64 = Utilities.base64Encode(blob.getBytes());

      AuditoriaService.log({
        session,
        accion: Models.AccionAuditoria.EXPORTAR,
        entidad: Constants.SHEETS.REGISTROS,
        entidadId: choferId,
        detalle: `PDF período: ${JSON.stringify(filtro)}`,
      });

      return { base64, filename: `${titulo}.pdf`, mimeType: 'application/pdf' };
    } finally {
      DriveApp.getFileById(ssId).setTrashed(true);
    }
  }

  /** Excel del detalle de un chofer en un período. */
  export function exportarExcelChofer(
    choferId: string,
    filtro: DTO.FiltroReporteDTO,
    session: Auth.UserSession
  ): ExportResult {
    RoleGuard.requirePermission(session, Auth.Permission.EXPORTAR);
    RoleGuard.requireOwnDataOrAdmin(session, choferId);

    const detalle = ReporteService.getDetalleChofer(choferId, filtro, session);
    const titulo = _sanitizeTitle(`Reporte_${detalle.chofer.nombre}_${detalle.periodo}`);
    const ss = SpreadsheetApp.create(titulo);
    const ssId = ss.getId();

    try {
      _buildChoferSheet(ss.getActiveSheet(), detalle);
      SpreadsheetApp.flush();

      const blob = _getExcelBlob(ssId);
      const base64 = Utilities.base64Encode(blob.getBytes());

      AuditoriaService.log({
        session,
        accion: Models.AccionAuditoria.EXPORTAR,
        entidad: Constants.SHEETS.REGISTROS,
        entidadId: choferId,
        detalle: `Excel período: ${JSON.stringify(filtro)}`,
      });

      return {
        base64,
        filename: `${titulo}.xlsx`,
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      };
    } finally {
      DriveApp.getFileById(ssId).setTrashed(true);
    }
  }

  /** Excel global de todos los choferes en un período (solo admins). */
  export function exportarExcel(
    filtro: DTO.FiltroReporteDTO,
    session: Auth.UserSession
  ): ExportResult {
    RoleGuard.requirePermission(session, Auth.Permission.EXPORTAR);

    const resumen = ReporteService.getResumenPeriodo(filtro, session);
    const fecha = DateUtils.toISODate(new Date());
    const titulo = _sanitizeTitle(`Reporte_Global_${fecha}`);
    const ss = SpreadsheetApp.create(titulo);
    const ssId = ss.getId();

    try {
      _buildResumenSheet(ss.getActiveSheet(), resumen, filtro);
      SpreadsheetApp.flush();

      const blob = _getExcelBlob(ssId);
      const base64 = Utilities.base64Encode(blob.getBytes());

      AuditoriaService.log({
        session,
        accion: Models.AccionAuditoria.EXPORTAR,
        entidad: Constants.SHEETS.REGISTROS,
        entidadId: 'bulk',
        detalle: `Excel global filtro: ${JSON.stringify(filtro)}`,
      });

      return {
        base64,
        filename: `${titulo}.xlsx`,
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      };
    } finally {
      DriveApp.getFileById(ssId).setTrashed(true);
    }
  }

  // ─── Private helpers ─────────────────────────────────────────────────────────

  function _sanitizeTitle(title: string): string {
    return title.replace(/[→\-\s]+/g, '_').replace(/[^\w]/g, '').slice(0, 80);
  }

  /**
   * Exporta un Spreadsheet de Google como .xlsx usando UrlFetchApp.
   * DriveApp.getAs('xlsx') no funciona con archivos nativos de Google Sheets.
   */
  function _getExcelBlob(ssId: string): GoogleAppsScript.Base.Blob {
    const url = `https://docs.google.com/spreadsheets/d/${ssId}/export?format=xlsx`;
    const response = UrlFetchApp.fetch(url, {
      headers: { Authorization: `Bearer ${ScriptApp.getOAuthToken()}` },
      muteHttpExceptions: true,
    });
    if (response.getResponseCode() !== 200) {
      throw new Error(`Error exportando Excel (HTTP ${response.getResponseCode()})`);
    }
    return response.getBlob();
  }

  function _buildChoferSheet(
    sheet: GoogleAppsScript.Spreadsheet.Sheet,
    detalle: ReporteService.DetalleChofer
  ): void {
    sheet.setName('Reporte');

    // Título
    sheet.getRange('A1').setValue(`Reporte de Rutas — ${detalle.chofer.nombre}`);
    sheet.getRange('A1:G1').merge().setFontWeight('bold').setFontSize(14);

    sheet.getRange('A2').setValue(`Período: ${detalle.periodo}`);
    sheet.getRange('A2:G2').merge().setFontSize(11);

    // Resumen
    const summary = [
      ['Total Registros', detalle.totalRegistros, 'Entregas', detalle.totalEntregas,
        'Recargues', detalle.totalRecargues, 'Monto Total', detalle.montoTotal],
    ];
    const summaryRange = sheet.getRange(4, 1, 1, 8);
    summaryRange.setValues(summary).setFontWeight('bold').setBackground('#E8F5E9');
    sheet.getRange(4, 8, 1, 1).setNumberFormat('"$"#,##0.00');

    // Cabeceras de detalle
    const headers = ['Fecha', 'Placa', 'Operación', 'Zona', 'Cantidad', 'Km', 'Rechazos', 'Tarifa', 'Estado', 'Observaciones'];
    sheet.getRange(6, 1, 1, headers.length)
      .setValues([headers])
      .setFontWeight('bold')
      .setBackground('#388E3C')
      .setFontColor('#FFFFFF');

    // Filas
    if (detalle.registros.length > 0) {
      const rows = detalle.registros.map(r => [
        r.fecha,
        r.placa,
        r.tipoOperacion,
        r.tipoZona,
        r.cantidadRecargues,
        r.kilometraje,
        r.tieneRechazos ? 'Sí' : 'No',
        r.tarifaAplicada,
        r.estado,
        r.observaciones,
      ]);
      sheet.getRange(7, 1, rows.length, headers.length).setValues(rows);
      sheet.getRange(7, 8, rows.length, 1).setNumberFormat('"$"#,##0.00');
    }

    sheet.autoResizeColumns(1, headers.length);
  }

  function _buildResumenSheet(
    sheet: GoogleAppsScript.Spreadsheet.Sheet,
    resumen: ReporteService.ResumenPeriodo,
    filtro: DTO.FiltroReporteDTO
  ): void {
    sheet.setName('Resumen Global');

    const periodo = filtro.anio && filtro.mes
      ? `${filtro.mes}/${filtro.anio}`
      : filtro.fechaDesde && filtro.fechaHasta
        ? `${filtro.fechaDesde} - ${filtro.fechaHasta}`
        : 'Todo el período';

    sheet.getRange('A1').setValue('Reporte Global — Tesalia Riobamba');
    sheet.getRange('A1:E1').merge().setFontWeight('bold').setFontSize(14);
    sheet.getRange('A2').setValue(`Período: ${periodo}`);
    sheet.getRange('A2:E2').merge().setFontSize(11);

    // Totales globales
    const globalSummary = [
      ['Total Registros', resumen.totalRegistros, 'Entregas', resumen.totalEntregas, 'Recargues', resumen.totalRecargues],
    ];
    sheet.getRange(4, 1, 1, 6).setValues(globalSummary).setFontWeight('bold').setBackground('#E3F2FD');
    sheet.getRange('A5').setValue('Monto Total');
    sheet.getRange('B5').setValue(resumen.montoTotal).setNumberFormat('"$"#,##0.00');
    sheet.getRange('A5:B5').setFontWeight('bold').setBackground('#E3F2FD');

    // Por chofer
    const headers = ['Chofer', 'Total Registros', 'Entregas', 'Recargues', 'Monto Total'];
    sheet.getRange(7, 1, 1, headers.length)
      .setValues([headers])
      .setFontWeight('bold')
      .setBackground('#1565C0')
      .setFontColor('#FFFFFF');

    if (resumen.porChofer.length > 0) {
      const rows = resumen.porChofer.map(c => [
        c.chofer.nombre,
        c.totalRegistros,
        c.totalEntregas,
        c.totalRecargues,
        c.montoTotal,
      ]);
      sheet.getRange(8, 1, rows.length, headers.length).setValues(rows);
      sheet.getRange(8, 5, rows.length, 1).setNumberFormat('"$"#,##0.00');
    }

    sheet.autoResizeColumns(1, headers.length);
  }
}
