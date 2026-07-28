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

  export function findAll(): Models.Auditoria[] {
    return BaseRepository.getAllRows(SHEET).map(rowToAuditoria);
  }

  export function findByUsuario(email: string): Models.Auditoria[] {
    return BaseRepository.filterRows(
      SHEET,
      row => String(row[C.USUARIO_EMAIL]) === email
    ).map(rowToAuditoria);
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
