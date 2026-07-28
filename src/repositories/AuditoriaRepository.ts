/**
 * Repositorio de la hoja Auditoria.
 * SOLO permite agregar filas. Nunca edita ni elimina.
 */
namespace AuditoriaRepository {
  const SHEET = Constants.SHEETS.AUDITORIA;
  const C = Constants.COLS.AUDITORIA;

  function auditoriaToRow(a: Models.Auditoria): unknown[] {
    return [
      a.auditoriaId,
      a.timestamp.toISOString(),
      a.usuarioEmail,
      a.accion,
      a.entidad,
      a.entidadId,
      a.valorAnterior ?? '',
      a.valorNuevo ?? '',
      a.ipOrigen,
      a.resultado,
      a.detalle,
    ];
  }

  function rowToAuditoria(row: unknown[]): Models.Auditoria {
    return {
      auditoriaId: String(row[C.AUDITORIA_ID]),
      timestamp: DateUtils.fromSheetValue(row[C.TIMESTAMP]),
      usuarioEmail: String(row[C.USUARIO_EMAIL]),
      accion: String(row[C.ACCION]) as Models.AccionAuditoria,
      entidad: String(row[C.ENTIDAD]),
      entidadId: String(row[C.ENTIDAD_ID]),
      valorAnterior: row[C.VALOR_ANTERIOR] ? String(row[C.VALOR_ANTERIOR]) : null,
      valorNuevo: row[C.VALOR_NUEVO] ? String(row[C.VALOR_NUEVO]) : null,
      ipOrigen: String(row[C.IP_ORIGEN] ?? ''),
      resultado: String(row[C.RESULTADO]) as Models.ResultadoAuditoria,
      detalle: String(row[C.DETALLE] ?? ''),
    };
  }

  /** Registra un evento de auditoría. Append-only. */
  export function append(auditoria: Models.Auditoria): void {
    BaseRepository.appendRow(SHEET, auditoriaToRow(auditoria));
  }

  /**
   * Retorna los últimos `limite` registros de auditoría, más reciente primero.
   * Solo lee las filas necesarias del sheet (no carga todo en memoria).
   */
  export function findRecent(limite = 200): Models.Auditoria[] {
    return BaseRepository.getLastRows(SHEET, limite).map(rowToAuditoria);
  }

  /**
   * Retorna los últimos `limite` registros de un usuario, más reciente primero.
   * Lee todas las filas pero solo serializa las que coinciden.
   */
  export function findByUsuario(email: string, limite = 200): Models.Auditoria[] {
    const allRows = BaseRepository.getAllRows(SHEET);
    const result: Models.Auditoria[] = [];
    // Recorrer de atrás hacia adelante para obtener los más recientes primero
    for (let i = allRows.length - 1; i >= 0 && result.length < limite; i--) {
      if (String(allRows[i][C.USUARIO_EMAIL]) === email) {
        result.push(rowToAuditoria(allRows[i]));
      }
    }
    return result;
  }

  export function findByEntidad(entidad: string, entidadId: string): Models.Auditoria[] {
    return BaseRepository.filterRows(
      SHEET,
      row =>
        String(row[C.ENTIDAD]) === entidad &&
        String(row[C.ENTIDAD_ID]) === entidadId
    ).map(rowToAuditoria);
  }
}
