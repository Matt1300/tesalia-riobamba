/**
 * Repositorio de errores de formulario.
 * Append-only para crear. Permite actualizar estado (ignorar/resolver).
 */
namespace FormErroresRepository {
  const SHEET = Constants.SHEETS.FORM_ERRORES;
  const C = Constants.COLS.FORM_ERRORES;

  function toRow(e: Models.FormError): unknown[] {
    return [
      e.errorId,
      e.timestamp.toISOString(),
      e.emailChofer,
      e.choferId ?? '',
      e.rawValues,
      e.mensajeError,
      e.estado,
      e.resueltoEn ? e.resueltoEn.toISOString() : '',
      e.resueltoPor ?? '',
      e.registroId ?? '',
    ];
  }

  function fromRow(row: unknown[]): Models.FormError {
    return {
      errorId: String(row[C.ERROR_ID]),
      timestamp: DateUtils.fromSheetValue(row[C.TIMESTAMP]),
      emailChofer: String(row[C.EMAIL_CHOFER]),
      choferId: row[C.CHOFER_ID] ? String(row[C.CHOFER_ID]) : null,
      rawValues: String(row[C.RAW_VALUES] ?? ''),
      mensajeError: String(row[C.MENSAJE_ERROR] ?? ''),
      estado: String(row[C.ESTADO]) as Models.EstadoFormError,
      resueltoEn: row[C.RESUELTO_EN] ? DateUtils.fromSheetValue(row[C.RESUELTO_EN]) : null,
      resueltoPor: row[C.RESUELTO_POR] ? String(row[C.RESUELTO_POR]) : null,
      registroId: row[C.REGISTRO_ID] ? String(row[C.REGISTRO_ID]) : null,
    };
  }

  export function append(error: Models.FormError): void {
    BaseRepository.appendRow(SHEET, toRow(error));
  }

  export function findAll(): Models.FormError[] {
    return BaseRepository.getAllRows(SHEET).map(fromRow).reverse();
  }

  export function findByEmail(email: string): Models.FormError[] {
    return BaseRepository.filterRows(SHEET, row => String(row[C.EMAIL_CHOFER]) === email)
      .map(fromRow)
      .reverse();
  }

  export function findById(errorId: string): Models.FormError | null {
    const row = BaseRepository.findRow(SHEET, C.ERROR_ID, errorId);
    return row ? fromRow(row) : null;
  }

  export function updateEstado(
    errorId: string,
    estado: Models.EstadoFormError,
    resueltoPor: string | null,
    registroId: string | null
  ): void {
    const idx = BaseRepository.findRowIndex(SHEET, C.ERROR_ID, errorId);
    if (idx < 0) throw new Error(`FormError ${errorId} no encontrado.`);

    const rows = BaseRepository.getAllRows(SHEET);
    const actual = fromRow(rows[idx]);
    const actualizado: Models.FormError = {
      ...actual,
      estado,
      resueltoEn: new Date(),
      resueltoPor,
      registroId: registroId ?? actual.registroId,
    };
    BaseRepository.updateRow(SHEET, idx, toRow(actualizado));
  }
}
